---
{
    "title": "ARRAY_REVERSE_SPLIT",
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

1. 传入两个长度相等的 `ARRAY` 且第二个为 `Array<Boolean>`，按照 `cond` 中为 `true` 的位置右侧作为分割点，分割 `arr` 数组 。
2. 高阶函数，传入一个 lambda 表达式和至少一个 `arr`，则按照 lambda 表达式运算得到的 `Array<Boolean>` 结果，其中为 `true` 的位置右侧作为分割点，分割 `arg0` 。

## 语法

```sql
ARRAY_REVERSE_SPLIT(<arr>, <cond>)
ARRAY_REVERSE_SPLIT(<lambda>, <arr> [, ...])
```

## 参数

| 参数 | 说明 | 
| --- |---|
| `<lambda>` | lambda 表达式，表达式中输入的参数为 1 个或多个，必须和后面的输入 array 列数量一致。在 lambda 中可以执行合法的标量函数，不支持聚合函数等。 |
| `<arr>` | ARRAY数组     |

## 返回值

返回一个 ARRAY 类型的结果，其中按照对应条件分割后的数组 

## 举例

```sql
select array_reverse_split([1,2,3,4,5], [1,0,1,0,0]);
```

```text
+-------------------------------------------------------------------------------+
| array_reverse_split([1, 2, 3, 4, 5], cast([1, 0, 1, 0, 0] as ARRAY<BOOLEAN>)) |
+-------------------------------------------------------------------------------+
| [[1], [2, 3], [4, 5]]                                                         |
+-------------------------------------------------------------------------------+
```

```sql
select array_reverse_split((x,y)->y, [1,2,3,4,5], [1,0,0,0,0]);
```

```text
+------------------------------------------------------------------------------------------------------------------------+
| array_reverse_split([1, 2, 3, 4, 5], cast(array_map((x, y) -> y, [1, 2, 3, 4, 5], [1, 0, 0, 0, 0]) as ARRAY<BOOLEAN>)) |
+------------------------------------------------------------------------------------------------------------------------+
| [[1], [2, 3, 4, 5]]                                                                                                    |
+------------------------------------------------------------------------------------------------------------------------+
```

```sql
select array_reverse_split((x,y)->(y+1), ['a', 'b', 'c', 'd'], [-1, -1, 0, -1]);
```

```text
+----------------------------------------------------------------------------------------------------------------------------------------+
| array_reverse_split(['a', 'b', 'c', 'd'], cast(array_map((x, y) -> (y + 1), ['a', 'b', 'c', 'd'], [-1, -1, 0, -1]) as ARRAY<BOOLEAN>)) |
+----------------------------------------------------------------------------------------------------------------------------------------+
| [["a", "b", "c"], ["d"]]                                                                                                               |
+----------------------------------------------------------------------------------------------------------------------------------------+
```

```sql
select array_reverse_split(x->(year(x)>2013),["2020-12-12", "2013-12-12", "2015-12-12", null]);
```

```text
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_reverse_split(['2020-12-12', '2013-12-12', '2015-12-12', NULL], array_map(x -> (year(cast(x as DATEV2)) > 2013), ['2020-12-12', '2013-12-12', '2015-12-12', NULL])) |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [["2020-12-12"], ["2013-12-12", "2015-12-12"], [null]]                                                                                                                    |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```
