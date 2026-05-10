---
{
    "title": "Importing STRUCT Type Data",
    "language": "en",
    "description": "Introduces how to import STRUCT type data into Apache Doris through CSV, JSON, and INSERT INTO methods, including table creation, Stream Load, and result verification examples.",
    "keywords": [
        "STRUCT import",
        "complex type import",
        "Doris STRUCT",
        "Stream Load STRUCT",
        "named_struct",
        "CSV import STRUCT",
        "JSON import STRUCT"
    ],
    "sidebar_label": "STRUCT"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Complex type data import -->

`STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >` represents a structure composed of multiple Fields, which can also be understood as a collection of multiple columns. For more type details, see [STRUCT Data Type](../../../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT.md).

This article starts from typical user scenarios and introduces how to import STRUCT data into Apache Doris, covering the following two common data formats:

- **CSV format import**: Suitable for importing from text files, ETL job outputs, and similar scenarios.
- **JSON format import**: Suitable for importing from APIs, logs, or semi-structured data sources.

Both methods are completed through [Stream Load](../import-way/stream-load-manual.md), and `INSERT INTO VALUES` statements are also supported for direct writes.

## Import Process Overview

Regardless of the data format used, importing STRUCT type data follows these 4 steps:

| Step | Operation | Description |
|------|------|------|
| 1 | Prepare data | Construct test data files in the target format (CSV / JSON) |
| 2 | Create a table in the database | Create a table schema that includes a `STRUCT` field |
| 3 | Import data | Write data using Stream Load or `INSERT INTO` |
| 4 | Verify imported data | Verify the result with `SELECT` |

## CSV Format Import

### Step 1: Prepare Data

Create the following CSV file `test_struct.csv`. The delimiter uses `|` instead of a comma, so that it can be distinguished from the commas inside STRUCT.

```text
1|{10, 3.14, "Emily"}
2|{4, 1.5, null}
3|{7, null, "Benjamin"}
4|{}
5|null
```

### Step 2: Create a Table in the Database

```sql
CREATE TABLE struct_test (
    id          INT                                  NOT NULL,
    c_struct    STRUCT<f1:INT,f2:FLOAT,f3:STRING>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Step 3: Import Data

Use Stream Load to import the CSV file:

```bash
curl --location-trusted \
    -u "root":"" \
    -H "column_separator:|" \
    -H "columns: id, c_struct" \
    -T "test_struct.csv" \
    http://localhost:8040/api/testdb/struct_test/_stream_load
```

You can also import using the `INSERT INTO VALUES` statement:

```sql
INSERT INTO struct_test VALUES(1, named_struct('f1', '1', 'f2', '2.0', 'f3', 'abc'));
```

### Step 4: Verify Imported Data

```sql
mysql> SELECT * FROM struct_test;
+------+--------------------------------------+
| id   | c_struct                             |
+------+--------------------------------------+
|    1 | {"f1":10, "f2":3.14, "f3":"Emily"}   |
|    2 | {"f1":4, "f2":1.5, "f3":null}        |
|    3 | {"f1":7, "f2":null, "f3":"Benjamin"} |
|    4 | {"f1":null, "f2":null, "f3":null}    |
|    5 | NULL                                 |
+------+--------------------------------------+
5 rows in set (0.01 sec)
```

## JSON Format Import

### Step 1: Prepare Data

Create the following JSON file `test_struct.json`:

```json
[
    {"id":1, "c_struct":{"f1":10, "f2":3.14, "f3":"Emily"}},
    {"id":2, "c_struct":{"f1":4, "f2":1.5, "f3":null}},
    {"id":3, "c_struct":{"f1":7, "f2":null, "f3":"Benjamin"}},
    {"id":4, "c_struct":{}},
    {"id":5, "c_struct":null}
]
```

### Step 2: Create a Table in the Database

```sql
CREATE TABLE struct_test (
    id          INT                                  NOT NULL,
    c_struct    STRUCT<f1:INT,f2:FLOAT,f3:STRING>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Step 3: Import Data

Use Stream Load to import the JSON file. Specify the format with `format:json`, and use `strip_outer_array:true` to parse the outermost JSON array:

```bash
curl --location-trusted \
    -u "root":"" \
    -H "format:json" \
    -H "columns: id, c_struct" \
    -H "strip_outer_array:true" \
    -T "test_struct.json" \
    http://localhost:8040/api/testdb/struct_test/_stream_load
```

### Step 4: Verify Imported Data

```sql
mysql> SELECT * FROM struct_test;
+------+--------------------------------------+
| id   | c_struct                             |
+------+--------------------------------------+
|    1 | {"f1":10, "f2":3.14, "f3":"Emily"}   |
|    2 | {"f1":4, "f2":1.5, "f3":null}        |
|    3 | {"f1":7, "f2":null, "f3":"Benjamin"} |
|    4 | {"f1":null, "f2":null, "f3":null}    |
|    5 | NULL                                 |
+------+--------------------------------------+
5 rows in set (0.00 sec)
```

## Key Parameters

<!-- Knowledge type: Configuration parameters -->

The following table lists the Stream Load Header parameters commonly used during STRUCT import:

| Parameter | Applicable Format | Description |
|------|----------|------|
| `column_separator` | CSV | Column delimiter. STRUCT internally uses `,`, so it is recommended to use other characters such as `|` for the outer delimiter to avoid ambiguity |
| `columns` | CSV / JSON | Specifies the mapping between columns and table fields |
| `format` | JSON | Specifies that the import file format is `json` |
| `strip_outer_array` | JSON | Set to `true` when the outermost layer of the JSON file is an array, so that it is parsed row by row |

## FAQ

<!-- Knowledge type: FAQ -->

### 1. Why does the CSV file need to use `|` instead of `,` as the delimiter?

The literal of a STRUCT field internally uses `,` to separate Fields (for example, `{10, 3.14, "Emily"}`). If the outer column delimiter also uses `,`, it will conflict with the STRUCT internal delimiter and cause parsing errors. It is recommended to use characters such as `|` or `\t` that do not appear inside STRUCT.

### 2. How to insert STRUCT values directly in SQL?

Use the `named_struct` function to explicitly specify the name and value of each Field, for example:

```sql
INSERT INTO struct_test VALUES(1, named_struct('f1', '1', 'f2', '2.0', 'f3', 'abc'));
```

### 3. What forms of NULL are allowed for STRUCT fields?

| Data Form | Meaning |
|----------|------|
| `null` | The entire STRUCT column is NULL |
| `{}` | The STRUCT exists, but all Fields are NULL |
| `{10, null, "Emily"}` | Some Fields are NULL, others are assigned values normally |

### 4. Why does JSON import need to set `strip_outer_array:true`?

When the JSON file wraps multiple records as an array (such as `[ {...}, {...} ]`), `strip_outer_array:true` is needed to make Doris remove the outermost array and parse row by row. Otherwise, the import will treat the entire array as a single record.
