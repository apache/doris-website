---
{
    "title": "MIN_BY",
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

The MIN_BY function is used to return the corresponding associated value based on the minimum value of the specified column.

## Syntax

```sql
MIN_BY(<expr1>, <expr2>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr1>` | The expression used to specify the corresponding association. |
| `<expr2>` | The expression used to specify the minimum value for statistics. |

## Return Value

Returns the same data type as the input expression <expr1>.

## Example

```sql
select * from tbl;
```

```text
+------+------+------+------+
| k1   | k2   | k3   | k4   |
+------+------+------+------+
|    0 | 3    | 2    |  100 |
|    1 | 2    | 3    |    4 |
|    4 | 3    | 2    |    1 |
|    3 | 4    | 2    |    1 |
+------+------+------+------+
```

```sql
select min_by(k1, k4) from tbl;
```

```text
+--------------------+
| min_by(`k1`, `k4`) |
+--------------------+
|                  4 |
+--------------------+ 
```
