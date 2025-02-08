---
{
    "title": "JSON_PARSE_NULLABLE_ERROR_TO_NULL",
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

`JSON_PARSE_NULLABLE_ERROR_TO_NULL` 函数用于解析一个 JSON 字符串为有效的 JSON 对象。如果输入的 JSON 字符串无效，它将返回 `NULL`，而不会抛出错误。如果输入为 `NULL`，则直接返回 `NULL`。

## 语法

```sql
JSON_PARSE_NULLABLE_ERROR_TO_NULL( <str> )
```
## 别名

- JSONB_PARSE_NULLABLE_ERROR_TO_NULL

## 必选参数

| 参数 | 描述 |
|------|------|
| `<str>` | 需要解析的 JSON 格式的输入字符串。 |

## 返回值

如果输入字符串是有效的 JSON，返回对应的 JSON 对象。
如果输入字符串无效或为 NULL，返回 NULL。

## 举例

1. 有效的 JSON 字符串：

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": 30}');

```

```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": 30}') |
+---------------------------------------------------------------+
| {"name": "John", "age": 30}                                    |
+---------------------------------------------------------------+

```
2. 无效的 JSON 字符串：

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": }');

```

```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": }') |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+

```
3. 输入为 NULL：

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_NULL(NULL);

```

```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_NULL(NULL)                        |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+

```