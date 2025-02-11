---
{
    "title": "JSON_PARSE_NOTNULL_ERROR_TO_VALUE",
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

函数用于解析 JSON 字符串。如果 JSON 字符串格式无效或发生解析错误，函数会返回用户指定的默认值，而不是返回无效的 JSON 对象。该函数的主要作用是提供一个默认值，用于替代解析错误时的无效结果，确保查询返回合理的值。

## 语法

```sql
JSON_PARSE_NOTNULL_ERROR_TO_VALUE(< str >, <default_value>)
``` 

## 别名

- JSONB_PARSE_NOTNULL_ERROR_TO_VALUE

## 必选参数

| 参数 | 描述 |
|------|------|
| `<str>` | 需要解析的 JSON 字符串。该参数应为一个有效的 JSON 字符串。如果 JSON 格式无效，函数会返回 default_value。 |
| `<default_value>` | 解析错误时返回的默认值。该参数可以是任意类型，用于替代无效的 JSON 格式数据。 |


## 返回值

返回一个 JSON 对象。如果输入的 JSON 字符串有效，返回解析后的 JSON 对象；如果无效，返回用户指定的 default_value。


## 示例

```sql
SELECT JSON_PARSE_NOTNULL_ERROR_TO_VALUE('{"name": "Alice", "age": 30}', '{"name": "Unknown", "age": 0}') AS parsed_json;

```
```sql
+-------------------------------------------+
| parsed_json                              |
+-------------------------------------------+
| {"name":"Alice","age":30}                |
+-------------------------------------------+

```