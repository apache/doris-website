---
{
    "title": "JSON_PARSE_NOTNULL_ERROR_TO_INVALID",
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

用于解析 JSON 字符串。如果 JSON 字符串格式无效或发生解析错误，函数会返回一个无效的 JSON 对象（通常是 `{}`）。该函数的主要作用是确保在出现 JSON 格式错误时，返回一个安全的默认值，避免由于解析错误导致的查询失败。

## 语法

```sql
JSON_PARSE_NOTNULL_ERROR_TO_INVALID( <str> )
```

## 别名

- JSONB_PARSE_NOTNULL_ERROR_TO_INVALID

## 必选参数

| 参数 | 描述 |
|------|------|
| `<str>` | 需要解析的 JSON 字符串。该参数应该是一个有效的字符串类型，包含 JSON 格式的数据。如果 JSON 格式无效，函数会返回一个无效的 JSON 对象。 |


## 返回值

返回一个无效的 JSON 对象（通常是 `{}`）


## 示例

```sql
SELECT JSON_PARSE_NOTNULL_ERROR_TO_INVALID('{"name": "Alice", "age": 30}') AS parsed_json;
```
```sql
+---------------------------+
| parsed_json               |
+---------------------------+
| {"name":"Alice","age":30} |
+---------------------------+

```