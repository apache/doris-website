---
{
"title": "JSON_CONTAINS",
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

用于判断一个 JSON 文档是否包含指定的 JSON 元素。如果指定的元素存在于 JSON 文档中，则返回 1，否则返回 0。如果 JSON 文档或查询的元素无效，则返回 `NULL`。

## 语法

`JSON_CONTAINS(<json_str>,  <candidate> [,  <json_path>])`


## 必选参数

| 参数 | 描述 |
|------|------|
| `<json_str>` | 需要检查的 JSON 字符串。 |
| `<candidate>` | 用于检查是否包含的 JSON 元素。 |

## 可选参数

| 参数 | 描述 |
|------|------|
| `<json_path>` | 可选的 JSON 路径，指定检查的 JSON 子文档。如果不提供，默认为根文档。 |

## 返回值
- 如果 json_elem 存在于 json_doc 中，则返回 1。
- 如果 json_elem 不存在于 json_doc 中，则返回 0。
- 如果任何参数无效或 JSON 文档格式不正确，则返回 NULL。

## 示例

```sql

SET @j = '{"a": 1, "b": 2, "c": {"d": 4}}';
SET @j2 = '1';
SELECT JSON_CONTAINS(@j, @j2, '$.a');

```

```sql

+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.a') |
+-------------------------------+
|                             1 |
+-------------------------------+

```
```sql

SELECT JSON_CONTAINS(@j, @j2, '$.b');
+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.b') |
+-------------------------------+
|                             0 |
+-------------------------------+

```
```sql

SET @j2 = '{"d": 4}';
SELECT JSON_CONTAINS(@j, @j2, '$.a');

```

```sql

+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.a') |
+-------------------------------+
|                             0 |
+-------------------------------+
```

```sql

SELECT JSON_CONTAINS(@j, @j2, '$.c');

```

```sql

+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.c') |
+-------------------------------+
|                             1 |
+-------------------------------+

```

```sql

SELECT json_contains('[1, 2, {"x": 3}]', '1');
+----------------------------------------+
| json_contains('[1, 2, {"x": 3}]', '1') |
+----------------------------------------+
|                                      1 |
+----------------------------------------+

```

