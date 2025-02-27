---
{
    "title": "NAMED_STRUCT",
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

根据给定的字符串和值构造并返回 struct ,注意事项：

- 参数个数必须为非 0 偶数，奇数位是 field 的名字，必须为常量字符串，偶数位是 field 的值，可以是多列或常量

## 语法

```sql
NAMED_STRUCT( <field_name> , <filed_value> [ , <field_name> , <filed_value> ... ] )
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<field_name>` | 构造 struct 的奇数位输入内容，field 的名字 |
| `<filed_value>` | 构造 struct 的偶数位输入内容，field 的值，可以是多列或常量 |

## 返回值

根据给定的字符串和值构造并返回 struct

## 举例

```sql
select named_struct('f1', 1, 'f2', 'a', 'f3', "abc"),named_struct('a', null, 'b', "v");
```

```text
+-----------------------------------------------+-----------------------------------+
| named_struct('f1', 1, 'f2', 'a', 'f3', 'abc') | named_struct('a', NULL, 'b', 'v') |
+-----------------------------------------------+-----------------------------------+
| {"f1":1, "f2":"a", "f3":"abc"}                | {"a":null, "b":"v"}               |
+-----------------------------------------------+-----------------------------------+
```
