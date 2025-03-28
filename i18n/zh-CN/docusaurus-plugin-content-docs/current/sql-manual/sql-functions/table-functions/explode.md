---
{
    "title": "EXPLODE",
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

`explode` 函数接受一个或多个数组，会将数组的每个元素映射为单独的行，每个数组的同一索引位置的元素会被组合在一起，形成一行。通常与 LATERAL VIEW 配合使用，以将嵌套数据结构展开为标准的平面表格式。`explode` 和 `explode_outer` 区别主要在于空值处理。

## 语法
```sql
EXPLODE(<array>[, <array> ])
EXPLODE_OUTER(<array>[, <array> ]
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<arr>` | array 类型 |

## 返回值

当数组不为空或 NULL 时，`explode` 和 `explode_outer` 的返回值相同。

当数据为空或 NULL 时：

`explode` 不会产生任何行，并且会过滤掉这些记录。

`explode_outer` 如果数组是空的，explode_outer 会生成一行记录，但展开的列值会是 NULL。如果数组为 NULL，同样会保留一行，并返回 NULL。

## 举例

```
select e1 from (select 1 k1) as t lateral view explode([1,2,3]) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
|    1 |
|    2 |
|    3 |
+------+
```


```sql
select e1 from (select 1 k1) as t lateral view explode_outer(null) tmp1 as e1;
```

``` text
+------+
| e1   |
+------+
| NULL |
+------+
```

```sql
select e1 from (select 1 k1) as t lateral view explode([]) tmp1 as e1;
Empty set (0.010 sec)
```

```sql
select e1 from (select 1 k1) as t lateral view explode([null,1,null]) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+
```

```sql
select e1 from (select 1 k1) as t lateral view explode_outer([null,1,null]) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+
```

```sql
select e1,e2 from (select 1 k1) as t lateral view explode([null,1,null], ["4","5","6"]) tmp1 as e1,e2;
```

```text
+------+------+
| e1   | e2   |
+------+------+
| NULL | 4    |
|    1 | 5    |
| NULL | 6    |
+------+------+
```

```sql
select e1,e2,e3 from (select 1 k1) as t lateral view explode([null,1,null], ["4","5","6"], null) tmp1 as e1,e2,e3;
```
```text
+------+------+------+
| e1   | e2   | e3   |
+------+------+------+
| NULL | 4    | NULL |
|    1 | 5    | NULL |
| NULL | 6    | NULL |
+------+------+------+
```
