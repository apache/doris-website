---
{
    "title": "EXPLODE",
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

The `explode` function takes one or more arrays as input and maps each element of the array to a separate row.The elements at the same index position of each array will be grouped together to form a row. It is typically used in conjunction with LATERAL VIEW to flatten nested data structures into a standard tabular format. The main difference between explode and `explode_outer` lies in handling empty values.

## Syntax
```sql
EXPLODE(<array>[, <array> ])
EXPLODE_OUTER(<array>[, <array> ])
```

## Required Parameters

| Parameter | Description |
| -- | -- |
| `<arr>` | 	Array type |

## Return Value

When the array is not empty or NULL, the return values of `explode` and `explode_outer` are the same.

When the data is empty or NULL:

`explode` will not produce any rows and will filter out these records.

`explode_outer` if the array is empty, will generate a single row, but the expanded column value will be NULL. If the array is NULL, it will also retain a row and return NULL.

## Examples
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
select e1,e2 from (select 1 k1) as t lateral view explode([null,1,null],["4","5","6"]) tmp1 as e1,e2;
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
select e1,e2,e3 from (select 1 k1) as t lateral view explode([null,1,null],["4","5","6"],null) tmp1 as e1,e2,e3;
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
z