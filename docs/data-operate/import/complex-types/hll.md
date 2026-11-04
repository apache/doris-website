---
{
    "title": "HLL",
    "language": "en",
    "description": "Use Stream Load with hll_hash or hll_from_binary to import data into Doris HLL columns for high-performance approximate distinct counting.",
    "keywords": [
        "HLL",
        "HyperLogLog",
        "approximate distinct",
        "approximate deduplication",
        "hll_hash",
        "hll_cardinality",
        "Stream Load",
        "Count Distinct",
        "UV statistics",
        "Doris complex type import"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Approximate distinct counting on large data volumes / UV statistics / HLL column data import -->

HLL (HyperLogLog) is a data type provided by Doris for **approximate distinct counting**. On large data volumes, HLL delivers significantly better deduplication performance than `Count Distinct`, and is commonly used for UV statistics, unique user counting, and similar scenarios.

Because raw values cannot be written directly into an HLL column, the data must be hashed with functions such as `hll_hash` during import. If the source column already holds serialized Doris HLL bytes, map it through `hll_from_binary` instead. For more information about the HLL type, see [HLL](../../../sql-manual/basic-element/sql-data-types/aggregate/HLL).

## Applicable Scenarios

| Scenario | Description |
| --- | --- |
| UV statistics on massive data | For example, estimating daily and monthly active unique users |
| Distinct counting on large data volumes | Data volumes above the million level where a small margin of error is acceptable |
| Replacing Count Distinct | Significantly reduces compute cost while keeping error within an acceptable range |

## Workflow Overview

The complete HLL data import workflow consists of the following 4 steps:

1. Prepare the source data file to import.
2. Create the target table with an HLL column in Doris.
3. Import the data through Stream Load together with the `hll_hash` function.
4. Verify the import result with `hll_cardinality`.

## Example

### Step 1: Prepare the data

Create the source data file `test_hll.csv` with the following content:

```sql
1001|koga
1002|nijg
1003|lojn
1004|lofn
1005|jfin
1006|kon
1007|nhga
1008|nfubg
1009|huang
1010|buag
```

### Step 2: Create the table in the database

In the target database, create an Aggregate model table that contains an HLL column:

```sql
CREATE TABLE testdb.test_hll(
    typ_id           BIGINT          NULL   COMMENT "ID",
    typ_name         VARCHAR(10)     NULL   COMMENT "NAME",
    pv               hll hll_union   NOT NULL   COMMENT "hll"
)
AGGREGATE KEY(typ_id,typ_name)
DISTRIBUTED BY HASH(typ_id) BUCKETS 10;
```

Notes:

- An HLL column must be paired with the aggregate function `hll_union`.
- The table model must be `AGGREGATE KEY`.

### Step 3: Import the data

Import the data through Stream Load. Use the `columns` parameter to apply `hll_hash` to the source column `typ_id` and write the result into the `pv` column:

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,typ_name,pv=hll_hash(typ_id)" \
    -T test_hll.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_hll/_stream_load
```

Key parameter descriptions:

| Parameter | Description |
| --- | --- |
| `column_separator` | Column separator in the source file. This example uses `|`. |
| `columns` | Field mapping expression. The HLL column must be transformed by one of `hll_hash()`, `hll_from_base64()`, `hll_from_binary()`, or `hll_empty()`. See [Loading Pre-serialized HLL Data](#loading-pre-serialized-hll-data). |
| `<doris_user>` / `<doris_password>` | Username and password for Doris. |
| `<fe_ip>` / `<fe_http_port>` | IP address and HTTP port of the FE node. |

### Step 4: Verify the imported data

Use the `hll_cardinality` function to query the distinct count result of the HLL column:

```sql
mysql> select typ_id,typ_name,hll_cardinality(pv) from testdb.test_hll;
+--------+----------+---------------------+
| typ_id | typ_name | hll_cardinality(pv) |
+--------+----------+---------------------+
|   1010 | buag     |                   1 |
|   1002 | nijg     |                   1 |
|   1001 | koga     |                   1 |
|   1008 | nfubg    |                   1 |
|   1005 | jfin     |                   1 |
|   1009 | huang    |                   1 |
|   1004 | lofn     |                   1 |
|   1007 | nhga     |                   1 |
|   1003 | lojn     |                   1 |
|   1006 | kon      |                   1 |
+--------+----------+---------------------+
10 rows in set (0.06 sec)
```

The result shows that the HLL column cardinality is 1 for every row, which means the data has been imported correctly and hashed by `hll_hash`.

## Loading Pre-serialized HLL Data

When the source data already contains serialized Doris HLL bytes instead of raw values, do not hash it again. Map the column through `hll_from_binary` so the bytes are deserialized into the HLL column:

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,typ_name,pv=hll_from_binary(typ_id_binary)" \
    -T test_hll_binary.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_hll/_stream_load
```

`hll_from_binary` accepts the bytes produced by [`hll_to_binary`](../../../sql-manual/sql-functions/scalar-functions/hll-functions/hll-to-binary), by the Doris Hive UDFs (`to_hll` / `hll_union`), or by any writer that uses the same Doris HLL serialization format. If the source column holds Base64 text instead of raw bytes, decode it first with `from_base64`, for example `pv=hll_from_binary(from_base64(typ_id_base64))`.

An HLL column in the `columns` mapping must use one of the following functions. Any other expression is rejected at analysis time with `HLL column must use hll_hash function`:

| Function | Use when |
| --- | --- |
| `hll_hash(<value>)` | The source column holds a raw value that must be hashed |
| `hll_from_base64(<string>)` | The source column holds a Base64 string of Doris HLL bytes |
| `hll_from_binary(<varbinary>)` | The source column holds raw Doris HLL bytes |
| `hll_empty()` | The column should be initialized as an empty HLL |

:::caution

`hll_from_binary` returns `NULL` for rows whose bytes are invalid or truncated. Because the HLL column is usually declared `NOT NULL`, such rows are filtered out and count towards the load's `max_filter_ratio`. Validate the source bytes before loading if a high filtered-row count would abort the job.

:::

## FAQ

### Why must HLL columns use hll_hash?

HLL is a special binary aggregate type and cannot store raw values directly. The raw value must first be converted into the internal HLL representation through `hll_hash` before being written into the HLL column. When the source data is already in the Doris HLL serialization format, use `hll_from_binary` (raw bytes) or `hll_from_base64` (Base64 text) instead of hashing it a second time.

### What is the difference between HLL and Count Distinct?

| Dimension | HLL | Count Distinct |
| --- | --- | --- |
| Accuracy | Approximate (small margin of error) | Exact |
| Performance | Significantly better on large data volumes | Performance drops noticeably on large data volumes |
| Storage | Fixed and relatively small footprint | No extra storage required |
| Applicable scenarios | UV estimation and other scenarios where some error is acceptable | Scenarios that require exact distinct counting |

### What table model is required when creating an HLL column?

An HLL column relies on the aggregate function `hll_union`, so it must be used in an `AGGREGATE KEY` aggregate model table.
