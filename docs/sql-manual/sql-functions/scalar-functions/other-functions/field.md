---
{
    "title": "FIELD",
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

Returns the position of the first occurrence of `<expr>` in the list of values `<param> [, ...]`.  
If `<expr>` is not found, the function returns `0`. This function is commonly used in `ORDER BY` to implement custom sorting.

## Syntax

```sql
FIELD(<expr>, <param> [, ...])
```

## Parameters

| Parameter  | Description                                             |
|------------|---------------------------------------------------------|
| `<expr>`   | The value to be searched in the list of parameters.     |
| `<param>`  | A sequence of values to compare against `<expr>`.       |

## Return Value

- Returns the position (1-based index) of `<expr>` in the list of `<param>` values.  
- If `<expr>` is not found, returns `0`.  
- If `<expr>` is `NULL`, returns `0`.

## Examples

```sql
SELECT FIELD(2, 3, 1, 2, 5);
```

```text
+----------------------+
| FIELD(2, 3, 1, 2, 5) |
+----------------------+
|                    3 |
+----------------------+
```

```sql
SELECT k1, k7 FROM baseall WHERE k1 IN (1,2,3) ORDER BY FIELD(k1, 2, 1, 3);
```

```text
+------+------------+
| k1   | k7         |
+------+------------+
|    2 | wangyu14   |
|    1 | wangjing04 |
|    3 | yuanyuan06 |
+------+------------+
```

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry');
```

```text
+------------+
| class_name |
+------------+
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```