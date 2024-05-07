---
{
    "title": "FLOOR",
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

## floor

### description
#### Syntax

`T floor(T x[, d])`

If not specified `d`: returns the largest integer value less than or equal to `x`, which is **the most common usage**.
Otherwise, returns the largest round number that is less than or equal to `x` and flowing the rules:

If `d` is specified as literal:  
`d` = 0: just like without `d`
`d` > 0 or `d` < 0: the round number would be a multiple of `1/10d`, or the nearest number of the appropriate data type if `1/10d` isn't exact.

Else if `d` is a column, and `x` has Decimal type, scale of result Decimal will always be same with input Decimal.

:::tip
Another alias for this function is `dfloor`.
:::

### example

```
mysql> select floor(1);
+------------+
| floor(1.0) |
+------------+
|          1 |
+------------+
mysql> select floor(2.4);
+------------+
| floor(2.4) |
+------------+
|          2 |
+------------+
mysql> select floor(-10.3);
+--------------+
| floor(-10.3) |
+--------------+
|          -11 |
+--------------+
mysql> select floor(123.45, 1), floor(123.45), floor(123.45, 0), floor(123.45, -1);
+------------------+---------------+------------------+-------------------+
| floor(123.45, 1) | floor(123.45) | floor(123.45, 0) | floor(123.45, -1) |
+------------------+---------------+------------------+-------------------+
|            123.4 |           123 |              123 |               120 |
+------------------+---------------+------------------+-------------------+
mysql> SELECT number
    -> , floor(number * 2.5, number - 1) AS f_decimal_column
    -> , floor(number * 2.5, 0) AS f_decimal_literal
    -> , floor(cast(number * 2.5 AS DOUBLE), number - 1) AS f_double_column
    -> , floor(cast(number * 2.5 AS DOUBLE), 0) AS f_double_literal
    -> FROM test_enhanced_round
    -> WHERE rid = 1;
+--------+------------------+-------------------+-----------------+------------------+
| number | f_decimal_column | f_decimal_literal | f_double_column | f_double_literal |
+--------+------------------+-------------------+-----------------+------------------+
|      1 |              2.0 |                 2 |               2 |                2 |
+--------+------------------+-------------------+-----------------+------------------+
```

### keywords
	FLOOR, DFLOOR
