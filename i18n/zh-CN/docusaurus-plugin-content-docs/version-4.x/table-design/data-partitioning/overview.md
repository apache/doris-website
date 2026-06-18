---
{
    "title": "分区与分桶",
    "language": "zh-CN",
    "description": "为 Doris 表选择推荐的分区与分桶方式，以及何时自定义：自动、动态、手动分区，分桶方式与分桶数。"
}
---

Doris 将一张表分为两层组织：分区按列值拆分数据行，分桶将每个分区切分为多个分片以实现并行。本文给出推荐的起步配置，并说明何时需要自定义。

## 推荐起步配置

大多数表建议按时间分区，并让 Doris 自动创建分区、自动确定分桶数：

```sql
CREATE TABLE sales (
    sale_time   DATETIME NOT NULL,
    order_id    BIGINT   NOT NULL,
    amount      DECIMAL(10, 2)
)
DUPLICATE KEY(sale_time, order_id)
AUTO PARTITION BY RANGE (date_trunc(sale_time, 'day')) ()
DISTRIBUTED BY HASH(order_id) BUCKETS AUTO;
```

- **自动分区（Auto Partition）**：数据写入时按需创建分区，无需预先定义或回填分区范围。
- **`BUCKETS AUTO`**：由 Doris 根据数据量自动确定分片数量。
- 基于 `sale_time` 的分区裁剪与跨分桶的并行扫描可保证查询性能。

如果表没有时间列，或数据量较小（约 1 GB 以内），使用单分区加固定分桶数即可：

```sql
DISTRIBUTED BY HASH(order_id) BUCKETS 10
```

## 选择你的设计

仅在默认方式不适用时才自定义：

| 决策项 | 推荐默认 | 何时调整 |
| --- | --- | --- |
| 如何分区 | 按时间列[自动分区](./auto-partitioning) | 需要固定或不规则范围时，用[手动分区](./manual-partitioning)；需要按时间滚动并保留窗口时，用[动态分区](./dynamic-partitioning) |
| 分桶方式 | 按高基数列做 Hash 分桶 | 数据倾斜或需按任意维度过滤时，用 Random 分桶（[数据分桶](./data-bucketing)） |
| 分桶数量 | `BUCKETS AUTO` | 已知数据量并希望固定控制时，手动设置分桶数（[数据分桶](./data-bucketing)） |

## 工作原理

Doris 将数据按两层映射：

```text
表 ──► 分区（按列值）──► 分桶（Hash 或 Random）──► Tablet（BE 节点上的分片）
```

分区用于数据裁剪与生命周期管理（如按时间归档或删除），分桶将每个分区分散到多个 Tablet 以实现读写并行。完整的数据分布模型（包括 Tablet、副本及其与节点的映射），见[分区与分桶原理](./basic-concepts)。

## 后续步骤

- [自动分区](./auto-partitioning)：默认方式，无需手动维护分区范围。
- [动态分区](./dynamic-partitioning)：按时间滚动并保留窗口。
- [手动分区](./manual-partitioning)：显式声明 Range 与 List 分区。
- [数据分桶](./data-bucketing)：选择分桶方式、分桶键与分桶数。
- [分区与分桶原理](./basic-concepts)：底层数据分布模型。
- [常见问题](./common-issues)：分区与分桶设计的排查方法。
