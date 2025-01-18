---
{
    "title": "ARRAY_JOIN",
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
Combine all elements in the array into a new string based on the separator (sep) and the string to replace NULL values (null_replace).

## Syntax

```sql
ARRAY_JOIN(<arr> , <sep> [, <null_replace>])
```
## Parameters
| Parameter      | Description |
|---|---|
| `<arr>`         | ARRAY |
| `<sep>`         | Separator string |
| `<null_replace>` | String to replace `NULL` values |

## Return Value
Returns a new string with the following special cases:
- If `<sep>` is `NULL`, the function returns `NULL`.
- If `<null_replace>` is `NULL`, the function also returns `NULL`.
- If `<sep>` is an empty string, no separator is applied.
- If `<null_replace>` is an empty string or not specified, `NULL` elements in the array are discarded directly.

## example

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
                           (7, [4, 5, 6, NULL, NULL]);
select k1, k2, array_join(k2, '_', 'null') from array_test order by k1;
```
```text
+------+-----------------------------+------------------------------------+
| k1   | k2                          | array_join(`k2`, '_', 'null')      |
+------+-----------------------------+------------------------------------+
|  1   | [1, 2, 3, 4, 5]             | 1_2_3_4_5                          |
|  2   | [6, 7, 8]                   | 6_7_8                              |
|  3   | []                          |                                    |
|  4   | NULL                        | NULL                               |
|  5   | [1, 2, 3, 4, 5, 4, 3, 2, 1] | 1_2_3_4_5_4_3_2_1                  |
|  6   | [1, 2, 3, NULL]             | 1_2_3_null                         |
|  7   | [4, 5, 6, NULL, NULL]       | 4_5_6_null_null                    |
+------+-----------------------------+------------------------------------+
```
```sql
select k1, k2, array_join(k2, '_') from array_test order by k1;
```
```text
+------+-----------------------------+----------------------------+
| k1   | k2                          | array_join(`k2`, '_')      |
+------+-----------------------------+----------------------------+
|  1   | [1, 2, 3, 4, 5]             | 1_2_3_4_5                  |
|  2   | [6, 7, 8]                   | 6_7_8                      |
|  3   | []                          |                            |
|  4   | NULL                        | NULL                       |
|  5   | [1, 2, 3, 4, 5, 4, 3, 2, 1] | 1_2_3_4_5_4_3_2_1          |
|  6   | [1, 2, 3, NULL]             | 1_2_3                      |
|  7   | [4, 5, 6, NULL, NULL]       | 4_5_6                      |
+------+-----------------------------+----------------------------+
```

```sql
CREATE TABLE array_test01 (
    k1 INT,
    k2 ARRAY<STRING>
)
duplicate key (k1)
distributed by hash(k1) buckets 1
properties(
  'replication_num' = '1'
);

INSERT INTO array_test01 VALUES
(1, ['a', 'b', 'c', 'd']),
(2, ['e', 'f', 'g', 'h']),
(3, [NULL, 'a', NULL, 'b', NULL, 'c']),
(4, ['d', 'e', NULL, ' ']),
(5, [' ', NULL, 'f', 'g']);
select k1, k2, array_join(k2, '_', 'null') from array_test01 order by k1;
```
```text
+------+-----------------------------------+------------------------------------+
| k1   | k2                                | array_join(`k2`, '_', 'null')      |
+------+-----------------------------------+------------------------------------+
|  1   | ['a', 'b', 'c', 'd']              | a_b_c_d                            |
|  2   | ['e', 'f', 'g', 'h']              | e_f_g_h                            |
|  3   | [NULL, 'a', NULL, 'b', NULL, 'c'] | null_a_null_b_null_c               |
|  4   | ['d', 'e', NULL, ' ']             | d_e_null_                          |
|  5   | [' ', NULL, 'f', 'g']             |  _null_f_g                         |
+------+-----------------------------------+------------------------------------+
```

```sql
select k1, k2, array_join(k2, '_') from array_test01 order by k1;
```
```text
+------+-----------------------------------+----------------------------+
| k1   | k2                                | array_join(`k2`, '_')      |
+------+-----------------------------------+----------------------------+
|  1   | ['a', 'b', 'c', 'd']              | a_b_c_d                    |
|  2   | ['e', 'f', 'g', 'h']              | e_f_g_h                    |
|  3   | [NULL, 'a', NULL, 'b', NULL, 'c'] | a_b_c                      |
|  4   | ['d', 'e', NULL, ' ']             | d_e_                       |
|  5   | [' ', NULL, 'f', 'g']             |  _f_g                      |
+------+-----------------------------------+----------------------------+
```