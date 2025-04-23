---
{
    "title": "STRUCT_ELEMENT",
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

返回 struct 数据列内的某一 field

## 语法

```sql
STRUCT_ELEMENT( <struct>, `<filed_location>/<filed_name>`)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<struct>` | 输入的 struct 列，如果是 null，则返回 null |
| `<filed_location>` | field 的位置，起始位置从 1 开始，仅支持常量 |
| `<filed_name>` | field 的名字，仅支持常量 |

## 返回值

返回指定的 field 列，类型为任意类型

## 举例

```sql
select struct_element(named_struct('f1', 1, 'f2', 'a'), 'f2'),struct_element(named_struct('f1', 1, 'f2', 'a'), 1);
```

```text
+--------------------------------------------------------+-----------------------------------------------------+
| struct_element(named_struct('f1', 1, 'f2', 'a'), 'f2') | struct_element(named_struct('f1', 1, 'f2', 'a'), 1) |
+--------------------------------------------------------+-----------------------------------------------------+
| a                                                      |                                                   1 |
+--------------------------------------------------------+-----------------------------------------------------+
```

```sql
select struct_col, struct_element(struct_col, 'f1') from test_struct;
```

```text
+-------------------------------------------------+-------------------------------------+
| struct_col                                      | struct_element(`struct_col `, 'f1') |
+-------------------------------------------------+-------------------------------------+
| {1, 2, 3, 4, 5}                                 |                                   1 |
| {1, 1000, 10000000, 100000000000, 100000000000} |                                   1 |
| {5, 4, 3, 2, 1}                                 |                                   5 |
| NULL                                            |                                NULL |
| {1, NULL, 3, NULL, 5}                           |                                   1 |
+-------------------------------------------------+-------------------------------------+
```
