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
### Description

Returns the [skewness](https://en.wikipedia.org/wiki/Skewness) of the expr expression.
The forumula used for this function is `3-th centrol moment / ((variance)^{1.5})`, when variance is zero, `skewness` will return `NULL`.

### Syntax

`skewness(expr)`

### Arguments

TinyInt/SmallInt/Integer/BigInt/Float/Double, Decimal will be casted to a float number.

### Return value

`Double`

### Example
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
### Related Commands

[kurt](./kurt.md)