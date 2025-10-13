---
{
    "title": "Hybrid Row-Columnar Storage",
    "language": "en"
}
---

## Hybrid Row-Columnar Storage

Doris uses columnar storage by default, with each column stored contiguously. Columnar storage offers excellent performance for analytical scenarios (such as aggregation, filtering, sorting, etc.), as it only reads the necessary columns, reducing unnecessary IO. However, in point query scenarios (such as `SELECT *`), all columns need to be read, requiring an IO operation for each column, which can lead to IOPS becoming a bottleneck, especially for wide tables with many columns (e.g., hundreds of columns).

To address the IOPS bottleneck in point query scenarios, starting from version 2.0.0, Doris supports Hybrid Row-Columnar Storage. When users create tables, they can specify whether to enable row storage. With row storage enabled, each row only requires one IO operation for point queries (such as `SELECT *`), significantly improving performance.

The principle of row storage is that an additional column is added during storage. This column concatenates all the columns of the corresponding row and stores them using a special binary format.

## Syntax

When creating a table, specify whether to enable row storage, which columns to enable row storage for, and the storage compression unit size page_size in the table's PROPERTIES.

1. Whether to enable row storage: defaults to false (not enabled).
``` 
"store_row_column" = "true"
```

2. Which columns to enable row storage for:if `"store_row_column" = "true"`, all columns are enabled by default. If you need to specify that only some columns are enabled for row storage, set the row_store_columns parameter (afer version 3.0), formatted as a comma-separated list of column names.
``` 
"row_store_columns" = "column1,column2,column3"
```

3. Row storage page_size: defaults to 16KB.
``` 
"row_store_page_size" = "16384"
```

A page is the smallest unit for storage read and write operations, and `page_size` refers to the size of a row-store page. This means that reading a single row requires generating a page IO. The larger this value is, the better the compression effect and the lower the storage space usage. However, the IO overhead during point queries increases, resulting in lower performance (because each IO operation reads at least one page). Conversely, the smaller the value, the higher the storage space usage and the better the performance for point queries. The default value of 16KB is a balanced choice in most cases. If you prioritize query performance, you can configure a smaller value, such as 4KB or even lower. If you prioritize storage space, you can configure a larger value, such as 64KB or even higher.

## Row Store Hit Conditions

Row store hit conditions are divided into two scenarios: one is high-concurrency primary key point queries that depend on table attributes and satisfy point query conditions, and the other is single-table `SELECT *` queries. These two query types are explained below.

- For high-concurrency primary key point queries, the table attributes need to have `"enable_unique_key_merge_on_write" = "true"` (MOW table) and `"store_row_column" = "true"` (all columns are stored separately in the row store, which incurs relatively high storage costs) or `"row_store_columns" = "key,v1,v3,v5,v7"` (only specified columns are stored in the row store). When querying, ensure the `WHERE` clause includes all primary keys with equality conditions connected by `AND`, e.g., `SELECT * FROM tbl WHERE k1 = 1 AND k2 = 2` or querying specific columns `SELECT v1, v2 FROM tbl WHERE k1 = 1 AND k2 = 2`. If the row store only contains some columns (e.g., v1) but the queried column (e.g., v2) is not in the row store, the remaining columns will be queried from the column store. In this example, v1 will be queried from the row store, while v2 will be queried from the column store (which has a larger page size, leading to more read amplification). You can confirm whether the high-concurrency primary key point query optimization is hit using `EXPLAIN`. For more details on point query usage, refer to [High-Concurrency Point Query](../query-acceleration/high-concurrent-point-query).

- For general non-primary key point queries, to utilize the row store, the table model must be `DUPLICATE` or have `"enable_unique_key_merge_on_write" = "true"` (MOW table) and `"store_row_column" = "true"` (all columns are stored separately in the row store, which incurs relatively high storage costs). Queries satisfying this pattern can hit the row store with `SELECT * FROM tbl [WHERE XXXXX] ORDER BY XXX LIMIT N`, where the content in square brackets is an optional query condition. Note that currently, only `SELECT *` is supported, and it must hit the TOPN delayed materialization optimization. For details, refer to [TOPN Query Optimization](../query-acceleration/optimization-technology-principle/topn-optimization), i.e., hitting `OPT TWO PHASE`. Finally, use `EXPLAIN` to check for the `FETCH ROW STORE` marker to confirm the row store hit.


## Usage Examples

The following example creates a table with 8 columns, where the 5 columns `key, v1, v3, v5, v7` are enabled for row store, and the `page_size` is set to 4KB for high-concurrency point query performance.

```
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

Query 1

```
SELECT k, v1, v3, v5, v7 FROM tbl_point_query WHERE k = 100
```
The `EXPLAIN` output for the above statement should include the `SHORT-CIRCUIT` marker. For more details on point query usage, refer to [High-Concurrency Point Query](../query-acceleration/high-concurrent-point-query).

The following example demonstrates how a `DUPLICATE` table can meet row store query conditions.

```
CREATE TABLE `tbl_duplicate` (
    `k` int(11) NULL,
    `v1` string NULw
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

`"store_row_column" = "true"` is required.

Query 2 (Note: It must hit TOPN query optimization and must be `SELECT *`)

```
SELECT * FROM tbl_duplicate WHERE k < 10 ORDER BY k LIMIT 10
```

The `EXPLAIN` output for the above statement should include the `FETCH ROW STORE` marker and the `OPT TWO PHASE` marker.

## Notice

1. Enabling row storage will increase the storage space used. The increase in storage space is related to the data characteristics and is generally 2 to 10 times the size of the original table. The exact space usage needs to be tested with actual data.
2. The `page_size` of row storage also affects the storage space. You can adjust it based on the previous table attribute parameter `row_store_page_size`.
