---
{
    "title": "Must Read Before the POC",
    "language": "en",
    "description": "Understand the four table design decisions in Apache Doris — data model, key columns, partitioning, and bucketing — and why each one matters for your POC.",
    "sidebar_label": "Must Read Before the POC"
}
---

# Must Read Before the POC

Creating a table in Doris involves four decisions that affect load and query performance. Some of them — like the data model — cannot be changed later. Understanding **why** each decision exists helps you get it right the first time.

:::tip The simplest valid CREATE TABLE

```sql
CREATE TABLE my_table
(
    id          INT,
    name        VARCHAR(100),
    created_at  DATETIME,
    amount      DECIMAL(10,2)
);
```

This is the simplest syntax — Doris defaults to Duplicate Key, a single partition, and Random bucketing. It works, but **it won't give you good performance for most POC scenarios.** Read the four decisions below to understand what to tune and why.

:::

## 1. Data Model

**Why it matters:** The data model controls whether Doris keeps every row, keeps only the latest row per key, or pre-aggregates rows at write time.

**How to choose:** Ask yourself one question — *do I need to update rows?*

| If your data is... | Use | Why |
|---|---|---|
| Append-only (logs, events, facts) | **[Duplicate Key](../table-design/data-model/duplicate)** (default — just omit it) | Keeps all rows. Best query performance. Safest default. |
| Updated by primary key (CDC sync, user profiles) | **[Unique Key](../table-design/data-model/unique)** | New rows replace old rows with the same key. |
| Pre-aggregated metrics (PV, UV, revenue sums) | **[Aggregate Key](../table-design/data-model/aggregate)** | Rows are merged with SUM/MAX/MIN during ingestion. |

For a POC, **Duplicate Key works for most scenarios**. Switch only if you have a clear need for upsert or pre-aggregation. For a detailed comparison, see [Data Model Overview](../table-design/data-model/overview).

## 2. Key Columns

**Why it matters:** Key columns determine the **physical sort order** on disk. Doris builds a [prefix index](../table-design/index/prefix-index) on the first 36 bytes of key columns, so queries that filter on these columns run significantly faster. However, when a `VARCHAR` column is encountered, the prefix index stops immediately — no subsequent columns are included. So place fixed-size columns (INT, BIGINT, DATE) before VARCHAR to maximize index coverage.

**How to choose:** Put the column you filter on most frequently first, with fixed-size types before VARCHAR types. You can add [inverted indexes](../table-design/index/inverted-index) later for any column that needs fast filtering.

## 3. Partitioning

**Why it matters:** Partitioning splits data into independent units. When a query includes a partition column in its WHERE clause, Doris only scans the relevant partitions — this is called **partition pruning** and it can skip the vast majority of data.

**How to choose:**

- **Have a time column?** → Use `AUTO PARTITION BY RANGE(date_trunc(time_col, 'day'))`. Partitions are created automatically during import, no manual management needed.
- **No time column, data < 50 GB?** → Skip partitioning entirely. Doris creates a single partition by default.
- **No time column, data > 50 GB?** → Consider `AUTO PARTITION BY LIST(category_col)` on a categorical dimension.

For full syntax and advanced options, see [Auto Partition](../table-design/data-partitioning/auto-partitioning).

## 4. Bucketing

**Why it matters:** Each bucket is stored as one or more **tablets** (one per replica). A tablet lives on a single BE node, so scanning a tablet can only use that one BE. For a single query, parallelism is determined by `partitions × buckets` — replicas are not used simultaneously. For concurrent queries, different replicas can serve different queries, so the total tablet count `partitions × buckets × replicas` determines cluster-wide throughput.

**Partitions first, then buckets.** Both partitioning and bucketing increase tablet count, but partitions also enable pruning and are easier to manage (add/drop). When you need more parallelism, prefer adding partitions before increasing bucket count.

**Keep bucket count as low as possible, and make it a multiple of the number of BEs.** Fewer buckets mean larger tablets, which improves scan efficiency and reduces metadata overhead. Setting it as a multiple of BEs ensures even distribution across nodes. In production, large tables typically have many partitions, and queries often span multiple partitions, so overall parallelism comes primarily from partitions — performance is not sensitive to bucket count.

**Default is Random bucketing** — you can omit the `DISTRIBUTED BY` clause entirely. For Duplicate Key tables, Random bucketing is recommended because it enables `load_to_single_tablet` for lower memory usage and higher load throughput.

**When to specify Hash bucketing:** If you frequently filter or join on a specific column, `DISTRIBUTED BY HASH(that_column)` enables **bucket pruning** — Doris skips irrelevant buckets, which is faster than scanning all of them.

```sql
-- Default: random bucketing (omit the clause, or write explicitly)
DISTRIBUTED BY RANDOM BUCKETS 10

-- Better for queries that filter on a specific column
DISTRIBUTED BY HASH(user_id) BUCKETS 10
```

For details on choosing between Hash and Random bucketing, see [Data Bucketing](../table-design/data-partitioning/data-bucketing).

## Critical Points

Things that surprise new users. Read these before you create your first table.

:::caution

**Data model is permanent.** You cannot change from Duplicate to Unique or Aggregate after table creation. If you choose wrong, the only fix is to create a new table and re-import data.

:::

**STRING type cannot be a key or partition column.** Use `VARCHAR` instead. `STRING` is only for value columns storing large text content. For key columns, `VARCHAR(65533)` has no performance penalty compared to `VARCHAR(255)` — they perform the same when storing identical data, so use a generous length. See [Data Types](../table-design/data-type) for the full type reference.

**Aggregate Key tables don't support `count(*)` well.** Because values are pre-aggregated, `count(*)` cannot simply count rows. The workaround is to add a column like `row_count BIGINT SUM DEFAULT '1'` and query `SELECT SUM(row_count)` instead.

**Bucket count on existing partitions cannot be changed.** You can only adjust bucket count for **new** partitions. Keep each tablet between **1 GB and 20 GB** compressed data (excluding index), or under **10 GB** for Unique Key tables — check with `SHOW TABLETS FROM your_table`. If data per partition is under 1 GB, a single bucket is fine. Otherwise, use multiple buckets so each tablet stays within the range. Too few buckets limits query parallelism; too many creates excessive small files.

## Typical Use Cases

Ready-to-use templates for the most common POC scenarios.

### Log / Event Analytics

Append-only data, queried by time range and keyword.

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

- Default **Duplicate Key** — logs are never updated, Random bucketing for best load throughput
- **AUTO PARTITION by day** — time-range queries skip irrelevant days
- **Inverted index on message** — enables full-text search ([details](../table-design/index/inverted-index))

### Real-Time Dashboard with Upsert (CDC)

Sync from MySQL/PostgreSQL, keep latest state per primary key.

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

- **Unique Key** — new rows replace old by `user_id`, enabling [CDC sync](../data-operate/import/data-source/migrate-data-from-other-oltp)
- **No partition** — dimension table, small and not time-series

### Metrics Aggregation

Pre-compute SUM/MAX at write time for fast dashboard queries.

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

- **Aggregate Key** — PV is summed, UV takes max, automatically during ingestion ([details](../table-design/data-model/aggregate))
- **AUTO PARTITION by day** — daily rollup with automatic partition creation

### Lakehouse Query (No Table Needed)

Query external data (Hive, Iceberg, S3) without importing. No table design decisions required.

```sql
CREATE CATALOG lakehouse PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'uri' = 'http://iceberg-rest:8181'
);

SELECT * FROM lakehouse.db.events WHERE dt = '2025-01-01';
```

This is the fastest way to validate Doris query performance on your existing data. Create internal tables later if you need better performance. See [Lakehouse Overview](../lakehouse/lakehouse-overview).

## Common Performance Pitfalls

### Load

- **Using `INSERT INTO VALUES` for large data.** This is the slowest import method. For bulk loading, use [Stream Load](../data-operate/import/import-way/stream-load-manual) (HTTP, synchronous, best for files < 10 GB) or [Broker Load](../data-operate/import/import-way/broker-load-manual) (async, for large files on S3/HDFS). Reserve `INSERT INTO VALUES` for small tests only. See [Loading Overview](../data-operate/import/load-manual) for choosing the right method.

- **Many small imports instead of batching.** Each import creates a new data version that requires compaction later. High-frequency small imports cause version accumulation, increasing memory and CPU pressure. Batch writes on the client side first — this is the most effective approach. If client-side batching is not feasible, [Group Commit](../data-operate/import/group-commit-manual) can help by automatically batching small writes on the server side.

- **Too many small tablets.** Total tablets = `partitions × buckets × replicas`. Excessive small tablets cause memory pressure during import, slow metadata operations, and generate too many small files. Avoid over-partitioning or setting bucket count too high. Reducing tablets after the fact is very costly — it's much easier to start small and add partitions or buckets later when needed.

- **Running a single long-running load statement.** If a large import fails halfway through, you have to restart from scratch — failure recovery is very costly. Break large imports into smaller batches, or use [INSERT INTO SELECT with S3 TVF](../data-operate/import/import-way/insert-into-manual) to import data incrementally with automatic resume.

- **Not enabling `load_to_single_tablet` with Random bucketing.** For Duplicate Key tables with Random bucketing, set `"load_to_single_tablet" = "true"` during import. Each import batch writes to a single tablet, improving throughput and reducing write amplification.

For more loading optimization tips, see [Load Best Practices](../data-operate/import/load-best-practices).

### Query

- **Data skew.** If the bucket column has low cardinality or uneven distribution, some tablets hold far more data than others. The slowest tablet determines overall query time. Check with `SHOW TABLETS FROM your_table` — if tablet sizes vary significantly, choose a higher-cardinality bucket column or switch to Random bucketing for even distribution.

- **Wrong key column order.** If your most common filter column is not in the [prefix index](../table-design/index/prefix-index) (first 36 bytes of key columns), queries fall back to scanning all data blocks. Reorder key columns to put the most frequently filtered column first, or add an [inverted index](../table-design/index/inverted-index) on that column.

- **Missing partition pruning.** If your query doesn't filter on the partition column, Doris scans all partitions. Always include the partition column (usually a time column) in your WHERE clause when possible.

- **`SELECT *` on wide tables.** Doris is a columnar store — it only reads the columns you request. `SELECT *` on a table with many columns forces reading all of them, wasting I/O. Select only the columns you need.

To diagnose slow queries, use [Query Profile](../query-acceleration/query-profile) to see where time is spent.

## What If I Choose Wrong?

During a POC, most decisions can be fixed by creating a new table and running `INSERT INTO new_table SELECT * FROM old_table` — this takes minutes, not days. The exception is that bucket count on existing partitions cannot be changed in place. Start with reasonable choices, measure, then optimize.

For production-level table design guidance, see [Best Practices](../table-design/best-practice).
