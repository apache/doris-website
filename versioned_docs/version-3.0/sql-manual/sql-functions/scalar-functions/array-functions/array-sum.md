---
{
    "title": "ARRAY_SUM",
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

Calculates the sum of all elements in an array

## Syntax

```sql
ARRAY_SUM(<src>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<src>` | Corresponding array |

## Return Value

Returns the sum of all elements in the array. NULL values in the array will be skipped. For an empty array or an array with all NULL values, the result returns a NULL value.

## Example

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
