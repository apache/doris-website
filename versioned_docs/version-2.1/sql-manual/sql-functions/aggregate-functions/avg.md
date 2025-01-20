---
{
    "title": "AVG",
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

Calculates the average of all non-NULL values in a specified column or expression.

## Syntax

`AVG([DISTINCT] expr)`

## Parameters

| Parameter | Description |
| -- | -- |
| `expr` | It is an expression or column, typically a numeric column or an expression that can be converted to a numeric value. |
| `DISTINCT` | It is an optional keyword that indicates the calculation of the average value after removing duplicate values from expr. |

## Return Value

Returns the average value of the selected column or expression. If all records in the group are NULL, the function returns NULL.

## example

```sql
SELECT datetime, AVG(cost_time) FROM log_statis group by datetime;
```

```text
+---------------------+--------------------+
| datetime            | avg(`cost_time`)   |
+---------------------+--------------------+
| 2019-07-03 21:01:20 | 25.827794561933533 |
+---------------------+--------------------+
```

```sql
SELECT datetime, AVG(distinct cost_time) FROM log_statis group by datetime;
```

```text
+---------------------+---------------------------+
| datetime            | avg(DISTINCT `cost_time`) |
+---------------------+---------------------------+
| 2019-07-04 02:23:24 |        20.666666666666668 |
+---------------------+---------------------------+
```


