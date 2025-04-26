---
{
    "title": "ARRAY_SUM",
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

计算数组中所有元素之和

## 语法

```sql
ARRAY_SUM(<src>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<src>` | 对应数组 |

## 返回值

返回数组中所有元素之和，数组中的 NULL 值会被跳过。空数组以及元素全为 NULL 值的数组，结果返回 NULL 值。

## 举例

```sql
SELECT ARRAY_SUM([1, 2, 3, 6]),ARRAY_SUM([1, 4, 3, 5, NULL]),ARRAY_SUM([NULL]);
```

```text
+-------------------------+-------------------------------+-------------------------------------------+
| array_sum([1, 2, 3, 6]) | array_sum([1, 4, 3, 5, NULL]) | array_sum(cast([NULL] as ARRAY<BOOLEAN>)) |
+-------------------------+-------------------------------+-------------------------------------------+
|                      12 |                            13 |                                      NULL |
+-------------------------+-------------------------------+-------------------------------------------+
```
