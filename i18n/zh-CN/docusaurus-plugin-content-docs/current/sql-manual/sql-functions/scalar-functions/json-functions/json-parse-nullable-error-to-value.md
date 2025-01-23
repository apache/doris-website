---
{
    "title": "JSON_PARSE_NULLABLE_ERROR_TO_VALUE",
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

`JSON_PARSE_NULLABLE_ERROR_TO_VALUE` 函数用于解析一个 JSON 字符串为有效的 JSON 对象。如果输入的 JSON 字符串无效，它将返回用户指定的默认值，而不是抛出错误。如果输入为 `NULL`，则返回默认值。

## 语法

```sql
JSON_PARSE_NULLABLE_ERROR_TO_VALUE( <str> , <default_value>)
```
## 别名

- JSONB_PARSE_NULLABLE_ERROR_TO_VALUE

## 必选参数

| 参数 | 描述 |
|------|------|
| `<str>` | 需要解析的 JSON 格式的输入字符串。 |
| `<default_value>` | 解析失败时返回的默认值。 |

## 返回值
如果输入字符串是有效的 JSON，返回对应的 JSON 对象。
如果输入字符串无效或为 NULL，返回 default_value 参数指定的默认值。

## 举例
1. 有效的 JSON 字符串：
```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": 30}', 'default');


```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": 30}', 'default') |
+---------------------------------------------------------------+
| {"name": "John", "age": 30}                                    |
+---------------------------------------------------------------+


```
2. 无效的 JSON 字符串：
```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": }', 'default');


```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": }', 'default') |
+---------------------------------------------------------------+
| default                                                       |
+---------------------------------------------------------------+

```
3. 输入为 NULL：
```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE(NULL, 'default');


```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE(NULL, 'default')           |
+---------------------------------------------------------------+
| default                                                       |
+---------------------------------------------------------------+

```