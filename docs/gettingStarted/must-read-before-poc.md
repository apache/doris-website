---
{
    "title": "Must Read Before the POC",
    "language": "en",
    "description": "Understand the four table design decisions in Apache Doris — data model, sort key, partitioning, and bucketing — and why each one matters for your POC.",
    "sidebar_label": "Must Read Before the POC"
}
---

# Must Read Before the POC

This document highlights common issues that new users may encounter, with the goal of accelerating the POC process.

## Table Design

Creating a table in Doris involves four decisions that affect load and query performance.

### Data Model

*Do I need to update rows?*

| If your data is... | Use | Why |
|---|---|---|
| Append-only (logs, events, facts) | **Duplicate Key** (default) | Keeps all rows. Best query performance. |
| Updated by primary key (CDC, upsert) | **Unique Key** | New rows replace old rows with the same key. |
| Pre-aggregated metrics (PV, UV, sums) | **Aggregate Key** | Rows are merged with SUM/MAX/MIN at write time. |

**Duplicate Key works for most scenarios.** See [Data Model Overview](../table-design/data-model/overview).

### Sort Key

Put the column you filter on most frequently first, with fixed-size types (INT, BIGINT, DATE) before VARCHAR. Doris builds a [prefix index](../table-design/index/prefix-index) on the first 36 bytes of key columns but stops at the first VARCHAR. Add [inverted indexes](../table-design/index/inverted-index) for other columns that need fast filtering.

### Partitioning

If you have a time column, use `AUTO PARTITION BY RANGE(date_trunc(time_col, 'day'))` to enable [partition pruning](../table-design/data-partitioning/auto-partitioning). Doris skips irrelevant partitions automatically.

### Bucketing

Default is **Random bucketing** (recommended for Duplicate Key tables). Use `DISTRIBUTED BY HASH(col)` if you frequently filter or join on a specific column. See [Data Bucketing](../table-design/data-partitioning/data-bucketing).

**How to choose bucket count:**

1. **Multiple of BE count** to ensure even data distribution. When BEs are added later, queries typically scan multiple partitions, so performance holds up.
2. **As low as possible** to avoid small files.
3. **Compressed data per bucket ≤ 20 GB** (≤ 10 GB for Unique Key). Check with `SHOW TABLETS FROM your_table`.
4. **No more than 128 per partition.** Consider partitioning first if you need more.

## Example Templates

### Log / Event Analytics

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

### Real-Time Dashboard with Upsert (CDC)

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

### Metrics Aggregation

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

## Performance Pitfalls

### Load

- **Don't use `INSERT INTO VALUES` for bulk data.** Use [Stream Load](../data-operate/import/import-way/stream-load-manual) or [Broker Load](../data-operate/import/import-way/broker-load-manual) instead. See [Loading Overview](../data-operate/import/load-manual).
- **Batch writes on the client side.** High-frequency small imports cause version accumulation. If not feasible, use [Group Commit](../data-operate/import/group-commit-manual).
- **Break large imports into smaller batches.** A failed long-running import must restart from scratch. Use [INSERT INTO SELECT with S3 TVF](../data-operate/import/import-way/insert-into-manual) for incremental import.
- **Enable `load_to_single_tablet`** for Duplicate Key tables with Random bucketing.

See [Load Best Practices](../data-operate/import/load-best-practices).

### Query

- **Data skew.** Check tablet sizes with `SHOW TABLETS`. Switch to Random bucketing or a higher-cardinality bucket column if sizes vary significantly.
- **Wrong sort key order.** See [Sort Key](#sort-key) above.

See [Query Profile](../query-acceleration/query-profile) to diagnose slow queries.
