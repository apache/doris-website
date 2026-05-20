---
{
    "title": "BITMAP",
    "language": "en",
    "description": "Learn how to load BITMAP data in Apache Doris, including table design rules, a Stream Load example, and two ways to load multi-element bitmaps.",
    "keywords": [
        "Doris BITMAP",
        "BITMAP load",
        "BITMAP_UNION",
        "to_bitmap",
        "bitmap_from_string",
        "bitmap_from_array",
        "Stream Load Bitmap",
        "Aggregate table Bitmap"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenarios: BITMAP data loading / exact deduplication / user profile tags -->

The BITMAP type is commonly used for exact deduplication, user profile tags, and similar scenarios. This document describes the table design rules for BITMAP columns in Apache Doris and demonstrates two loading approaches, single-value and multi-element, through Stream Load.

## BITMAP Type Constraints

Before loading BITMAP data, review the following constraints:

| Constraint | Description |
| --- | --- |
| Supported table models | Duplicate table, Unique table, Aggregate table |
| Column position | Can only be used as a Value column, not as a Key column |
| Aggregate table requirement | In an Aggregate table, the BITMAP column must use the aggregate type `BITMAP_UNION` |
| Length and default value | No need to specify length or default value; the length is automatically controlled by the system based on the aggregation level |

For more details about the type, see [BITMAP Data Type](../../../sql-manual/basic-element/sql-data-types/aggregate/BITMAP).

## Scenario 1: Loading Single-Value BITMAP Data

This applies when each row of source data contains only a single integer value. Use the `to_bitmap` function to convert the integer into a BITMAP.

### Step 1: Prepare the Data

Create a CSV file `test_bitmap.csv` where each row contains a single integer value:

```text
1|koga|17723
2|nijg|146285
3|lojn|347890
4|lofn|489871
5|jfin|545679
6|kon|676724
7|nhga|767689
8|nfubg|879878
9|huang|969798
10|buag|97997
```

### Step 2: Create the Target Table

Create an Aggregate table with a BITMAP column in the `testdb` database:

```sql
CREATE TABLE testdb.test_bitmap(
    typ_id     BIGINT                NULL   COMMENT "ID",
    hou        VARCHAR(10)           NULL   COMMENT "one",
    arr        BITMAP  BITMAP_UNION  NOT NULL   COMMENT "two"
)
AGGREGATE KEY(typ_id,hou)
DISTRIBUTED BY HASH(typ_id,hou) BUCKETS 10;
```

### Step 3: Run Stream Load

Use the `to_bitmap` function to convert the integer column into a BITMAP:

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=to_bitmap(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### Step 4: Verify the Load Result

Use `bitmap_to_string` to convert the BITMAP back into a string and view the loaded data:

```sql
mysql> select typ_id,hou,bitmap_to_string(arr) from testdb.test_bitmap;
+--------+-------+-----------------------+
| typ_id | hou   | bitmap_to_string(arr) |
+--------+-------+-----------------------+
|      4 | lofn  | 489871                |
|      6 | kon   | 676724                |
|      9 | huang | 969798                |
|      3 | lojn  | 347890                |
|      8 | nfubg | 879878                |
|      7 | nhga  | 767689                |
|      1 | koga  | 17723                 |
|      2 | nijg  | 146285                |
|      5 | jfin  | 545679                |
|     10 | buag  | 97997                 |
+--------+-------+-----------------------+
10 rows in set (0.07 sec)
```

## Scenario 2: Loading Multi-Element BITMAP Data

When each row in the source data contains multiple integers (for example, multiple user IDs), choose one of the following two methods based on the format of the source file. The differences between the two methods are as follows:

| Method | Source file format | Requires cast conversion | Notes |
| --- | --- | --- | --- |
| `bitmap_from_string` | Comma-separated, square brackets **not allowed** | No | Square brackets are treated as a data quality error |
| `bitmap_from_array` | Comma-separated, square brackets **allowed** | Must `cast` to `array<int>` | Without the cast, loading fails because the function signature does not match |

### Method A: Using bitmap_from_string

#### Data Format Requirements

The `arr` column in the source file uses comma separators and must not contain square brackets:

```text
1|koga|17,723
2|nijg|146,285
3|lojn|347,890
4|lofn|489,871
5|jfin|545,679
6|kon|676,724
7|nhga|767,689
8|nfubg|879,878
9|huang|969,798
10|buag|97,997
```

#### Stream Load Command

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=bitmap_from_string(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### Method B: Using bitmap_from_array

#### Data Format Requirements

The `arr` column in the source file is allowed to contain square brackets:

```text
1|koga|[17,723]
2|nijg|[146,285]
3|lojn|[347,890]
4|lofn|[489,871]
5|jfin|[545,679]
6|kon|[676,724]
7|nhga|[767,689]
8|nfubg|[879,878]
9|huang|[969,798]
10|buag|[97,997]
```

#### Stream Load Command

In Stream Load, you must first `cast` the string to `array<int>` and then convert it with `bitmap_from_array`:

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr_str,arr=bitmap_from_array(cast(arr_str as array<int>))" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

## Troubleshooting

### Function Does Not Exist Error When Using bitmap_from_array

Example error:

```text
[ANALYSIS_ERROR]TStatus: errCode = 2, detailMessage = Does not support non-builtin functions, or function does not exist: bitmap_from_array(<slot 8>)
```

- **Cause**: The string was not explicitly cast to `array<int>`, so the function signature for `bitmap_from_array` cannot be matched.
- **Solution**: In the `columns` parameter of Stream Load, use `cast(arr_str as array<int>)` to perform an explicit conversion.

### How to View BITMAP Column Contents in Queries

BITMAP is a binary aggregate type and cannot be viewed directly with `SELECT`. You need to convert it through functions:

- `bitmap_to_string(col)`: Converts the BITMAP into a comma-separated string.
- `bitmap_count(col)`: Returns the number of distinct elements in the BITMAP.

### Why BITMAP Cannot Be Used as a Key Column

BITMAP is an aggregate binary type. It does not support being used as a Key column for sorting or deduplication, and can only be stored as a Value column to hold aggregate results.
