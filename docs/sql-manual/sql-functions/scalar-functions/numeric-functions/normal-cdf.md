---
{
    "title": "NORMAL_CDF",
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

Computes the Cumulative distribution function (CDF) of the normal distribution at value `x`.

- Returns `NULL` when the standard deviation of the normal distribution is less than or equal to `0`.

## Syntax

```sql
NORMAL_CDF(<mean>, <sd>, <x>)
```

## Parameters  

| Parameter | Description |
| -- | -- |
| `<mean>` | The mean of the normal distribution |
| `<sd>` | The standard deviation of the normal distribution |
| `<x>` | The value to be evaluated |

## Return Value

Return the Cumulative distribution Function (CDF) for a Normal random variable at a value `x`.

- Return `NULL` when standard deviation of the normal distribution is less than or equal to `0`.

## Examples

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
