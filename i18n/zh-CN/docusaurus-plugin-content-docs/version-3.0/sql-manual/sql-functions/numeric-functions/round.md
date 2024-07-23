---
{
    "title": "ROUND",
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

## round

### description
#### Syntax

`T round(T x[, d])`
将`x`四舍五入后保留d位小数，d默认为0。如果d为负数，则小数点左边d位为0。如果x或d为null，返回null。
2.5会舍入到3，如果想要舍入到2的算法，请使用round_bankers函数。

如果 d 为一个列，并且第一个参数为 Decimal 类型，那么结果 Decimal 会跟入参 Decimal 具有相同的小数部分长度。

:::tip
该函数的另一个别名为 `dround`。
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
