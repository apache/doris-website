---
{
    "title": "json_search",
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

`JSON_SEARCH` 函数用于在 JSON 文档中查找指定的值。如果找到该值，则返回值的路径。如果没有找到该值，则返回 `NULL`。该函数可以在 JSON 数据结构中递归查找。


## 语法

```sql
JSON_SEARCH(<str>, <one_or_all>, <search_value> [, <start_path> [, <escape_char>]])
```
## 必选参数

| 参数 | 描述 |
|------|------|
| `<str>` | 需要搜索的 JSON 文档（可以是 JSON 字符串或 JSON 对象）。 |
| `<one_or_all>` | 指定是否查找所有匹配的值。可以取值 'one' 或 'all'。 |
| `<search_value>` | 需要查找的值，搜索目标。 |


## 可选参数

| 参数 | 描述 |
|------|------|
| `<start_path>` | 指定开始搜索的路径。如果没有提供，则从整个 JSON 文档开始搜索。 |
| `<escape_char>` | 指定用于转义路径中的特殊字符。 |

## 返回值

如果找到匹配的值，返回一个 JSON 路径（字符串类型），指向匹配的值。
如果没有找到匹配的值，返回 NULL。

## 注意事项
`one_or_all` 参数决定了是否查找所有匹配的值。'one' 会返回第一个匹配的路径，'all' 会返回所有匹配的路径。
如果没有找到匹配值，函数会返回 NULL。
使用 `start_path` 参数可以限制搜索的范围，使得查询更加高效。

## 示例

1. 查找一个值（one）：
```sql
SELECT JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'John');

```
```sql
+-----------------------------------------------+
| JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'John') |
+-----------------------------------------------+
| $.name                                         |
+-----------------------------------------------+

```
2. 查找多个匹配值（all）：

```sql
SELECT JSON_SEARCH('{"person": {"name": "John", "age": 30}, "name": "John"}', 'all', 'John');


```
```sql
+---------------------------------------------------------------+
| JSON_SEARCH('{"person": {"name": "John", "age": 30}, "name": "John"}', 'all', 'John') |
+---------------------------------------------------------------+
| $.name                                                       |
| $.person.name                                                |
+---------------------------------------------------------------+
```
3. 没有找到匹配值：

```sql
SELECT JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'Alice');

```
```sql
+-----------------------------------------------+
| JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'Alice') |
+-----------------------------------------------+
| NULL                                          |
+-----------------------------------------------+

```

4. 指定搜索起始路径：

```sql
SELECT JSON_SEARCH('{"person": {"name": "John", "age": 30}}', 'one', 'John', '$.person');

```
```sql
+---------------------------------------------------------------+
| JSON_SEARCH('{"person": {"name": "John", "age": 30}}', 'one', 'John', '$.person') |
+---------------------------------------------------------------+
| $.name                                                         |
+---------------------------------------------------------------+


```