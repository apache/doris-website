---
{
"title": "EXPLODE_JSON_ARRAY_STRING",
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

## 描述

`explode_json_array_string` 表函数，接受一个 JSON 数组，其中每个元素是字符串类型，将该 JSON 数组中的每个字符串展开为多行，每行包含一个字符串。配合 LATERAL VIEW 使用。

`explode_json_array_string_outer` 和 `explode_json_array_string` 类似，对于空值或 NULL 的处理不同。

如果 JSON 字符串本身为 NULL，`OUTER` 版本会返回一行，且该行中的值为 NULL。普通版本会完全忽略这类记录。

如果 JSON 数组为空，`OUTER` 版本会返回一行，且该行的值为 NULL。普通版本则不会返回任何结果。

## 语法

```sql
EXPLODE_JSON_ARRAY_STRING(<json>)
EXPLODE_JSON_ARRAY_STRING_OUTER(<json>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<json>` | json 类型 |

## 返回值

展开 JSON 数组，每个元素生成一行，返回整数列。

## 举例

```sql
CREATE TABLE json_array_example (
    id INT,
    json_array STRING
)DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS AUTO
PROPERTIES (
"replication_allocation" = "tag.location.default: 1");
```

```sql
INSERT INTO json_array_example (id, json_array) VALUES
(1, '[1, 2, 3, 4, 5]'),
(2, '[1.1, 2.2, 3.3, 4.4]'),
(3, '["apple", "banana", "cherry"]'),
(4, '[{"a": 1}, {"b": 2}, {"c": 3}]'),
(5, '[]'),
(6, 'NULL');
```

```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_STRING(json_array) tmp1 AS e1
WHERE id = 3;
```

```text
+------+--------+
| id   | e1     |
+------+--------+
|    3 | apple  |
|    3 | banana |
|    3 | cherry |
+------+--------+
```

```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_STRING(json_array) tmp1 AS e1
WHERE id = 6;
Empty set (0.02 sec)
```

```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_STRING_OUTER(json_array) tmp1 AS e1
WHERE id = 6;
```

```text
+------+------+
| id   | e1   |
+------+------+
|    6 | NULL |
+------+------+
```