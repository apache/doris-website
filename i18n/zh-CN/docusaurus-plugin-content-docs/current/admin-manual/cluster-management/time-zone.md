---
{
    "title": "时区管理",
    "language": "zh-CN",
    "description": "了解 Doris 时区参数、设置方法、夏令时处理及导入数据时区转换，掌握时区敏感数据的最佳实践。",
    "keywords": [
        "Doris 时区",
        "time_zone",
        "system_time_zone",
        "set time_zone",
        "Asia/Shanghai",
        "时区设置",
        "夏令时",
        "tzdata",
        "IANA 时区",
        "Stream Load timezone",
        "DATETIME 时区",
        "TIMESTAMPTZ"
    ]
}
---

<!-- 知识类型: 配置参数 / 操作步骤 -->
<!-- 适用场景: 集群初始化时区配置 / 跨时区数据导入 / 夏令时调整 -->

Doris 支持自定义时区设置。本文介绍 Doris 中时区相关参数的含义、查看与设置方法、时区对函数与数据类型的影响、夏令时处理，以及时区敏感数据的最佳实践。

## 适用场景

| 场景 | 说明 |
| --- | --- |
| 集群初始化 | 部署后根据业务所在地或统一规范设置 `time_zone` |
| 跨时区数据导入 | 使用 Stream Load、Broker Load 等方式导入带时区或不带时区的数据 |
| 函数结果对齐 | 调整 `NOW()`、`CURTIME()`、`FROM_UNIXTIME` 等函数返回值的时区 |
| 夏令时处理 | 业务涉及具名时区（如 `America/Los_Angeles`），需要考虑夏令时切换 |
| 时区数据更新 | IANA 发布新版本 tzdata 后，需同步更新 BE 所在机器的时区数据 |

## 基本概念

Doris 内部存在以下两个时区相关参数：

| 参数 | 是否可修改 | 说明 |
| --- | --- | --- |
| `system_time_zone` | 否 | 服务器启动时，系统根据机器所在地的时区自动设置，设置后不可修改。 |
| `time_zone` | 是 | 集群当前时区。集群启动时与 `system_time_zone` 相同，之后保持不变，除非用户手动修改。 |

## 查看与设置时区

### 查看当前时区

执行以下 SQL 查看时区相关变量：

```sql
show variables like '%time_zone%';
```

### 设置时区

通过 `SET` 语句修改 `time_zone`：

```sql
SET [global] time_zone = 'Asia/Shanghai';
```

- 不带 `global` 关键字：仅在当前 Session 生效。
- 带 `global` 关键字：Doris FE 会将参数持久化，对之后所有新 Session 生效。

### 时区数据来源

时区数据包含时区名、对应时间偏移量、夏令时变化情况等。在 BE 所在机器上，其数据来源为 `TZDIR` 命令返回的目录；如不支持该命令，则为 `/usr/share/zoneinfo` 目录。

## 时区取值格式

时区值可以使用多种格式给出，以下是 Doris 完善支持的标准格式：

| 类型 | 示例 | 说明 |
| --- | --- | --- |
| 标准具名时区 | `Asia/Shanghai`、`America/Los_Angeles`、`Etc/GMT+3` | 来源于[本机所带时区数据](#时区数据来源) |
| 标准偏移格式 | `+02:30`、`-10:00` | 不支持诸如 `+12:03` 等特殊偏移 |
| 缩写时区 | `GMT`、`UTC` | 等同于 `+00:00` 时区 |
| 缩写时区 | `CST` | 等同于 `Asia/Shanghai` 时区 |
| 单字母 Z | `Z` | 代表 Zulu 时区，等同于 `+00:00` 时区 |

此外，对任何字母的解析不区分大小写。

:::caution 注意
由于实现方式的不同，当前 Doris 存在部分其他格式在部分导入方式中得到了支持。**生产环境不应当依赖这些未列于此的格式，它们的行为随时可能发生变化**，请关注版本更新时的相关 changelog。
:::

## 时区的影响

### 对函数的影响

时区会影响包括 `NOW()` 或 `CURTIME()` 等时间函数显示的值，也包括 `SHOW LOAD`、`SHOW BACKENDS` 中的时间值。

但**不会**影响 `CREATE TABLE` 中时间类型分区列的 `LESS THAN` 值，也不会影响存储为 `DATE`/`DATETIME` 类型的值的显示。

受时区影响的函数：

| 函数 | 行为 |
| --- | --- |
| `FROM_UNIXTIME` | 给定一个 UTC 时间戳，返回其在 Doris session `time_zone` 指定时区的日期时间。例如 `time_zone` 为 `CST` 时，`FROM_UNIXTIME(0)` 返回 `1970-01-01 08:00:00`。 |
| `UNIX_TIMESTAMP` | 给定一个日期时间，返回其在 Doris session `time_zone` 指定时区下的 UTC 时间戳。例如 `time_zone` 为 `CST` 时，`UNIX_TIMESTAMP('1970-01-01 08:00:00')` 返回 `0`。 |
| `CURTIME` | 返回当前 Doris session `time_zone` 指定时区的时间。 |
| `NOW` | 返回当前 Doris session `time_zone` 指定时区的日期时间。 |
| `CONVERT_TZ` | 将一个日期时间从一个指定时区转换到另一个指定时区。 |

### 对时间类型的影响

#### DATE / DATETIME 类型

对于 `DATE`、`DATETIME` 类型，支持导入数据时对时区进行转换：

- **数据带时区**：如 `2020-12-12 12:12:12+08:00`，而 Stream Load 指定的 Header `timezone` 为 `+00:00`，则数据导入 Doris 得到的实际值为 `2020-12-12 04:12:12`。
- **数据不带时区**：如 `2020-12-12 12:12:12`，则认为该时间为绝对时间，不发生任何转换。

#### TIMESTAMPTZ 类型

`TIMESTAMPTZ` 类型也支持导入数据时对时区进行转换：将输入的时间值统一转换为 UTC（世界协调时间），输出时加上当前会话的时区。

- **数据带时区**：如 `2020-12-12 12:12:12+08:00`，Doris 会使用该时区信息进行转换。
- **数据不带时区**：如 `2020-12-12 12:12:12`，Doris 会使用当前会话的时区设置进行转换。

当前会话的 `time_zone` 会影响 `TIMESTAMPTZ` 类型的输出。例如，假设当前会话 `time_zone="+08:00"`，`TIMESTAMPTZ` 类型值是 `2020-12-12 12:12:12+08:00`，改变 `time_zone` 后，输出值会变：

```sql
set time_zone = "+08:00";

select * from tz_test;
+---------------------------+
| tz                        |
+---------------------------+
| 2020-12-12 12:12:12+08:00 |
+---------------------------+

set time_zone = "+07:00";

select * from tz_test;
+---------------------------+
| tz                        |
+---------------------------+
| 2020-12-12 11:12:12+07:00 |
+---------------------------+
```

### 夏令时

夏令时的本质是具名时区的实际时间偏移量，在一定日期内发生改变。

例如，`America/Los_Angeles` 时区包含一次夏令时调整，起止时间约为每年 3 月至 11 月。即三月份夏令时开始时，`America/Los_Angeles` 实际时区偏移由 `-08:00` 变为 `-07:00`；11 月夏令时结束时，又从 `-07:00` 变回 `-08:00`。

如果不希望开启夏令时，则应设定 `time_zone` 为 `-08:00` 而非 `America/Los_Angeles`。

## 最佳实践

### 时区敏感数据处理

<!-- 知识类型: 最佳实践 -->
<!-- 适用场景: 跨时区数据导入与查询 -->

时区问题主要涉及三个影响因素：

1. **集群时区**：session variable `time_zone`。
2. **导入时区**：Stream Load、Broker Load 等导入时指定的 header `timezone`。
3. **数据时区**：时区类型字面量（如 `2023-12-12 08:00:00+08:00` 中的 `+08:00`）。

Doris 目前兼容各时区下的数据向 Doris 中进行导入。由于 Doris 自身 `DATETIME` 等各个时间类型本身不内含时区信息，且数据在导入后不会随时区变化而变更，因此时间数据导入 Doris 时，可分为如下两类：

1. **绝对时间**

    绝对时间是指它所关联的数据场景与时区无关。对于这类数据，在导入时应该不带有任何时区后缀，它们将被原样存储。

2. **特定时区下的时间**

    某个特定时区下的时间是指它所关联的数据场景与时区有关。对于这类数据，在导入时应该带有具体时区后缀，导入时它们将被转化至 Doris 集群 `time_zone` 时区或 Stream Load/Broker Load 中指定的 header `timezone`。

    这类数据在导入后即被转化至导入时指定时区下的绝对时间存储，故后续导入和查询应当保持此时区，以免数据意义发生紊乱。

#### Insert 语句示例

```sql
Doris > select @@time_zone;
+---------------+
| @@time_zone   |
+---------------+
| Asia/Shanghai |
+---------------+

Doris > insert into dt values('2020-12-12 12:12:12+02:00'); --- 导入的数据中指定了时区为 +02:00

Doris > select * from dt;
+---------------------+
| dt                  |
+---------------------+
| 2020-12-12 18:12:12 | --- 被转换为 Doris 集群时区 Asia/Shanghai，后续导入和查询应当保持此时区。
+---------------------+

Doris > set time_zone = 'America/Los_Angeles';

Doris > select * from dt;
+---------------------+
| dt                  |
+---------------------+
| 2020-12-12 18:12:12 | --- 如果修改 time_zone，时间值不会随之改变，其查询时的意义发生紊乱。
+---------------------+
```

#### Stream Load 示例

对于 Stream Load、Broker Load 等导入方式，可以通过指定 header `timezone` 来实现时区转换。例如：

```shell
cat dt.csv
2020-12-12 12:12:12+02:00

curl --location-trusted -u root: \
    -H "Expect:100-continue" \
    -H "strict_mode: true" \
    -H "timezone: Asia/Shanghai" \
    -T dt.csv -XPUT \
    http://127.0.0.1:8030/api/test/dt/_stream_load
```

```sql
Doris > select @@time_zone;
+---------------+
| @@time_zone   |
+---------------+
| Asia/Shanghai |
+---------------+

Doris > select * from dt;
+---------------------+
| dt                  |
+---------------------+
| 2020-12-12 18:12:12 | --- 被转换为 Doris 集群时区 Asia/Shanghai，后续导入和查询应当保持此时区。
+---------------------+
```

:::tip
- Stream Load、Broker Load 等导入方式中，header `timezone` 会覆盖 Doris 集群 `time_zone`，因此在导入时应当保持一致。
- Stream Load、Broker Load 等导入方式中，header `timezone` 会影响导入转换中使用的函数。
- 如果导入时未指定 header `timezone`，则默认为集群当前时区。
:::

#### 最佳实践总结

:::info 最佳实践
1. 在使用前确认该集群所表征的时区并设置 `time_zone`，在此之后不再更改。
2. 在导入时设定 header `timezone` 同集群 `time_zone` 一致。
3. 对于绝对时间，导入时不带时区后缀；对于有时区的时间，导入时带具体时区后缀，导入后将被转化至 Doris `time_zone` 时区。
:::

### 夏令时使用建议

夏令时的起讫时间来自[当前时区数据源](#时区数据来源)，不一定与当年度时区所在地官方实际确认时间完全一致。该数据由 ICANN 进行维护。

如果需要确保夏令时表现与当年度实际规定一致，请保证 Doris 所选择的数据源为最新的 ICANN 所公布时区数据，下载途径见下文。

## 更新时区信息

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 时区数据同步 / IANA tzdata 更新 -->

真实世界中的时区与夏令时相关数据，将会因各种原因而不定期发生变化。IANA 会定期记录这些变化并更新相应时区文件。如果希望 Doris 中的时区信息与最新的 IANA 数据保持一致，可采用以下两种方式更新：

### 方式一：使用包管理器更新

根据当前操作系统使用的包管理器，用户可以使用对应的命令直接更新时区数据：

```shell
# yum
sudo yum update tzdata
# apt
sudo apt update tzdata
```

该方式更新的数据位于系统 `$TZDIR` 下（一般为 `/usr/share/zoneinfo`）。

### 方式二：直接拉取 IANA 时区数据库（推荐）

大多数 Linux 发行版的包管理器，tzdata 的同步并不及时。如果对时区数据准确性要求较高，可以直接拉取 IANA 定期公布的数据：

```shell
wget https://www.iana.org/time-zones/repository/tzdb-latest.tar.lz
```

然后根据解压后文件夹中的 README 文件，生成具体的 zoneinfo 数据。生成的数据应当拷贝并覆盖 `$TZDIR` 目录。

:::caution 重要
以上所有操作在 BE 所在机器上完成后，都**必须重启**对应 BE 才能生效。
:::

## 常见问题

### Q: 修改 `time_zone` 后已有数据查询结果变化异常？

`DATETIME` 等类型不内含时区信息，导入后修改集群时区不会改变存储值。在使用前确认集群时区并设置 `time_zone`，之后不再更改。

### Q: Stream Load 导入数据时间偏移与预期不符？

header `timezone` 与集群 `time_zone` 不一致。保持 header `timezone` 与集群 `time_zone` 一致。

### Q: `NOW()` 返回时间与本地时间不符？

集群 `time_zone` 与本地时区不一致。通过 `SET global time_zone = 'Asia/Shanghai'` 调整。

### Q: 具名时区夏令时切换与当年实际规定不符？

BE 所在机器的 tzdata 过旧。使用包管理器更新或直接拉取 IANA tzdata，并重启 BE。

### Q: 使用 `America/Los_Angeles` 不希望开启夏令时？

具名时区自带夏令时规则。改用固定偏移格式，如 `-08:00`。

## 拓展阅读

- 时区格式列表：[List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- IANA 时区数据库：[IANA Time Zone Database](https://www.iana.org/time-zones)
- ICANN 时区数据库：[The tz-announce Archives](https://mm.icann.org/pipermail/tz-announce/)
