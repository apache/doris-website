---
{
    "title": "STRUCT | Complex Types",
    "language": "en",
    "description": "STRUCT<fieldname:fieldtype [COMMENT 'commentstring'], ... > Represents value with structure described by multiple fields,"
}
---

# STRUCT

`STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >` Represents value with structure described by multiple fields, which can be viewed as a collection of multiple columns.

- It cannot be used as a Key column. Now STRUCT can only be used in Duplicate Model Tables.

- The names and number of Fields in a Struct are fixed and always Nullable, and a Field typically consists of the following parts.

  - field_name: Identifier naming the field, non repeatable.
  - field_type: A data type.
  - COMMENT: An optional string describing the field. (currently not supported)

The currently supported types are:

```sql
BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DECIMALV3, DATE,
DATEV2, DATETIME, DATETIMEV2, CHAR, VARCHAR, STRING
```

## CSV format import

### Step 1: Prepare the data

Create the following csv file: `test_struct.csv`
The separator is `|` instead of comma to distinguish it from the comma in struct.

```
1|{10, 3.14, "Emily"}
2|{4, 1.5, null}
3|{7, null, "Benjamin"}
4|{}
5|null
```

### Step 2: Create a table in the database

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

### Step 3: Load data

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_struct" \
        -T "test_struct.csv" \
        http://localhost:8040/api/testdb/struct_test/_stream_load
```

### Step 4: Check the imported data

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

## JSON format import

### Step 1: Prepare the data

Create the following JSON file, `test_struct.json`

```json
[
    {"id":1, "c_struct":{"f1":10, "f2":3.14, "f3":"Emily"}},
    {"id":2, "c_struct":{"f1":4, "f2":1.5, "f3":null}},
    {"id":3, "c_struct":{"f1":7, "f2":null, "f3":"Benjamin"}},
    {"id":4, "c_struct":{}},
    {"id":5, "c_struct":null}
]
```

### Step 2: Create a table in the database

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

### Step 3: Load data

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_struct" \
        -H "strip_outer_array:true" \
        -T "test_struct.json" \
        http://localhost:8040/api/testdb/struct_test/_stream_load
```

### Step 4: Check the imported data

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

