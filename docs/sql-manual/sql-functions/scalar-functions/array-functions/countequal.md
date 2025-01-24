---
{
    "title": "COUNTEQUAL",
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

Determine the number of value elements in the array

## Syntax

```sql
COUNTEQUAL(<arr>, <value>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<arr>` | Input arrayd |
| `<value>` | Judging elements |

## Return Value

The returned judgment results are as follows: num: the number of value in array; 0: value does not exist in array arr; NULL: if the array is NULL.

## Example

```sql
SELECT COUNTEQUAL(NULL,1),COUNTEQUAL([1, 2, 3, 'c'],2),COUNTEQUAL([],'b');
```

```text
+---------------------+---------------------------------------------------+------------------------------------------+
| countequal(NULL, 1) | countequal(['1', '2', '3', 'c'], cast(2 as TEXT)) | countequal(cast([] as ARRAY<TEXT>), 'b') |
+---------------------+---------------------------------------------------+------------------------------------------+
|                NULL |                                                 1 |                                        0 |
+---------------------+---------------------------------------------------+------------------------------------------+
```
