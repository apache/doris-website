---
{
    "title": "Hybrid Row-Columnar Storage",
    "language": "en",
    "description": "Doris hybrid row-columnar storage enables row-oriented storage alongside columnar storage, reducing IOPS for point queries on wide tables."
}
---

## Overview

Doris uses columnar storage by default, where each column is stored contiguously. Columnar storage performs well in analytical scenarios (aggregation, filtering, sorting, etc.) because it reads only the required columns. However, when a query needs all columns — such as `SELECT *` in point query scenarios — each column requires a separate IO operation, making IOPS a bottleneck. This is especially noticeable on wide tables with hundreds of columns.

To solve this, Doris supports **Hybrid Row-Columnar Storage** since version 2.0.0. When row storage is enabled at table creation, all columns of a row are concatenated into a single additional column using a compact binary format. A point query then reads a complete row in one IO operation instead of one IO per column, significantly reducing IOPS and improving latency.

## Use Cases

Row storage is recommended in the following scenarios:

- **High-concurrency primary key point queries** on Unique Key merge-on-write (MOW) tables, where each query looks up a specific row by the full primary key.
- **Wide-table `SELECT *` queries** on Duplicate or MOW tables where only a small number of rows are returned (TOPN pattern).

If your workload is primarily analytical (aggregation, complex filtering on a few columns), columnar storage alone is usually sufficient.

## Table Properties

Enable and configure row storage through the following `PROPERTIES` when creating a table.

| Property | Default | Since | Description |
|----------|---------|-------|-------------|
| `"store_row_column" = "true"` | `false` | 2.0 | Enable row storage for **all** columns. |
| `"row_store_columns" = "col1,col2,..."` | All columns | 3.0 | Enable row storage for **specified columns only**. When this property is set, `store_row_column` is implicitly enabled. Using selective columns reduces storage overhead compared to storing all columns. |
| `"row_store_page_size" = "16384"` | `16384` (16 KB) | 2.0 | Size of the row-store page in bytes. A page is the minimum IO unit — reading even a single row requires one page IO. |

**Tuning `row_store_page_size`:**

| Goal | Recommended page_size | Trade-off |
|------|----------------------|-----------|
| Best point query performance | 4096 (4 KB) or smaller | Higher storage overhead |
| Balanced (default) | 16384 (16 KB) | — |
| Minimum storage overhead | 65536 (64 KB) or larger | Higher point query latency |

## When Row Storage Is Used

Row storage is triggered in two scenarios. Each has different prerequisites.

### Scenario 1: High-Concurrency Primary Key Point Query (Short-Circuit)

This optimization applies when **all** of the following conditions are met:

1. The table is a **Unique Key MOW table** (`"enable_unique_key_merge_on_write" = "true"`).
2. Row storage is enabled via `"store_row_column" = "true"` or `"row_store_columns" = "..."`.
3. The `WHERE` clause contains **equality conditions on all primary key columns**, joined by `AND`.

Example queries:

```sql
-- Full row retrieval
SELECT * FROM tbl WHERE k1 = 1 AND k2 = 2;

-- Partial column retrieval
SELECT v1, v2 FROM tbl WHERE k1 = 1 AND k2 = 2;
```

**Partial column coverage:** If the row store contains only some columns (e.g., `v1`) but the query also requests columns not in the row store (e.g., `v2`), Doris fetches the missing columns from the column store. The columns in the row store are still read efficiently, while the remaining columns incur normal columnar IO.

**Verification:** Run `EXPLAIN` on the query and check for the `SHORT-CIRCUIT` marker. For details, see [High-Concurrency Point Query](../query-acceleration/high-concurrent-point-query).

### Scenario 2: TOPN Deferred Materialization Query (Fetch Row Store)

This optimization applies when **all** of the following conditions are met:

1. The table is a **Duplicate** table, or a **Unique Key MOW table** (`"enable_unique_key_merge_on_write" = "true"`).
2. **All columns** must be in the row store (`"store_row_column" = "true"`).
3. The query follows the pattern `SELECT * FROM tbl [WHERE ...] ORDER BY ... LIMIT N`.
4. The query must be `SELECT *` — selecting specific columns is not supported for this optimization.
5. The TOPN deferred materialization optimization must be triggered. For details, see [TOPN Query Optimization](../query-acceleration/optimization-technology-principle/topn-optimization).

**Verification:** Run `EXPLAIN` on the query and check for both the `FETCH ROW STORE` and `OPT TWO PHASE` markers.

## Examples

### Example 1: Unique Key MOW Table with Selective Row Store Columns

Create a table with 8 columns, enable row storage for 5 selected columns, and set `page_size` to 4 KB for optimal point query performance:

```sql
CREATE TABLE `tbl_point_query` (
    `k` int(11) NULL,
    `v1` decimal(27, 9) NULL,
    `v2` varchar(30) NULL,
    `v3` varchar(30) NULL,
    `v4` date NULL,
    `v5` datetime NULL,
    `v6` float NULL,
    `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`k`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "row_store_columns" = "k,v1,v3,v5,v7",
    "row_store_page_size" = "4096"
);
```

Point query on the row-stored columns:

```sql
SELECT k, v1, v3, v5, v7 FROM tbl_point_query WHERE k = 100;
```

Run `EXPLAIN` on this query — the output should include the `SHORT-CIRCUIT` marker. For more details, see [High-Concurrency Point Query](../query-acceleration/high-concurrent-point-query).

### Example 2: Duplicate Table with Full Row Store

Create a Duplicate table with row storage enabled for all columns:

```sql
CREATE TABLE `tbl_duplicate` (
    `k` int(11) NULL,
    `v1` string NULL
) ENGINE=OLAP
DUPLICATE KEY(`k`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "light_schema_change" = "true",
    "store_row_column" = "true",
    "row_store_page_size" = "4096"
);
```

:::note
`"store_row_column" = "true"` is required for Duplicate tables. The `row_store_columns` property is not supported with Duplicate tables — all columns are stored in the row store.
:::

TOPN query using row storage:

```sql
SELECT * FROM tbl_duplicate WHERE k < 10 ORDER BY k LIMIT 10;
```

Run `EXPLAIN` on this query — the output should include both the `FETCH ROW STORE` marker and the `OPT TWO PHASE` marker.

## Limitations

1. **Storage overhead:** Enabling row storage increases disk usage. Depending on data characteristics, the additional storage is typically 2–10× the original table size. Test with actual data to measure the impact.
2. **page_size affects storage:** A smaller `row_store_page_size` improves point query performance but increases storage overhead. See the [Table Properties](#table-properties) section for tuning guidance.
3. **ALTER not supported:** Modifying the `store_row_column` and `row_store_columns` properties via `ALTER TABLE` is not supported.
