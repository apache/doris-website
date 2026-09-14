---
{
    "title": "Table Stream 进阶",
    "language": "zh-CN",
    "description": "Doris Table Stream 进阶用法：分区级消费位点与按分区分批消费、@snapshot() 快照读取与 @reset() 重置、与维表关联、多 Stream 与并发消费、基表 schema change / 分区变更 / 删表对 Stream 的影响、监控与故障恢复，以及常见错误对照。"
}
---

<!-- 知识类型: 操作指南 + 运维手册 -->
<!-- 适用场景: 大表按分区分批消费 / 增量关联维表 / 下游重建 / 消费链路运维 -->

本文假设你已经读过 [Table Stream 基础](table-stream.md)，示例沿用其中的 `orders` 表和 `orders_stream`。

## 分区级消费位点

Stream 的消费位点按基表分区维护，`information_schema.table_stream_consumption` 每行对应一个分区：

```sql
SELECT UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream'
ORDER BY UNIT;
```

```text
+-----------+--------------------+-----------+-----------------------+
| UNIT      | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+-----------+--------------------+-----------+-----------------------+
| p20260912 | 469015470080000000 | 0         |         1789180806000 |
| p20260913 | 469041123123200000 | 0         |         1789267206000 |
| p20260914 | 469067681628160003 | 262144000 |         1789351206000 |
| p20260915 | N/A                | 0         |                    -1 |
+-----------+--------------------+-----------+-----------------------+
```

| 列 | 说明 |
|---|---|
| `UNIT` | 消费单元，即基表分区名。未显式分区的表只有一个与表同名的分区 |
| `CONSUMPTION_STATUS` | 该分区已消费到的提交时间戳（TSO）。`N/A` 表示该分区还没有消费过 |
| `LAG` | 该分区最新提交的 TSO 与已消费 TSO 的差值。`0` 表示没有积压；`N/A` 表示分区有数据但还没有消费过 |
| `LAST_CONSUMPTION_TIME` | 最近一次消费该分区的时间（毫秒时间戳），`-1` 表示没有消费过 |

TSO 的高位是物理时间（毫秒），低 18 位是逻辑计数，因此 `LAG` 除以 262144（2 的 18 次方）约等于积压的毫秒数。上例中 `p20260914` 的积压约为 1 秒。

### 按分区消费

大表的变更集中在少数活跃分区时，可以用 `PARTITION` 子句只消费部分分区，只有被消费的分区的位点会推进：

```sql
INSERT INTO dwd_orders
SELECT order_id, status, amount
FROM orders_stream PARTITION (p20260914)
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

同一条语句里多次引用同一个 Stream 的不同分区，会合并成一次位点更新。

存算分离模式下，一条 `INSERT` 消费的分区数不能超过 FE 配置 `cloud_table_stream_max_partitions_per_insert`（默认 10000），超出时报 `Cloud Table Stream consumes N partitions, exceeding cloud_table_stream_max_partitions_per_insert=...`，请按 `PARTITION` 分批消费。

### 分区的增减

- Stream 创建之后新增的分区（包括动态分区、自动分区创建的分区），其中的全部数据都会作为变更输出，首次消费该分区时从头读取。
- 分区被删除后，其位点记录会由 FE 定期清理（`table_stream_partition_offset_cleanup_interval_second`，默认 3600 秒），不需要人工处理。被删除分区中尚未消费的变更随分区一起消失。

## 快照读取 @snapshot()

`<stream>@snapshot()` 返回基表在 Stream **当前消费位点**处的镜像，也就是"本轮待消费的变更发生之前"基表的样子：

```sql
SELECT order_id, status, amount FROM orders_stream@snapshot() ORDER BY order_id;
```

以 [Table Stream 基础](table-stream.md#消费类型) 中的数据为例，创建 Stream 时基表有订单 1、2、3，之后发生了更新 1、删除 2、新增 4 等变更但尚未消费。此时 `@snapshot()` 返回的仍是订单 1（更新前）、2、3，而普通读取返回这些变更。两者的关系是：**快照 + 待消费的变更 = 基表当前状态**。

`@snapshot()` 的特点：

- 不推进位点。用 `INSERT INTO ... SELECT FROM <stream>@snapshot()` 写入其它表也不会推进。
- 返回的是表镜像，不提供 `__DORIS_STREAM_*` 虚拟列。
- 按分区取镜像：每个分区各自使用自己的消费位点。
- `show_initial_rows = true` 且尚未消费过的分区，其快照为空（消费从"什么都没有"开始，存量数据都属于待消费的变更）。

典型用途：

- **对账**：消费前先把 `@snapshot()` 的结果与下游表比对，确认下游与上一轮消费后的基表状态一致，再消费本轮变更。
- **重建下游**：下游表损坏时，用 `@snapshot()` 恢复到消费位点对应的状态，再正常消费后续变更，不会漏掉或重复处理位点之后的变更。
- **增量关联中的"变更前镜像"**：见下文 [与维表关联](#与维表关联)。

## 重置 @reset()

`<stream>@reset()` 返回基表**当前**的全量镜像。用普通 `SELECT` 读取它只是查看；用 `INSERT INTO ... SELECT FROM <stream>@reset()` 消费它，会把 Stream 所有分区的位点推进到当前，之后 Stream 只输出这次消费之后的变更：

```sql
-- 清空下游后全量重刷，并把位点推进到当前
TRUNCATE TABLE dwd_orders;
INSERT INTO dwd_orders
SELECT order_id, status, amount FROM orders_stream@reset();

-- 之后正常增量消费
SELECT COUNT(*) FROM orders_stream;   -- 0
```

典型用途：

- 下游需要重新做一次全量同步，然后从当前位置继续增量。
- 创建 Stream 时 `show_initial_rows = false`，事后又需要先同步存量数据。
- Stream 积压过多、下游不再需要历史变更时，直接跳到当前。

与 `@snapshot()` 一样，`@reset()` 不提供 `__DORIS_STREAM_*` 虚拟列。

## 与维表关联

Stream 可以直接和其它表 JOIN，此时维表读到的是它当前的数据：

```sql
INSERT INTO dwd_orders_wide
SELECT o.order_id, o.status, o.amount, u.user_name, u.city
FROM orders_stream AS o
JOIN users AS u ON o.user_id = u.user_id
WHERE o.__DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

如果维表自身也在变化，而你需要的是与消费节奏对齐的维表状态，可以为维表也创建一个 Stream，并在同一个消费任务里配合使用：

- `users_stream@snapshot()`：上一轮消费时的维表镜像。
- `users_stream`：上一轮到现在维表的变更。
- `users_stream@reset()`：当前的维表镜像。

例如订单增量关联"上一轮消费时"的用户信息，同时单独处理用户表自身的变更：

```sql
INSERT INTO dwd_orders_wide
SELECT o.order_id, o.status, o.amount, u.user_name, u.city
FROM orders_stream AS o
JOIN users_stream@snapshot() AS u ON o.user_id = u.user_id
WHERE o.__DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

这条语句只推进 `orders_stream` 的位点；`users_stream` 的位点由消费 `users_stream` 的语句推进。两个 Stream 的消费节奏由你的任务编排决定。

## 多 Stream 与并发消费

- **一张基表多个 Stream**：每个 Stream 独立维护位点，互不影响。不同下游可以各建一个 Stream，按各自的节奏消费。
- **一条语句消费多个 Stream**：例如把两张表的变更 UNION 后写入同一张目标表，所有涉及的 Stream 的位点在同一个事务里推进。
- **同一个 Stream 多个消费者**：两个会话同时消费同一个 Stream 的同一个分区时，后提交的事务失败并回滚，报 `target offset already consumed`。请保证一个 Stream 的每个分区同一时刻只有一个消费者；需要并行时，按分区拆分任务，或者为每个消费者单独创建 Stream。
- **消费与写入并发**：消费 Stream 时基表可以正常写入。消费语句读取的是它开始时已提交的变更，之后提交的写入留到下一轮。

## 基表变更的影响

| 基表操作 | 对 Stream 的影响 |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | Stream 的列自动同步。新增列在之后的变更记录中带有实际值，删除的列不再输出 |
| `ADD PARTITION`、动态分区、自动分区 | 新分区从头消费，其全部数据作为变更输出 |
| `DROP PARTITION` | 该分区尚未消费的变更随分区消失，位点记录由 FE 定期清理 |
| `TRUNCATE TABLE` / `TRUNCATE PARTITION` | 被清空的分区会得到新的分区 ID，之后写入的数据从头作为变更输出；清空前尚未消费的变更消失。其它分区不受影响 |
| `REPLACE PARTITION`（临时分区替换） | 替换后的分区从头消费；被替换掉的分区中尚未消费的变更消失 |
| `RENAME` 表或分区 | 不受影响，Stream 通过 ID 引用基表 |
| `REPLACE WITH TABLE` | Stream 仍然指向原来的表对象（即交换后换了名字的那张表），通常不是预期结果。替换基表后请删除并重建 Stream |
| `DROP TABLE` 基表 | Stream 仍然保留，但无法再读取。请用 `DROP STREAM ... FORCE` 删除 |
| `DROP DATABASE` | 库内的 Stream 一并删除。位于其它库、以本库的表为基表的 Stream 会保留，同样需要 `FORCE` 删除 |

不允许在开启 Row Binlog 的基表上执行的 DDL（如 `MODIFY COLUMN`）见 [Row Binlog](row-binlog.md#对表-ddl-的约束)。

## 监控与故障恢复

### 监控

- **积压**：定期查询 `information_schema.table_stream_consumption` 的 `LAG`，对长时间不为 `0` 或持续增长的分区告警。
- **状态**：`information_schema.table_streams` 的 `ENABLED`、`IS_STALE`、`STALE_REASON` 反映 Stream 是否可用。当前版本 Row Binlog 不会自动清理，Stream 不会因为长期不消费而失效；自动清理能力上线后，变更记录已被清理的 Stream 会被标记为 stale，需要通过 `@reset()` 重新对齐。
- **消费历史**：`LAST_CONSUMPTION_TIME` 可用于判断消费任务是否按计划运行。

### 故障恢复

- **消费语句失败**：位点不变，直接重跑即可，不会漏掉变更。
- **消费成功但调度系统没记录到**：如果重跑，本轮读到的是下一批变更，不会重复消费上一批。要让重复执行完全无副作用，目标表建议使用 Unique Key 模型（按主键写入天然幂等）。
- **下游数据错误需要重建**：用 `@snapshot()` 恢复到消费位点对应的状态后继续增量消费；或者用 `@reset()` 全量重刷并把位点推进到当前。
- **FE 重启、主从切换**：位点持久化在元数据中，重启后继续消费。

## 常见错误对照

- `Table Stream is experimental. Please set enable_table_stream=true to enable it.`

    原因：FE 未开启 `enable_table_stream`。处理：修改 `fe.conf` 并重启 FE。

- `Insert plan with Table stream failed. should enable binlog feature in FE config.`

    原因：FE 未开启 `enable_feature_binlog`。处理：修改 `fe.conf` 并重启 FE。

- `Base Olap table ... need to enable row binlog for table stream`

    原因：基表未开启 Row Binlog。处理：重建基表并开启 `binlog.enable` + `binlog.format = ROW`。

- `MIN_DELTA table stream requires base mow table to enable binlog.need_historical_value=true`

    原因：`min_delta` / 默认类型要求 before 镜像。处理：基表开启 `binlog.need_historical_value`，或改用 `append_only`。

- `not supported type: xxx`

    原因：`type` 取值不合法。处理：使用 `append_only` / `min_delta` / `detail`。

- `target offset already consumed`

    原因：并发消费同一分区，本事务提交时位点已被推进。处理：重跑即可读到新的一批；避免并发消费。

- `Cloud Table Stream consumption only supports a normal INSERT into a local OLAP table`

    原因：存算分离模式下在显式事务、Group Commit 中消费，或目标不是内表。处理：改用普通 `INSERT INTO ... SELECT`。

- `Cloud Table Stream consumes N partitions, exceeding cloud_table_stream_max_partitions_per_insert=...`

    原因：单条语句涉及分区过多。处理：按 `PARTITION` 分批消费，或调大该配置。

- `Cloud Table Stream only supports DROP STREAM ... FORCE`

    原因：存算分离模式下删除 Stream 未加 `FORCE`。处理：使用 `DROP STREAM ... FORCE`。

- `Unknown column '__DORIS_STREAM_CHANGE_TYPE_COL__' ...`

    原因：在 `@snapshot()` / `@reset()` 上引用虚拟列。处理：镜像读取不提供虚拟列。
