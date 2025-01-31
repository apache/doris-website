---
{
    "title": "ARRAY_COUNT",
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

使用 lambda 表达式作为输入参数，对其他输入 ARRAY 参数的内部数据进行相应的表达式计算。返回使得 `lambda(array1[i], ...)` 返回值不为 0 的元素数量。如果找不到到满足此条件的元素，则返回 0。

lambda 表达式中输入的参数为 1 个或多个，必须和后面输入的数组列数一致，且所有输入的 array 的元素个数必须相同。在 lambda 中可以执行合法的标量函数，不支持聚合函数等。

## 语法

```sql
ARRAY_COUNT(<arr>),
ARRAY_COUNT(<lambda>, <arr> [ , <arr> ... ] )
```

## 参数

| 参数 | 说明 | 
| --- |---|
| `<lambda>` | lambda 表达式，表达式中输入的参数为 1 个或多个，必须和后面的输入 array 列数量一致。在 lambda 中可以执行合法的标量函数，不支持聚合函数等。 |
| `<arr>` | ARRAY数组     |

## 返回值

经过表达式lambda计算之后ARRAY，不为 0 的元素数量。如果找不到到满足此条件的元素，则返回 0。

## 举例

```sql
select array_count(x -> x, [0, 1, 2, 3]);
```

```text
+--------------------------------------------------------+
| array_count(array_map([x] -> x(0), ARRAY(0, 1, 2, 3))) |
+--------------------------------------------------------+
|                                                      3 |
+--------------------------------------------------------+
```

```sql
select array_count(x -> x > 2, [0, 1, 2, 3]);
```

```text
+------------------------------------------------------------+
| array_count(array_map([x] -> x(0) > 2, ARRAY(0, 1, 2, 3))) |
+------------------------------------------------------------+
|                                                          1 |
+------------------------------------------------------------+
```

```sql
select array_count(x -> x is null, [null, null, null, 1, 2]);
```

```text
+----------------------------------------------------------------------------+
| array_count(array_map([x] -> x(0) IS NULL, ARRAY(NULL, NULL, NULL, 1, 2))) |
+----------------------------------------------------------------------------+
|                                                                          3 |
+----------------------------------------------------------------------------+
```

```sql
select array_count(x -> power(x,2)>10, [1, 2, 3, 4, 5]);
```

```text
+------------------------------------------------------------------------------+
| array_count(array_map([x] -> power(x(0), 2.0) > 10.0, ARRAY(1, 2, 3, 4, 5))) |
+------------------------------------------------------------------------------+
|                                                                            2 |
+------------------------------------------------------------------------------+
```

```sql
select *, array_count((x, y) -> x>y, c_array1, c_array2) from array_test;
```

```text
+------+-----------------+-------------------------+-----------------------------------------------------------------------+
| id   | c_array1        | c_array2                | array_count(array_map([x, y] -> x(0) > y(1), `c_array1`, `c_array2`)) |
+------+-----------------+-------------------------+-----------------------------------------------------------------------+
|    1 | [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] |                                                                     2 |
|    2 | [6, 7, 8]       | [10, 12, 13]            |                                                                     0 |
|    3 | [1]             | [-100]                  |                                                                     1 |
|    4 | [1, NULL, 2]    | [NULL, 3, 1]            |                                                                     1 |
|    5 | []              | []                      |                                                                     0 |
|    6 | NULL            | NULL                    |                                                                     0 |
+------+-----------------+-------------------------+-----------------------------------------------------------------------+
```


