---
{
    "title": "REGR_SXX",
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
#### Syntax

` double regr_sxx(y, x)`

x, y support basic numeric types.

calculate the sum of the squared differences between each `X` value and the mean of all `X` values

## EXAMPLE

We have the following data

```sql
mysql> select * from t;
+------+------+------+
| id   | x    | y    |
+------+------+------+
|    2 |   14 |   27 |
|    4 |   10 |   20 |
|    3 |    5 |    7 |
|    1 |   18 |   13 |
+------+------+------+
```

```sql
mysql> select regr_sxx(y,x) from t;
+----------------+
| regr_sxx(y, x) |
+----------------+
|          92.75 |
+----------------+

```
## KEYWORDS
REGR_SXX
