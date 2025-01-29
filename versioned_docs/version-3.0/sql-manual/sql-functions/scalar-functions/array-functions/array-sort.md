---
{
    "title": "ARRAY_SORT",
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

Sort the elements in an array in ascending order

## Syntax

```sql
ARRAY_SORT(<arr>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<arr>` | Corresponding array |

## Return Value

Returns an array sorted in ascending order. If the input array is NULL, it returns NULL. If the array elements contain NULL, the output sorted array will put NULL first.

## Example

```sql
SELECT ARRAY_SORT([1, 2, 3, 6]),ARRAY_SORT([1, 4, 3, 5, NULL]),ARRAY_SORT([NULL]);
```

```text
+--------------------------+--------------------------------+--------------------+
| array_sort([1, 2, 3, 6]) | array_sort([1, 4, 3, 5, NULL]) | array_sort([NULL]) |
+--------------------------+--------------------------------+--------------------+
| [1, 2, 3, 6]             | [null, 1, 3, 4, 5]             | [null]             |
+--------------------------+--------------------------------+--------------------+
```
