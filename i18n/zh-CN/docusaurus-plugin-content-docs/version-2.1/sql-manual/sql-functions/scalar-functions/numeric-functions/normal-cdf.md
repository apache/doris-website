---
{
    "title": "NORMAL_CDF",
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

计算正态分布在值 `x` 处的累积分布函数 (CDF)。

- 当正态分布的标准差小于等于 `0`，则返回 `NULL`。

## 语法

```sql
NORMAL_CDF(<mean>, <sd>, <x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<mean>` | 正态分布的均值 |
| `<sd>` | 正态分布的标准差 |
| `<x>` | 要评价的值 |

## 返回值

返回某一正态随机变量在值 `x` 处的累积分布函数 (CDF) 值。

- 当正态分布的标准差小于等于 `0`，则返回 `NULL`。

## 举例

```sql
select normal_cdf(10, 9, 10);
```

```text
+-----------------------------------------------------------------------+
| normal_cdf(cast(10 as DOUBLE), cast(9 as DOUBLE), cast(10 as DOUBLE)) |
+-----------------------------------------------------------------------+
|                                                                   0.5 |
+-----------------------------------------------------------------------+
```

```sql
select NORMAL_CDF(10, 0, 10);
```

```text
+-----------------------------------------------------------------------+
| normal_cdf(cast(10 as DOUBLE), cast(0 as DOUBLE), cast(10 as DOUBLE)) |
+-----------------------------------------------------------------------+
|                                                                  NULL |
+-----------------------------------------------------------------------+
```