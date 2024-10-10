---
{
    "title": "KURT,KURT_POP,KURTOSIS",
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

kurtosis 返回 expr 表达式的[峰度值](https://en.wikipedia.org/wiki/Kurtosis)。此函数使用的公式为 第四阶中心矩 / (方差的平方) - 3，当方差为零时，kurtosis 将返回 NULL。

## 语法

`kurtosis(expr)`

## 参数说明

TinyInt/SmallInt/Integer/BigInt/Float/Double, Decimal 会被 cast 成浮点数参与运算。

## 返回值说明

`Double`

## 举例
```sql
create table statistic_test(tag int, val1 double not null, val2 double null) distributed by hash(tag) properties("replication_num"="1");

insert into statistic_test values (1, -10, -10),(2, -20, NULL),(3, 100, NULL),(4, 100, NULL),(5, 1000,1000);

// NULL 值会被忽略
select kurt(val1), kurt(val2) from statistic_test;
--------------

+-------------------+--------------------+
| kurt(val1)        | kurt(val2)         |
+-------------------+--------------------+
| 0.162124583734851 | -1.3330994719286338 |
+-------------------+--------------------+
1 row in set (0.02 sec)

// 每组只有一行数据，结果为 NULL
select kurt(val1), kurt(val2) from statistic_test group by tag;
--------------

+------------+------------+
| kurt(val1) | kurt(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
5 rows in set (0.02 sec)
```

## 相关命令

[skew](./skew.md)
