---
{
    "title": "REGR_SLOPE",
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

## Description
#### Syntax

` Float64 regr_slope(y, x)`

x, y 支持基本数字类型

计算线性回归拟合直线的斜率

## EXAMPLE

我们有如下数据

```sql
mysql> select * from test;
+------+------+------+
| id   | x    | y    |
+------+------+------+
|    1 |   18 |   13 |
|    3 |   12 |    2 |
|    5 |   10 |   20 |
|    2 |   14 |   27 |
|    4 |    5 |    6 |
+------+------+------+
```

```sql
mysql> select regr_slope(y,x) from test;
+--------------------+
| regr_slope(y, x)   |
+--------------------+
| 0.6853448275862069 |
+--------------------+
```
## KEYWORDS
REGR_SLOPE
