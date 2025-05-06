---
{
    "title": "COSINE_DISTANCE",
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

Calculates the cosine distance between two vectors (vector values are coordinates)

## Syntax

```sql
COSINE_DISTANCE(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<array1>` | The first vector (the vector value is the coordinate). The subtypes of the input array are: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE. The number of elements must be consistent with array2 |
| `<array2>` | The second vector (the vector value is the coordinate), the subtype of the input array supports: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, the number of elements must be consistent with array1 |

## Return Value

Returns the cosine distance between two vectors (where the vector values are coordinates). If the input array is NULL, or any element in the array is NULL, then NULL is returned.

## Example

```sql
SELECT COSINE_DISTANCE([1, 2], [2, 3]),COSINE_DISTANCE([3, 6], [4, 7]);
```

```text
+---------------------------------+---------------------------------+
| cosine_distance([1, 2], [2, 3]) | cosine_distance([3, 6], [4, 7]) |
+---------------------------------+---------------------------------+
|            0.007722123286332261 |           0.0015396467945875125 |
+---------------------------------+---------------------------------+
```
