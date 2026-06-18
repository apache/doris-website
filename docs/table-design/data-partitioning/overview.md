---
{
    "title": "Partitioning and Bucketing",
    "language": "en",
    "description": "The recommended partitioning and bucketing for a Doris table, and when to customize: auto, dynamic, and manual partitioning, bucketing method, and bucket count."
}
---

Doris organizes a table in two tiers: partitions split rows by column value, and buckets split each partition into shards for parallel processing. This page gives the recommended starting point and shows when to customize.

## Recommended Starting Point

For most tables, partition by time and let Doris manage partition creation and bucket sizing automatically:

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

- **Auto partitioning** creates a partition as data arrives, so you never pre-define or backfill partition ranges.
- **`BUCKETS AUTO`** lets Doris size the number of shards from the data.
- Partition pruning on `sale_time` and parallel scans across buckets keep queries fast.

If the table has no time column or stays small (under about 1 GB), use a single partition with a fixed bucket count:

```sql
DISTRIBUTED BY HASH(order_id) BUCKETS 10
```

## Choose Your Design

Customize only when the default does not fit:

| Decision | Recommended default | Change it when |
| --- | --- | --- |
| How to partition | [Auto partitioning](./auto-partitioning) by a time column | You need fixed or irregular ranges, use [manual partitioning](./manual-partitioning); you want a rolling time window with retention, use [dynamic partitioning](./dynamic-partitioning) |
| Bucketing method | Hash on a high-cardinality column | Data skews or you filter on arbitrary dimensions, use random bucketing ([Data Bucketing](./data-bucketing)) |
| Number of buckets | `BUCKETS AUTO` | You know your data size and want fixed control, set a count ([Data Bucketing](./data-bucketing)) |

## How It Works

Doris maps data in two tiers:

```text
Table ──► Partition (by column value) ──► Bucket (hash or random) ──► Tablet (shard on a BE node)
```

Partitions let Doris skip data that can't match a query, and make it easy to archive or drop data by time. Buckets spread each partition across tablets for parallel reads and writes. For the full data-distribution model, including tablets, replicas, and how they map to nodes, see [How Partitioning and Bucketing Work](./basic-concepts).

## Next Steps

- [Auto Partitioning](./auto-partitioning): the default, with no manual range maintenance.
- [Dynamic Partitioning](./dynamic-partitioning): rolling time windows with retention.
- [Manual Partitioning](./manual-partitioning): explicit ranges and list partitions.
- [Data Bucketing](./data-bucketing): choose the method, key, and bucket count.
- [How Partitioning and Bucketing Work](./basic-concepts): the underlying data-distribution model.
- [Common Issues](./common-issues): troubleshooting partition and bucket design.
