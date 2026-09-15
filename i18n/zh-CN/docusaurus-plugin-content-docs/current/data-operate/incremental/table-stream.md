---
{
    "title": "Table Stream 基础",
    "language": "zh-CN",
    "description": "Doris Table Stream 使用指南：创建、查看、删除 Stream，append_only / min_delta / detail 三种消费类型对比，show_initial_rows，查询与消费的区别，虚拟列与限制。",
    "keywords": [
        "Table Stream",
        "Doris Stream",
        "CREATE STREAM",
        "DROP STREAM",
        "SHOW STREAMS",
        "SHOW CREATE STREAM",
        "ALTER STREAM",
        "append_only",
        "min_delta",
        "detail",
        "show_initial_rows",
        "消费位点",
        "offset",
        "__DORIS_STREAM_CHANGE_TYPE_COL__",
        "__DORIS_STREAM_SEQUENCE_COL__",
        "__DORIS_STREAM_LSN_COL__",
        "APPEND UPDATE_BEFORE UPDATE_AFTER DELETE",
        "增量 ETL",
        "下游表同步",
        "__DORIS_DELETE_SIGN__",
        "information_schema.table_streams",
        "enable_table_stream",
        "Incremental View Maintenance",
        "IVM",
        "变更数据消费"
    ]
}
---

<!-- 知识类型: 操作指南 + Feature 说明 -->
<!-- 适用场景: 增量 ETL / 下游表同步 / 变更审计 / 不重不漏地消费表的变更 -->

Table Stream（下文简称 Stream）是建立在 [Row Binlog](row-binlog) 之上的变更消费对象。它记住"消费到哪了"，每次读取只返回上次消费之后基表发生的变化，并在把变更写入目标表的同一个事务里推进消费位点，从而做到不重不漏。

:::caution 实验性功能
该功能自 5.0.0 版本起提供，目前处于实验阶段，需要在 FE 中开启 `enable_feature_binlog = true` 和 `enable_table_stream = true`。
:::

## 基本概念

<!-- 知识类型: 概念说明 -->

| 概念 | 说明 |
|---|---|
| 基表 | Stream 所跟踪的表，必须开启 Row Binlog。一张基表可以创建多个 Stream，各自独立消费 |
| 消费位点（offset） | Stream 为基表的每个分区分别记录"已消费到的提交时间戳（TSO）"。读取 Stream 时，返回每个分区从消费位点到语句开始时最新提交之间的变更 |
| 变更类型 | `APPEND`（新增）、`UPDATE_BEFORE`（更新前的值）、`UPDATE_AFTER`（更新后的值）、`DELETE`（删除，携带删除前的值） |
| 消费类型 | Stream 创建时指定的 `type`，决定变更以什么粒度输出，见 [消费类型](#消费类型) |
| 查询与消费 | 普通 `SELECT` 只读取变更、不推进位点；`INSERT INTO ... SELECT ... FROM <stream>` 在写入成功时推进位点，见 [查询与消费](#查询与消费) |

:::info IVM 内部 Stream
[物化视图增量维护（IVM）](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view) 会自动创建名称以 `__doris_ivm_stream_` 开头的内部 Stream。用户不需要创建、消费或删除这些 Stream，Doris 也不允许普通 `INSERT INTO` 使用它们。
:::

## 前置条件

<!-- 知识类型: 环境要求 -->

- Doris 5.0.0 及以上版本，FE 已开启 `enable_feature_binlog = true` 和 `enable_table_stream = true`。
- 基表是开启 Row Binlog 的内表；`min_delta` / `detail` 类型还要求基表为 Unique Key MoW 表并开启 `binlog.need_historical_value`，见 [Row Binlog](row-binlog#支持范围与限制)。
- 在 Stream 所在数据库有 `CREATE_PRIV`，对基表有 `SELECT_PRIV`。

## 创建与管理

<!-- 知识类型: 操作步骤 + 语法参考 -->

### 创建 Stream

```sql
CREATE STREAM [IF NOT EXISTS] [<db_name>.]<stream_name>
ON TABLE [<db_name>.]<table_name>
[COMMENT '<comment>']
[PROPERTIES (
    "type" = "<append_only | min_delta | detail>",
    "show_initial_rows" = "<true | false>"
)]
```

| 属性 | 默认值 | 说明 |
|---|---|---|
| `type` | `min_delta` | 消费类型。`min_delta` 和 `detail` 要求基表为 Unique Key MoW 表并开启 `binlog.need_historical_value`；对 Duplicate Key 表，`min_delta` 会退化为 `append_only` |
| `show_initial_rows` | `false` | 创建 Stream 时基表已有的数据是否作为变更输出。见 [初始数据](#初始数据) |

示例：

```sql
CREATE STREAM orders_stream ON TABLE orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

创建 Stream 的要求及不满足时的报错：

| 要求 | 不满足时的报错 |
|---|---|
| 基表已开启 Row Binlog | `Base Olap table ... need to enable row binlog for table stream` |
| `type = min_delta` 时基表必须是 MoW 表且开启 `binlog.need_historical_value` | `MIN_DELTA table stream requires base mow table to enable binlog.need_historical_value=true` |
| 在 Stream 所在数据库有 `CREATE_PRIV`，对基表有 `SELECT_PRIV` | - |

Stream 与基表可以位于不同的数据库。同名的 Stream 不能与表、视图重名。`CREATE OR REPLACE STREAM` 目前不支持。完整语法见 [CREATE STREAM](../../sql-manual/sql-statements/table-and-view/stream/CREATE-STREAM)。

### 查看 Stream

```sql
-- 列出当前数据库的 Stream
SHOW STREAMS;
SHOW STREAMS FROM demo LIKE 'orders%';

-- 查看建 Stream 语句
SHOW CREATE STREAM orders_stream;

-- 查看 Stream 的列（与基表当前的可见列一致）
DESC orders_stream;
```

```text
mysql> SHOW CREATE STREAM orders_stream\G
*************************** 1. row ***************************
       Stream: orders_stream
Create Stream: CREATE STREAM `orders_stream`
ON TABLE internal.demo.orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
"type" = "MIN_DELTA",
"show_initial_rows" = "false"
);
```

`information_schema.table_streams` 列出所有 Stream 及其状态，`information_schema.table_stream_consumption` 展示每个分区的消费位点和积压：

```sql
SELECT STREAM_NAME, CONSUME_TYPE, BASE_TABLE_DB, BASE_TABLE_NAME, ENABLED, IS_STALE, STALE_REASON
FROM information_schema.table_streams
WHERE DB_NAME = 'demo';
```

```text
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| STREAM_NAME   | CONSUME_TYPE | BASE_TABLE_DB | BASE_TABLE_NAME | ENABLED | IS_STALE | STALE_REASON |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| orders_stream | MIN_DELTA    | demo          | orders          |       1 |        0 | N/A          |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
```

两张系统表的完整列说明见 [table_streams](../../admin-manual/system-tables/information_schema/table_streams) 与 [table_stream_consumption](../../admin-manual/system-tables/information_schema/table_stream_consumption)；语句说明见 [SHOW STREAMS](../../sql-manual/sql-statements/table-and-view/stream/SHOW-STREAMS) 与 [SHOW CREATE STREAM](../../sql-manual/sql-statements/table-and-view/stream/SHOW-CREATE-STREAM)。

### 修改 Stream

目前只支持修改注释：

```sql
ALTER STREAM orders_stream SET COMMENT 'new comment';
```

消费类型和 `show_initial_rows` 创建后不能修改，需要删除后重建。语句说明见 [ALTER STREAM](../../sql-manual/sql-statements/table-and-view/stream/ALTER-STREAM)。

### 删除 Stream

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE];
```

- 删除 Stream 不影响基表及其 Row Binlog。
- 基表已被删除的 Stream 仍会保留在目录中，请使用 `FORCE` 删除。
- 存算分离模式下必须使用 `DROP STREAM ... FORCE`。
- 对 Stream 执行 `DROP TABLE` 会报错并提示使用 `DROP STREAM`。

语句说明见 [DROP STREAM](../../sql-manual/sql-statements/table-and-view/stream/DROP-STREAM)。

## 消费类型

<!-- 知识类型: 行为规则 + 选型指南 -->
<!-- 适用场景: 选择 append_only / min_delta / detail -->

| 消费类型 | 输出 | 适用场景 | 对基表的要求 |
|---|---|---|---|
| `append_only` | 只输出新增的行，更新和删除不输出 | 只追加的日志、事件表；下游只关心新增数据 | 开启 Row Binlog |
| `min_delta`（默认） | 按 key 折叠两次消费之间的所有变更，只输出净变化 | 同步下游表，处理的行数最少 | Unique Key MoW 表并开启 `binlog.need_historical_value` |
| `detail` | 逐条输出每一次变更，不做任何折叠 | 审计、回放、需要保留完整修改轨迹 | Unique Key MoW 表并开启 `binlog.need_historical_value` |

下面用同一份数据对比三种消费类型。基表 `orders` 为 Unique Key MoW 表并开启 before 镜像，在创建 Stream 之后执行：

```sql
INSERT INTO orders VALUES (1, 'paid', 100.00);      -- 更新已有订单 1
DELETE FROM orders WHERE order_id = 2;              -- 删除已有订单 2
INSERT INTO orders VALUES (4, 'created', 400.00);   -- 新增订单 4
INSERT INTO orders VALUES (5, 'created', 500.00);   -- 新增订单 5
DELETE FROM orders WHERE order_id = 5;              -- 又删除订单 5
```

然后执行：

```sql
SELECT order_id, status, amount, __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type
FROM <stream>
ORDER BY __DORIS_STREAM_SEQUENCE_COL__, __DORIS_STREAM_LSN_COL__;
```

### append_only

只输出新增的行，更新和删除不输出。适合只追加的日志、事件表，或者下游只关心新增数据的场景。

```text
+----------+---------+--------+-------------+
| order_id | status  | amount | change_type |
+----------+---------+--------+-------------+
|        4 | created | 400.00 | APPEND      |
|        5 | created | 500.00 | APPEND      |
+----------+---------+--------+-------------+
```

- 订单 1 的更新、订单 2 的删除被过滤。
- 订单 5 的新增会输出，之后的删除不会撤销它。
- 对 MoW 表，只有写入一个不存在的 key 才算新增；写入已存在的 key 是更新，不输出。

### min_delta（默认）

按 key 折叠两次消费之间的所有变更，只输出净变化：

| 消费起点时 key 是否存在 | 当前是否存在 | 输出 |
|---|---|---|
| 不存在 | 存在 | 一条 `APPEND`，值为当前值 |
| 存在 | 存在（期间被修改过） | 一条 `UPDATE_BEFORE`（起点时的值）+ 一条 `UPDATE_AFTER`（当前值） |
| 存在 | 不存在 | 一条 `DELETE`，值为起点时的值 |
| 不存在 | 不存在 | 不输出 |

```text
+----------+---------+--------+---------------+
| order_id | status  | amount | change_type   |
+----------+---------+--------+---------------+
|        1 | created | 100.00 | UPDATE_BEFORE |
|        1 | paid    | 100.00 | UPDATE_AFTER  |
|        2 | created | 200.00 | DELETE        |
|        4 | created | 400.00 | APPEND        |
+----------+---------+--------+---------------+
```

- 订单 5 先新增后删除，净变化为空，不输出。
- 同一个 key 在两次消费之间被更新多次，只输出一对 `UPDATE_BEFORE` / `UPDATE_AFTER`，中间值被折叠。
- 折叠的起点是该分区当前的消费位点。消费之后再修改订单 4，下次读到的 `UPDATE_BEFORE` 就是消费时的值。

`min_delta` 是同步下游表最常用的类型：下游按 `APPEND` / `UPDATE_AFTER` 写入、按 `DELETE` 删除即可与基表保持一致，且处理的行数最少。

### detail

逐条输出每一次变更，更新拆成 `UPDATE_BEFORE` 和 `UPDATE_AFTER` 两行，不做任何折叠。适合审计、回放、需要保留完整修改轨迹的场景。

```text
+----------+---------+--------+---------------+
| order_id | status  | amount | change_type   |
+----------+---------+--------+---------------+
|        1 | created | 100.00 | UPDATE_BEFORE |
|        1 | paid    | 100.00 | UPDATE_AFTER  |
|        2 | created | 200.00 | DELETE        |
|        4 | created | 400.00 | APPEND        |
|        5 | created | 500.00 | APPEND        |
|        5 | created | 500.00 | DELETE        |
+----------+---------+--------+---------------+
```

### Duplicate Key 表上的行为

Duplicate Key 表只记录新增，三种类型的输出相同：每一行写入都是一条 `APPEND`，同 key 的多次写入不会合并，`DELETE` 语句删除的数据也不会输出（见 [Row Binlog](row-binlog#duplicate-key-表)）。在 Duplicate Key 表上创建 `min_delta` 类型的 Stream 会自动按 `append_only` 处理。

## 初始数据

<!-- 知识类型: 配置参数 + 行为规则 -->
<!-- 适用场景: 先同步存量再同步增量 -->

`show_initial_rows` 决定创建 Stream 时基表已有的数据要不要输出：

| 取值 | 行为 |
|---|---|
| `false`（默认） | 消费位点初始化为创建时各分区的最新提交，只输出创建之后的变更 |
| `true` | 首次读取时，把基表当前的全量数据作为 `APPEND` 输出（每行的 `__DORIS_STREAM_SEQUENCE_COL__` 为所在分区的提交时间戳）；消费之后转为增量 |

`show_initial_rows = true` 适合"先把存量同步到下游，再持续同步增量"的场景，不需要另外做一次全量导入。需要注意，首次读取输出的是**读取时刻**的全量镜像：创建 Stream 之后、首次消费之前发生的变更会直接体现在镜像里，而不是作为单独的变更输出。

无论取值如何，Stream 创建之后新增的分区，其全部数据都会作为变更输出。

## 查询与消费

<!-- 知识类型: 行为规则 + 操作示例 -->
<!-- 适用场景: 理解什么操作会推进消费位点 -->

### 查询不推进位点

对 Stream 执行普通 `SELECT`，返回每个分区从消费位点到语句开始时最新提交之间的变更。位点不变，重复执行返回相同结果（如果期间基表没有新的写入）。基表在两次查询之间又有写入时，新写入会出现在后一次查询里。

Stream 可以像普通表一样使用 WHERE、JOIN、聚合、CTE 等：

```sql
-- 只看删除
SELECT order_id FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE';

-- 统计积压的变更数量
SELECT __DORIS_STREAM_CHANGE_TYPE_COL__, COUNT(*)
FROM orders_stream GROUP BY 1;
```

### INSERT ... SELECT 推进位点

`INSERT INTO <目标表> SELECT ... FROM <stream>` 会在写入事务提交时，把 Stream 涉及分区的消费位点推进到本次读取的上界：

```sql
INSERT INTO dwd_orders
SELECT order_id, status, amount
FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

消费的语义：

| 语义 | 说明 |
|---|---|
| 原子性 | 写入目标表和推进位点在同一个事务内完成。语句失败或被取消时，位点不变，下次消费仍能读到这批变更 |
| 不重复 | 消费成功后，这批变更不会再出现。两个会话同时消费同一个 Stream 的同一个分区时，后提交的事务会失败（`target offset already consumed`）并回滚，不会重复消费 |
| 过滤即跳过 | 位点按读取范围推进，与 SELECT 是否用 WHERE 过滤掉部分行无关。上例中被过滤掉的 `UPDATE_BEFORE` 和 `DELETE` 行不会再次出现；如果下游还需要处理删除，应在同一条语句里一并写入，或者用另一个 Stream 单独消费 |
| 空结果也推进 | 读取结果为空时，位点同样推进到本次读取的上界 |
| 一条语句可以消费多个 Stream | 各自的位点都会推进；同一个 Stream 在一条语句中被多次引用（别名、CTE、子查询）时只推进一次，多次引用读到的是同一份数据 |

目标表必须是 Doris 内表。存算分离模式下，消费语句只支持普通的 `INSERT INTO ... SELECT`，不支持在显式事务（`BEGIN ... COMMIT`）中执行，也不支持 Group Commit，否则报 `Cloud Table Stream consumption only supports a normal INSERT into a local OLAP table`。

### 典型消费方式

把 `min_delta` 的变更同步到一张 Unique Key 目标表：新增和更新后的值直接写入，删除通过删除标记写入。

```sql
CREATE TABLE dwd_orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8
PROPERTIES ("enable_unique_key_merge_on_write" = "true");

INSERT INTO dwd_orders (order_id, status, amount, __DORIS_DELETE_SIGN__)
SELECT order_id, status, amount,
       CASE WHEN __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE' THEN 1 ELSE 0 END
FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER', 'DELETE');
```

把这条语句放进定时任务（例如 Doris 的 [Job 调度](../../admin-manual/workload-management/job-scheduler) 或外部调度系统）周期执行，就是一条最简单的增量同步链路。写入 Unique Key 目标表天然幂等，即使某次任务在提交后、调度系统记录状态前失败而被重跑，也不会产生错误数据。

## 虚拟列

<!-- 知识类型: 参数参考 -->

Stream 的列与基表当前的可见列一致（基表 `ADD COLUMN` / `DROP COLUMN` 后自动同步），另外提供三个虚拟列。虚拟列不包含在 `SELECT *` 中，需要显式写出：

| 虚拟列 | 类型 | 说明 |
|---|---|---|
| `__DORIS_STREAM_CHANGE_TYPE_COL__` | STRING | 变更类型：`APPEND` / `UPDATE_BEFORE` / `UPDATE_AFTER` / `DELETE` |
| `__DORIS_STREAM_SEQUENCE_COL__` | BIGINT | 变更的提交时间戳（TSO）。同一事务内的变更相同 |
| `__DORIS_STREAM_LSN_COL__` | BIGINT | 变更在事务内的序号。`ORDER BY __DORIS_STREAM_SEQUENCE_COL__, __DORIS_STREAM_LSN_COL__` 即变更发生的顺序 |

`<stream>@snapshot()` 与 `<stream>@reset()` 读取的是表镜像而非变更，不提供虚拟列，见 [Table Stream 进阶](table-stream-advanced)。

## 使用限制

<!-- 知识类型: 使用限制 -->

- 基表必须是开启 Row Binlog 的内表，支持的表模型和列类型限制见 [Row Binlog](row-binlog#支持范围与限制)。
- Stream 只能读取基表的基础索引，不支持指定 rollup / 物化视图，也不支持 `TABLET (...)` 子句。
- Stream 不能作为 `INSERT`、`UPDATE`、`DELETE` 的目标。
- 消费类型和 `show_initial_rows` 创建后不可修改。
- 当前版本 Row Binlog 数据不会自动清理，Stream 长时间不消费不会丢失变更；自动清理能力上线后，长期不消费的 Stream 可能因为变更记录被清理而无法继续消费，届时会通过 `information_schema.table_streams` 的 `IS_STALE` / `STALE_REASON` 标识。
- 基表被删除、分区被删除或替换等操作对 Stream 的影响见 [Table Stream 进阶](table-stream-advanced#基表变更的影响)。

## 常见问题

<!-- 知识类型: FAQ -->

| 问题 | 回答 |
|---|---|
| 刚创建的 Stream 查询结果为空？ | `show_initial_rows = false`（默认）时，创建之前已有的数据不作为变更输出；需要存量数据请创建时设置 `show_initial_rows = true`，见 [初始数据](#初始数据) |
| `SELECT *` 看不到变更类型？ | 虚拟列不包含在 `SELECT *` 中，需要显式写出 `__DORIS_STREAM_CHANGE_TYPE_COL__` 等列 |
| 消费时被 WHERE 过滤掉的行还能再读到吗？ | 不能。位点按读取范围推进，与是否过滤无关；需要处理的变更类型应在同一条语句里一并写入 |
| 两个任务同时消费同一个 Stream 会怎样？ | 后提交的事务失败并回滚，报 `target offset already consumed`；请保证每个分区同一时刻只有一个消费者，见 [多 Stream 与并发消费](table-stream-advanced#多-stream-与并发消费) |
| Duplicate Key 表上能建 `min_delta` 类型的 Stream 吗？ | 可以，但会自动按 `append_only` 处理，且 `DELETE` 语句删除的数据不会输出 |
| 能修改 Stream 的消费类型吗？ | 不能，`ALTER STREAM` 目前只支持修改注释；需要删除后重建 |
| 更多报错的原因与处理 | 见 [常见错误对照](table-stream-advanced#常见错误对照) |
