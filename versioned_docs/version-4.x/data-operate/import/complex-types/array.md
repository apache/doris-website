---
{
    "title": "ARRAY | Complex Types",
    "language": "en",
    "description": "How to import ARRAY type data into Apache Doris via Stream Load in CSV and JSON formats, including table creation, separator, and parameter examples.",
    "sidebar_label": "ARRAY",
    "keywords": [
        "ARRAY import",
        "array type",
        "complex type import",
        "CSV import array",
        "JSON import array",
        "Stream Load",
        "ARRAY<T>",
        "Apache Doris array",
        "column_separator",
        "strip_outer_array"
    ]
}
---

<!-- Knowledge type: Procedure / Data import example -->
<!-- Applicable scenario: Importing data files containing array fields into Doris -->

`ARRAY<T>` represents an array of elements of type T, commonly used to store tags, ID lists, multi-value attributes, and similar scenarios. For the syntax, restrictions, and function support of this type, see [ARRAY data type](../../../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY.md).

This document focuses on **how to import data containing ARRAY fields into Doris**, providing end-to-end examples for two typical scenarios based on the source data format: CSV and JSON.

## Applicable Scenarios

| Data source | Recommended approach | Key parameters |
| --- | --- | --- |
| Text files separated by `|`, `\t`, or similar characters | Stream Load in CSV format | `column_separator` |
| Nested structured JSON arrays | Stream Load in JSON format | `format=json`, `strip_outer_array` |

The general steps are as follows:

1. Prepare a source data file in the appropriate format
2. Create a target table containing an `ARRAY<T>` column in Doris
3. Import the file via Stream Load
4. Query and verify that the data is parsed correctly

## CSV Format Import

### Step 1: Prepare the data

Create a CSV file `test_array.csv`. Because array elements themselves are separated by commas, `|` is used here as the column separator to avoid conflicts with the column delimiter:

```text
1|[1,2,3,4,5]
2|[6,7,8]
3|[]
4|null
```

### Step 2: Create the table in the database

```sql
CREATE TABLE `array_test` (
    `id`         INT           NOT NULL,
    `c_array`    ARRAY<INT>    NULL
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Step 3: Import the data

Import via Stream Load, using `column_separator` to specify `|` as the column separator:

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_array" \
        -T "test_array.csv" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### Step 4: Check the imported data

```sql
mysql> SELECT * FROM array_test;
+------+-----------------+
| id   | c_array         |
+------+-----------------+
|    1 | [1, 2, 3, 4, 5] |
|    2 | [6, 7, 8]       |
|    3 | []              |
|    4 | NULL            |
+------+-----------------+
4 rows in set (0.01 sec)
```

## JSON Format Import

### Step 1: Prepare the data

Create a JSON file `test_array.json`. The outermost layer is an array of objects:

```json
[
    {"id":1, "c_array":[1,2,3,4,5]},
    {"id":2, "c_array":[6,7,8]},
    {"id":3, "c_array":[]},
    {"id":4, "c_array":null}
]
```

### Step 2: Create the table in the database

```sql
CREATE TABLE `array_test` (
    `id`         INT           NOT NULL,
    `c_array`    ARRAY<INT>    NULL
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Step 3: Import the data

Import via Stream Load. Set `format` to `json` and use `strip_outer_array:true` to split the outermost array into multiple rows:

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_array" \
        -H "strip_outer_array:true" \
        -T "test_array.json" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### Step 4: Check the imported data

```sql
mysql> SELECT * FROM array_test;
+------+-----------------+
| id   | c_array         |
+------+-----------------+
|    1 | [1, 2, 3, 4, 5] |
|    2 | [6, 7, 8]       |
|    3 | []              |
|    4 | NULL            |
+------+-----------------+
4 rows in set (0.01 sec)
```

## Key Parameter Description

| Parameter | Applicable format | Description |
| --- | --- | --- |
| `column_separator` | CSV | Column separator. When the array contains commas, characters such as `|` or `\t` are recommended to avoid conflicts with the array element separator |
| `columns` | CSV / JSON | Specifies the mapping order between data columns and table columns |
| `format` | JSON | Set to `json` to indicate that the input is parsed in JSON format |
| `strip_outer_array` | JSON | When set to `true`, the outermost `[]` is stripped, and each object inside is imported as a row |

## FAQ

### When the array contains commas, why cannot the CSV column separator be a comma?

In a CSV file, an `ARRAY` is represented in the form `[1,2,3]`, with elements separated by commas. If the column separator is also a comma, the parser cannot distinguish between the internal array separator and the column separator, which leads to parsing errors. Use characters such as `|` or `\t` that do not appear in the array content.

### How to represent NULL arrays and empty arrays?

- **NULL array**: write `null` directly (CSV) or use the JSON literal `null`. After import, the value is `NULL`
- **Empty array**: write `[]`. After import, the value is `[]`. The two have different semantics

### What if the outermost layer of the JSON file is not an array?

If each line in the file is an independent JSON object (JSON Lines), there is no need to set `strip_outer_array`. Only when the outermost layer is in the form `[ {...}, {...} ]` do you need to set `strip_outer_array` to `true`.
