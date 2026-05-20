---
{
    "title": "MAP | Complex Types",
    "language": "en",
    "description": "Learn how to load data into MAP-type columns in Apache Doris, covering table creation, Stream Load commands, and result verification for both CSV and JSON formats.",
    "keywords": [
        "Doris MAP load",
        "MAP data type",
        "complex type load",
        "Stream Load MAP",
        "CSV load MAP",
        "JSON load MAP",
        "semi-structured data"
    ],
    "sidebar_label": "MAP"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Complex type data load / Stream Load practice -->

`MAP<K, V>` represents a `MAP` whose elements are of type `K, V`, and is commonly used to store semi-structured key-value pair data. See [MAP data type](../../../sql-manual/basic-element/sql-data-types/semi-structured/MAP.md) for details.

This document focuses on **how to write data into MAP-type columns**, and provides end-to-end examples for two common data sources:

- [CSV format load](#csv-format-load): suitable when the upstream data is delimited text (watch out for conflicts between the column delimiter and commas inside the MAP).
- [JSON format load](#json-format-load): suitable when the upstream data is a JSON array or JSON Lines.

Both load methods use the [Stream Load](../import-way/stream-load-manual.md) interface. The general steps are:

1. Prepare the data file.
2. Create the table in the database.
3. Call Stream Load with `curl` to load the data.
4. Query the results to verify.

## CSV format load

### Step 1: Prepare the data

Create the following CSV file `test_map.csv`. The column delimiter uses `|` instead of a comma, so that it does not conflict with the commas inside the MAP.

```text
1|{"Emily":101,"age":25}
2|{"Benjamin":102}
3|{}
4|null
```

The meaning of each line in the file is as follows:

| Line | Meaning |
| --- | --- |
| `1\|{"Emily":101,"age":25}` | A MAP containing two key-value pairs |
| `2\|{"Benjamin":102}` | A MAP containing one key-value pair |
| `3\|{}` | An empty MAP |
| `4\|null` | A NULL value |

### Step 2: Create the table in the database

```sql
CREATE TABLE map_test (
    id       INT                 NOT NULL,
    c_map    MAP<STRING, INT>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Step 3: Load the data

Load the CSV file with Stream Load. The meanings of the key headers are listed in the table below.

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_map" \
        -T "test_map.csv" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```

| Header | Purpose |
| --- | --- |
| `column_separator:|` | Sets the column delimiter to `|` to avoid conflicts with commas inside the MAP |
| `columns: id, c_map` | Declares the mapping between file columns and table columns |

### Step 4: Verify the loaded data

```sql
mysql> SELECT * FROM map_test;
+------+-------------------------+
| id   | c_map                   |
+------+-------------------------+
|    1 | {"Emily":101, "age":25} |
|    2 | {"Benjamin":102}        |
|    3 | {}                      |
|    4 | NULL                    |
+------+-------------------------+
4 rows in set (0.01 sec)
```

## JSON format load

### Step 1: Prepare the data

Create the following JSON file `test_map.json`. The whole file is a JSON array, and each element corresponds to one row of data.

```json
[
    {"id":1, "c_map":{"Emily":101, "age":25}},
    {"id":2, "c_map":{"Benjamin":102}},
    {"id":3, "c_map":{}},
    {"id":4, "c_map":null}
]
```

### Step 2: Create the table in the database

```sql
CREATE TABLE map_test (
    id       INT                 NOT NULL,
    c_map    MAP<STRING, INT>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Step 3: Load the data

Load the JSON file with Stream Load. The meanings of the key headers are listed in the table below.

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_map" \
        -H "strip_outer_array:true" \
        -T "test_map.json" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```

| Header | Purpose |
| --- | --- |
| `format:json` | Declares the data format as JSON |
| `strip_outer_array:true` | When the input is a JSON array, parses each array element as one row |
| `columns: id, c_map` | Declares the mapping between JSON fields and table columns |

### Step 4: Verify the loaded data

```sql
mysql> SELECT * FROM map_test;
+------+-------------------------+
| id   | c_map                   |
+------+-------------------------+
|    1 | {"Emily":101, "age":25} |
|    2 | {"Benjamin":102}        |
|    3 | {}                      |
|    4 | NULL                    |
+------+-------------------------+
4 rows in set (0.01 sec)
```

## FAQ

**Q1: Why not use a comma as the column delimiter in CSV?**

The MAP literal itself uses commas to separate multiple key-value pairs (for example, `{"Emily":101,"age":25}`). Using a comma as the column delimiter as well would cause parsing ambiguity. It is recommended to use characters that do not appear inside the MAP content, such as `|` or `\t`.

**Q2: Why is `strip_outer_array:true` needed when loading a JSON array?**

When the outermost layer of the JSON file is an array (as in the example in this document), you must set `strip_outer_array:true` so that Doris treats each element in the array as one row of data. If the file is already JSON Lines (one object per line), this parameter is not required.

**Q3: How do you represent an empty MAP versus NULL?**

- Empty MAP: write as `{}` in CSV, and as `{}` in JSON.
- NULL value: write as `null` in CSV, and as `null` in JSON. The target column must allow `NULL`.
