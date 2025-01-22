---
{
    "title": "ARRAY_EXISTS",
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
使用一个可选 lambda 表达式作为输入参数，对其他的输入 ARRAY 参数的内部数据做对应表达式计算。当计算返回非 0 时，返回 1；否则返回 0。
在 lambda 表达式中输入的参数为 1 个或多个，必须和后面的输入 array 列数量一致。在 lambda 中可以执行合法的标量函数，不支持聚合函数等。

在没有使用 lambda 作为参数时，array1 作为计算结果。

## 语法
```sql
ARRAY_EXISTS([ <lambda>, ] <arr1> [, <arr2> , ...] )
```

## 参数
| Parameter | Description |
|---|---|
| `<lambda>` | lambda 表达式，可以执行合法的标量函数，不支持聚合函数等 |
| `<arr1>` | 需要计算的数组arr1  |
| `<arr2>` | 需要计算的数组arr2  |

## 返回值
返回使用表达式计算后的数组，特殊情况：
- 如果数组里面包含NULL或者本身为NULL，则返回NULL

## 举例

```sql
CREATE TABLE array_test2 (
    id INT,
    c_array1 ARRAY<INT>,
    c_array2 ARRAY<INT>
)
duplicate key (id)
distributed by hash(id) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_test2 VALUES
(1, [1, 2, 3, 4, 5], [10, 20, -40, 80, -100]),
(2, [6, 7, 8], [10, 12, 13]),
(3, [1], [-100]),
(4, NULL, NULL);
select *, array_exists(x->x>1,[1,2,3]) from array_test2 order by id;
```
```text
select *, array_exists(x->x>1,[1,2,3]) from array_test2 order by id;
+------+-----------------+-------------------------+-----------------------------------------------+
| id   | c_array1        | c_array2                | array_exists([x] -> x(0) > 1, ARRAY(1, 2, 3)) |
+------+-----------------+-------------------------+-----------------------------------------------+
|    1 | [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [0, 1, 1]                                     |
|    2 | [6, 7, 8]       | [10, 12, 13]            | [0, 1, 1]                                     |
|    3 | [1]             | [-100]                  | [0, 1, 1]                                     |
|    4 | NULL            | NULL                    | [0, 1, 1]                                     |
+------+-----------------+-------------------------+-----------------------------------------------+
```

```sql
select c_array1, c_array2, array_exists(x->x%2=0,[1,2,3]) from array_test2 order by id;
```
```text
+-----------------+-------------------------+---------------------------------------------------+
| c_array1        | c_array2                | array_exists([x] -> x(0) % 2 = 0, ARRAY(1, 2, 3)) |
+-----------------+-------------------------+---------------------------------------------------+
| [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [0, 1, 0]                                         |
| [6, 7, 8]       | [10, 12, 13]            | [0, 1, 0]                                         |
| [1]             | [-100]                  | [0, 1, 0]                                         |
| NULL            | NULL                    | [0, 1, 0]                                         |
+-----------------+-------------------------+---------------------------------------------------+
```
```sql
select c_array1, c_array2, array_exists(x->abs(x)-1,[1,2,3]) from array_test2 order by id;
```
```text
+-----------------+-------------------------+-------------------------------------------------------------------------------+
| c_array1        | c_array2                | array_exists(cast(array_map(x -> (abs(x) - 1), [1, 2, 3]) as ARRAY<BOOLEAN>)) |
+-----------------+-------------------------+-------------------------------------------------------------------------------+
| [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [0, 1, 1]                                                                     |
| [6, 7, 8]       | [10, 12, 13]            | [0, 1, 1]                                                                     |
| [1]             | [-100]                  | [0, 1, 1]                                                                     |
| NULL            | NULL                    | [0, 1, 1]                                                                     |
+-----------------+-------------------------+-------------------------------------------------------------------------------+
```
```sql
select c_array1, c_array2, array_exists((x,y)->x>y,c_array1,c_array2) from array_test2 order by id;
```
```text
+-----------------+-------------------------+-------------------------------------------------------------+
| c_array1        | c_array2                | array_exists([x, y] -> x(0) > y(1), `c_array1`, `c_array2`) |
+-----------------+-------------------------+-------------------------------------------------------------+
| [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [0, 0, 1, 0, 1]                                             |
| [6, 7, 8]       | [10, 12, 13]            | [0, 0, 0]                                                   |
| [1]             | [-100]                  | [1]                                                         |
| NULL            | NULL                    | NULL                                                        |
+-----------------+-------------------------+-------------------------------------------------------------+
```
```sql
select *, array_exists(c_array1) from array_test2 order by id;
```
```text
+------+-----------------+-------------------------+--------------------------+
| id   | c_array1        | c_array2                | array_exists(`c_array1`) |
+------+-----------------+-------------------------+--------------------------+
|    1 | [1, 2, 3, 0, 5] | [10, 20, -40, 80, -100] | [1, 1, 1, 0, 1]          |
|    2 | [6, 7, 8]       | [10, 12, 13]            | [1, 1, 1]                |
|    3 | [1]             | [-100]                  | [1]                      |
|    4 | NULL            | NULL                    | NULL                     |
+------+-----------------+-------------------------+--------------------------+
```
