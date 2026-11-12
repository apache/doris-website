---
{
    "title": "行级 TTL",
    "language": "zh-CN",
    "description": "Apache Doris 5.0.0 起支持的实验性行级 TTL 使用指南：按源列保留时长或逐行过期时间管理数据，提供建表、Stream Load 导入和更新示例，说明 NULL 行为、表模型、查询优化及物理回收限制。",
    "keywords": ["行级 TTL", "数据过期", "保留时长", "实验性", "Compaction", "row-level TTL", "Time to Live", "自动数据过期", "逐行过期时间", "数据生命周期管理", "function_column.enable_row_ttl", "Doris 5.0.0"],
    "doc_type": "feature"
}
---

:::caution 实验性功能

行级 TTL 是实验性功能，自 Apache Doris 5.0.0 起支持。采用前请先在测试环境中验证。

TTL 必须在建表时开启：不能为已有普通表补开，不能关闭，也不能切换 TTL 模式。部分列更新、Sequence 列和物化视图等存在下文所列限制。数据过期不保证磁盘空间立即释放。

:::

<!-- 知识类型: 功能概述 -->
<!-- 适用场景: 行级数据过期管理 -->
## 概述

行级 TTL（Time to Live）使单行数据在过期后对查询不可见，并允许后台 Compaction 回收过期行。它适用于同一张表或同一个分区内各行需要不同过期时间的场景。目前支持 Doris 内表的 Duplicate Key 和 Unique Key 模型，包括写时合并（MOW）和读时合并（MOR），不支持 Aggregate Key 模型。

### 选择 TTL 模式

建表时，根据数据的保留需求选择以下两种互斥模式之一：

| 适用场景 | 模式 | 配置方式 | 过期时间 |
| --- | --- | --- | --- |
| 每条事件从其时间戳起保留相同的时长 | 源列模式 | 开启 TTL，同时设置 `function_column.ttl_col` 和 `function_column.ttl` | 源列时间 + 表级保留时长 |
| 应用为每行指定绝对过期时间 | 直接过期时间模式 | 开启 TTL，不设置上述两个属性 | 写入 `__DORIS_TTL_COL__` 的逐行绝对过期时间 |

### 过期规则

- 源列值或直接过期时间为 NULL 时，该行不会因 TTL 过期。
- 过期时间**小于或等于**查询使用的当前时间时，该行即为过期。
- 一次查询在整个扫描过程中使用统一的当前时间值。因此，即使没有新写入，后续查询也可能返回更少的行。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 配置源列模式 TTL -->
## 快速开始

### 前置条件

- 使用 Apache Doris 5.0.0 或更高版本，并在测试环境中验证此实验性功能。
- 使用有建表、写入和查询权限的账号连接测试数据库。
- 使用受支持的表模型：Doris 内表的 Duplicate Key 或 Unique Key（MOW/MOR）。

### 建表并验证过期行为

以下示例使每条事件从 `event_time` 起保留一天。单副本配置仅用于演示，不是生产环境的副本数建议。

```sql
SET time_zone = '+00:00';
DROP TABLE IF EXISTS row_ttl_events;
CREATE TABLE row_ttl_events (
    id INT,
    event_time DATETIME(6) NULL,
    message STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "function_column.enable_row_ttl" = "true",
    "function_column.ttl_col" = "event_time",
    "function_column.ttl" = "1 day",
    "function_column.ttl_time_zone" = "+00:00"
);

INSERT INTO row_ttl_events VALUES
    (1, NOW(6) - INTERVAL 2 DAY, 'expired'),
    (2, NULL, 'persistent'),
    (3, NOW(6), 'live');

SELECT id, message FROM row_ttl_events ORDER BY id;
```

写入后立即查询，结果为：

```text
id  message
2   persistent
3   live
```

旧事件无需等待 Compaction 就已不可见。事件时间为 NULL 的行不会过期。TTL 依据传入的事件时间计算，并不会自动以导入时间为起点，因此迟到的事件可能在导入时就已经过期。

<!-- 知识类型: 配置参数 -->
## 参数

下列 `function_column.*` 属性均以字符串形式设置为表属性。

| 属性 | 默认值 / 必填条件 | 含义及修改规则 |
| --- | --- | --- |
| `function_column.enable_row_ttl` | 默认 `false`；两种模式均需设为 `true` | 布尔字符串，仅能在建表时设置。 |
| `function_column.ttl_col` | 默认不设置；源列模式下必须与 `function_column.ttl` 一起设置 | 已存在的非生成 Value 列名，类型须为 DATE/DATEV2、DATETIME/DATETIMEV2 或 TIMESTAMPTZ。不支持 Key 列和 TIMESTAMP_NS。建表后不可修改。 |
| `function_column.ttl` | 默认不设置；须与 `function_column.ttl_col` 一起设置 | 非负整数时长。建表后仅允许设置为相同或更短的时长。`0` 表示在源列时间到达时过期，**不表示关闭 TTL**。直接过期时间模式不支持此属性。 |
| `function_column.ttl_time_zone` | DATE/DATETIME 系列源列必须显式设置；TIMESTAMPTZ 默认 `+00:00` | 解释源列时间所用的时区。接受 `UTC`、`Z`，或 `-12:00` 至 `+14:00` 范围内的固定偏移，格式为 `+HH:MM` / `-HH:MM`。TIMESTAMPTZ 只接受零偏移。建表后不可修改，直接过期时间模式不能设置。 |

### 时长格式

时长不带单位时按秒解释。单位不区分大小写：

| 单位 | 支持的写法 |
| --- | --- |
| 周 | `week`、`weeks` |
| 天 | `day`、`days`、`d` |
| 小时 | `hour`、`hours`、`h` |
| 分钟 | `minute`、`minutes`、`m` |
| 秒 | `second`、`seconds`、`s` |

例如，`86400`、`1 day` 和 `24h` 表示相同时长。一天固定为 24 小时。

- 不支持小数、负数、`1 day 2 hours` 等组合时长、月和年。
- 时长转换为微秒后，必须在有符号 64 位整数范围内。
- 源列时间与时长相加得到的纪元微秒数也必须在有符号 64 位整数范围内，否则计算过期时间时会报错。

### 时区

源列模式不支持 `Asia/Shanghai` 等区域时区及夏令时规则。DATE 按所配置偏移下的当天零点解释；TIMESTAMPTZ 表示绝对时间。修改查询会话时区不会改变已存储行的 TTL 策略。

### 隐藏 TTL 列

Doris 自动创建可空隐藏列 `__DORIS_TTL_COL__`，不要在表结构中手动声明此列。

在源列模式下，Doris 将源列值复制到隐藏列。应写入或更新源列，不要通过隐藏列提供独立的过期时间。

在直接过期时间模式下，隐藏列类型为 BIGINT，保存 **Unix 纪元以来的微秒数**，不是秒或毫秒。各类输入的处理方式如下：

| 输入 | 直接过期时间模式下的行为 |
| --- | --- |
| 完整行写入时传入 NULL、DEFAULT 或省略此列 | 得到 NULL 过期时间，该行不会因 TTL 过期。 |
| BIGINT | 直接作为纪元微秒数使用。在当前日期查询时，`0` 和负值已经过期。 |
| DATE/DATETIME 表达式 | 使用 SQL 会话的 `time_zone` 或导入任务的 `timezone` 转换为纪元微秒数。 |
| TIMESTAMPTZ 表达式 | 转换为纪元微秒数；该值本身已表示绝对时间。 |
| 文本日期 | 应显式转换为支持的时间类型。 |
| TIMESTAMP_NS | 不支持。 |

需要查看隐藏列时，开启 `show_hidden_columns` 并显式查询该列。此设置**不会**绕过 TTL 过滤，也不能用来查看已过期行。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 导入和更新逐行过期时间 -->
## 示例

### 为每行指定过期时间

应用需要为每行指定不同的过期时间时，使用直接过期时间模式：

```sql
SET time_zone = '+00:00';
DROP TABLE IF EXISTS row_ttl_expirations;
CREATE TABLE row_ttl_expirations (id INT, message STRING)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "function_column.enable_row_ttl" = "true"
);

INSERT INTO row_ttl_expirations(id, message, __DORIS_TTL_COL__) VALUES
    (1, 'expired', 0),
    (2, 'persistent', NULL),
    (3, 'live', NOW(6) + INTERVAL 1 DAY);
INSERT INTO row_ttl_expirations VALUES (4, 'omitted');

SELECT id, message FROM row_ttl_expirations ORDER BY id;
```

立即查询，结果为：

```text
id  message
2   persistent
3   live
4   omitted
```

`INSERT ... SELECT` 也支持向隐藏列写入时间类型表达式，转换规则相同。

### 通过 Stream Load 导入过期时间

使用上例的 `row_ttl_expirations` 表。替换连接参数占位符，并使用有导入权限的账号。输入中包含过期时间字符串，因此在列映射中显式转换类型，同时指定导入时区：

```bash
curl --location-trusted -u '<user>:<password>' \
  -H 'label:row_ttl_expirations_example_1' \
  -H 'column_separator:,' \
  -H 'timezone:+00:00' \
  -H 'columns:id,message,expiration,__DORIS_TTL_COL__=cast(expiration as datetime(6))' \
  -T - 'http://<fe_host>:<http_port>/api/<database>/row_ttl_expirations/_stream_load' <<'DATA'
10,stream-live,2099-01-01 00:00:00.000000
11,stream-expired,2000-01-01 00:00:00.000000
DATA
```

重复导入时请使用新的 label。成功响应中的 `Status` 为 `Success`；过期本身不会使其他方面合法的输入行成为导入错误。在 2099 年之前执行以下查询，仅返回第 10 行：

```sql
SELECT id, message FROM row_ttl_expirations WHERE id >= 10 ORDER BY id;
```

```text
id  message
10  stream-live
```

如果输入已经是纪元**微秒数**，应使用 `columns:id,message,__DORIS_TTL_COL__` 直接映射，不要再转换为 DATETIME。

### 更新 Unique Key 行

支持普通 SQL UPDATE。对于可见行，修改无关列会保留 TTL 值；修改源列时间或直接过期时间会改变该行的到期时间。这与不支持的部分列更新导入模式不同。

```sql
DROP TABLE IF EXISTS row_ttl_accounts;
CREATE TABLE row_ttl_accounts (id INT, message STRING)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "function_column.enable_row_ttl" = "true"
);
INSERT INTO row_ttl_accounts(id, message, __DORIS_TTL_COL__) VALUES
    (1, 'original', 9223372036854775807);
UPDATE row_ttl_accounts SET message = 'updated' WHERE id = 1;

SET show_hidden_columns = true;
SELECT id, message, __DORIS_TTL_COL__ FROM row_ttl_accounts ORDER BY id;
SET show_hidden_columns = false;
```

```text
id  message  __DORIS_TTL_COL__
1   updated  9223372036854775807
```

完整行 UPSERT 会替换整行。因此，直接过期时间模式下省略过期时间会清除旧的过期时间：

```sql
INSERT INTO row_ttl_accounts(id, message) VALUES (1, 'replaced');
SET show_hidden_columns = true;
SELECT id, message, __DORIS_TTL_COL__ FROM row_ttl_accounts ORDER BY id;
SET show_hidden_columns = false;
```

```text
id  message   __DORIS_TTL_COL__
1   replaced  NULL
```

更新时还需注意以下规则：

- 源列模式下，完整行写入省略源列时使用该列正常的默认值/NULL 规则，而不是上一版本的时间戳。
- UPDATE 无法通过普通查询找到已经过期的行；如需写入新版本，应使用包含所需值的完整行 INSERT。
- 对于 Unique Key 表，最新版本过期不会让同一 Key 的旧版本重新可见。

### 缩短保留时长

使用快速开始中的源列模式表，并使用有 ALTER 权限的账号：

```sql
ALTER TABLE row_ttl_events SET ("function_column.ttl" = "12 hours");
SHOW CREATE TABLE row_ttl_events;
```

新的保留时长既作用于已有源列值，也作用于后续写入。`SHOW CREATE TABLE` 会显示更新后的 `function_column.ttl` 属性；若显示的是不带单位的整数，则单位为秒。

按新策略已经过期的行对使用该策略的查询不可见，并可被回收。允许再次设置相同的时长；不允许增大，因为先前过期的数据可能已经被回收。

:::caution ALTER 报错不代表策略已回滚

更短的查询策略会先持久化，再下发回收配置。因此，即使 ALTER 返回超时、配置版本未获确认或表发生并发变更等错误，更短的保留时长也可能已经生效。

请检查 `SHOW CREATE TABLE`，排除报错原因后，以相同的时长重试以同步策略。不要尝试恢复原来更长的时长。

:::

<!-- 知识类型: 功能限制 -->
## 限制

开启 TTL 前，请检查现有表功能和工作负载是否满足以下限制：

| 方面 | 当前行为 / 限制 |
| --- | --- |
| 表模型 | 仅支持 Doris 内表的 Duplicate Key 和 Unique Key（MOW/MOR）；拒绝 Aggregate Key。 |
| 开启及模式修改 | 仅能在 CREATE TABLE 时开启。ALTER 不能开启/关闭 TTL、改变源列或时区，也不能切换模式。不支持 `ENABLE FEATURE "ROW_TTL"`。只有源列模式的保留时长可以缩短。 |
| Sequence 列 | 不能与行级 TTL 共存，包括建表后再开启 `SEQUENCE_LOAD`。 |
| 表结构变更 | 不能删除或修改 TTL 源列、隐藏列，不能重命名源列。无关列的变更仍遵循普通 Schema Change 规则。 |
| 部分列更新 | 两种 TTL 模式均不支持。包括开启 `enable_unique_key_partial_update = true` 的 INSERT、Stream Load 的 `partial_columns = true`、`UPDATE_FIXED_COLUMNS` 和 `UPDATE_FLEXIBLE_COLUMNS`，即使请求中带有 TTL 值也不支持。完整行 UPSERT、普通 SQL UPDATE 和 DELETE 仍可按各自的表模型规则使用。 |
| 物化视图 | 不允许在 TTL 表上通过 `CREATE MATERIALIZED VIEW` 创建同步物化视图；异步物化视图不能以 TTL 表作为基表。这与普通 `ALTER TABLE ... ADD ROLLUP` 不同，后者受支持，TTL 隐藏列由 Doris 维护。 |
| 历史及增量访问 | TTL 表不支持 `FOR VERSION AS OF`、`FOR TIME AS OF`、`@incr(...)` 和 `CREATE STREAM ... ON TABLE`。 |
| 查询 Hint | 拒绝 `PREAGGOPEN`。MOR 扫描会关闭存储层预聚合，以保证版本合并和过期语义正确。 |
| 查询性能 | TTL 扫描会关闭 SQL Cache、Query Cache、短路点查以及部分 TopN 下推优化。点查、聚合、关联和 ORDER BY/LIMIT 仍可使用，但不能假定其执行计划和性能与普通表相同。 |
| 一致性检查 | 自动校验和一致性检查会跳过 TTL 表；对 TTL Tablet 显式发起的校验和一致性检查会被拒绝。这不表示关闭普通副本复制。 |

<!-- 知识类型: 数据回收行为 -->
## 物理回收边界

查询时检查 TTL 可见性；磁盘回收则依赖适用的后台 Compaction 和后续旧文件清理。表长期没有合并、Compaction 延迟或旧文件仍被保留，都可能导致过期数据继续占用磁盘，没有固定的物理删除时限。

回收行为取决于表模型和 Compaction 路径：

| 表模型 / 数据路径 | 回收行为 |
| --- | --- |
| Duplicate Key | 可在支持的 Segment、Cumulative、Base 和 Full Compaction 路径中回收过期行。 |
| Unique Key MOW | 可在 Cumulative、Base 和 Full Compaction 中回收已发布 Rowset 的过期行。发布前的 Segment Compaction 会保留过期 Key，用于写入冲突处理。 |
| Unique Key MOR | 只有在 Full Compaction，或覆盖从版本 0 开始的历史版本的 Base Compaction 中才会回收过期行，避免删除后露出同一 Key 的旧版本。 |
| 冷数据 Compaction | 不执行行级 TTL 回收。 |
| Changelog Tablet | 不会通过行级 TTL 删除日志条目。原始 Changelog 中可能仍保留基表已过期行的写入记录，其保留策略独立于行级 TTL。 |

行级 TTL 不保证到期时所有数据副本或变更记录都已被擦除。

<!-- 知识类型: 常见问题 -->
<!-- 适用场景: 排查 TTL 配置错误和存储回收延迟 -->
## 常见问题 {#错误处理}

遇到配置报错或存储空间未释放时，可按下表排查：

| 报错 / 现象 | 处理方式 |
| --- | --- |
| `function_column.ttl_col and function_column.ttl must be set together` | 源列模式同时设置这两个属性；直接过期时间模式则都不设置。 |
| `function_column.ttl_time_zone is required` | 为 DATE/DATETIME 源列显式设置固定时区偏移。 |
| `row ttl column must be a value column` | 使用受支持的时间类型 Value 列，不要使用 Key 列。 |
| `Partial update is not supported on tables with row TTL` | 使用完整行 UPSERT，并确认省略列的默认值符合预期，或使用普通 SQL UPDATE；不要在未检查省略列取值的情况下直接移除部分更新设置。 |
| `Increasing function_column.ttl is not supported` | 保持或缩短时长。如需延长，规划新表并从仍保留的源数据重新导入；TTL 无法恢复已回收数据。 |
| `TTL properties can only be specified when creating a table` | 不要通过 ALTER 修改开关、源列或时区；仅源列 TTL 表的 `function_column.ttl` 可修改。 |
| 查询中行已消失，但存储空间未减少 | 检查 Compaction 进度和上述回收边界。过期与物理删除是两个阶段。 |

<!-- 知识类型: 方案选型 -->
## 最佳实践

- 事件发生后保留统一时长时，选择源列模式；应用需要逐行指定绝对截止时间时，选择直接过期时间模式。导入前检查迟到时间戳和 NULL 值。
- 数据天然按整个时间分区保留时，优先考虑[动态分区](../../table-design/data-partitioning/dynamic-partitioning)。行级 TTL 适合更细粒度的管理，但增加逐行过滤，并限制部分查询优化。
- 采用前验证实际的导入、更新、查询与 Compaction 工作负载，尤其检查对部分列更新、Sequence 列、物化视图、历史查询和缓存的依赖。
- 缩短保留时长前确认预期的过期边界，并在此 TTL 策略之外保留必须可恢复的数据。用普通查询验证可见性，不要把磁盘占用或隐藏列查询当作是否过期、是否彻底擦除的依据。
