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

## Json_keys
### Description
#### Syntax

`ARRAY<STRING> json_keys(JSON, [VARCHAR path])`

JSON_KEYS() 函数用于从 JSON 对象的顶级值中返回键。这些键作为数组返回，或者如果给定了路径参数，则返回所选路径的顶级键。您需要将 JSON 文档作为函数的参数提供。您还可以（可选地）提供第二个参数，以指定 JSON 文档中“顶级”路径从何处开始。
其中，json_doc 是 JSON 文档，path 是一个可选参数，用于确定 JSON 文档中“顶级”路径从何处开始。

> 注意:
>
> 如果所选对象为空，则结果数组为空。如果顶级值包含嵌套的子对象，返回值不包括这些子对象的键。

### Example

```sql

mysql> SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}');
+-----------------------------------------------------+
| json_keys(cast('{"a": 1, "b": {"c": 30}}' as JSON)) |
+-----------------------------------------------------+
| ["a", "b"]                                          |
+-----------------------------------------------------+
1 row in set (0.35 sec)

mysql> SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}', '$.b');
+------------------------------------------------------------+
| json_keys(cast('{"a": 1, "b": {"c": 30}}' as JSON), '$.b') |
+------------------------------------------------------------+
| ["c"]                                                      |
+------------------------------------------------------------+
1 row in set (0.07 sec)

mysql> SELECT JSON_KEYS('{}');
+-------------------------------+
| json_keys(cast('{}' as JSON)) |
+-------------------------------+
| []                            |
+-------------------------------+
1 row in set (0.07 sec)

mysql> SELECT JSON_KEYS('[1,2]');
+----------------------------------+
| json_keys(cast('[1,2]' as JSON)) |
+----------------------------------+
| NULL                             |
+----------------------------------+
1 row in set (0.07 sec)

mysql> SELECT JSON_KEYS('[]');
+-------------------------------+
| json_keys(cast('[]' as JSON)) |
+-------------------------------+
| NULL                          |
+-------------------------------+
1 row in set (0.07 sec)
```
### Keywords
json,json_keys
