---
{
    "title": "ARRAY_REDUCE",
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

Reduce array to get a value

## Syntax

```sql
ARRAY_REDUCE(lambda, <arr>, <val>)
```

## Parameters
| Parameter | Description |
|---|---|
| `lambda` | A lambda expression with two input parameters. The lambda can execute valid scalar functions but does not support aggregate functions. |
| `<arr>` | ARRAY array |
| `<val>` | Initial value of reduce. Constant values and columns from tables are supported. |

## Return Value

The reduced value of array.

## Example

```sql
select array_reduce((s,x)->s+x, [1, 2, 3, 4, 5], 0);
```
```text
+---------------------------------------------------+
| array_reduce((s,x)->s+x, ARRAY(1, 2, 3, 4, 5), 0) |
+---------------------------------------------------+
| 15                                                |
+---------------------------------------------------+
```
```sql
select array_reduce((s,x)->s-x, [1, 2, 3, 4, 5], 0);
```
```text
+---------------------------------------------+
| array_reduce((s,x)->s-x, ARRAY(1, 2, 3), 0) |
+---------------------------------------------+
| -6                                          |
+---------------------------------------------+
```