---
{
    "title": "ARRAY_LAST",
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

Use a lambda bool expression and an array as the input parameters, the lambda expression is used to evaluate the internal data of other input ARRAY parameters.
Returns the last element in the array for which lambda(arr1[i]) returns something other than 0.

## Syntax

```sql
ARRAY_LAST(<lambda>, <arr>)
```

## Parameters

| Parameter | Description | 
| --- | --- |
| `lambda` | A lambda expression where the input parameters must match the number of columns in the given array. The expression can execute valid scalar functions but does not support aggregate functions. |
| `<arr>` | ARRAY array |

## Return Value

Returns the index of the last non-zero value. If no such index is found, returns NULL.

## Example

```sql
select array_last(x->x>2, [1,2,3,0]) ;
```

```text
+------------------------------------------------------------------------------------------------+
| array_last(array_filter(ARRAY(1, 2, 3, 0), array_map([x] -> x(0) > 2, ARRAY(1, 2, 3, 0))), -1) |
+------------------------------------------------------------------------------------------------+
|                                                                                              3 |
+------------------------------------------------------------------------------------------------+
```

```sql
select array_last(x->x>4, [1,2,3,0]) ; 
```

```text
+------------------------------------------------------------------------------------------------+
| array_last(array_filter(ARRAY(1, 2, 3, 0), array_map([x] -> x(0) > 4, ARRAY(1, 2, 3, 0))), -1) |
+------------------------------------------------------------------------------------------------+
|                                                                                           NULL |
+------------------------------------------------------------------------------------------------+
```

