---
{
    "title": "ARRAY | Complex Types",
    "language": "en",
    "description": "ARRAY<T> An array of T-type items, it cannot be used as a key column.",
    "sidebar_label": "ARRAY"
}
---

# ARRAY

`ARRAY<T>` An array of T-type items, it cannot be used as a key column.

- Before version 2.0, it was only supported in the Duplicate model table.
- Starting from version 2.0, it is supported in the non-key columns of the Unique model table.

T-type could be any of:

```sql
BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE,
DATEV2, DATETIME, DATETIMEV2, CHAR, VARCHAR, STRING
```

## CSV format import

### Step 1: Prepare the data

Create the following csv file: `test_array.csv`
The separator is `|` instead of comma to distinguish it from the comma in array.

```
1|[1,2,3,4,5]
2|[6,7,8]
3|[]
4|null
```

### Step 2: Create a table in the database

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

### Step 3: Load data

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

## JSON format import

### Step 1: Prepare the data

Create the following JSON file, `test_array.json`

```json
[
    {"id":1, "c_array":[1,2,3,4,5]},
    {"id":2, "c_array":[6,7,8]},
    {"id":3, "c_array":[]},
    {"id":4, "c_array":null}
]
```

### Step 2: Create a table in the database

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

### Step 3: Load data

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

