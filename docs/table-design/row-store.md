---
{
    "title": "Row Store",
    "language": "en",
    "description": "Doris Row Store layers a row-based format on top of columnar storage, merging the multiple IOs of wide-table point queries into one and significantly reducing IOPS and query latency."
}
---

<!-- Knowledge type: Feature introduction / Configuration parameters -->
<!-- Applicable scenarios: Wide-table point query / TOPN query performance tuning -->

**Row Store** is a Doris capability that stores an additional compact binary row-format copy of each row on top of columnar storage. It turns point-query scenarios from "one IO per column" into "one IO to read the whole row." This capability has been supported since Doris 2.0.0.

By default, Doris uses columnar storage, where each column is stored contiguously. Columnar storage performs well in analytical scenarios (aggregation, filtering, sorting, and so on) because only the required columns need to be read. However, in point-query scenarios (such as `SELECT *`), all columns need to be read, with one IO per column. On wide tables with many columns (for example, hundreds of columns), IOPS becomes a bottleneck.

When row store is enabled, the system stores an additional column at write time, concatenating all columns of a row into a compact binary format. A point query then needs only one IO to read the complete row data, which substantially reduces IOPS and improves query latency.

## Applicable Scenarios

Row store mainly targets the following two query categories. Use the table below to quickly judge whether to enable it:

| Scenario | Typical Query Pattern | Table Model Requirement | Recommended |
|------|-------------|-----------|---------|
| High-concurrency primary key point query | `SELECT ... FROM t WHERE pk1 = ? AND pk2 = ?` | Unique Key MOW table | Recommended |
| Wide-table TOPN query | `SELECT * FROM t [WHERE ...] ORDER BY ... LIMIT N` | Duplicate table / Unique Key MOW table | Recommended |
| Analytical query | Aggregation, complex filtering on a few columns, and so on | — | Not recommended (columnar storage is sufficient) |

The following sections describe the trigger conditions, table-creation methods, and query examples for each scenario.

## Scenario 1: High-Concurrency Primary Key Point Query

This applies to high-concurrency scenarios on Unique Key MOW tables that look up specific rows by the full primary key. When the conditions are met, the query takes the Short-Circuit path and bypasses the regular execution pipeline.

### Trigger Conditions

All of the following conditions must be met **at the same time**:

1. The table is a Unique Key MOW table (`"enable_unique_key_merge_on_write" = "true"`).
2. Row store is enabled via `"store_row_column" = "true"` or `"row_store_columns" = "..."`.
3. The `WHERE` clause contains **equality conditions on all primary key columns**, joined by `AND`.

### Table Creation Example

The following example creates a table with 8 columns, enables row store on only 5 of them, and sets `page_size` to 4 KB to achieve the best point-query performance:

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

### Query Example

```sql
-- Query all columns
SELECT * FROM tbl_point_query WHERE k = 100;

-- Query a subset of columns
SELECT k, v1, v3, v5, v7 FROM tbl_point_query WHERE k = 100;
```

**Handling partial-column row store:** If the row store contains only a subset of columns (for example, `v1`) but the query requests a column that is not in the row store (for example, `v2`), Doris reads the missing column from columnar storage. Columns in the row store are still read efficiently, while the remaining columns go through normal columnar IO.

### Verification Method

Run `EXPLAIN` on the query. The output should contain the `SHORT-CIRCUIT` marker. For details, see [High-Concurrency Point Query](../query-acceleration/high-concurrent-point-query).

## Scenario 2: TOPN Lazy Materialization Query

This applies to wide-table `SELECT *` queries on Duplicate tables or Unique Key MOW tables that "sort and then take a small number of rows." When the conditions are met, the query takes the Fetch Row Store path and, combined with the TOPN two-phase optimization, fetches only the rows actually hit.

### Trigger Conditions

All of the following conditions must be met **at the same time**:

1. The table is a Duplicate table, or a Unique Key MOW table (`"enable_unique_key_merge_on_write" = "true"`).
2. Row store must be enabled on **all columns** (`"store_row_column" = "true"`).
3. The query matches the pattern `SELECT * FROM tbl [WHERE ...] ORDER BY ... LIMIT N`.
4. It must be `SELECT *`; selecting specific columns is not supported.
5. The TOPN lazy materialization optimization must be triggered. For details, see [TOPN Query Optimization](../query-acceleration/optimization-technology-principle/topn-optimization).

### Table Creation Example

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
Duplicate tables must set `"store_row_column" = "true"` and do not support specifying a subset of columns via `row_store_columns`. All columns are stored in the row store.
:::

### Query Example

```sql
SELECT * FROM tbl_duplicate WHERE k < 10 ORDER BY k LIMIT 10;
```

### Verification Method

Run `EXPLAIN` on the query. The output should contain both the `FETCH ROW STORE` marker and the `OPT TWO PHASE` marker.

## Configuration Parameters

Set the following parameters in the `PROPERTIES` of `CREATE TABLE`:

| Parameter | Default | Supported Versions | Description |
|------|--------|---------|------|
| `store_row_column` | `false` | 2.0+ | When set to `true`, enables row store on **all columns**. |
| `row_store_columns` | All columns | 3.0+ | Enables row store on **specified columns** only, in the format `"col1,col2,..."`. When this parameter is set, `store_row_column` is implicitly enabled. Compared with full row store, this can significantly reduce storage overhead. |
| `row_store_page_size` | `16384` (16 KB) | 2.0+ | Row store page size in bytes. The page is the minimum IO unit: even reading a single row produces one page of IO. |

### `row_store_page_size` Tuning Recommendations

`row_store_page_size` directly affects the trade-off between point-query performance and storage overhead:

| Optimization Goal | Recommended Value | Trade-off |
|---------|--------|------|
| Best point-query performance | 4096 (4 KB) or smaller | Higher storage overhead |
| Balanced (default) | 16384 (16 KB) | — |
| Minimum storage overhead | 65536 (64 KB) or larger | Higher point-query latency |

## Notes

1. **Storage overhead:** Enabling row store increases disk usage. Depending on data characteristics, the additional storage is typically 2 to 10 times the original table size. Test with real data to evaluate the impact.
2. **`page_size` affects storage:** A smaller `row_store_page_size` improves point-query performance but increases storage overhead. For tuning recommendations, see the [Configuration Parameters](#configuration-parameters) section.
3. **ALTER not supported:** Modifying the `store_row_column` and `row_store_columns` properties through `ALTER TABLE` is not supported.
