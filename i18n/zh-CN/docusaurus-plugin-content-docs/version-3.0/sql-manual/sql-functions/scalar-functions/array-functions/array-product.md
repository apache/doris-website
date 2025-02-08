---
{
    "title": "ARRAY_PRODUCT",
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

计算数组中所有元素的乘积

## 语法

```sql
ARRAY_PRODUCT(<arr>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<arr>` | 对应数组 |

## 返回值

返回数组中所有元素的乘积，数组中的NULL值会被跳过。空数组以及元素全为NULL值的数组，结果返回NULL值。

## 举例

```sql
SELECT ARRAY_PRODUCT([1, 2, 3]),ARRAY_PRODUCT([1, NULL, 3]),ARRAY_PRODUCT([NULL]);
```

```text
+--------------------------+-----------------------------+----------------------------------------------+
| array_product([1, 2, 3]) | array_product([1, NULL, 3]) | array_product(cast([NULL] as ARRAY<DOUBLE>)) |
+--------------------------+-----------------------------+----------------------------------------------+
|                        6 |                           3 |                                         NULL |
+--------------------------+-----------------------------+----------------------------------------------+
```
