---
{
"title": "JSON_LENGTH",
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
`JSON_LENGTH` 函数用于返回给定 JSON 文档的长度或元素个数。如果 JSON 文档是一个数组，则返回数组中元素的个数；如果 JSON 文档是一个对象，则返回对象中键值对的个数。如果 JSON 文档为空或无效，返回 `NULL`。

## 语法

```sql
JSON_LENGTH(<json_str> [ , <json_path>])
```


## 必选参数

| 参数 | 描述 |
|------|------|
| `<json_str>` | 需要检查长度的 JSON 字符串。 |


## 可选参数

| 参数 | 描述 |
|------|------|
| `<json_path>` | 如果指定 path，该 JSON_LENGTH() 函数返回与 JSON 文档中的路径匹配的数据的长度，否则返回 JSON 文档的长度 |

## 注意事项
该函数根据以下规则计算 JSON 文档的长度：
- 标量的长度为 1。例如：'1', '"x"', 'true', 'false', 'null' 的长度均为 1。
- 数组的长度是数组元素的数量。例如：'[1, 2]' 的长度为 2。
- 对象的长度是对象成员的数量。例如：'{"x": 1}' 的长度为 1

## 返回值
- 对于 JSON 数组，返回数组中元素的个数。
- 对于 JSON 对象，返回对象中键值对的个数。
- 对于无效的 JSON 字符串，返回 NULL。
- 对于其他类型（如字符串、数字、布尔值、null 等），返回 NULL。

## 示例

```sql
SELECT json_length('{"k1":"v31","k2":300}');
```
```sql
+--------------------------------------+
| json_length('{"k1":"v31","k2":300}') |
+--------------------------------------+
|                                    2 |
+--------------------------------------+
```

```sql
SELECT json_length('"abc"');
```

```sql
+----------------------+
| json_length('"abc"') |
+----------------------+
|                    1 |
+----------------------+
```

```sql
SELECT json_length('{"x": 1, "y": [1, 2]}', '$.y');
```

```sql
+---------------------------------------------+
| json_length('{"x": 1, "y": [1, 2]}', '$.y') |
+---------------------------------------------+
|                                           2 |
+---------------------------------------------+

```
