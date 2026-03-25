---
{
    "title": "Before You Start the POC",
    "language": "en",
    "description": "Apache Doris POC checklist: covers table design (data model, sort key, partitioning, bucketing), data loading best practices, query tuning, and data lake (Hive, Iceberg, Paimon) query optimization to help new users complete POC validation quickly.",
    "sidebar_label": "Before You Start the POC"
}
---

This document highlights common issues that new users may encounter, with the goal of accelerating the POC process. The content is organized by the typical POC workflow:

1. **Table Design** — Choose the data model, sort key, partitioning, and bucketing strategy.
2. **Data Loading** — Pick the right loading method and avoid common pitfalls.
3. **Query Tuning** — Diagnose slow queries and optimize bucketing and index configuration.
4. **Data Lake Queries** — Additional optimization tips for Lakehouse scenarios.

## Table Design

Creating a table in Doris involves four decisions that affect load and query performance: data model, sort key, partitioning, and bucketing.

### Data Model

Choose the model based on how your data is written:

| Data Characteristics | Recommended Model | Why |
|---|---|---|
| Append-only (logs, events, facts) | **Duplicate Key** (default) | Keeps all rows, best query performance |
| Updated by primary key (CDC, upsert) | **Unique Key** | New rows replace old rows with the same key |
| Pre-aggregated metrics (PV, UV, sums) | **Aggregate Key** | Rows are merged with SUM/MAX/MIN at write time |

**Duplicate Key works for most scenarios.** See [Data Model Overview](../table-design/data-model/overview).

### Sort Key

Doris builds a [prefix index](../table-design/index/prefix-index) on the first 36 bytes of key columns. Follow these principles when setting the sort key:

- **Frequently filtered columns first**: Put the columns most commonly used in WHERE conditions at the front.
- **Fixed-size types first**: Place INT, BIGINT, DATE, and other fixed-size types before VARCHAR, because the prefix index stops at the first VARCHAR column.
- **Add inverted indexes**: For columns not covered by the prefix index, add [inverted indexes](../table-design/index/inverted-index.md) to speed up filtering.

### Partitioning

If you have a time column, use `AUTO PARTITION BY RANGE(date_trunc(time_col, 'day'))` to enable [partition pruning](../table-design/data-partitioning/auto-partitioning). Doris skips irrelevant partitions automatically.

### Bucketing

Default is **Random bucketing** (recommended for Duplicate Key tables). Use `DISTRIBUTED BY HASH(col)` if you frequently filter or join on a specific column. See [Data Bucketing](../table-design/data-partitioning/data-bucketing).

**How to choose bucket count:**

| Principle | Details |
|---|---|
| Multiple of BE count | Ensures even data distribution. When BEs are added later, queries typically scan multiple partitions, so performance holds up |
| As low as possible | Avoids producing small files |
| Compressed data per bucket ≤ 20 GB | ≤ 10 GB for Unique Key tables. Check with `SHOW TABLETS FROM your_table` |
| No more than 128 per partition | Consider adding more partitions first if you need more. In extreme cases the upper bound is 1024, but this is rarely needed in production |

### Example Templates

#### Log / Event Analytics

```sql
CREATE TABLE app_logs
(
    log_time      DATETIME    NOT NULL,
    log_level     VARCHAR(10),
    service_name  VARCHAR(50),
    trace_id      VARCHAR(64),
    message       STRING,
    INDEX idx_message (message) USING INVERTED PROPERTIES("parser" = "unicode")
)
AUTO PARTITION BY RANGE(date_trunc(`log_time`, 'day'))
()
DISTRIBUTED BY RANDOM BUCKETS 10;
```

#### Real-Time Dashboard with Upsert (CDC)

```sql
CREATE TABLE user_profiles
(
    user_id       BIGINT      NOT NULL,
    username      VARCHAR(50),
    email         VARCHAR(100),
    status        TINYINT,
    updated_at    DATETIME
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

#### Metrics Aggregation

```sql
CREATE TABLE site_metrics
(
    dt            DATE        NOT NULL,
    site_id       INT         NOT NULL,
    pv            BIGINT      SUM DEFAULT '0',
    uv            BIGINT      MAX DEFAULT '0'
)
AGGREGATE KEY(dt, site_id)
AUTO PARTITION BY RANGE(date_trunc(`dt`, 'day'))
()
DISTRIBUTED BY HASH(site_id) BUCKETS 10;
```

## Data Loading

Choose the right loading method and follow these best practices to avoid common performance issues:

- **Don't use `INSERT INTO VALUES` for bulk data.** Use [Stream Load](../data-operate/import/import-way/stream-load-manual) or [Broker Load](../data-operate/import/import-way/broker-load-manual) instead. See [Loading Overview](../data-operate/import/load-manual).
- **Batch writes on the client side.** High-frequency small imports cause version accumulation. If not feasible, use [Group Commit](../data-operate/import/group-commit-manual).
- **Break large imports into smaller batches.** A failed long-running import must restart from scratch. Use [INSERT INTO SELECT with S3 TVF](../data-operate/import/import-way/insert-into-manual.md) for incremental import.
- **Enable `load_to_single_tablet`** for Duplicate Key tables with Random bucketing to reduce write amplification.

See [Load Best Practices](../data-operate/import/load-best-practices).

## Query Tuning

### Bucketing

Bucket count directly affects query parallelism and scheduling overhead — strike a balance between the two:

- **Don't over-bucket.** Too many small tablets create scheduling overhead and can degrade query performance by up to 50%.
- **Don't under-bucket.** Too few tablets limit CPU parallelism.
- **Avoid data skew.** Check tablet sizes with `SHOW TABLETS`. Switch to Random bucketing or a higher-cardinality bucket column if sizes vary significantly.

See [Bucketing](#bucketing) for sizing guidelines.

### Indexes

- **Put the right columns in the sort key.** Unlike systems such as PostgreSQL, Doris only indexes the first 36 bytes of key columns and stops at the first VARCHAR. Columns beyond this prefix won't benefit from the sort key. Add [inverted indexes](../table-design/index/inverted-index.md) for those columns. See [Sort Key](#sort-key).

### Diagnostic Tools

See [Query Profile](../query-acceleration/performance-tuning-overview/analysis-tools) to diagnose slow queries.

## Data Lake Queries

If your POC involves querying data in Hive, Iceberg, Paimon, or other data lakes through Doris (i.e., a Lakehouse scenario), the following points have the greatest impact on test results.

### Ensure Partition Pruning is Effective

Lake tables often hold massive amounts of data. Always include partition columns in your WHERE conditions so that Doris only scans the necessary partitions. Use `EXPLAIN <SQL>` to check the `partition` field and verify that pruning is working:

```
0:VPAIMON_SCAN_NODE(88)
    partition=203/0          -- 203 partitions pruned, 0 actually scanned
```

If the partition count is much higher than expected, check whether your WHERE conditions correctly match the partition columns.

### Enable Data Cache

Remote storage (HDFS/object storage) has significantly higher IO latency than local disks. Data Cache caches recently accessed remote data on BE local disks, **delivering near-internal-table query performance for repeated queries on the same dataset**.

- Cache is disabled by default. See the [Data Cache](../lakehouse/data-cache) documentation to configure and enable it.
- Since version 4.0.2, **cache warmup** is supported, allowing you to proactively load hot data before POC testing.

:::tip
During POC, run a query once to populate the cache, then use the latency of the second query as the benchmark. This more accurately reflects steady-state production performance.
:::

### Address Small Files

Data lake storage often contains a large number of small files. Small files get split into many splits, increasing FE memory pressure (potentially causing OOM) and raising query planning overhead.

- **Fix at source (recommended):** Periodically compact small files on the Hive/Spark side, keeping each file above 128 MB.
- **Doris-side safeguard:** Use `SET max_file_split_num = 50000;` (supported since 4.0.4) to limit the maximum number of splits per scan and prevent OOM.

### Use Query Profile for Diagnosis

The bottleneck of data lake queries is typically IO rather than computation. [Query Profile](../query-acceleration/performance-tuning-overview/analysis-tools) can help locate the root cause of slow queries. Focus on:

- **Split count and data volume**: Determine if too much data is being scanned.
- **MergeIO metrics**: If `MergedBytes` is much larger than `RequestBytes`, read amplification is severe. Reduce `merge_io_read_slice_size_bytes` (default 8 MB) to mitigate.
- **Cache hit rate**: Confirm that Data Cache is working effectively.

For more optimization techniques, see [Data Lake Query Optimization](../lakehouse/best-practices/optimization).
