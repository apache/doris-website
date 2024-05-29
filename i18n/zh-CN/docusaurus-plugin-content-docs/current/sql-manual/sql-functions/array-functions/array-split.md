---
{
    "title": "ARRAY_SPLIT",
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

## array_sortby

array_split

### description

#### Syntax

```sql
ARRAY<T> array_split(ARRAY<T> arg, Array<Boolean> cond)
ARRAY<T> array_split(lambda, ARRAY<T0> arg0...)
```

1. 传入两个长度相等的 `ARRAY` 且第二个为 `Array<Boolean>`，则按照 `cond` 中为 `true` 的位置作为分割点，分割 `arg` 。
2. 高阶函数，传入一个 lambda 表达式和至少一个 `ARRAY arg0`，则按照 lambda 表达式运算得到的 `Array<Boolean>` 结果，其中为 `true` 的位置作为分割点，分割 `arg0` 。

### example

```
mysql> select array_split([1,2,3,4,5], [1,0,1,0,0]);
+-----------------------------------------------------------------------+
| array_split([1, 2, 3, 4, 5], cast([1, 0, 1, 0, 0] as ARRAY<BOOLEAN>)) |
+-----------------------------------------------------------------------+
| [[1, 2], [3, 4, 5]]                                                   |
+-----------------------------------------------------------------------+
1 row in set (0.09 sec)

mysql> select array_split((x,y)->y, [1,2,3,4,5], [1,0,0,0,0]);
+----------------------------------------------------------------------------------------------------------------+
| array_split([1, 2, 3, 4, 5], cast(array_map((x, y) -> y, [1, 2, 3, 4, 5], [1, 0, 0, 0, 0]) as ARRAY<BOOLEAN>)) |
+----------------------------------------------------------------------------------------------------------------+
| [[1, 2, 3, 4, 5]]                                                                                              |
+----------------------------------------------------------------------------------------------------------------+
1 row in set (0.13 sec)

mysql> select array_split((x,y)->(y+1), ['a', 'b', 'c', 'd'], [-1, -1, 0, -1]);
+--------------------------------------------------------------------------------------------------------------------------------+
| array_split(['a', 'b', 'c', 'd'], cast(array_map((x, y) -> (y + 1), ['a', 'b', 'c', 'd'], [-1, -1, 0, -1]) as ARRAY<BOOLEAN>)) |
+--------------------------------------------------------------------------------------------------------------------------------+
| [["a", "b"], ["c", "d"]]                                                                                                       |
+--------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.12 sec)

mysql> select array_split(x->(year(x)>2013),["2020-12-12", "2013-12-12", "2015-12-12", null]);
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_split(['2020-12-12', '2013-12-12', '2015-12-12', NULL], array_map(x -> (year(cast(x as DATEV2)) > 2013), ['2020-12-12', '2013-12-12', '2015-12-12', NULL])) |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [["2020-12-12", "2013-12-12"], ["2015-12-12"], [null]]                                                                                                            |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.14 sec)
```

### keywords

ARRAY, SPLIT, ARRAY_SPLIT
