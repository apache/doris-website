---
{
    "title": "Row Binlog",
    "language": "zh-CN",
    "description": "Doris Row Binlog 记录内表的行级增删改：建表属性、TTL 保留策略、自动清理、支持的表模型与限制、before/after 镜像与 TSO 的记录模型、对 DDL 的约束、写入开销与常见报错。",
    "keywords": [
        "Row Binlog",
        "行级 Binlog",
        "Doris binlog",
        "binlog.enable",
        "binlog.format ROW",
        "binlog.need_historical_value",
        "binlog.ttl_seconds",
        "Row Binlog TTL",
        "before 镜像",
        "historical value",
        "commit TSO",
        "__DORIS_BINLOG_OP__",
        "__DORIS_COMMIT_TSO_COL__",
        "binlog() 表函数",
        "Merge-on-Write 变更记录",
        "Duplicate Key 变更记录",
        "light schema change",
        "enable_mow_light_delete",
        "变更数据捕获",
        "Doris CDC",
        "Incremental View Maintenance",
        "IVM",
        "Not allowed to perform current operation on Table With binlog",
        "Only duplicate and mow table model support binlog"
    ]
}
---

<!-- 知识类型: Feature 说明 + 参数参考 -->
<!-- 适用场景: 为表开启行级变更记录 / 评估表模型是否支持 / 排查变更记录内容 -->

Row Binlog 是 Doris 内表的行级变更日志。开启后，每一次写入产生的行级变化（新增、更新、删除）都会连同变更前后的值、提交时间戳一起持久化，作为 [Table Stream](table-stream)、[增量查询](incremental-query) 和 [物化视图增量维护（IVM）](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view) 的数据来源，也可以通过 [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector/incremental-read)（26.3.0 及以上版本）在 Flink 中消费。

变更记录默认保留一天。请通过 `binlog.ttl_seconds` 设置能覆盖最长预期消费延迟的保留时长；变更记录过期不会删除基表中的数据。

:::caution 实验性功能
该功能自 5.0.0 版本起提供，目前处于实验阶段，需要在 FE 中开启 `enable_feature_binlog = true`。
:::

## 前置条件

<!-- 知识类型: 环境要求 -->

- Doris 5.0.0 及以上版本。
- FE 已在 `fe.conf` 中开启 `enable_feature_binlog = true`（非动态配置，需重启 FE）。
- 如需自动清理，BE 也需在 `be.conf` 中开启 `enable_feature_binlog = true`（非动态配置，需重启 BE）。
- 表模型为 Duplicate Key，或 Unique Key Merge-on-Write（MoW）且没有 cluster key，详见 [支持范围与限制](#支持范围与限制)。
- Row Binlog 只能在建表时开启，请在建表前完成评估。

## 基本概念

<!-- 知识类型: 概念说明 -->

| 概念 | 说明 |
|---|---|
| 变更记录 | 基表每提交一个事务，其中每一行的变化都会形成一条记录，包含操作类型（新增 / 更新 / 删除）、变更后的值，以及可选的变更前的值（before 镜像） |
| 提交时间戳（TSO） | 每个写入事务提交时从 FE 获取的全局单调递增时间戳，由物理时间（毫秒）和逻辑计数两部分组成。同一事务内的所有变更共享同一个 TSO。Table Stream 的消费位点、`@incr` 的时间窗口，都以 TSO 作为标尺 |
| LSN | 同一事务内变更记录的序号，与 TSO 一起决定变更记录的先后顺序 |

## 开启方式

<!-- 知识类型: 操作步骤 + 配置参数 -->

Row Binlog 只能在 `CREATE TABLE` 时通过表属性开启，且开启后不能关闭：

```sql
CREATE TABLE orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true",
    "binlog.ttl_seconds" = "86400"
);
```

`binlog.enable` 与 `binlog.format = "ROW"` 必须同时设置，只设置 `binlog.enable` 不会开启 Row Binlog。

### 属性

| 属性 | 取值 | 默认值 | 建表后可否修改 | 说明 |
|---|---|---|---|---|
| `binlog.enable` | `true` / `false` | `false` | 开启后不可关闭 | 是否开启 binlog，需与 `binlog.format = "ROW"` 同时设置 |
| `binlog.format` | `ROW` | - | 不可修改 | 必须为 `ROW`，表示记录行级变更。取值区分大小写，小写的 `row` 会报 `Invalid binlog format value: row` |
| `binlog.need_historical_value` | `true` / `false` | `false` | 不可修改 | 是否记录变更前的值（before 镜像）。仅 Unique Key MoW 表可设为 `true`；`min_delta` / `detail` 类型的 Table Stream、`MIN_DELTA` 增量查询和需要处理更新或删除的 IVM 都依赖它 |
| `binlog.ttl_seconds` | 正整数（秒） | `86400`（一天） | 可修改 | 变更记录的保留时长。增量读取会过滤过期记录，后台 compaction 会回收过期记录的存储空间；不允许设置为 `0` 或负数。见 [保留与清理](#保留与清理) |
| `binlog.max_bytes` | 整数（字节） | 无限制 | 可修改 | 保留大小上限。**当前版本不生效** |
| `binlog.max_history_nums` | 整数 | 无限制 | 可修改 | 保留条数上限。**当前版本不生效** |

### 不可变属性的修改

在已有表上修改不可变属性会直接报错：

```sql
ALTER TABLE orders SET ("binlog.enable" = "false");
-- ERROR: can't disable binlog when format is [Row]

ALTER TABLE orders SET ("binlog.need_historical_value" = "false");
-- ERROR: not support change binlog.need_historical_value from true to false

ALTER TABLE t_without_binlog SET ("binlog.format" = "ROW");
-- ERROR: not support change binlog format from STATEMENT_AND_SNAPSHOT to ROW
```

对于已经存在且没有开启 Row Binlog 的表，需要新建一张开启 Row Binlog 的表并导入数据，再用 [`ALTER TABLE ... REPLACE WITH TABLE`](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE) 原子替换。

### 查看属性

`SHOW CREATE TABLE` 会完整展示 `binlog.*` 属性：

```sql
SHOW CREATE TABLE orders\G
```

```text
...
"binlog.enable" = "true",
"binlog.ttl_seconds" = "86400",
"binlog.max_bytes" = "9223372036854775807",
"binlog.max_history_nums" = "9223372036854775807",
"binlog.format" = "ROW",
"binlog.need_historical_value" = "true",
...
```

## 支持范围与限制

<!-- 知识类型: 支持矩阵 -->
<!-- 适用场景: 建表前评估表模型 / 列类型是否支持 -->

### 表模型

| 表模型 | 是否支持 | 说明 |
|---|---|---|
| Duplicate Key | 支持 | 只记录新增行；不支持 `binlog.need_historical_value = true`，否则报 `Duplicate table model don't support record historical value` |
| Unique Key，Merge-on-Write | 支持 | 记录新增、更新、删除；可开启 before 镜像。**不支持带 cluster key 的表**，否则报 `Unique merge-on-write tables with cluster keys do not support binlog<Row>` |
| Unique Key，Merge-on-Read | 不支持 | 报 `Only duplicate and mow table model support binlog<Row>` |
| Aggregate Key | 不支持 | 同上 |

### 列类型

| 限制 | 说明 |
|---|---|
| auto-increment 列 | 不支持，建表和 `ADD COLUMN` 都会被拒绝 |
| VARIANT 类型的列 | 不支持，建表和 `ADD COLUMN` 都会被拒绝 |

### 部署模式

存算一体与存算分离模式均支持开启 Row Binlog。

### 写入方式

所有写入方式（`INSERT`、`UPDATE`、`DELETE`、Stream Load、Broker Load、Routine Load、Flink / Spark Connector 等）产生的变更都会被记录，包括部分列更新和灵活部分列更新。

## 变更记录模型

<!-- 知识类型: 行为规则 -->
<!-- 适用场景: 理解不同写入操作会产生什么变更记录 -->

### 操作类型与隐藏列

每条变更记录包含基表的全部可见列（变更后的值）以及下列隐藏列：

| 隐藏列 | 类型 | 说明 |
|---|---|---|
| `__DORIS_BINLOG_OP__` | TINYINT | 操作类型。在 `binlog()` 表函数的原始记录中：`0` 新增，`1` 更新，`2` 删除。在 `@incr` 增量查询中更新会被拆成两行：`0` 新增，`1` 删除，`2` 更新前，`3` 更新后 |
| `__DORIS_BINLOG_TSO__` | BIGINT | 提交时间戳 |
| `__DORIS_BINLOG_LSN__` | BIGINT | 事务内序号 |
| `__BEFORE__<列名>__` | 与原列相同 | 变更前的值，每个非 key 列对应一个。仅 `binlog.need_historical_value = true` 时存在 |

基表自身还会增加一个隐藏列 `__DORIS_COMMIT_TSO_COL__`，记录每行最近一次写入的提交时间戳，`SET show_hidden_columns = true` 后可以直接查询：

```sql
SET show_hidden_columns = true;
SELECT order_id, status, __DORIS_COMMIT_TSO_COL__ FROM orders;
```

### Duplicate Key 表

Duplicate Key 表只有新增，每次写入的每一行都记录为一条新增记录，即使 key 相同也不会合并。

Duplicate Key 表上执行 `DELETE FROM ... WHERE ...` 使用删除谓词标记删除，**不会产生变更记录**，下游通过 Table Stream 或 `@incr` 无法感知这类删除。如果需要把删除传递给下游，请使用 Unique Key MoW 表。

### Unique Key MoW 表

| 写入操作 | 记录内容 |
|---|---|
| 写入一个不存在的 key | 一条新增记录 |
| 写入一个已存在的 key（`INSERT` 同 key、`UPDATE`、部分列更新） | 一条更新记录，携带更新后的完整行；开启 before 镜像时还携带更新前的值 |
| 删除一个已存在的 key（`DELETE`、带删除标记的导入） | 一条删除记录。开启 before 镜像时携带删除前的值，否则只有 key 列有值 |
| 删除后再次写入同一个 key | 一条新增记录（前一个版本是删除标记，不是有效行） |
| 写入的 sequence 列值小于当前可见行 | 写入被丢弃，不产生变更记录 |

MoW 表的 `DELETE` 语句默认通过写入删除标记实现，因此会产生删除记录。如果表属性 `enable_mow_light_delete` 设为 `true`，`DELETE` 会改用删除谓词，与 Duplicate Key 表一样不产生变更记录，因此开启了 Row Binlog 的表请保持该属性为默认值 `false`。

部分列更新会记录合并后的完整行，而不是只记录被更新的列。灵活部分列更新（`unique_key_update_mode = UPDATE_FLEXIBLE_COLUMNS`）中，同一批次内对同一个 key 先删除再写入，会记录为一条更新记录：before 为删除前的旧行，after 为新写入的行，其中未提供的列取默认值或 NULL，不会沿用旧值。

以下示例展示 MoW 表（开启 before 镜像）的原始变更记录：

```sql
INSERT INTO orders VALUES (1, 'created', 100.00);
INSERT INTO orders VALUES (1, 'paid', 100.00);
DELETE FROM orders WHERE order_id = 1;
INSERT INTO orders VALUES (1, 'created', 150.00);

SELECT __DORIS_BINLOG_OP__ AS op, order_id, status, amount,
       __BEFORE__status__, __BEFORE__amount__
FROM binlog("table" = "orders")
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

```text
+------+----------+---------+--------+--------------------+--------------------+
| op   | order_id | status  | amount | __BEFORE__status__ | __BEFORE__amount__ |
+------+----------+---------+--------+--------------------+--------------------+
|    0 |        1 | created | 100.00 | NULL               |               NULL |
|    1 |        1 | paid    | 100.00 | created            |             100.00 |
|    2 |        1 | paid    | 100.00 | paid               |             100.00 |
|    0 |        1 | created | 150.00 | NULL               |               NULL |
+------+----------+---------+--------+--------------------+--------------------+
```

## 对表 DDL 的约束

<!-- 知识类型: 行为规则 -->
<!-- 适用场景: 评估开启 Row Binlog 后哪些 ALTER TABLE 还能执行 -->

开启 Row Binlog 的表只允许下列 `ALTER TABLE` 操作：

| 允许 | 说明 |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | 仅支持轻量级 schema change（表需开启 `light_schema_change`，默认开启）；新增列会同步加入变更记录 |
| `CREATE INDEX` / `DROP INDEX` | 仅支持轻量级索引变更 |
| `ADD ROLLUP` / `DROP ROLLUP` / `RENAME ROLLUP` | |
| 分区操作：`ADD PARTITION`、`DROP PARTITION`、`MODIFY PARTITION`、`RENAME PARTITION`、`REPLACE PARTITION` | |
| `RENAME` 表、`REPLACE WITH TABLE` | |
| 修改表注释、列注释 | |
| 修改分桶方式 | |
| 修改表属性 | `bloom_filter_columns` / `bloom_filter_fpp` 除外 |
| `ENABLE FEATURE`（如 `SEQUENCE_LOAD`） | 内部转换为 `ADD COLUMN` |

其它操作会被拒绝，报 `Not allowed to perform current operation on Table With binlog<row>`，典型的有：

- `MODIFY COLUMN`（修改列类型、位置等）
- `RENAME COLUMN`
- `ORDER BY`（重排列顺序）
- `BUILD INDEX`
- 修改 bloom filter 相关属性

开启了 Row Binlog 的表可以正常执行 `TRUNCATE TABLE`、备份恢复等表级操作。对基表结构和分区的变更如何影响已创建的 Table Stream，见 [Table Stream 进阶](table-stream-advanced#基表变更的影响)。

## 保留与清理

<!-- 知识类型: 行为规则 -->
<!-- 适用场景: 设置保留时长 / 处理过期位点 / 容量规划 -->

自 Doris 5.0.0 起，`binlog.ttl_seconds` 控制 Row Binlog 的保留时长，存算一体和存算分离模式均支持。保留时长按提交 TSO 中的物理时间计算，以当前 Master FE 的 TSO 为基准。提交时间小于等于「基准时间减去 TTL」的记录视为过期。即使表没有新写入，保留窗口也会随时间推进。

### 配置保留时长

TTL 默认值为 `86400` 秒（一天）。如果数据库显式设置了 `binlog.ttl_seconds`，新建表会继承该值，表属性中的显式设置优先。修改数据库配置不会改变已有表的 TTL。`CREATE TABLE ... LIKE` 会复制源表的 TTL。

例如，将上文创建的 `orders` 表的保留时长改为七天：

```sql
ALTER TABLE orders SET ("binlog.ttl_seconds" = "604800");
```

语句成功后，`SHOW CREATE TABLE orders` 的输出包含：

```text
"binlog.ttl_seconds" = "604800"
```

TTL 必须大于 `0`，不能通过 `0` 或 `-1` 关闭过期机制。缩短 TTL 可能立即使已有记录过期；延长 TTL 可以使尚未被物理清理的记录重新可读，但无法恢复已被清理的记录。如果 `ALTER TABLE` 在向分区下发配置时失败，较短的 TTL 可能已经生效，请检查 `SHOW CREATE TABLE` 并重试同一条语句，完成配置更新。

### 对读取的影响

增量读取在生成执行计划时应用保留窗口，不需要等待物理清理完成。同一条语句使用同一个基准 TSO，每条新语句都会重新计算窗口。

| 读取方式 | 请求的起点已过期时的行为 |
|---|---|
| 未指定 `startTimestamp` 的 `@incr` | 仅读取保留窗口内的变更，`MIN_DELTA` 模式也适用 |
| 显式指定 `startTimestamp` 的 `@incr`，且 `incrementType = MIN_DELTA` | 报 `Row binlog offset has expired according to binlog.ttl_seconds`，避免返回不完整的净变化 |
| `incrementType = DETAIL` 或 `APPEND_ONLY` 的 `@incr` | 将实际起点推进到第一个仍保留的 TSO，仅返回请求窗口内尚未过期的部分 |
| `type = min_delta` 的 Table Stream | 任一分区的消费位点已过期时，报相同错误 |
| `type = detail` 或 `append_only` 的 Table Stream | 跳过过期变更，从第一个仍保留的 TSO 开始读取 |
| MoW 表的快照读取（`FOR TIME AS OF`、`FOR VERSION AS OF` 或 Stream 的 `@snapshot()`） | 重建需要读取 Row Binlog 时，已过期的目标快照报相同错误，因为所需的 before 镜像已不在保留窗口内 |
| `binlog()` 表函数 | 不应用 TTL 过滤；物理清理前仍可能读到已过期的原始记录 |

过期机制不会等待消费者。即使 `IS_STALE` / `STALE_REASON` 仍显示 Stream 可用，也应在保留窗口内完成消费：当前实现不会通过这两个字段报告 TTL 过期。所需变更过期后，需要从全量快照重建下游数据。对于 Table Stream，可按 [reset 流程](table-stream-advanced#重置-reset) 全量重载下游并推进位点。IVM 的内部 Stream 请通过 [物化视图刷新任务](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#内部-table-stream) 管理。

### 示例：变更过期后基表数据仍保留

在已有数据库中执行以下示例。执行用户需具备建表所需的 `CREATE` 权限、写入所需的 `LOAD` 权限，以及查询所需的 `SELECT` 权限：

```sql
CREATE TABLE row_binlog_ttl_demo (id INT, value INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.ttl_seconds" = "30"
);

INSERT INTO row_binlog_ttl_demo VALUES (1, 10);

SELECT COUNT(*) AS change_count
FROM row_binlog_ttl_demo@incr("incrementType" = "DETAIL");
```

写入后立即查询，结果为：

```text
+--------------+
| change_count |
+--------------+
|            1 |
+--------------+
```

等待超过 30 秒后，再次执行增量查询：

```sql
SELECT COUNT(*) AS change_count
FROM row_binlog_ttl_demo@incr("incrementType" = "DETAIL");
```

```text
+--------------+
| change_count |
+--------------+
|            0 |
+--------------+
```

基表中的行仍然存在：

```sql
SELECT id, value FROM row_binlog_ttl_demo;
```

```text
+------+-------+
| id   | value |
+------+-------+
|    1 |    10 |
+------+-------+
```

### 物理清理与容量规划

后台 compaction 会回收 Row Binlog 中已全部过期的 Rowset，即使表没有新写入也会执行。包含未过期记录的 Rowset 会保留到其中所有记录都过期。清理会保留基表数据和版本连续性。存储空间异步回收，因此 TTL 不代表文件必须在该时刻消失，也不构成严格的存储大小上限。

自动清理要求 BE 开启 `enable_feature_binlog = true`，且自动 compaction 未被关闭。将 BE 配置或表属性 `disable_auto_compaction` 设为 `true` 会暂停自动清理，但增量读取仍会过滤过期记录。BE 重启后，清理会等待 Master FE 心跳下发有效的基准 TSO。

`binlog.max_bytes` 和 `binlog.max_history_nums` 对 Row Binlog 仍不生效。请根据写入量、TTL 和清理延迟预留存储空间；对开启 before 镜像的 MoW 表，每次更新还会额外记录一份旧值。TTL 应覆盖最长消费延迟、刷新间隔和预期故障停机时间，并为恢复预留余量。

## 写入开销

<!-- 知识类型: 性能说明 -->
<!-- 适用场景: 上线前评估导入吞吐 -->

开启 Row Binlog 后，每次写入需要额外生成并持久化变更记录；对 MoW 表，更新和删除还需要读取旧值以生成 before 镜像。导入吞吐会有可感知的下降，实际幅度与表结构、更新比例有关。建议：

- 只对确实需要增量消费的表开启。
- 上线前使用真实的写入负载评估吞吐变化。
- 不需要变更前的值时（例如只做 `append_only` 消费、只关心最新值），不要开启 `binlog.need_historical_value`。

## 用 binlog() 表函数排查

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 确认某次写入是否产生了预期的变更 / 查看某个 key 的变更历史 -->

`binlog()` 表函数返回一张表的原始变更记录，例如用来确认某次写入是否产生了预期的变更、查看某个 key 的变更历史。

:::caution
`binlog()` 主要用于内部调试，不建议在正式数据处理流程中使用。它的输出格式和参数可能随版本变化，正式的增量消费请使用 [Table Stream](table-stream) 或 [`@incr`](incremental-query)。
:::

```sql
SELECT __DORIS_BINLOG_OP__, __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__,
       order_id, status, amount
FROM binlog(
    "db" = "demo",
    "table" = "orders",
    "partition" = "p20260914"
)
WHERE order_id = 1
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

| 参数 | 是否必填 | 说明 |
|---|---|---|
| `table` | 是 | 表名 |
| `db` | 否 | 数据库名，默认为当前数据库 |
| `partition` | 否 | 分区名，多个用逗号分隔，默认全部分区 |
| `tablet` | 否 | tablet ID，多个用逗号分隔，默认全部 tablet |

`binlog()` 直接读取存储的原始记录，不做变更折叠或 TTL 过滤，返回的 `__DORIS_BINLOG_OP__` 使用原始编码（`0` 新增、`1` 更新、`2` 删除）。物理清理完成前，这里仍可能看到过期记录。完整语法见 [BINLOG 表函数](../../sql-manual/sql-functions/table-valued-functions/binlog)。

## 常见错误对照

<!-- 知识类型: 故障排查 -->

| 错误信息 | 原因 | 处理 |
|---|---|---|
| `Invalid binlog format value: row` | `binlog.format` 使用了小写 `row` | 取值区分大小写，改为大写 `ROW` |
| `ROW binlog.ttl_seconds must be greater than 0` | TTL 为 `0` 或负数 | 设置以秒为单位的正整数，默认值为 `86400` |
| `Row binlog offset has expired according to binlog.ttl_seconds` | `MIN_DELTA` 起点或 MoW 快照超出保留窗口 | 从全量快照重建下游数据并重新对齐消费位点，见 [对读取的影响](#对读取的影响) |
| `not support change binlog format from STATEMENT_AND_SNAPSHOT to ROW` | 对已有表用 `ALTER TABLE` 开启 Row Binlog | Row Binlog 只能在建表时开启。新建开启 Row Binlog 的表并导入数据，再用 `ALTER TABLE ... REPLACE WITH TABLE` 原子替换 |
| `can't disable binlog when format is [Row]` | 尝试在已开启 Row Binlog 的表上设置 `binlog.enable = false` | Row Binlog 开启后不可关闭 |
| `not support change binlog.need_historical_value from true to false` | 尝试修改 `binlog.need_historical_value` | 该属性建表后不可修改 |
| `Duplicate table model don't support record historical value` | Duplicate Key 表设置了 `binlog.need_historical_value = true` | Duplicate Key 表不支持 before 镜像，去掉该属性；需要 before 镜像时改用 Unique Key MoW 表 |
| `Unique merge-on-write tables with cluster keys do not support binlog<Row>` | MoW 表带有 cluster key | 建表时不要指定 cluster key |
| `Only duplicate and mow table model support binlog<Row>` | 表模型为 Aggregate Key 或 Unique Key Merge-on-Read | 改用 Duplicate Key 或 Unique Key MoW 表 |
| `Not allowed to perform current operation on Table With binlog<row>` | 执行了 `MODIFY COLUMN`、`RENAME COLUMN`、`ORDER BY`、`BUILD INDEX` 或修改 bloom filter 属性等不允许的 DDL | 见 [对表 DDL 的约束](#对表-ddl-的约束) 中的允许清单 |
