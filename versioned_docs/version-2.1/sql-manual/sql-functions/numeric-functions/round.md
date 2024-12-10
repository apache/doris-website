---
{
    "title": "ROUND",
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

## round

### description
#### Syntax

`T round(T x[, d])`
Rounds the argument `x` to `d` decimal places. `d` defaults to 0 if not specified. If d is negative, the left d digits of the decimal point are 0. If x or d is null, null is returned.
2.5 will round up to 3. If you want to round down to 2, please use the round_bankers function.

If `d` is a column, and `x` has Decimal type, scale of result Decimal will always be same with input Decimal.

:::tip
Another alias for this function is `dround`.
:::

### example

```
mysql> select round(2.4);
+------------+
| round(2.4) |
+------------+
|          2 |
+------------+
mysql> select round(2.5);
+------------+
| round(2.5) |
+------------+
|          3 |
+------------+
mysql> select round(-3.4);
+-------------+
| round(-3.4) |
+-------------+
|          -3 |
+-------------+
mysql> select round(-3.5);
+-------------+
| round(-3.5) |
+-------------+
|          -4 |
+-------------+
mysql> select round(1667.2725, 2);
+---------------------+
| round(1667.2725, 2) |
+---------------------+
|             1667.27 |
+---------------------+
mysql> select round(1667.2725, -2);
+----------------------+
| round(1667.2725, -2) |
+----------------------+
|                 1700 |
+----------------------+
mysql> SELECT number
    -> , round(number * 2.5, number - 1) AS r_decimal_column
    -> , round(number * 2.5, 0) AS r_decimal_literal
    -> , round(cast(number * 2.5 AS DOUBLE), number - 1) AS r_double_column
    -> , round(cast(number * 2.5 AS DOUBLE), 0) AS r_double_literal
    -> FROM test_enhanced_round
    -> WHERE rid = 1;
+--------+------------------+-------------------+-----------------+------------------+
| number | r_decimal_column | r_decimal_literal | r_double_column | r_double_literal |
+--------+------------------+-------------------+-----------------+------------------+
|      1 |              3.0 |                 3 |               3 |                3 |
+--------+------------------+-------------------+-----------------+------------------+
```

### keywords
	ROUND, DROUND
