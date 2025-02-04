---
{
    "title": "ARRAY_DISTINCT",
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
Return the array which has been removed duplicate values.
Return NULL for NULL input.

## Syntax
```sql
ARRAY_DISTINCT(<arr> )
```

## Parameters
| Parameter | Description |
|---|---|
| `<arr>` | An array that might contain duplicate elements to be removed |

## Return Value
Return the array which has been removed duplicate values. Special case:
- If the input array is NULL, the result is NULL.

## Example

```sql
CREATE TABLE array_test (
    k1 INT,
    k2 ARRAY<INT>
)
duplicate key (k1)
distributed by hash(k1) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_test VALUES
(1, [1, 2, 3, 4, 5]),
(2, [6, 7, 8]),
(3, []),
(4, NULL),
(5, [1, 2, 3, 4, 5, 4, 3, 2, 1]),
(6, [1, 2, 3, NULL]),
(7, [1, 2, 3, NULL, NULL]);
select k1, k2, array_distinct(k2) from array_test;
```
```text
+------+-----------------------------+---------------------------+
| k1   | k2                          | array_distinct(k2)        |
+------+-----------------------------+---------------------------+
| 1    | [1, 2, 3, 4, 5]             | [1, 2, 3, 4, 5]           |
| 2    | [6, 7, 8]                   | [6, 7, 8]                 |
| 3    | []                          | []                        |
| 4    | NULL                        | NULL                      |
| 5    | [1, 2, 3, 4, 5, 4, 3, 2, 1] | [1, 2, 3, 4, 5]           |
| 6    | [1, 2, 3, NULL]             | [1, 2, 3, NULL]           |
| 7    | [1, 2, 3, NULL, NULL]       | [1, 2, 3, NULL]           |
+------+-----------------------------+---------------------------+
```
```sql
CREATE TABLE array_test01 (
   k1 INT,
   k2 ARRAY<VARCHAR>
)
duplicate key (k1)
distributed by hash(k1) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_test01 VALUES
(1, ['a', 'b', 'c', 'd', 'e']),
(2, ['f', 'g', 'h']),
(3, ['']),
(3, [NULL]),
(5, ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c']),
(6, NULL),
(7, ['a', 'b', NULL]),
(8, ['a', 'b', NULL, NULL]);
select k1, k2, array_distinct(k2) from array_test01;
```
```text
+------+------------------------------------------+---------------------------+
| k1   | k2                                       | array_distinct(`k2`)      |
+------+------------------------------------------+---------------------------+
| 1    | ['a', 'b', 'c', 'd', 'e']                | ['a', 'b', 'c', 'd', 'e'] |
| 2    | ['f', 'g', 'h']                          | ['f', 'g', 'h']           |
| 3    | ['']                                     | ['']                      |
| 3    | [NULL]                                   | [NULL]                    |
| 5    | ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c'] | ['a', 'b', 'c', 'd', 'e'] |
| 6    | NULL                                     | NULL                      |
| 7    | ['a', 'b', NULL]                         | ['a', 'b', NULL]          |
| 8    | ['a', 'b', NULL, NULL]                   | ['a', 'b', NULL]          |
+------+------------------------------------------+---------------------------+
```