---
{
"title": "COUNT",
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

返回指定列的非NULL记录数，或者记录总数

## 语法

```sql
COUNT(DISTINCT <expr> [,<expr>,...])
COUNT(*)
COUNT(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 条件表达式（列名） |

## 返回值

返回值为数值类型。如果expr为NULL，则不参数统计

## 举例

```sql
select * from test_count;
```

```text
+------+------+------+
| id   | name | sex  |
+------+------+------+
|    1 | 1    |    1 |
|    2 | 2    |    1 |
|    3 | 3    |    1 |
|    4 | 0    |    1 |
|    4 | 4    |    1 |
|    5 | NULL |    1 |
+------+------+------+
```

```sql
select count(*) from test_count;
```

```text
+----------+
| count(*) |
+----------+
|        6 |
+----------+
```

```sql
select count(name) from test_insert;
```

```text
+-------------+
| count(name) |
+-------------+
|           5 |
+-------------+
```

```sql
select count(distinct sex) from test_insert;
```

```text
+---------------------+
| count(DISTINCT sex) |
+---------------------+
|                   1 |
+---------------------+
```

```sql
select count(distinct id,sex) from test_insert;
```

```text
+-------------------------+
| count(DISTINCT id, sex) |
+-------------------------+
|                       5 |
+-------------------------+
```
