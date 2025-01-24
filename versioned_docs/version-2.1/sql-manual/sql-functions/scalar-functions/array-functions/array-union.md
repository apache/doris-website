---
{
    "title": "ARRAY_UNION",
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

Merge multiple arrays without duplicate elements to generate a new array

## Syntax

```sql
ARRAY_UNION(<array>[, <array> ])
```

## Parameters

| Parameter | Description |
|--|--|
| `<array>` | The array to be merged |

## Return Value

Returns an array containing all elements in the union of array1 and array2, excluding duplicates. If the input parameter is NULL, it returns NULL.

## Example

```sql
SELECT ARRAY_UNION([1, 2, 3, 6],[1, 2, 5]),ARRAY_UNION([1, 4, 3, 5, NULL],[1,6,10]);
```

```text
+--------------------------------------+---------------------------------------------+
| array_union([1, 2, 3, 6], [1, 2, 5]) | array_union([1, 4, 3, 5, NULL], [1, 6, 10]) |
+--------------------------------------+---------------------------------------------+
| [3, 2, 1, 6, 5]                      | [null, 10, 3, 1, 6, 4, 5]                   |
+--------------------------------------+---------------------------------------------+
```
