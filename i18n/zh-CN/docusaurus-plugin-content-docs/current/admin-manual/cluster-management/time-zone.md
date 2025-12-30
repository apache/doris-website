---
{
    "title": "时区管理",
    "language": "zh-CN",
    "description": "Doris 支持自定义时区设置"
}
---

Doris 支持自定义时区设置

## 基本概念

Doris 内部存在以下两个时区相关参数：

- system_time_zone : 当服务器启动时，系统会根据机器设置时区自动设置，设置后不可修改。

- time_zone : 集群当前时区，可以修改。集群启动时，该变量会设置为与 `system_time_zone` 相同，之后不再变动，除非用户手动修改。

## 具体操作

1. `show variables like '%time_zone%'`

   查看当前时区相关配置

2. `SET [global] time_zone = 'Asia/Shanghai'`

   该命令可以设置 Session 级别的时区，如使用 `global` 关键字，则 Doris FE 会将参数持久化，之后对所有新 Session 生效。

## 数据来源

时区数据包含时区名、对应时间偏移量、夏令时变化情况等。在 BE 所在机器上，其数据来源为 `TZDIR` 命令返回的目录，如不支持该命令，则为 `/usr/share/zoneinfo` 目录。

## 时区的影响

### 1. 函数

包括 `NOW()` 或 `CURTIME()` 等时间函数显示的值，也包括 `show load`, `show backends` 中的时间值。

但不会影响 `create table` 中时间类型分区列的 less than 值，也不会影响存储为 `date/datetime` 类型的值的显示。

受时区影响的函数：

- `FROM_UNIXTIME`：给定一个 UTC 时间戳，返回其在 Doris session `time_zone` 指定时区的日期时间，如`time_zone`为`CST`时`FROM_UNIXTIME(0)`返回`1970-01-01 08:00:00`。

- `UNIX_TIMESTAMP`：给定一个日期时间，返回其在 Doris session `time_zone` 指定时区下的 UTC 时间戳，如`time_zone`为`CST`时`UNIX_TIMESTAMP('1970-01-01 08:00:00')`返回`0`。

- `CURTIME`：返回当前 Doris session `time_zone` 指定时区的时间。

- `NOW`：返回当前 Doris session `time_zone` 指定时区的日期时间。

- `CONVERT_TZ`：将一个日期时间从一个指定时区转换到另一个指定时区。

### 2. 时间类型的值

对于`DATE`、`DATETIME`类型，我们支持导入数据时对时区进行转换。

- 如果数据带有时区，如 "2020-12-12 12:12:12+08:00"，而 Stream Load 指定的 Header `timezone` 为 `+00:00` ，则数据导入 Doris 得到实际值为 "2020-12-12 04:12:12"。

- 如果数据不带有时区，如 "2020-12-12 12:12:12"，则认为该时间为绝对时间，不发生任何转换。

对于`TIMESTAMPTZ`类型，也支持导入数据时对时区进行转换，将输入的时间值统一转换为 UTC（世界协调时间），输出的时候加上当前会话的时区。

- 如果数据带有时区，如 "2020-12-12 12:12:12+08:00"，Doris 会使用该时区信息进行转换。

- 如果数据不带时区，如 "2020-12-12 12:12:12"，Doris 会使用当前会话的时区设置进行转换。

当前会话的 `time_zone` 会影响`TIMESTAMPTZ`类型的输出，例如，假设当前会话`time_zone="+08:00"`，`TIMESTAMPTZ`类型值是`2020-12-12 12:12:12+08:00`，改变`time_zone`后，输出值会变：
```
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

### 3. 夏令时

夏令时的本质是具名时区的实际时间偏移量，在一定日期内发生改变。

例如，`America/Los_Angeles`时区包含一次夏令时调整，起止时间为约为每年 3 月至 11 月。即，三月份夏令时开始时，`America/Los_Angeles`实际时区偏移由`-08:00`变为`-07:00`，11 月夏令时结束时，又从`-07:00`变为`-08:00`。
如果不希望开启夏令时，则应设定 `time_zone` 为 `-08:00` 而非 `America/Los_Angeles`。

## 使用方式

时区值可以使用多种格式给出，以下是 Doris 中完善支持的标准格式：

1. 标准具名时区格式，如 "Asia/Shanghai", "America/Los_Angeles"。此类格式来源于[本机所带时区数据](#数据来源)，如 "Etc/GMT+3" 等亦属此列。

2. 标准偏移格式，如 "+02:30", "-10:00"（不支持诸如 "+12:03" 等特殊偏移）

3. 缩写时区格式，当前仅支持：

   1. "GMT", "UTC"，等同于 "+00:00" 时区

   2. "CST", 等同于 "Asia/Shanghai" 时区

4. 单字母 Z，代表 Zulu 时区，等同于 "+00:00" 时区

此外，对任何字母的解析不区分大小写。

注意：由于实现方式的不同，当前 Doris 存在部分其他格式在部分导入方式中得到了支持。**生产环境不应当依赖这些未列于此的格式，它们的行为随时可能发生变化**，请关注版本更新时的相关 changelog。

## 最佳实践

### 时区敏感数据

时区问题主要涉及三个影响因素：

1. session variable `time_zone` —— 集群时区

2. Stream Load、Broker Load 等导入时指定的 header `timezone` —— 导入时区

3. 时区类型字面量 "2023-12-12 08:00:00+08:00" 中的 "+08:00" —— 数据时区

我们可以做如下理解：

Doris 目前兼容各时区下的数据向 Doris 中进行导入。而由于 Doris 自身 `DATETIME` 等各个时间类型本身不内含时区信息，且数据在导入后不会随时区变化而变更，因此时间数据导入 Doris 时，可分为如下两类：

1. 绝对时间

    绝对时间是指，它所关联的数据场景与时区无关。对于这类数据，在导入时应该不带有任何时区后缀，它们将被原样存储。

2. 特定时区下的时间

    某个特定时区下的时间是指，它所关联的数据场景与时区有关。对于这类数据，在导入时应该带有具体时区后缀，导入时它们将被转化至 Doris 集群 `time_zone` 时区或 Stream Load/Broker Load 中指定的 header `timezone`。

    这类数据在导入后即被转化至导入时指定时区下的绝对时间存储，故后续导入和查询应当保持此时区，以免数据意义发生紊乱。

 * 对于 Insert 语句，我们可以通过以下例子来说明：

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

 * 对于 Stream Load、Broker Load 等导入方式，我们可以通过指定 header `timezone` 来实现。例如，对于 Stream Load，我们可以通过以下例子来说明：

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
    * Stream Load、Broker Load 等导入方式中，header `timezone` 会覆盖 Doris 集群 `time_zone`，因此在导入时应当保持一致。
    * Stream Load、Broker Load 等导入方式中，header `timezone` 会影响导入转换中使用的函数。
    * 如果导入时未指定 header `timezone`，则默认使用东八区。
   :::

**综上所述，处理时区问题最佳的实践是：**
:::info 最佳实践
1. 在使用前确认该集群所表征的时区并设置 `time_zone`，在此之后不再更改。

2. 在导入时设定 header `timezone` 同集群 `time_zone` 一致。

3. 对于绝对时间，导入时不带时区后缀；对于有时区的时间，导入时带具体时区后缀，导入后将被转化至 Doris `time_zone` 时区。
:::

### 夏令时

夏令时的起讫时间来自[当前时区数据源](#数据来源)，不一定与当年度时区所在地官方实际确认时间完全一致。该数据由 ICANN 进行维护。如果需要确保夏令时表现与当年度实际规定一致，请保证 Doris 所选择的数据源为最新的 ICANN 所公布时区数据，下载途径见下文。

### 信息更新

真实世界中的时区与夏令时相关数据，将会因各种原因而不定期发生变化。IANA 会定期记录这些变化并更新相应时区文件。如果希望 Doris 中的时区信息与最新的 IANA 数据保持一致，请采取下列方式进行更新：

1. 使用包管理器更新

根据当前操作系统使用的包管理器，用户可以使用对应的命令直接更新时区数据：

```shell
# yum
> sudo yum update tzdata
# apt
> sudo apt update tzdata
```

该方式更新的数据位于系统 `$TZDIR` 下（一般为 `usr/share/zoneinfo`）。

2. 直接拉取 IANA 时区数据库（推荐）

大多数 Linux 发行版的包管理器，tzdata 的同步并不及时。如果对时区数据准确性要求较高，可以直接拉取 IANA 定期公布的数据：

```shell
wget https://www.iana.org/time-zones/repository/tzdb-latest.tar.lz
```

然后根据解压后文件夹中的 README 文件，生成具体的 zoneinfo 数据。生成的数据应当拷贝并覆盖 `$TZDIR` 目录。

请注意，以上所有操作在 BE 所在机器上完成后，都**必须重启**对应 BE 才能生效。

## 拓展阅读

- 时区格式列表：[List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

- IANA 时区数据库：[IANA Time Zone Database](https://www.iana.org/time-zones)

- ICANN 时区数据库：[The tz-announce Archives](https://mm.icann.org/pipermail/tz-announce/)
