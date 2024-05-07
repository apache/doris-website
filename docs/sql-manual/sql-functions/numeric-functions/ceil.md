---
{
    "title": "CEIL",
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

## ceil

### description
#### Syntax

`T ceil(T x[, d])`

If not specified `d`: returns the smallest integer value less than or equal to `x`, which is **the most common usage**.
Otherwise, returns the smallest round number that is less than or equal to `x` and flowing the rules:

If `d` is specified as literal:  
`d` = 0: just like without `d`
`d` > 0 or `d` < 0: the round number would be a multiple of `1/(10^d)`, or the nearest number of the appropriate data type if `1/(10^d)` isn't exact.

Else if `d` is a column, and `x` has Decimal type, scale of result Decimal will always be same with input Decimal.

:::tip
The other alias for this function are `dceil` and `ceiling`.
:::

### example

```
mysql> select ceil(1);
+-----------+
| ceil(1.0) |
+-----------+
|         1 |
+-----------+
mysql> select ceil(2.4);
+-----------+
| ceil(2.4) |
+-----------+
|         3 |
+-----------+
mysql> select ceil(-10.3);
+-------------+
| ceil(-10.3) |
+-------------+
|         -10 |
+-------------+
mysql> select ceil(123.45, 1), ceil(123.45), ceil(123.45, 0), ceil(123.45, -1);
+-----------------+--------------+-----------------+------------------+
| ceil(123.45, 1) | ceil(123.45) | ceil(123.45, 0) | ceil(123.45, -1) |
+-----------------+--------------+-----------------+------------------+
|           123.5 |          124 |             124 |              130 |
+-----------------+--------------+-----------------+------------------+
mysql> SELECT number
    -> , ceil(number * 2.5, number - 1) AS c_decimal_column
    -> , ceil(number * 2.5, 0) AS c_decimal_literal
    -> , ceil(cast(number * 2.5 AS DOUBLE), number - 1) AS c_double_column
    -> , ceil(cast(number * 2.5 AS DOUBLE), 0) AS c_double_literal
    -> FROM test_enhanced_round
    -> WHERE rid = 1;
+--------+------------------+-------------------+-----------------+------------------+
| number | c_decimal_column | c_decimal_literal | c_double_column | c_double_literal |
+--------+------------------+-------------------+-----------------+------------------+
|      1 |              3.0 |                 3 |               3 |                3 |
+--------+------------------+-------------------+-----------------+------------------+
```

### keywords
	CEIL, DCEIL, CEILING
