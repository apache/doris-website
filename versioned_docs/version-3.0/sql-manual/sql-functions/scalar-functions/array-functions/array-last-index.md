---
{
    "title": "ARRAY_LAST_INDEX",
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

Use an lambda expression as an input parameter to perform corresponding expression calculations on the internal data of other input ARRAY parameters. Returns the last index such that the return value of `lambda(array1[i], ...)` is not 0. Return 0 if such index is not found.

There are one or more parameters input in the lambda expression, and the number of elements of all input arrays must be the same. Legal scalar functions can be executed in lambda, aggregate functions, etc. are not supported.


## Syntax

```sql
ARRAY_LAST_INDEX(<lambda>, <arr> [, ...])
```

## Parameters

| Parameter | Description | 
| --- | --- |
| `<lambda>` | A lambda expression where the input parameters must match the number of columns in the given array. The expression can execute valid scalar functions but does not support aggregate functions. |
| `<arr>` | ARRAY array |

## Return Value

Returns the index of the last non-zero value. If no such index is found, returns 0.

## Example

```sql
select array_last_index(x -> x is null, [null, null, 1, 2]);
```

```text
+------------------------------------------------------------------------+
| array_last_index(array_map([x] -> x IS NULL, ARRAY(NULL, NULL, 1, 2))) |
+------------------------------------------------------------------------+
|                                                                      2 |
+------------------------------------------------------------------------+
```

```sql
select array_last_index(x->x='s', ['a', 's', 's', 's', 'b']);
```

```text
+-----------------------------------------------------------------------------+
| array_last_index(array_map([x] -> x = 's', ARRAY('a', 's', 's', 's', 'b'))) |
+-----------------------------------------------------------------------------+
|                                                                           4 |
+-----------------------------------------------------------------------------+
```

```sql
select array_last_index(x->power(x,2)>10, [1, 4, 3, 4]);
```

```text
+-----------------------------------------------------------------------------+
| array_last_index(array_map([x] -> power(x, 2.0) > 10.0, ARRAY(1, 4, 3, 4))) |
+-----------------------------------------------------------------------------+
|                                                                           4 |
+-----------------------------------------------------------------------------+
```

```sql
select col2, col3, array_last_index((x,y)->x>y, col2, col3) from array_test;
```

```text
+--------------+--------------+---------------------------------------------------------------------+
| col2         | col3         | array_last_index(array_map([x, y] -> x(0) > y(1), `col2`, `col3`)) |
+--------------+--------------+---------------------------------------------------------------------+
| [1, 2, 3]    | [3, 4, 5]    |                                                                   0 |
| [1, NULL, 2] | [NULL, 3, 1] |                                                                   3 |
| [1, 2, 3]    | [9, 8, 7]    |                                                                   0 |
| NULL         | NULL         |                                                                   0 |
+--------------+--------------+---------------------------------------------------------------------+
```