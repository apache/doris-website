---
{
    "title": "Partitioning and Bucketing",
    "language": "en",
    "description": "Choose partitioning and bucketing for Doris tables based on query filters, data distribution, and retention requirements."
}
---

Doris organizes a table in two tiers: partitions split rows by column value, and buckets split each partition into tablets for parallel processing. Choose the design based on query filters, data distribution, and retention requirements.

## Starting Point for Time-Series Data

For time-series data that arrives continuously, auto partitioning can create time partitions as rows arrive. The following example uses daily partitions and automatic bucket sizing.

Connect with a MySQL client using an account with permission to create databases and tables. The example uses one replica so it can run on a single-BE development cluster; choose an appropriate replica count for production.

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

The load creates two daily partitions. `BUCKETS AUTO` chooses the bucket count using the estimated partition size and cluster resources; it does not resize existing partitions. Select a partition interval that avoids creating too many small partitions. Small reference tables or tables without time-based filtering or retention can use a single partition instead.

## Choose Your Design

| Decision | Starting point | When to choose another option |
| --- | --- | --- |
| Partitioning | [Auto partitioning](./auto-partitioning) for on-demand creation of time or list partitions | Use [manual partitioning](./manual-partitioning) for custom ranges, numeric ranges, or grouped LIST values. Use [dynamic partitioning](./dynamic-partitioning) when you need scheduled creation and a rolling time window. |
| Bucketing method | Hash on columns that suit equality filters and distribute data well | Random bucketing can reduce skew for DUPLICATE tables, but does not support bucket pruning. See [Data Bucketing](./data-bucketing). |
| Number of buckets | `BUCKETS AUTO` with a representative `estimate_partition_size` | Use a fixed count when you need explicit control. Balance tablet size and query parallelism against tablet-management overhead. |

## Expire Old Partitions

The retention modes express different policies:

| Partition mode | Property | Retention rule |
| --- | --- | --- |
| [Dynamic partitioning](./dynamic-partitioning) | `dynamic_partition.start` (for example, `-7`) | A window relative to the current time, using the configured time unit and time zone |
| [Auto partitioning](./auto-partitioning) (RANGE) | `partition.retention_count` (for example, `3`) | Keep the newest N **historical** partitions by partition value; current and future partitions are retained |

A partition count is not an elapsed-time guarantee. For sparse or stale data, the newest N historical partitions may be much older than N days. Choose a time window when data must expire by age.

For the example table, the following policy retains the newest three historical partitions in addition to current and future partitions:

```sql
ALTER TABLE partition_demo.sales SET ("partition.retention_count" = "3");
```

The FE scheduler subsequently removes excess historical partitions. This property applies only to AUTO RANGE tables and cannot be combined with enabled dynamic partitioning. See [Auto Partitioning: Lifecycle Management](./auto-partitioning#lifecycle-management) for scheduling behavior and version-specific restrictions, including changes in Doris 4.1.4.

Retention **drops** data. To move cold data to cheaper storage while retaining it, use [tiered storage](../tiered-storage/overview).

## How It Works

```text
Table → Partition (by column value) → Bucket (hash or random) → Tablet (shard on a BE node)
```

Partitions support query pruning and data lifecycle management. Buckets provide parallel reads and writes. For tablets, replicas, node placement, and operational commands, see [How Partitioning and Bucketing Work](./basic-concepts).

## Next Steps

- [Auto Partitioning](./auto-partitioning): on-demand partition creation.
- [Dynamic Partitioning](./dynamic-partitioning): scheduled creation and rolling time windows.
- [Manual Partitioning](./manual-partitioning): explicit ranges and list partitions.
- [Data Bucketing](./data-bucketing): choose the method, key, and bucket count.
- [How Partitioning and Bucketing Work](./basic-concepts): the data-distribution model.
- [Common Issues](./common-issues): troubleshoot partition and bucket design.
