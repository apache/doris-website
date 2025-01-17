---
{
    "title": "JSON_SET",
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
`json_set` 函数在 JSON 中插入或更新数据并返回结果。

## 语法
```sql
JSON_SET (<json_str>,  <path>,  <val> [, <path>,  <val>, ...])
```

## 参数
| 参数    | 描述                                                                                                                      |
|-------|-------------------------------------------------------------------------------------------------------------------------|
| `<jsonStr>` | 要插入的 JSON 对象。可以是任意类型元素的 JSON 对象，包括`NULL`，如果没有指定元素，则返回一个空数组。如果 `json_str` 不是有效的 JSON 或任何 `path` 参数不是有效的路径表达式或包含了 * 通配符，则会返回错误 |
| `<jsonPath>` | 要插入的 JSON 路径。如果是 `NULL` ，则返回 NULL                                                                                       |
| `<val>` | 要插入 JSON 的值。如果是 `NULL` ，则会在对应的位置插入 `NULL` 的 value 值。                                                                    |

## 返回值

`json_set` 函数在 JSON 中插入或更新数据并返回结果。如果 `json_str` 或 `path` 为 NULL，则返回 NULL。否则，如果 `json_str` 不是有效的 JSON 或任何 `path` 参数不是有效的路径表达式或包含了 * 通配符，则会返回错误。

路径值对按从左到右的顺序进行评估。

如果 JSON 中已存在某个路径，则路径值对会将现有 JSON 值覆盖为新值。如果 JSON 中不存在该路径，则路径值对会添加该值到 JSON 中，如果路径标识某个类型的值，则：

* 对于现有对象中不存在的成员，会将新成员添加到该对象中并与新值相关联。
* 对于现有数组结束后的位置，该数组将扩展为包含新值。如果现有值不是数组，则自动转换为数组，然后再扩展为包含新值的数组。

否则，对于 JSON 中不存在的某个路径的路径值对将被忽略且不会产生任何影响。

## 示例

```sql
select json_set(null, null, null);
```
```text
+------------------------------+
| json_set(NULL, NULL, 'NULL') |
+------------------------------+
| NULL                         |
+------------------------------+
```
```sql
select json_set('{"k": 1}', "$.k", 2);
``` 
```text
+------------------------------------+
| json_set('{\"k\": 1}', '$.k', '2') |
+------------------------------------+
| {"k":2}                            |
+------------------------------------+
```
```sql
select json_set('{"k": 1}', "$.j", 2);
```
```text
+------------------------------------+
| json_set('{\"k\": 1}', '$.j', '2') |
+------------------------------------+
| {"k":1,"j":2}                      |
+------------------------------------+
```