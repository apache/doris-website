---
{
    "title": "JSON",
    "language": "en"
}
---

The JSON data type stores JSON data efficiently in a binary format and allows access to its internal fields through JSON functions.

By default, it supports up to 1048576 bytes (1MB), and can be increased up to 2147483643 bytes (2GB). This can be adjusted via the string_type_length_soft_limit_bytes configuration.

Compared to storing JSON strings in a regular STRING type, the JSON type has two main advantages:

JSON format validation during data insertion.
More efficient binary storage format, enabling faster access to JSON internal fields using functions like json_extract, compared to get_json_xx functions.
Note: In version 1.2.x, the JSON type was named JSONB. To maintain compatibility with MySQL, it was renamed to JSON starting from version 2.0.0. Older tables can still use the previous name.

## CSV format import

### Step 1: Prepare the data

Create the following csv file: `test_json.csv`
The separator is `|` instead of comma to distinguish it from the comma in json.

```
1|{"name": "tom", "age": 35}
2|{"name": null, "age": 28}
3|{"name": "michael", "age": null}
4|{"name": null, "age": null}
5|null
```

### Step 2: Create a table in the database

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

### Step 3: Load data

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_json" \
        -T "test_json.csv" \
        http://localhost:8040/api/testdb/json_test/_stream_load
```

### Step 4: Check the imported data

```sql
SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"michael","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | null                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```

## JSON format import

### Step 1: Prepare the data

Create the following JSON file, `test_json.json`

```json
[
    {"id": 1, "c_json": {"name": "tom", "age": 35}},
    {"id": 2, "c_json": {"name": null, "age": 28}},
    {"id": 3, "c_json": {"name": "michael", "age": null}},
    {"id": 4, "c_json": {"name": null, "age": null}},
    {"id": 5, "c_json": null}
]
```

### Step 2: Create a table in the database

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

### Step 3: Load data

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_json" \
        -H "strip_outer_array:true" \
        -T "test_json.json" \
        http://localhost:8040/api/testdb/json_test/_stream_load
```

### Step 4: Check the imported data

```sql
mysql> SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"michael","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | NULL                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```
