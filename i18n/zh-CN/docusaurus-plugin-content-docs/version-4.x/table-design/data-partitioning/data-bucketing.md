---
{
    "title": "数据分桶",
    "language": "zh-CN",
    "description": "一个分区可以根据业务需求进一步划分为多个数据分桶（bucket）。每个分桶都作为一个物理数据分片（tablet）存储。合理的分桶策略可以有效降低查询时的数据扫描量，提升查询性能并增加并发处理能力。"
}
---

一个分区可以根据业务需求进一步划分为多个数据分桶（bucket）。每个分桶都作为一个物理数据分片（tablet）存储。合理的分桶策略可以有效降低查询时的数据扫描量，提升查询性能并增加并发处理能力。


## 分桶方式

Doris 支持两种分桶方式：Hash 分桶与 Random 分桶。

### Hash 分桶

在创建表或新增分区时，用户需选择一列或多列作为分桶列，并明确指定分桶的数量。在同一分区内，系统会根据分桶键和分桶数量进行哈希计算。哈希值相同的数据会被分配到同一个分桶中。例如，在下图中，p250102 分区根据 region 列被划分为 3 个分桶，哈希值相同的行被归入同一个分桶。

![hash-bucket](/images/table-desigin/hash-bucket.png)

推荐在以下场景中使用 Hash 分桶：

* 业务需求频繁基于某个字段进行过滤时，可将该字段作为分桶键，利用 Hash 分桶提高查询效率。

* 当表中的数据分布较为均匀时，Hash 分桶同样是一种有效的选择。

以下示例展示了如何创建带有 Hash 分桶的表。详细语法请参考 CREATE TABLE 语句。

```sql
CREATE TABLE demo.hash_bucket_tbl(
    oid         BIGINT,
    dt          DATE,
    region      VARCHAR(10),
    amount      INT
)
DUPLICATE KEY(oid)
PARTITION BY RANGE(dt) (
    PARTITION p250101 VALUES LESS THAN("2025-01-01"),
    PARTITION p250102 VALUES LESS THAN("2025-01-02")
)
DISTRIBUTED BY HASH(region) BUCKETS 8;
```

示例中，通过 `DISTRIBUTED BY HASH(region)` 指定了创建 Hash 分桶，并选择 `region` 列作为分桶键。同时，通过 `BUCKETS 8` 指定了创建 8 个分桶。

### Random 分桶

在每个分区中，使用 Random 分桶会随机地将数据分散到各个分桶中，不依赖于某个字段的 Hash 值进行数据划分。Random 分桶能够确保数据均匀分散，从而避免由于分桶键选择不当而引发的数据倾斜问题。

在导入数据时，单次导入作业的每个批次会被随机写入到一个 tablet 中，以此保证数据的均匀分布。例如，在一次操作中，8 个批次的数据被随机分配到 `p250102` 分区下的 3 个分桶中。

![random-bucket](/images/table-desigin/random-bucket.png)

在使用 Random 分桶时，可以启用单分片导入模式（通过设置 `load_to_single_tablet` 为 `true`）。这样，在大规模数据导入过程中，单个批次的数据仅写入一个数据分片，能够提高数据导入的并发度和吞吐量，减少因数据导入和压缩（Compaction）操作造成的写放大问题，从而确保集群稳定性。

在以下场景中，建议使用 Random 分桶：

* 在任意维度分析的场景中，业务没有特别针对某一列频繁进行过滤或关联查询时，可以选择 Random 分桶；

* 当经常查询的列或组合列数据分布极其不均匀时，使用 Random 分桶可以避免数据倾斜。

* Random 分桶无法根据分桶键进行剪裁，会扫描命中分区的所有数据，不建议在点查场景下使用；

* 只有 DUPLICATE 表可以使用 Random 分区，UNIQUE 与 AGGREGATE 表无法使用 Random 分桶；

以下示例展示了如何创建带有 Random 分桶的表。详细语法请参考 CREATE TABLE 语句：

```sql
CREATE TABLE demo.random_bucket_tbl(
    oid         BIGINT,
    dt          DATE,
    region      VARCHAR(10),
    amount      INT
)
DUPLICATE KEY(oid)
PARTITION BY RANGE(dt) (
    PARTITION p250101 VALUES LESS THAN("2025-01-01"),
    PARTITION p250102 VALUES LESS THAN("2025-01-02")
)
DISTRIBUTED BY RANDOM BUCKETS 8;
```

示例中，通过 `DISTRIBUTED BY RANDOM` 语句指定了使用 Random 分桶，创建 Random 分桶无需选择分桶键，通过 `BUCKETS 8` 语句指定创建 8 个分桶。

## 选择分桶键

:::tip 提示

只有 Hash 分桶需要选择分桶键，Random 分桶不需要选择分桶键。

:::

分桶键可以是一列或者多列。如果是 DUPLICATE 表，任何 Key 列与 Value 列都可以作为分桶键。如果是 AGGREGATE 或 UNIQUE 表，为了保证逐渐的聚合性，分桶列必须是 Key 列。

通常情况下，可以根据以下规则选择分桶键：

* **利用查询过滤条件：**&#x4F7F;用查询中的过滤条件进行 Hash 分桶，有助于数据的剪裁，减少数据扫描量；

* **利用高基数列：**&#x9009;择高基数（唯一值较多）的列进行 Hash 分桶，有助于数据均匀的分散在每一个分桶中；

* **高并发点查场景：**&#x5EFA;议选择单列或较少列进行分桶。点查可能仅触发一个分桶扫描，不同查询之间触发不同分桶扫描的概率较大，从而减小查询间的 IO 影响。

* **大吞吐查询场景：**&#x5EFA;议选择多列进行分桶，使数据更均匀分布。若查询条件不能包含所有分桶键的等值条件，将增加查询吞吐，降低单个查询延迟。

## 选择分桶数量

在 Doris 中，一个 bucket 会被存储为一个物理文件（tablet）。一个表的 Tablet 数量等于 partition\_num（分区数）乘以 bucket\_num（分桶数）。一旦指定 Partition 的数量，便不可更改。

在确定 bucket 数量时，需预先考虑机器扩容情况。自 2.0 版本起，Doris 支持根据机器资源和集群信息自动设置分区中的分桶数。

### 手动设置分桶数

通过 `DISTRIBUTED` 语句可以指定分桶数量：

```sql
-- Set hash bucket num to 8
DISTRIBUTED BY HASH(region) BUCKETS 8

-- Set random bucket num to 8
DISTRIBUTED BY RANDOM BUCKETS 8
```

在决定分桶数量时，通常遵循数量与大小两个原则，当发生冲突时，优先考虑大小原则：

* **大小原则**：建议一个 tablet 的大小在 1-10G 范围内。过小的 tablet 可能导致聚合效果不佳，增加元数据管理压力；过大的 tablet 则不利于副本迁移、补齐，且会增加 Schema Change 操作的失败重试代价；

* **数量原则**：在不考虑扩容的情况下，一个表的 tablet 数量建议略多于整个集群的磁盘数量。

例如，假设有 10 台 BE 机器，每个 BE 一块磁盘，可以按照以下建议进行数据分桶：

| 单表大小  | 建议分桶数量                        |
|-------|-------------------------------|
| 500MB | 4-8 个分桶                       |
| 5GB   | 6-16 个分桶                      |
| 50GB  | 32 个分桶                        |
| 500GB | 建议分区，每个分区 50GB，每个分区 16-32 个分桶 |
| 5TB   | 建议分区，每个分区 50GB，每个分区 16-32 个分桶 |

:::tip 提示

表的数据量可以通过 `SHOW DATA` 命令查看。结果需要除以副本数，即表的数据量。

:::

### 自动设置分桶数

自动推算分桶数功能会根据过去一段时间的分区大小，自动预测未来的分区大小，并据此确定分桶数量。

```sql
-- Set hash bucket auto
DISTRIBUTED BY HASH(region) BUCKETS AUTO
properties("estimate_partition_size" = "20G")

-- Set random bucket auto
DISTRIBUTED BY HASH(region) BUCKETS AUTO
properties("estimate_partition_size" = "20G")
```

在创建分桶时，可以通过 `estimate_partition_size` 属性来调整前期估算的分区大小。此参数为可选设置，若未给出，Doris 将默认取值为 10GB。请注意，该参数与后期系统通过历史分区数据推算出的未来分区大小无关。

## 维护数据分桶

:::tip 提示

目前，Doris 仅支持修改新增分区的分桶数量，对于以下操作暂不支持：

1. 不支持修改分桶类型

2. 不支持修改分桶键

3. 不支持修改已创建的分桶的分桶数量

:::

在建表时，已通过 `DISTRIBUTED` 语句统一指定了每个分区的数量。为了应对数据增长或减少的情况，在动态增加分区时，可以单独指定新分区的分桶数量。以下示例展示了如何通过 `ALTER TABLE` 命令来修改新增分区的分桶数：

```sql
-- Modify hash bucket table
ALTER TABLE demo.hash_bucket_tbl 
ADD PARTITION p250103 VALUES LESS THAN("2025-01-03")
DISTRIBUTED BY HASH(region) BUCKETS 16;

-- Modify random bucket table
ALTER TABLE demo.random_bucket_tbl 
ADD PARTITION p250103 VALUES LESS THAN("2025-01-03")
DISTRIBUTED BY RANDOM BUCKETS 16;

-- Modify dynamic partition table
ALTER TABLE demo.dynamic_partition_tbl
SET ("dynamic_partition.buckets"="16");
```

在修改分桶数量后，可以通过 SHOW PARTITION 命令查看修改后的分桶数量。

