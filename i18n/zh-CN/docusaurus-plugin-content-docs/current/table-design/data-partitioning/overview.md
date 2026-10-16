---
{
    "title": "分区与分桶",
    "language": "zh-CN",
    "description": "根据查询过滤条件、数据分布和保留要求，为 Doris 表选择分区与分桶方式。"
}
---

Doris 将表分为两层组织：分区按列值拆分数据行，分桶将每个分区拆分为多个 Tablet，以支持并行处理。选择方案时，需要结合查询过滤条件、数据分布和保留要求。

## 时序数据的起步示例

对于持续写入的时序数据，自动分区可以在数据到达时创建时间分区。以下示例按天分区，并自动计算分桶数。

使用具有创建数据库和表权限的账户，通过 MySQL 客户端连接 Doris。示例使用单副本，可在单 BE 开发集群运行；生产环境应选择适当的副本数。

```sql
CREATE DATABASE IF NOT EXISTS partition_demo;
USE partition_demo;

CREATE TABLE sales (
    sale_time   DATETIME NOT NULL,
    order_id    BIGINT   NOT NULL,
    amount      DECIMAL(10, 2)
)
DUPLICATE KEY(sale_time, order_id)
AUTO PARTITION BY RANGE (date_trunc(sale_time, 'day')) ()
DISTRIBUTED BY HASH(order_id) BUCKETS AUTO
PROPERTIES (
    "replication_num" = "1",
    "estimate_partition_size" = "1G"
);

INSERT INTO sales VALUES
    ('2026-10-14 10:00:00', 1, 12.50),
    ('2026-10-15 11:00:00', 2, 20.00);

SELECT COUNT(*) AS row_count FROM sales;
```

```text
+-----------+
| row_count |
+-----------+
|         2 |
+-----------+
```

导入会创建两个按天分区。`BUCKETS AUTO` 根据预估分区大小和集群资源选择分桶数，不会调整已有分区的分桶数。应选择合适的分区粒度，避免产生过多小分区。对于小型维表，或者不需要按时间过滤和管理保留周期的表，可以使用单分区。

## 选择设计方案

| 决策项 | 起步方案 | 何时选择其他方案 |
| --- | --- | --- |
| 分区方式 | 使用[自动分区](./auto-partitioning)按需创建时间或 LIST 分区 | 对于自定义范围、数值范围或合并多个值的 LIST 分区，使用[手动分区](./manual-partitioning)。需要定时创建分区和滚动时间窗口时，使用[动态分区](./dynamic-partitioning)。 |
| 分桶方式 | 对适合等值过滤、数据分布较均匀的列使用 Hash 分桶 | Random 分桶可以降低 DUPLICATE 表的数据倾斜，但不支持分桶裁剪。参见[数据分桶](./data-bucketing)。 |
| 分桶数 | 使用 `BUCKETS AUTO`，并提供有代表性的 `estimate_partition_size` | 需要明确控制时使用固定桶数。应在 Tablet 大小、查询并行度与 Tablet 管理开销之间权衡。 |

## 清理历史分区

两种保留方式表达不同的策略：

| 分区模式 | 属性 | 保留规则 |
| --- | --- | --- |
| [动态分区](./dynamic-partitioning) | `dynamic_partition.start`（例如 `-7`） | 相对当前时间的窗口，使用配置的时间单位和时区 |
| [自动分区](./auto-partitioning)（RANGE） | `partition.retention_count`（例如 `3`） | 按分区值保留最新 N 个**历史分区**；当前和未来分区全部保留 |

保留分区数量不等于保证数据保留时长。数据稀疏或长期没有新增数据时，最新 N 个历史分区可能远早于 N 天之前。需要按数据年龄过期时，应使用时间窗口。

对于示例表，以下策略在当前和未来分区之外，保留最新三个历史分区：

```sql
ALTER TABLE partition_demo.sales SET ("partition.retention_count" = "3");
```

FE 调度器随后清理多余的历史分区。该属性仅适用于 AUTO RANGE 表，不能与已启用的动态分区同时使用。调度行为及版本限制（包括 Doris 4.1.4 的变化）参见[自动分区：生命周期管理](./auto-partitioning#生命周期管理)。

保留策略会**删除**数据。如需将冷数据移至更便宜的存储并继续保留，请使用[冷热分层](../tiered-storage/overview)。

## 工作原理

```text
Table → Partition（按列值）→ Bucket（Hash 或 Random）→ Tablet（BE 节点上的分片）
```

分区支持查询裁剪与数据生命周期管理，分桶支持并行读写。Tablet、副本、节点分布及运维命令参见[分区与分桶的工作原理](./basic-concepts)。

## 后续步骤

- [自动分区](./auto-partitioning)：按需创建分区。
- [动态分区](./dynamic-partitioning)：定时创建分区与滚动时间窗口。
- [手动分区](./manual-partitioning)：显式范围与 LIST 分区。
- [数据分桶](./data-bucketing)：选择分桶方式、分桶键和分桶数。
- [分区与分桶的工作原理](./basic-concepts)：数据分布模型。
- [常见问题](./common-issues)：排查分区与分桶设计问题。
