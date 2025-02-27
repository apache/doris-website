---
{
"title": "AVG_WEIGHTED",
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

计算加权算术平均值，即返回结果为：所有对应数值和权重的乘积相累加，除总的权重和。如果所有的权重和等于 0, 将返回 NaN。

## 语法

```sql
AVG_WEIGHTED(<x>, <weight>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 是需要计算平均值的数值表达式，可以是一个列名、常量或复杂的数值表达式 |
| `<weight>` | 是一个数值表达式，通常可以是一个列名、常量或其他数值计算结果 |

## 返回值

所有对应数值和权重的乘积相累加，除总的权重和，如果所有的权重和等于 0, 将返回 NaN。

## 举例

```sql
select k1,k2 from test_doris_avg_weighted;
```

```text
+------+------+
| k1   | k2   |
+------+------+
|   10 |  100 |
|   20 |  200 |
|   30 |  300 |
|   40 |  400 |
+------+------+
```

```sql
select avg_weighted(k2,k1) from test_doris_avg_weighted;
```

```text
+--------------------------------------+
| avg_weighted(k2, cast(k1 as DOUBLE)) |
+--------------------------------------+
|                                  300 |
+--------------------------------------+
```
