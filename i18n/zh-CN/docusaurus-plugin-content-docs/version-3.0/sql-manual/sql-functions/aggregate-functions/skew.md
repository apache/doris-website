---
{
    "title": "SKEW,SKEW_POP,SKEWNESS",
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

## skewness,skew,skew_pop
### 描述

返回表达式的 [斜度](https://en.wikipedia.org/wiki/Skewness)。
用来计算斜度的公式是 `3阶中心矩 / ((方差)^{1.5})`, 当方差为零时, `skewness` 会返回 `NULL`.

### 语法

`skewness(expr)`

### 参数说明

TinyInt/SmallInt/Integer/BigInt/Float/Double, Decimal 会被 cast 成浮点数参与运算。

### 返回值说明

`Double`

### 举例
```sql
create table statistic_test (tag int, val1 double not null, val2 double null)
                distributed by hash(tag) properties("replication_num"="1")

insert into statistic_test values (1, -10, -10),
                                  (2, -20, NULL),
                                  (3, 100, NULL),
                                  (4, 100, NULL),
                                  (5, 1000,1000);

// NULL is ignored
select skew(val1), skew(val2) from statistic_test
--------------

+--------------------+--------------------+
| skew(val1)         | skew(val2)         |
+--------------------+--------------------+
| 1.4337199628825619 | 1.1543940205711711 |
+--------------------+--------------------+
1 row in set (0.01 sec)

// Each group just has one row, result is NULL
select skew(val1), skew(val2) from statistic_test group by tag
--------------

+------------+------------+
| skew(val1) | skew(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
5 rows in set (0.04 sec)
```
### 相关命令

[kurt](./kurt.md)