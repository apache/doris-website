---
{
    "title": "ARRAY_SLICE",
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

Specify the starting position and length to extract a portion of elements from an array to form a new sub-array

## Syntax

```sql
ARRAY_SLICE(<arr>, <off>, <len>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<arr>` | Corresponding array |
| `<off>` | Starting position. If off is a positive number, it indicates the offset from the left. If off is a negative number, it indicates the offset from the right. When the specified off is not within the actual range of the array, an empty array is returned. |
| `<len>` | If len is a negative number, it means the length is 0.|

## Return Value

Returns a subarray containing all elements of the specified length starting from the specified position. If the input parameter is NULL, it returns NULL.

## Example

```sql
SELECT ARRAY_SLICE([1, 2, 3, 6],2,3),ARRAY_SLICE([1, 4, 3, 5, NULL],-2,1),ARRAY_SLICE([1, 3, 5],0);
```

```text
+---------------------------------+----------------------------------------+---------------------------+
| array_slice([1, 2, 3, 6], 2, 3) | array_slice([1, 4, 3, 5, NULL], -2, 1) | array_slice([1, 3, 5], 0) |
+---------------------------------+----------------------------------------+---------------------------+
| [2, 3, 6]                       | [5]                                    | []                        |
+---------------------------------+----------------------------------------+---------------------------+
```
