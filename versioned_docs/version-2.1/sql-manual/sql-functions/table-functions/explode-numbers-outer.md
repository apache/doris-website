---
{
    "title": "EXPLODE_NUMBERS_OUTER",
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

The `explode_numbers_outer` table function takes an integer n and expands all numbers within the range into multiple rows, each containing a single number. It is commonly used to generate a sequence of consecutive numbers and is often paired with LATERAL VIEW. Unlike `explode_numbers`, it adds a row with NULL when the function generates 0 rows.

## Syntax

`explode_numbers_outer(<n>)`


## Parameters

| Parameter | Description |
| -- | -- |
| `<n>` | Integer type input |

## Return Value

Returns a sequence of [0, n).

- Returns NULL when n is 0 or NULL.

## Examples

```
mysql> select e1 from (select 1 k1) as t lateral view explode_numbers(0) tmp1 as e1;
Empty set

mysql> select e1 from (select 1 k1) as t lateral view explode_numbers_outer(0) tmp1 as e1;
+------+
| e1   |
+------+
| NULL |
+------+
```
### keywords
explode,numbers,explode_numbers