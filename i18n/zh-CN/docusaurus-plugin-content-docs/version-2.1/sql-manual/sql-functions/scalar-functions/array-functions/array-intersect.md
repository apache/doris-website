---
{
    "title": "ARRAY_INTERSECT",
    "language": "zh-CN"
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

## 描述
返回一个数组，包含 array1 和 array2 的交集中的所有元素，不包含重复项，如果输入参数为 NULL，则返回 NULL

## 语法
```sql
ARRAY_INTERSECT(<arr1> , <arr2> )
```

## 参数
| Parameter | Description |
|---|---|
| `<arr1>` | 源数组 |
| `<arr2>` | 与 arr1 求交集的数组 |

## 返回值
返回包含 array1 和 array2 的交集中的所有元素的数组，特殊情况：
- 如果输入参数为 NULL，则返回 NULL

## 注意事项

`仅支持向量化引擎中使用`

## 举例

```sql
CREATE TABLE array_type_table (
    k1 INT,
    k2 ARRAY<INT>,
    k3 ARRAY<INT>
)
duplicate key (k1)
distributed by hash(k1) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_type_table VALUES 
(1, [1, 2, 3], [2, 4, 5]),
(2, [2, 3], [1, 5]),
(3, [1, 1, 1], [2, 2, 2]);
select k1,k2,k3,array_intersect(k2,k3) from array_type_table;
```
```text
+------+-----------------+--------------+-----------------------------+
| k1   | k2              | k3           | array_intersect(`k2`, `k3`) |
+------+-----------------+--------------+-----------------------------+
|    1 | [1, 2, 3]       | [2, 4, 5]    | [2]                         |
|    2 | [2, 3]          | [1, 5]       | []                          |
|    3 | [1, 1, 1]       | [2, 2, 2]    | []                          |
+------+-----------------+--------------+-----------------------------+
```
```sql
CREATE TABLE array_type_table_nullable (
    k1 INT,
    k2 ARRAY<INT>,
    k3 ARRAY<INT>
)
duplicate key (k1)
distributed by hash(k1) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_type_table_nullable VALUES
(1, [1, NULL, 3], [1, 3, 5]),
(2, [NULL, NULL, 2], [2, NULL, 4]),
(3, NULL, [1, 2, 3]);
select k1,k2,k3,array_intersect(k2,k3) from array_type_table_nullable;
```

```text
+------+-----------------+--------------+-----------------------------+
| k1   | k2              | k3           | array_intersect(`k2`, `k3`) |
+------+-----------------+--------------+-----------------------------+
|    1 | [1, NULL, 3]    | [1, 3, 5]    | [1, 3]                      |
|    2 | [NULL, NULL, 2] | [2, NULL, 4] | [NULL, 2]                   |
|    3 | NULL            | [1, 2, 3]    | NULL                        |
+------+-----------------+--------------+-----------------------------+
```
```sql
CREATE TABLE array_type_table_varchar (
    k1 INT,
    k2 ARRAY<VARCHAR>,
    k3 ARRAY<VARCHAR>
)
    duplicate key (k1)
distributed by hash(k1) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_type_table_varchar VALUES
(1, ['hello', 'world', 'c++'], ['I', 'am', 'c++']),
(2, ['a1', 'equals', 'b1'], ['a2', 'equals', 'b2']),
(3, ['hasnull', NULL, 'value'], ['nohasnull', 'nonull', 'value']),
(3, ['hasnull', NULL, 'value'], ['hasnull', NULL, 'value']);
select k1,k2,k3,array_intersect(k2,k3) from array_type_table_varchar;
```
```text
+------+----------------------------+----------------------------------+----------------------------+
| k1   | k2                         | k3                               | array_intersect(k2, k3)    |
+------+----------------------------+----------------------------------+----------------------------+
|    1 | ["hello", "world", "c++"]  | ["I", "am", "c++"]               | ["c++"]                    |
|    2 | ["a1", "equals", "b1"]     | ["a2", "equals", "b2"]           | ["equals"]                 |
|    3 | ["hasnull", null, "value"] | ["hasnull", null, "value"]       | [null, "value", "hasnull"] |
|    3 | ["hasnull", null, "value"] | ["nohasnull", "nonull", "value"] | ["value"]                  |
+------+----------------------------+----------------------------------+----------------------------+```
```
```sql
CREATE TABLE array_type_table_decimal (
    k1 INT,
    k2 ARRAY<DECIMAL(10, 2)>,
    k3 ARRAY<DECIMAL(10, 2)>
)
    duplicate key (k1)
distributed by hash(k1) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_type_table_decimal VALUES
(1, [1.1, 2.1, 3.44], [2.1, 3.4, 5.4]),
(2, [NULL, 2, 5], [NULL, NULL, 5.4]),
(3, [1, NULL, 2, 5], [1, 3.1, 5.4]);
select k1,k2,k3,array_intersect(k2,k3) from array_type_table_decimal;
```
```text
+------+--------------------------+--------------------+-------------------------+
| k1   | k2                       | k3                 | array_intersect(k2, k3) |
+------+--------------------------+--------------------+-------------------------+
|    1 | [1.10, 2.10, 3.44]       | [2.10, 3.40, 5.40] | [2.10]                  |
|    2 | [null, 2.00, 5.00]       | [null, null, 5.40] | [null]                  |
|    3 | [1.00, null, 2.00, 5.00] | [1.00, 3.10, 5.40] | [1.00]                  |
+------+--------------------------+--------------------+-------------------------+
```
