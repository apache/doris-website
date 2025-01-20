---
{
"title": "AVG_WEIGHTED",
"language": "en"
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

## Description

Calculates the weighted arithmetic mean, i.e., the result is the sum of the products of corresponding values and weights, divided by the total sum of weights. If the total sum of weights is 0, it will return NaN.

## Syntax

` double avg_weighted(x, weight)`

## Parameters

| Parameter | Description |
| -- | -- |
| `x` | It is the numeric expression for which the average needs to be calculated, and can be a column name, constant, or a complex numeric expression. |
| `expr` | It is a numeric expression, typically a column name, constant, or the result of another numeric calculation. |

## Return Value

The sum of the products of corresponding values and weights is accumulated, divided by the total sum of weights. If the total sum of weights equals 0, NaN will be returned.

## example

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
