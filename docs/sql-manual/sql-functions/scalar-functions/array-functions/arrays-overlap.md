---
{
    "title": "ARRAYS_OVERLAP",
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

Determine whether the left and right arrays contain common elements

## Syntax

```sql
ARRAYS_OVERLAP(<left>, <right>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<left>` | The array to be judged |
| `<right>` | The array to be judged |

## Return Value

Returns if left and right have any non-null elements in common. Returns null if there are no non-null elements in common but either array contains null.

## Example

```
select arrays_overlap([1, 2, 3], [1, null]);
+--------------------------------------+
| arrays_overlap([1, 2, 3], [1, null]) |
+--------------------------------------+
|                                    1 |
+--------------------------------------+


select arrays_overlap([2, 3], [1, null]);
+-----------------------------------+
| arrays_overlap([2, 3], [1, null]) |
+-----------------------------------+
|                              NULL |
+-----------------------------------+

select arrays_overlap([2, 3], [1]);
+-----------------------------+
+-----------------------------+
| arrays_overlap([2, 3], [1]) |
+-----------------------------+
|                           0 |
+-----------------------------+
```
