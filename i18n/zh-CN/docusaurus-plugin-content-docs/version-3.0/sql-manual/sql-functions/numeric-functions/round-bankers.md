---
{
    "title": "ROUND_BANKERS",
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

## round_bankers

### description
#### Syntax

`T round_bankers(T x[, d])`
将`x`使用银行家舍入法后，保留d位小数，`d`默认为0。如果`d`为负数，则小数点左边`d`位为0。如果`x`或`d`为null，返回null。

如果 d 为一个列，并且第一个参数为 Decimal 类型，那么结果 Decimal 会跟入参 Decimal 具有相同的小数部分长度。

+ 如果舍入数介于两个数字之间，则该函数使用银行家的舍入
+ 在其他情况下，该函数将数字四舍五入到最接近的整数。


### example

```
mysql> select round_bankers(0.4);
+--------------------+
| round_bankers(0.4) |
+--------------------+
|                  0 |
+--------------------+
mysql> select round_bankers(-3.5);
+---------------------+
| round_bankers(-3.5) |
+---------------------+
|                  -4 |
+---------------------+
mysql> select round_bankers(-3.4);
+---------------------+
| round_bankers(-3.4) |
+---------------------+
|                  -3 |
+---------------------+
mysql> select round_bankers(10.755, 2);
+--------------------------+
| round_bankers(10.755, 2) |
+--------------------------+
|                    10.76 |
+--------------------------+
mysql> select round_bankers(1667.2725, 2);
+-----------------------------+
| round_bankers(1667.2725, 2) |
+-----------------------------+
|                     1667.27 |
+-----------------------------+
mysql> select round_bankers(1667.2725, -2);
+------------------------------+
| round_bankers(1667.2725, -2) |
+------------------------------+
|                         1700 |
+------------------------------+
mysql> SELECT number
    -> , round_bankers(number * 2.5, number - 1) AS rb_decimal_column
    -> , round_bankers(number * 2.5, 0) AS rb_decimal_literal
    -> , round_bankers(cast(number * 2.5 AS DOUBLE), number - 1) AS rb_double_column
    -> , round_bankers(cast(number * 2.5 AS DOUBLE), 0) AS rb_double_literal
    -> FROM test_enhanced_round
    -> WHERE rid = 1;
+--------+-------------------+--------------------+------------------+-------------------+
| number | rb_decimal_column | rb_decimal_literal | rb_double_column | rb_double_literal |
+--------+-------------------+--------------------+------------------+-------------------+
|      1 |               2.0 |                  2 |                2 |                 2 |
+--------+-------------------+--------------------+------------------+-------------------+
```

### keywords
	round_bankers
