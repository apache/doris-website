---
{
    "title": "JSON_EXISTS_PATH",
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

用来判断 `json_path` 指定的字段在 JSON 数据中是否存在，如果存在返回 TRUE，不存在返回 FALSE

## 语法

```sql
JSON_EXISTS_PATH (<json_str>,  <path>)
```

## 别名

* JSONB_EXISTS_PATH

## 参数
| 参数           | 描述                                                     |
|--------------|--------------------------------------------------------|
| `<json_str>` | 要包含在 JSON 数组中的元素。可以是任意类型的值，包括`NULL`。如果没有指定元素，则返回一个空数组。 
| `<path>`     | 要插入的 JSON 路径。如果是 `NULL` ，则返回 NULL                      |

## 返回值
如果存在返回 TRUE，不存在返回 FALSE

## 举例

```sql
SELECT JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.name');
```
```text
+---------------------------------------------------------------------------+
| jsonb_exists_path(cast('{"id": 123, "name": "doris"}' as JSON), '$.name') |
+---------------------------------------------------------------------------+
|                                                                         1 |
+---------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.age');
```
```text
+--------------------------------------------------------------------------+
| jsonb_exists_path(cast('{"id": 123, "name": "doris"}' as JSON), '$.age') |
+--------------------------------------------------------------------------+
|                                                                        0 |
+--------------------------------------------------------------------------+
```
```sql
SELECT JSONB_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.age');
```
```text
+--------------------------------------------------------------------------+
| jsonb_exists_path(cast('{"id": 123, "name": "doris"}' as JSON), '$.age') |
+--------------------------------------------------------------------------+
|                                                                        0 |
+--------------------------------------------------------------------------+
```

