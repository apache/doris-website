---
{
    "title": "ARRAY_FILTER",
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

使用 lambda 表达式作为输入参数，计算筛选另外的输入参数 ARRAY 列的数据。
并过滤掉在结果中 0 和 NULL 的值。

## 语法

```sql
ARRAY_FILTER(<lambda>, <arr>)
ARRAY_FILTER(<arr>, <filter_column>)
```

## 参数

| 参数 | 说明 | 
| --- |---|
| `<lambda>` | lambda 表达式，表达式中输入的参数为 1 个或多个，必须和后面的输入 array 列数量一致。在 lambda 中可以执行合法的标量函数，不支持聚合函数等。 |
| `<arr>` | ARRAY 数组     |

## 返回值

对其输入 ARRAY 参数的内部数据做对应表达式计算。过滤掉在结果中 0 和 NULL 的值

## 举例

```sql
select c_array,array_filter(c_array,[0,1,0]) from array_test;
```

```text
+-----------------+----------------------------------------------------+
| c_array         | array_filter(`c_array`, ARRAY(FALSE, TRUE, FALSE)) |
+-----------------+----------------------------------------------------+
| [1, 2, 3, 4, 5] | [2]                                                |
| [6, 7, 8]       | [7]                                                |
| []              | []                                                 |
| NULL            | NULL                                               |
+-----------------+----------------------------------------------------+
```

```sql
select array_filter(x->(x > 1),[1,2,3,0,null]);
```

```text
+----------------------------------------------------------------------------------------------+
| array_filter(ARRAY(1, 2, 3, 0, NULL), array_map([x] -> (x(0) > 1), ARRAY(1, 2, 3, 0, NULL))) |
+----------------------------------------------------------------------------------------------+
| [2, 3]                                                                                       |
+----------------------------------------------------------------------------------------------+
```

```sql
select *, array_filter(x->x>0,c_array2) from array_test2;
```

```text
+------+-----------------+-------------------------+------------------------------------------------------------------+
| id   | c_array1        | c_array2                | array_filter(`c_array2`, array_map([x] -> x(0) > 0, `c_array2`)) |
+------+-----------------+-------------------------+------------------------------------------------------------------+
|    1 | [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [10, 20, 80]                                                     |
|    2 | [6, 7, 8]       | [10, 12, 13]            | [10, 12, 13]                                                     |
|    3 | [1]             | [-100]                  | []                                                               |
|    4 | NULL            | NULL                    | NULL                                                             |
+------+-----------------+-------------------------+------------------------------------------------------------------+
```

```sql
select *, array_filter(x->x%2=0,c_array2) from array_test2;
```

```text
+------+-----------------+-------------------------+----------------------------------------------------------------------+
| id   | c_array1        | c_array2                | array_filter(`c_array2`, array_map([x] -> x(0) % 2 = 0, `c_array2`)) |
+------+-----------------+-------------------------+----------------------------------------------------------------------+
|    1 | [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [10, 20, -40, 80, -100]                                              |
|    2 | [6, 7, 8]       | [10, 12, 13]            | [10, 12]                                                             |
|    3 | [1]             | [-100]                  | [-100]                                                               |
|    4 | NULL            | NULL                    | NULL                                                                 |
+------+-----------------+-------------------------+----------------------------------------------------------------------+
```

```sql
select *, array_filter(x->(x*(-10)>0),c_array2) from array_test2;
```

```text
+------+-----------------+-------------------------+----------------------------------------------------------------------------+
| id   | c_array1        | c_array2                | array_filter(`c_array2`, array_map([x] -> (x(0) * (-10) > 0), `c_array2`)) |
+------+-----------------+-------------------------+----------------------------------------------------------------------------+
|    1 | [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [-40, -100]                                                                |
|    2 | [6, 7, 8]       | [10, 12, 13]            | []                                                                         |
|    3 | [1]             | [-100]                  | [-100]                                                                     |
|    4 | NULL            | NULL                    | NULL                                                                       |
+------+-----------------+-------------------------+----------------------------------------------------------------------------+
```

```sql
select *, array_filter(x->x>0, array_map((x,y)->(x>y), c_array1,c_array2)) as res from array_test2;
```

```text
+------+-----------------+-------------------------+--------+
| id   | c_array1        | c_array2                | res    |
+------+-----------------+-------------------------+--------+
|    1 | [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [1, 1] |
|    2 | [6, 7, 8]       | [10, 12, 13]            | []     |
|    3 | [1]             | [-100]                  | [1]    |
|    4 | NULL            | NULL                    | NULL   |
+------+-----------------+-------------------------+--------+
```

