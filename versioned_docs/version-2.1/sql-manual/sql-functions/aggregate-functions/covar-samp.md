---
{
"title": "COVAR_SAMP",
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

Computes the sample covariance between two numeric variables.

## Syntax

```sql
COVAR_SAMP(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | Numeric expression or column |
| `<expr2>` | Numeric expression or column |

## Return Value

Returns the sample covariance of expr1 and expr2, special case:

- If a column of expr1 or expr2 is NULL, the row data will not be counted in the final result.

## Example

```
select covar_samp(x,y) from baseall;
```

```text
+---------------------+
| covar_samp(x, y)    |
+---------------------+
| 0.89442719099991586 |
+---------------------+
```
