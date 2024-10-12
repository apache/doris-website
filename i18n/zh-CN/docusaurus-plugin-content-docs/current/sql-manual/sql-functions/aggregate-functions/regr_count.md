---
{
    "title": "REGR_COUNT",
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

## REGR_COUNT
### Description
#### Syntax

`regr_count(x, y)`

计算两个输入都非空的行数。

### example

```sql
mysql> select * from t;
+------+------+------+
| id   | x    | y    |
+------+------+------+
|    3 |   13 |    3 |
|    5 |    4 |    7 |
|    1 |    1 |   18 |
|    2 |    6 | NULL |
|    4 | NULL |    6 |
+------+------+------+
5 rows in set (0.034 sec)
```

```sql
mysql> select regr_count(x, y) from t;
+------------------+
| regr_count(x, y) |
+------------------+
|                3 |
+------------------+
1 row in set (0.026 sec)
```

### keywords
REGR_COUNT
