---
{
    "title": "ARRAY_SHUFFLE",
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

Randomly arrange the elements in an array

## Aliases

- SHUFFLE

## Syntax

```sql
ARRAY_SHUFFLE(<array1>, <seed>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<array1>` | The array to be randomly permuted |
| `<seed>` | An optional parameter that sets the initial value of the pseudo-random number generator used to generate pseudo-random numbers |

## Return Value

Randomize the elements in an array. The parameter array1 is the array to be randomly arranged, and the optional parameter seed is the initial value used by the pseudo-random number generator to generate pseudo-random numbers. shuffle has the same function as array_shuffle.

## Example

```sql
SELECT ARRAY_SHUFFLE([1, 2, 3, 6]),ARRAY_SHUFFLE([1, 4, 3, 5, NULL],1);
```

```text
+-----------------------------+--------------------------------------+
| array_shuffle([1, 2, 3, 6]) | array_shuffle([1, 4, 3, 5, NULL], 1) |
+-----------------------------+--------------------------------------+
| [2, 6, 3, 1]                | [4, 1, 3, 5, null]                   |
+-----------------------------+--------------------------------------+
```
