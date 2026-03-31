---
{
    "title": "VARIANT Workload Guide",
    "language": "en",
    "description": "Decision guide for when to use VARIANT in Doris 3.x, when to enable sparse columns, and when to add Schema Template or path-specific indexes."
}
---

## Overview

`VARIANT` stores semi-structured JSON and uses Subcolumnization on frequently used paths.

Use this guide when you are planning a new `VARIANT` workload in Doris 3.x. It helps answer questions such as:

- Should this workload use `VARIANT` or static columns?
- If the JSON is getting wide, should I stay with default behavior or enable sparse columns?
- When should I add a Schema Template or path-specific indexes?

If you already know you want `VARIANT` and only need syntax or type rules, go to [VARIANT](./VARIANT). If you want the smallest runnable import example, go to [Import Variant Data](../../../../data-operate/import/complex-types/variant).

:::tip Why choose VARIANT
`VARIANT` keeps JSON flexible while letting Doris apply Subcolumnization to frequently used paths. In Doris 3.1 and later, wide JSON can keep hot paths in Subcolumnization while long-tail paths move into sparse storage, so you do not need to freeze every field in advance.
:::

:::note 3.x capability boundary
This guide only covers capabilities available in Doris 3.x. Sparse columns, `variant_max_subcolumns_count`, `variant_enable_typed_paths_to_sparse`, and path-specific indexes require Doris 3.1.0 or later. DOC mode guidance from newer versions does not apply to Doris 3.x.
:::

## When VARIANT Fits

Use `VARIANT` when all or most of the following are true:

- The input is JSON or another semi-structured payload whose fields evolve over time.
- Queries usually touch a subset of hot paths instead of every field in every row.
- You want schema flexibility without giving up columnar analytics performance.
- Some paths need indexing, while many other paths can remain dynamic.

Prefer static columns when these conditions dominate:

- The schema is stable and known in advance.
- Core fields are regularly used as join keys, sort keys, or tightly controlled typed columns.
- The main requirement is to archive raw JSON or return the whole document frequently, not to analyze by path.

## Key Concepts

Before reading the storage modes below, make sure these terms are clear. Each is explained in 2-3 lines; for implementation details, see [VARIANT](./VARIANT).

**Subcolumnization.** When data is written into a `VARIANT` column, Doris automatically discovers JSON paths and extracts hot paths as independent columnar subcolumns for efficient analytics.

![Default VARIANT: Automatic Subcolumn Extraction](/images/variant/variant-default-storage.png)

**Schema Template (3.1+).** A declaration on a `VARIANT` column that pins selected paths to stable types. Use it for key business fields that must stay typed, indexable, and predictable. Do not try to enumerate every possible path.

**Wide JSON.** You have a wide-JSON problem when the number of distinct paths keeps growing and starts to increase metadata size, write cost, compaction cost, or query cost.

**Sparse columns (3.1+).** When wide JSON has a clear hot/cold split, sparse columns keep hot paths in Subcolumnization while pushing cold (long-tail) paths into shared sparse storage. Use `variant_max_subcolumns_count` to control the boundary.

![Sparse Columns: Hot/Cold Path Separation](/images/variant/variant-sparse-storage.png)

As shown above, hot paths (such as `user_id`, `page`) stay as independent columnar subcolumns with full analytics speed, while thousands of long-tail paths converge into shared sparse storage. The threshold is controlled by `variant_max_subcolumns_count`.

## Recommended Decision Path

![VARIANT Mode Decision Path (Doris 3.x)](/images/variant/variant-decision-flowchart-3x.png)

For wide JSON where most queries return the whole document, Doris 3.x `VARIANT` is usually not the best fit because there is no DOC mode. Avoid making `SELECT variant_col` the main query pattern on very wide columns.

For most workloads, the default configuration is already the right starting point. Tune only when the access pattern is clearly unusual. Typical examples include AI training feature payloads, connected-vehicle telemetry, and user-tag systems that, in Doris 3.1 and later, need unusually large-scale Subcolumnization together with many path-level indexes.

## Storage Modes

Use the table below to pick a starting point, then read the matching section.

| | Typical scenario | Recommended mode | Key configuration |
|---|---|---|---|
| **A** | Event logs, audit logs | Default VARIANT | Keep defaults |
| **B** | Advertising / telemetry / user profiles (wide, hot paths few) | Sparse (3.1+) | `variant_max_subcolumns_count` |
| **C** | Orders / payments / devices (key paths need stable types) | Schema Template (3.1+) + A or B | Define only key paths |

### Default Mode

This is the safest starting point for most new `VARIANT` workloads.

Typical example: event logs or audit payloads where queries repeatedly touch a few familiar paths.

```sql
CREATE TABLE IF NOT EXISTS event_log (
    ts DATETIME NOT NULL,
    event_id BIGINT NOT NULL,
    event_type VARCHAR(64),
    payload VARIANT
)
DUPLICATE KEY(`ts`, `event_id`)
DISTRIBUTED BY HASH(`event_id`) BUCKETS 16
PROPERTIES (
    "replication_num" = "1"
);
```

Use it when you are not yet sure whether the workload is wide enough to justify sparse columns, and most value still comes from filtering, aggregating, and grouping on several common paths.

Watch for:
- Do not raise `variant_max_subcolumns_count` early unless path growth is already causing pressure.
- If the JSON is not wide, enabling sparse columns adds complexity without benefit.

### Sparse Mode

> This template requires Doris 3.1.0 or later.

Choose sparse columns when the payload is wide, but most queries still focus on a small set of hot paths.

Typical example: advertising, telemetry, or profile JSON with thousands of optional attributes but only dozens queried regularly.

```sql
CREATE TABLE IF NOT EXISTS telemetry_wide (
    ts DATETIME NOT NULL,
    device_id BIGINT NOT NULL,
    attributes VARIANT<
        'device_type' : STRING,
        'region' : STRING,
        properties(
            'variant_max_subcolumns_count' = '2048',
            'variant_enable_typed_paths_to_sparse' = 'true'
        )
    >
)
DUPLICATE KEY(`ts`, `device_id`)
DISTRIBUTED BY HASH(`device_id`) BUCKETS 32
PROPERTIES (
    "replication_num" = "1"
);
```

Use it when the total key count is very large, but the primary workload is still path-based filtering, aggregation, and indexing.

Watch for:
- If hot-path analytics is the bottleneck, sparse columns are the right direction in 3.x.
- Do not set `variant_max_subcolumns_count` so large that effectively all paths go through Subcolumnization. That defeats the purpose and increases metadata and compaction cost.

### Schema Template

> This template requires Doris 3.1.0 or later.

Choose Schema Template when a small number of paths need stable types, stable behavior, or path-specific indexes.

Typical example: order, payment, or device payloads where a few business-critical paths must stay typed and searchable.

```sql
CREATE TABLE IF NOT EXISTS order_events (
    ts DATETIME NOT NULL,
    order_id BIGINT NOT NULL,
    detail VARIANT<
        'status' : STRING,
        'amount' : DECIMAL(18, 2),
        'currency' : STRING
    >,
    INDEX idx_status(detail) USING INVERTED PROPERTIES("field_pattern" = "status")
)
DUPLICATE KEY(`ts`, `order_id`)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 16
PROPERTIES (
    "replication_num" = "1"
);
```

Use it when only a few fields are business-critical and those paths need stricter typing or path-level index strategy. Combine Schema Template with sparse columns or default `VARIANT` when appropriate.

Watch for:
- Do not turn the whole JSON schema into a static template. That defeats the point of `VARIANT`.
- Schema Template should cover key paths only; the rest stays dynamic.

## Performance

The chart below compares single-path extraction time on a 10K-path wide-column dataset (200K rows, extracting one key, 16 CPUs, median of 3 runs).

![Wide-Column Single-Path Extraction: Query Time](/images/variant/variant-bench-query-time-3x.svg)

| Mode | Query Time | Peak Memory |
|---|---:|---:|
| VARIANT Default | 76 ms | 1 MiB |
| JSONB | 887 ms | 32 GiB |
| MAP\<STRING,STRING\> | 2,800 ms | 1 MiB |
| STRING (raw JSON) | 6,104 ms | 48 GiB |

Key takeaways:

- **VARIANT Default is fastest.** 76 ms — 12× faster than JSONB, 80× faster than raw STRING.
- **JSONB and STRING are memory-heavy.** They consume 32–48 GiB peak memory vs. 1 MiB for VARIANT.

## Best Practices

### Import Phase

- **Pin key paths via Schema Template early (3.1+).** Without Schema Template, the system infers types automatically. If the same path changes type across batches (e.g., integer then string), it gets promoted to JSONB, and indexes on that path are lost.
- **Start from default settings, then tune from symptoms.** For most workloads, defaults are enough. Tune by scenario only when workloads such as AI training, connected vehicles, or user-tag systems need unusually large Subcolumnization scale and many path-level indexes in Doris 3.1 and later. Over-configuring on day one (very large `variant_max_subcolumns_count`) adds complexity without evidence of benefit.

### Query Phase

- **Do not use `SELECT *` as the main query pattern for very wide `VARIANT` columns.** In Doris 3.x there is no DOC mode, so `SELECT *` or `SELECT variant_col` must reconstruct JSON from all subcolumns, which is very expensive on wide columns.
- **Always CAST subpaths when the query depends on type.** Type inference may not match expectations. If `v['id']` is actually stored as STRING but you compare with an integer literal, indexes will not be used and the result may be wrong.

### Operations Phase

- **Watch compaction pressure.** Subcolumn growth increases merge cost. If Compaction Score keeps rising, check whether `variant_max_subcolumns_count` is too high or ingestion rate is too fast.
- **Watch for schema drift.** If the JSON structure changes frequently, hot paths may be pushed into sparse storage, causing sudden query slowdowns. Lock critical paths with Schema Template.
- **Watch for type conflicts.** Frequent type conflicts on the same path indicate the path should be locked via Schema Template to avoid JSONB promotion and index loss.

## Quick Verify

After creating a table, use this minimal sequence to verify everything works:

```sql
-- Insert sample data
INSERT INTO event_log VALUES
    ('2025-01-01 10:00:00', 1001, 'click', '{"page": "home", "user_id": 42, "duration_ms": 320}'),
    ('2025-01-01 10:00:01', 1002, 'purchase', '{"item": "widget", "price": 9.99, "user_id": 42}'),
    ('2025-01-01 10:00:02', 1003, 'click', '{"page": "search", "user_id": 99, "query": "doris variant"}');

-- Verify data
SELECT payload['user_id'], payload['page'] FROM event_log;

-- Check Subcolumnization results
SET describe_extend_variant_column = true;
DESC event_log;

-- Check per-row types
SELECT variant_type(payload) FROM event_log;
```

## Related Reading

- [VARIANT](./VARIANT)
- [Import Variant Data](../../../../data-operate/import/complex-types/variant)
- [Inverted Index](../../../../table-design/index/inverted-index)
- [Full-Text Search Operators](../../operators/conditional-operators/full-text-search-operators)
