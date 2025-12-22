---
{
    "title": "ARRAY",
    "language": "zh-CN",
    "description": "ARRAY<T> 表示由 T 类型元素组成的数组。点击 ARRAY 数据类型 了解具体信息。"
}
---

`ARRAY<T>` 表示由 T 类型元素组成的数组。点击 [ARRAY 数据类型](../../../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY.md) 了解具体信息。

## CSV 格式导入

### 第 1 步：准备数据

创建如下的 csv 文件：`test_array.csv`
其中分隔符使用 `|` 而不是逗号，以便和 array 中的逗号区分。

```
1|[1,2,3,4,5]
2|[6,7,8]
3|[]
4|null
```

### 第 2 步：在数据库中建表

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

### 第 3 步：导入数据

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_array" \
        -T "test_array.csv" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### 第 4 步：检查导入数据

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

## JSON 格式导入

### 第 1 步：准备数据

创建如下的 JSON 文件，`test_array.json`

```json
[
    {"id":1, "c_array":[1,2,3,4,5]},
    {"id":2, "c_array":[6,7,8]},
    {"id":3, "c_array":[]},
    {"id":4, "c_array":null}
]
```

### 第 2 步：在数据库中建表

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

### 第 3 步：导入数据

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_array" \
        -H "strip_outer_array:true" \
        -T "test_array.json" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### 第 4 步：检查导入数据

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
