---
{
"title": "GROUP_BIT_AND",
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

对单个整数列或表达式中的所有值执行按位 and 运算

## 语法

```sql
GROUP_BIT_AND(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 支持所有 INT 类型 |

## 返回值

返回一个整数值

## 举例

```sql
select * from group_bit;
```

```text
+-------+
| value |
+-------+
|     3 |
|     1 |
|     2 |
|     4 |
+-------+
```

```sql
select group_bit_and(value) from group_bit;
```

```text
+------------------------+
| group_bit_and(`value`) |
+------------------------+
|                      0 |
+------------------------+
```

