---
{
    "title": "JSON_KEYS",
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
用于从 JSON 对象的顶级值中返回键。这些键作为数组返回，或者如果给定了路径参数，则返回所选路径的顶级键。您需要将 JSON 文档作为函数的参数提供。您还可以（可选地）提供第二个参数，以指定 JSON 文档中“顶级”路径从何处开始。
其中，json_doc 是 JSON 文档，path 是一个可选参数，用于确定 JSON 文档中“顶级”路径从何处开始。

## 语法

`JSON_KEYS(<str> [, <path>])`

## 别名

- JSONB_KEYS

## 必选参数

| 参数 | 描述 |
|------|------|
| `<str>` | 需要提取键的 JSON 字符串。 |


## 可选参数

| 参数 | 描述 |
|------|------|
| `<path>` | 可选的 JSON 路径，指定检查的 JSON 子文档。如果不提供，默认为根文档。 |

## 返回值

- 返回 JSON 文档的键名列表（一个 JSON 数组）。
- 如果 str 不是一个有效的 JSON 对象，返回 NULL。
- 如果 JSON 对象没有键，返回一个空数组。

## 注意事项

- 如果所选对象为空，则结果数组为空。如果顶级值包含嵌套的子对象，返回值不包括这些子对象的键。

## 示例

```sql

SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}');

```

```sql

+-----------------------------------------------------+
| json_keys(cast('{"a": 1, "b": {"c": 30}}' as JSON)) |
+-----------------------------------------------------+
| ["a", "b"]                                          |
+-----------------------------------------------------+

```

```sql

SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}', '$.b');

```

```sql
+------------------------------------------------------------+
| json_keys(cast('{"a": 1, "b": {"c": 30}}' as JSON), '$.b') |
+------------------------------------------------------------+
| ["c"]                                                      |
+------------------------------------------------------------+
```

```sql

SELECT JSON_KEYS('{}');

```

```sql

+-------------------------------+
| json_keys(cast('{}' as JSON)) |
+-------------------------------+
| []                            |
+-------------------------------+

```

```sql

SELECT JSON_KEYS('[1,2]');

```

```sql

+----------------------------------+
| json_keys(cast('[1,2]' as JSON)) |
+----------------------------------+
| NULL                             |
+----------------------------------+

```

```sql

 SELECT JSON_KEYS('[]');

 ```

 ```sql

+-------------------------------+
| json_keys(cast('[]' as JSON)) |
+-------------------------------+
| NULL                          |
+-------------------------------+

```


