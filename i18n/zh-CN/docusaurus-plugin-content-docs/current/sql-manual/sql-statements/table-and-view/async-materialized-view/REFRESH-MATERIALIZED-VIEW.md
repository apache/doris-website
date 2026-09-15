---
{
    "title": "REFRESH MATERIALIZED VIEW",
    "language": "zh-CN",
    "description": "手动刷新异步物化视图，可选择 IVM 行级增量刷新、分区刷新、完整刷新或自动选择刷新方式。"
}
---

## 描述

该语句用于手动刷新指定的异步物化视图。刷新任务异步执行，可以通过 `tasks("type"="mv")` 查看状态。

## 语法

```sql
REFRESH MATERIALIZED VIEW <mv_name>
{
    PARTITIONS (<partition_name> [, <partition_name> [, ... ] ])
  | COMPLETE
  | AUTO
  | PARTITIONS [FALLBACK]
  | INCREMENTAL [FALLBACK]
  | INCREMENTAL WITH DRY RUN [LIMIT <limit> [OFFSET <offset>]]
}
```

查看刷新计划而不执行刷新：

```sql
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL [WITH ALL STREAMS]
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> COMPLETE
```

## 必选参数

**1. `<mv_name>`**

> 指定物化视图的名称。

**2. 刷新方式**

| 刷新方式 | 说明 |
|---|---|
| `INCREMENTAL` | 使用 物化视图增量维护（IVM）处理基表两次刷新之间的行级变化。仅适用于创建时启用了 IVM 的物化视图 |
| `PARTITIONS` | 由 Doris 计算发生变化的物化视图分区，并重新计算这些分区 |
| `COMPLETE` | 强制重新计算物化视图的全部数据，不判断分区是否与基表同步 |
| `AUTO` | 由 Doris 自动选择可用方式。对于支持 IVM 的物化视图，依次尝试 IVM、分区刷新和完整刷新 |
| `PARTITIONS (<partition_name>, ...)` | 强制刷新指定的物化视图分区，不判断这些分区是否与基表同步 |

## 可选参数

**1. `FALLBACK`**

允许本次刷新在首选方式无法安全执行时回退：

- `INCREMENTAL FALLBACK` 默认按 IVM、分区刷新、完整刷新的顺序尝试。部分 IVM 错误会直接回退到完整刷新。
- `PARTITIONS FALLBACK` 无法执行分区刷新时回退到完整刷新。
- 不带 `FALLBACK` 的 `INCREMENTAL` 或 `PARTITIONS` 为严格模式，首选方式失败时任务失败。

**2. `WITH DRY RUN`**

仅用于 `INCREMENTAL`。它执行下一次 IVM 刷新的 delta 查询并返回待写入行，但不修改物化视图数据，不推进内部 Table Stream 位点，也不修改 IVM 元数据。

可以使用 `LIMIT` 和 `OFFSET` 限制返回结果。返回列包含业务列和 IVM 使用的内部列。

**3. `WITH ALL STREAMS`**

仅用于 `EXPLAIN ... INCREMENTAL`。默认计划只包含当前有未消费变化的内部 Stream；指定该选项后，计划还包含已经消费完的 Stream，便于检查多表增量计划的完整结构。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
|---|---|---|
| ALTER_PRIV | 物化视图 | `REFRESH` 属于物化视图的 `ALTER` 操作 |

## 注意事项

- `INCREMENTAL` 从 Doris 5.0.0 开始支持，目前处于实验阶段。前置条件、支持范围、回退原因和基线要求见 [物化视图增量维护（IVM）](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)。
- IVM 不支持使用 `PARTITIONS (<partition_name>, ...)` 强制刷新指定分区。需要分区刷新时使用不带分区列表的 `PARTITIONS`，或者使用 `COMPLETE` 完整刷新。
- 严格 `INCREMENTAL` 失败时，物化视图数据和内部 Stream 消费位点都不会推进。
- 对无法感知版本变化的外表使用普通异步物化视图时，应指定 `COMPLETE` 或明确指定分区。
- `EXPLAIN` 和 `WITH DRY RUN` 都不会修改持久化状态。

## 示例

使用 IVM 严格增量刷新：

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL;
```

增量刷新失败时允许回退：

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL FALLBACK;
```

预览下一次增量刷新最多 100 行待写入数据：

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL WITH DRY RUN LIMIT 100;
```

查看完整的 IVM 增量计划：

```sql
EXPLAIN REFRESH MATERIALIZED VIEW mv1 INCREMENTAL WITH ALL STREAMS;
```

由 Doris 计算并刷新发生变化的分区：

```sql
REFRESH MATERIALIZED VIEW mv1 PARTITIONS FALLBACK;
```

刷新指定分区：

```sql
REFRESH MATERIALIZED VIEW mv1 PARTITIONS (p_19950801_19950901, p_19950901_19951001);
```

强制刷新全部数据：

```sql
REFRESH MATERIALIZED VIEW mv1 COMPLETE;
```
