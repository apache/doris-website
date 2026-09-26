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
| How to partition | [Auto partitioning](./auto-partitioning) | Use [manual partitioning](./manual-partitioning) for schemes auto cannot express: custom or irregular ranges, ranges on a numeric column, or grouped LIST values. [Dynamic partitioning](./dynamic-partitioning) is superseded by auto. |
| Bucketing method | Hash on a high-cardinality column | If data skews, or you filter on arbitrary dimensions, use random bucketing ([Data Bucketing](./data-bucketing)) |
| Number of buckets | `BUCKETS AUTO` | If you know your data size and want fixed control, set a count ([Data Bucketing](./data-bucketing)) |

## Expire Old Partitions

To drop old data automatically, set a retention policy. Both modes keep the most recent partitions and drop older ones; they differ in how you express the limit:

| Partition mode | Property | Retention limit |
| --- | --- | --- |
| [Dynamic partitioning](./dynamic-partitioning) | `dynamic_partition.start` (for example, `-7`) | A time window: keep partitions within the last N time units of now |
| [Auto partitioning](./auto-partitioning) (RANGE) | `partition.retention_count` (for example, `3`) | A partition count: keep the newest N historical partitions |

With regular time partitions (such as one per day), the two are effectively equivalent: "last 7 days" matches "newest 7 daily partitions." They diverge when partitions are irregular or data is stale: a time window can drop every partition once the data is older than the window, whereas a count always keeps the newest N.

Combining auto and dynamic partitioning for retention is no longer recommended; use `partition.retention_count` for auto-range tables.

Retention **drops** data. To move cold data to cheaper storage instead of dropping it, use [tiered storage](../tiered-storage/overview) instead.

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
