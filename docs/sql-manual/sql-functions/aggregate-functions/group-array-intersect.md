---
{
    "title": "GROUP_ARRAY_INTERSECT",
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

## description

Calculate the intersection elements of the input array across all rows and return a new array.

## Syntax

`GROUP_ARRAY_INTERSECT(expr)`

## Parameters

| Parameter | Description |
| -- | -- |
| `expr` | Array columns or array values that require intersection |

## Return Value

Returns an array containing the intersection results

## example

```sql
select c_array_string from group_array_intersect_test where id in (18, 20);
```

```text
+------+---------------------------+
| id   | col                       |
+------+---------------------------+
|    1 | ["a", "b", "c", "d", "e"] |
|    2 | ["a", "b"]                |
|    3 | ["a", null]               |
+------+---------------------------+
```

```sql
select group_array_intersect(col) from group_array_intersect_test;
```

```text
+----------------------------+
| group_array_intersect(col) |
+----------------------------+
| ["a"]                      |
+----------------------------+
```

