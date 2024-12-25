---
{
    "title": "MAP",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

`MAP<K, V>` 表示由K, V类型元素组成的 map，不能作为 key 列使用。

- 目前支持在 Duplicate，Unique 模型的表中使用。

K, V 支持的类型有：

```sql
BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DECIMALV3,
DATE, DATEV2, DATETIME, DATETIMEV2, CHAR, VARCHAR, STRING
```

## CSV格式导入

### 第 1 步：准备数据

创建如下的 csv 文件：`test_map.csv`
其中分隔符使用 `|` 而不是逗号，以便和 map 中的逗号区分。

```
1|{"Emily":101,"age":25}
2|{"Benjamin":102}
3|{}
4|null
```

### 第 2 步：在数据库中建表

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

### 第 3 步：导入数据

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_map" \
        -T "test_map.csv" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```

### 第 4 步：检查导入数据

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

## JSON格式导入

### 第 1 步：准备数据

创建如下的 JSON 文件，`test_map.json`

```json
[
    {"id":1, "c_map":{"Emily":101, "age":25}},
    {"id":2, "c_map":{"Benjamin":102}},
    {"id":3, "c_map":{}},
    {"id":4, "c_map":null}
]
```

### 第 2 步：在数据库中建表

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

### 第 3 步：导入数据

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_map" \
        -H "strip_outer_array:true" \
        -T "test_map.json" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```

### 第 4 步：检查导入数据

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
