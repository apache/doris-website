---
{
    "title": "JSON",
    "language": "zh-CN",
    "description": "JSON 数据类型，用二进制格式高效存储 JSON 数据，通过 JSON 函数访问其内部字段。"
}
---

`JSON` 数据类型，用二进制格式高效存储 JSON 数据，通过 JSON 函数访问其内部字段。

默认支持 1048576 字节（1 MB），可调大到 2147483643 字节（2 GB），可通过 BE 配置`string_type_length_soft_limit_bytes` 调整。

与普通 String 类型存储的 JSON 字符串相比，JSON 类型有两点优势

1. 数据写入时进行 JSON 格式校验
2. 二进制存储格式更加高效，通过 json_extract 等函数可以高效访问 JSON 内部字段，比 get_json_xx 函数快几倍

:::caution[注意]
在 1.2.x 版本中，JSON 类型的名字是 JSONB，为了尽量跟 MySQL 兼容，从 2.0.0 版本开始改名为 JSON，老的表仍然可以使用。
:::

## CSV 格式导入

### 第 1 步：准备数据

创建如下的 csv 文件：`test_json.csv`
其中分隔符使用 `|` 而不是逗号，以便和 json 中的逗号区分。

```
1|{"name": "tom", "age": 35}
2|{"name": null, "age": 28}
3|{"name": "micheal", "age": null}
4|{"name": null, "age": null}
5|null
```

### 第 2 步：在数据库中建表

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

### 第 3 步：导入数据

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_json" \
        -T "test_json.csv" \
        http://localhost:8040/api/testdb/json_test/_stream_load
```

### 第 4 步：检查导入数据

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

## JSON 格式导入

### 第 1 步：准备数据

创建如下的 JSON 文件，`test_json.json`

```json
[
    {"id": 1, "c_json": {"name": "tom", "age": 35}},
    {"id": 2, "c_json": {"name": null, "age": 28}},
    {"id": 3, "c_json": {"name": "micheal", "age": null}},
    {"id": 4, "c_json": {"name": null, "age": null}},
    {"id": 5, "c_json": null}
]
```

### 第 2 步：在数据库中建表

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

### 第 3 步：导入数据

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_json" \
        -H "strip_outer_array:true" \
        -T "test_json.json" \
        http://localhost:8040/api/testdb/json_test/_stream_load
```

### 第 4 步：检查导入数据

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
