---
{
    "title": "JSON | Complex Types",
    "language": "en",
    "description": "This article describes the features and capacity limits of the Apache Doris JSON type, along with Stream Load import methods and examples for both CSV and JSON formats.",
    "keywords": [
        "Doris JSON",
        "JSON data type",
        "JSONB",
        "JSON import",
        "Stream Load JSON",
        "json_extract",
        "complex type import",
        "semi-structured data"
    ],
    "sidebar_label": "JSON"
}
---

<!-- Knowledge type: Data type description + Operation steps -->
<!-- Use case: Semi-structured data modeling / JSON data import -->

## Overview

`JSON` is a complex data type provided by Apache Doris. It stores JSON data efficiently in a binary format and provides JSON functions to access internal fields. Choose this type when your business needs to store semi-structured data such as event tracking logs, user attributes, or configuration items, and requires fast access to internal fields.

Compared with storing JSON strings as the `String` type, the `JSON` type offers the following advantages:

1. **Data validation**: Doris automatically validates JSON format on write, preventing dirty data from being stored.
2. **Efficient access**: The binary storage format is more compact, and accessing JSON fields with functions such as `json_extract` is several times faster than with `get_json_xx` functions.

### Capacity Limits

| Item | Default | Maximum | How to Adjust |
| --- | --- | --- | --- |
| Size of a single JSON field | 1 MB (1048576 bytes) | 2 GB (2147483643 bytes) | Adjust the BE configuration `string_type_length_soft_limit_bytes` |

:::caution[Version compatibility]
In version 1.2.x, the JSON type was named `JSONB`. For compatibility with MySQL, it was renamed to `JSON` starting in version 2.0.0. Existing tables created with `JSONB` continue to work normally.
:::

## Choose an Import Method

Choose an import option based on the format of your source data file:

| Source File Format | Use Case | Key Parameters |
| --- | --- | --- |
| CSV | Data comes from a delimited file with one record per line | `column_separator` (a non-comma delimiter such as `|` is recommended) |
| JSON | Data is already in JSON array or JSON Lines format | `format:json`, `strip_outer_array:true` |

The following sections use Stream Load as an example to walk through the complete import process for both methods.

## Import via CSV Format

### Step 1: Prepare the Data

Create a CSV file `test_json.csv`. Because JSON internally uses commas to separate fields, use `|` as the column delimiter to avoid conflicts:

```text
1|{"name": "tom", "age": 35}
2|{"name": null, "age": 28}
3|{"name": "micheal", "age": null}
4|{"name": null, "age": null}
5|null
```

### Step 2: Create a Table in the Database

```sql
CREATE TABLE json_test (
    id          INT     NOT NULL,
    c_json      JSON    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Step 3: Import the Data

Submit a Stream Load job. Set the column delimiter to `|` with `column_separator`:

```bash
curl --location-trusted \
    -u "root":"" \
    -H "column_separator:|" \
    -H "columns: id, c_json" \
    -T "test_json.csv" \
    http://localhost:8040/api/testdb/json_test/_stream_load
```

### Step 4: Verify the Imported Data

```sql
SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"micheal","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | null                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```

## Import via JSON Format

### Step 1: Prepare the Data

Create a JSON file `test_json.json`. The file content is a JSON array, where each element corresponds to one row of records:

```json
[
    {"id": 1, "c_json": {"name": "tom", "age": 35}},
    {"id": 2, "c_json": {"name": null, "age": 28}},
    {"id": 3, "c_json": {"name": "micheal", "age": null}},
    {"id": 4, "c_json": {"name": null, "age": null}},
    {"id": 5, "c_json": null}
]
```

### Step 2: Create a Table in the Database

```sql
CREATE TABLE json_test (
    id          INT     NOT NULL,
    c_json      JSON    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Step 3: Import the Data

Submit a Stream Load job. Set `format:json`, and use `strip_outer_array:true` to unwrap the outer array:

```bash
curl --location-trusted \
    -u "root":"" \
    -H "format:json" \
    -H "columns: id, c_json" \
    -H "strip_outer_array:true" \
    -T "test_json.json" \
    http://localhost:8040/api/testdb/json_test/_stream_load
```

### Step 4: Verify the Imported Data

```sql
mysql> SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"micheal","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | NULL                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: What is the maximum size of a JSON field?**

The default limit is 1 MB (1048576 bytes). You can raise it up to 2 GB (2147483643 bytes) by adjusting the BE configuration `string_type_length_soft_limit_bytes`.

**Q2: Do `JSONB` fields created in version 1.2.x need to be modified after upgrading?**

No modification is needed. The type was renamed to `JSON` starting in version 2.0.0, but existing tables created with `JSONB` continue to support normal reads and writes.

**Q3: Why is the `JSON` type recommended over `String` for storing JSON?**

The `JSON` type validates the format on write, preventing dirty data. Its binary storage is more compact, and accessing fields with functions such as `json_extract` is several times faster than with `get_json_xx` functions.

**Q4: Why use the `|` delimiter when importing CSV?**

JSON itself contains commas, so using a comma as the column delimiter would cause parsing errors. Choose a character that does not appear in the JSON strings (such as `|`) as the column delimiter.

**Q5: Why is `strip_outer_array:true` required when importing a JSON array?**

This parameter tells Stream Load to unwrap the outer JSON array and import each element of the array as an independent row. Without it, the entire array is processed as a single record.
