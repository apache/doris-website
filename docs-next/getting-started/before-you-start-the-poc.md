---
{
    "title": "How to Complete an Apache Doris POC",
    "language": "en",
    "description": "Failing to create tables, slow queries, or data lake stalls during a POC? This article summarizes common questions and solutions for new users, covering four scenarios: table design, data ingestion, query tuning, and data lake queries.",
    "sidebar_label": "Must-Read Before POC",
    "tags": ["POC", "Table Design", "Query Tuning", "Data Lake", "New Users"]
}
---

This document summarizes common questions from new users to accelerate the POC process. The content is organized following the typical POC workflow:

1. **Table Design** - Choose the data model, sort key, partitioning, and bucketing strategy.
2. **Data Ingestion** - Choose the right ingestion method and avoid common pitfalls.
3. **Query Tuning** - Diagnose slow queries and optimize bucket and index configurations.
4. **Data Lake Queries** - Additional optimization tips for Lakehouse scenarios.

:::tip Quick Checklist
Complete a basic check in 5 minutes:
1. Does the table use the appropriate data model (Duplicate/Unique/Aggregate Key)?
2. Is the bucket count an integer multiple of the BE count?
3. Do time-based queries include the partition column?
4. Is Data Cache enabled (for data lake query scenarios)?
:::

## Table Design

Creating a table in Doris involves four decisions that affect ingestion and query performance: data model, sort key, partitioning, and bucketing.

### Data Model

Choose the right model based on how data is written:

| Data Characteristic | Recommended Model | Reason |
|---|---|---|
| Append-only (logs, events, fact tables) | **Duplicate Key** (default) | Keeps all rows; best query performance |
| Updated by primary key (CDC, Upsert) | **Unique Key** | New rows replace old rows with the same key |
| Pre-aggregated metrics (PV, UV, summaries) | **Aggregate Key** | Merges rows by SUM/MAX/MIN at write time |

**Duplicate Key fits most scenarios.** For details, see [Data Model Overview](../table-design/data-model/intro).

### Sort Key

Doris builds a [prefix index](../table-design/index/prefix-index) on the first 36 bytes of the sort key. When setting the sort key, follow these principles:

- **Put high-frequency filter columns first**: place columns most often used in WHERE conditions at the front.
- **Put fixed-length types first**: put fixed-length types such as INT, BIGINT, and DATE before VARCHAR, because the prefix index truncates immediately when it encounters a VARCHAR.
- **Add inverted indexes as a complement**: for columns the prefix index does not cover, add an [inverted index](../table-design/index/inverted-index/overview) to speed up filtering.

### Partitioning

If you have a time column, use `AUTO PARTITION BY RANGE(date_trunc(time_col, 'day'))` to enable [partition pruning](../table-design/data-partitioning/auto-partitioning). Doris automatically skips irrelevant partitions.

### Bucketing

The default is **Random bucketing** (recommended for Duplicate Key tables). If you frequently filter or JOIN on a specific column, use `DISTRIBUTED BY HASH(that_column)`. For details, see [Data Bucketing](../table-design/data-partitioning/data-bucketing).

**How to choose the bucket count:**

| Principle | Description |
|---|---|
| Set as an integer multiple of the BE count | Ensures data is evenly distributed. When you scale out BEs later, queries usually involve multiple partitions, so performance is not affected |
| As few as possible | Avoid creating small files |
| Compressed data per bucket <= 20 GB | <= 10 GB for Unique Key tables. Check with `SHOW TABLETS FROM your_table` |
| No more than 128 buckets per partition | If you need more, increase the number of partitions first. The extreme upper limit is 1024, but production environments rarely need it |

### Table Creation Templates

#### Log / Event Analytics

**Use case:** Append-only scenarios such as logs, events, and sensor data.

**Prerequisites:** No special requirements.

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

**Verification steps:**

```sql
-- 1. Verify that partitions are created automatically
SHOW PARTITIONS FROM app_logs;

-- 2. Verify that data is evenly distributed
SHOW TABLETS FROM app_logs;
```

#### Real-Time Dashboards and Upsert (CDC)

**Use case:** Scenarios that need primary-key updates, such as user profiles and order records.

**Prerequisites:** A clearly defined primary key column.

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

**Verification steps:**

```sql
-- 1. Verify primary key uniqueness (only one latest row per user_id)
SELECT user_id, count(*) as cnt FROM user_profiles GROUP BY user_id HAVING cnt > 1;

-- 2. Verify data distribution
SHOW TABLETS FROM user_profiles;
```

#### Metric Aggregation

**Use case:** Scenarios that need pre-aggregation, such as traffic statistics and business reports.

**Prerequisites:** Clearly defined aggregation dimension columns and metric columns.

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

**Verification steps:**

```sql
-- 1. Verify that aggregation works (metrics with the same dt+site_id are merged)
SELECT dt, site_id, pv, uv FROM site_metrics ORDER BY dt DESC LIMIT 10;

-- 2. Verify that partition pruning works
EXPLAIN SELECT * FROM site_metrics WHERE dt = '2024-01-01';
```

## Data Ingestion

Choose the right ingestion method and follow these best practices to avoid common performance issues:

- **Do not use `INSERT INTO VALUES` for bulk data.** Use [Stream Load](../data-operate/import/import-way/stream-load-manual) or [Broker Load](../data-operate/import/import-way/broker-load-manual) instead. For details, see [Ingestion Overview](../data-operate/import/load-manual).
- **Merge writes on the client side first.** High-frequency small-batch ingestion causes version pile-up. If client-side merging is not feasible, use [Group Commit](../data-operate/import/load-best-practices/group-commit-manual).
- **Split large ingestions into smaller batches.** A long-running ingestion must restart from the beginning if it fails. Use [INSERT INTO SELECT with the S3 TVF](../data-operate/import/import-way/streaming-job/continuous-load-overview) for incremental ingestion.
- **Enable `load_to_single_tablet` for Duplicate Key tables with Random bucketing** to reduce write amplification.

**Quick verification:**

```sql
-- View ingestion task status
SHOW LOAD WHERE label = 'your_label';

-- Check version pile-up (a high Version Count indicates ingestion is too frequent)
SHOW TABLETS FROM your_table;
```

For details, see [Ingestion Best Practices](../data-operate/import/load-best-practices/load-best-practices).

## Query Tuning

### Bucketing

The bucket count directly affects query parallelism and scheduling overhead, so you need to strike a balance:

- **Do not use too many buckets.** Too many small tablets create scheduling overhead and can reduce query performance by up to 50%.
- **Do not use too few buckets.** Too few tablets limit CPU parallelism.
- **Avoid data skew.** Use `SHOW TABLETS` to check tablet sizes. When sizes differ significantly, switch to Random bucketing or pick a bucketing column with higher cardinality.

**Diagnostic command:**

```sql
-- Check tablet size distribution (used to detect data skew)
SHOW TABLETS FROM your_table\G
-- Review the tablet count and size to decide whether to adjust the bucket count
```

See [Bucketing](#bucketing) for guidance on choosing the bucket count.

### Indexes

- **Set the sort key correctly.** Unlike systems such as PostgreSQL, Doris only indexes the first 36 bytes of the sort key, and it truncates immediately when it encounters a VARCHAR. Columns beyond the prefix range cannot benefit from the sort key and need an [inverted index](../table-design/index/inverted-index/overview). See [Sort Key](#sort-key).

**Verify that the sort key works:**

```sql
EXPLAIN SELECT * FROM your_table WHERE filter_column = 'xxx';
-- Check whether the Sort Key index is used
```

### Diagnostic Tools

To diagnose slow queries, use [Query Profile](../query-acceleration/query-profile).

**Quick start:**

```sql
-- 1. Run the query and obtain the query_id
SET enable_profile = true;
SELECT ...;

-- 2. View the Query Profile
SHOW PROFILELIST;
SHOW PROFILE WHERE query_id = 'xxx';
```

## Data Lake Queries

If your POC involves querying data lake data such as Hive, Iceberg, or Paimon through Doris (Lakehouse scenarios), the following points have the largest impact on test results.

### Make Sure Partition Pruning Works

Data lake tables often hold massive amounts of data, so always include the partition column in the WHERE clause so that Doris scans only the necessary partitions. Run `EXPLAIN <SQL>` and check the `partition` field to confirm that pruning works:

```
0:VPAIMON_SCAN_NODE(88)
    partition=203/0          -- 203 partitions are pruned, 0 are actually scanned
```

If the partition count is much larger than expected, check whether the WHERE clause correctly matches the partition column.

### Enable Data Cache

The IO latency of remote storage (HDFS / object storage) is several times higher than local disks. Data Cache caches recently accessed remote data on the BE local disk, so **repeated queries on the same data can achieve performance close to that of internal tables**.

- The cache is disabled by default. See the [Data Cache](../lakehouse/data-cache) documentation for configuration.
- **Cache prewarming** is supported starting from version 4.0.2, allowing you to proactively load hot data before POC testing.

:::tip
During a POC, run a query once to load the cache, then use the latency of the second query as the baseline. This more accurately reflects the steady-state performance of a production environment.
:::

### Manage Small Files

Data lake data often contains many small files. Small files are split into a large number of Splits, increasing FE memory pressure and even causing OOM, and raising query planning overhead.

- **Manage from the source (recommended):** periodically merge small files on the Hive/Spark side, keeping each file above 128 MB.
- **Doris-side fallback:** use `SET max_file_split_num = 50000;` (supported since 4.0.4) to limit the maximum number of Splits per scan and prevent OOM.

### Use Query Profile for Diagnosis

The bottleneck of data lake queries is usually IO rather than computation. [Query Profile](../query-acceleration/query-profile) helps locate the root cause of slow queries. Focus on:

- **Split count and data volume**: determine whether too much data is being scanned.
- **MergeIO metrics**: if `MergedBytes` is much larger than `RequestBytes`, read amplification is severe; reduce `merge_io_read_slice_size_bytes` (default 8 MB) to mitigate it.
- **Cache hit ratio**: confirm that Data Cache is working effectively.

For more optimization techniques, see [Data Lake Query Tuning](../lakehouse/best-practices/optimization).

## Common Errors and Solutions

### Table creation fails with "Tablet count should be greater than 0"

**Cause:** The bucket count is set to 0 or bucketing is not specified.

**Solution:** Check whether the DDL contains `DISTRIBUTED BY HASH(xxx) BUCKETS n` and ensure that BUCKETS is followed by a positive integer.

```sql
-- Correct example
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Slow query, suspected the index is not used

**Diagnosis steps:**

1. Run `EXPLAIN SQL` to view the query plan and confirm whether the Sort Key index is used.
2. Run `SHOW TABLETS FROM table_name` to check whether tablet sizes are even.
3. View the Query Profile to locate the bottleneck.

```sql
-- Check whether the index is used (look at output_id for Sort Key columns)
EXPLAIN SELECT * FROM table_name WHERE key_col = 'xxx';

-- Check tablet size (to detect data skew)
SHOW TABLETS FROM table_name;
```

### OOM on data lake queries

**Cause:** Too many small files cause the Split count to explode.

**Solution:**

1. Merge small files on the data source side (each file > 128 MB).
2. Limit the Split count on the Doris side:

```sql
SET max_file_split_num = 50000;
```

### Ingestion version pile-up causes slow queries

**Cause:** Frequent small-batch ingestion creates too many versions.

**Solution:**

1. Merge ingestion batches and reduce ingestion frequency.
2. Enable Group Commit:

```sql
SET group_commit_mode = 'async_mode';
```

## FAQ

### Q: How long does a POC take?

Basic functional verification (table creation, ingestion, simple queries) usually takes 1-2 days. Detailed performance tuning takes 3-5 days.

### Q: How should I choose the bucket count when creating a table?

Set it to an integer multiple of the BE node count first to ensure even data distribution. The compressed data per bucket should be <= 20 GB (<= 10 GB for Unique Key tables).

### Q: What should I do if queries are slower than expected?

1. Run `EXPLAIN` to check whether the index is used.
2. Run `SHOW TABLETS` to check for data skew.
3. View the Query Profile to locate the bottleneck.

### Q: Should I enable Data Cache?

If your workload involves data lake queries (Hive/Iceberg/Paimon), enable it. The first query automatically caches data, and repeated queries achieve performance close to internal tables.
