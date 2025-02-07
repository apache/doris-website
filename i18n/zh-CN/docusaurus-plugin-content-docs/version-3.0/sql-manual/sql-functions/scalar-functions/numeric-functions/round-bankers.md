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

## 描述

将`x`使用银行家舍入法后，保留d位小数，`d`默认为0。

如果`d`为负数，则小数点左边`d`位为0。

如果`x`或`d`为null，返回null。

如果 d 为一个列，并且第一个参数为 Decimal 类型，那么结果 Decimal 会跟入参 Decimal 具有相同的小数部分长度。

根据银行家舍入算法的规则，当需要舍入到指定的小数位时：

- 如果要舍入的数字是5，且后面没有其他非零数字，则会检查前一位数字：
   - 如果前一位数字是偶数，则直接舍去；
   - 如果前一位数字是奇数，则向上进一。

- 如果要舍入的数字大于5或者其后有非0的数字，则按照传统的四舍五入规则进行：即大于等于5则进位，否则舍去。

例如：

- 对于数值2.5，由于5前面的数字2是偶数，因此结果将舍入为2。

- 对于数值3.5，由于5前面的数字3是奇数，因此结果将舍入为4。

- 对于数值2.51，因为5后面的数字不是0，所以直接进位，结果为3。

## 语法

```sql
ROUND_BANKERS(x [ , d])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 待舍入的数字 |
| `<d>` | 精度，默认为0 |

## 返回值

返回一个整型或者浮点数：

- 默认情况，参数d = 0 , 返回 `x` 根据银行家舍入算法计算过的整数。

- d 为 负数 , 返回小数点左边第一位为0的整数。

- x 和 d is NULL , 返回NULL。

- d 为一个列时 , 且 `x` 为Decimal类型 , 返回相同精度的浮点数。

## 举例

```sql
select round_bankers(0.4);
```

```text
+--------------------+
| round_bankers(0.4) |
+--------------------+
|                  0 |
+--------------------+
```

```sql
select round_bankers(-3.5);
```

```text
+---------------------+
| round_bankers(-3.5) |
+---------------------+
|                  -4 |
+---------------------+
```

```sql
select round_bankers(-3.4);
```

```text
+---------------------+
| round_bankers(-3.4) |
+---------------------+
|                  -3 |
+---------------------+
```

```sql
select round_bankers(10.755, 2);
```

```text
+--------------------------+
| round_bankers(10.755, 2) |
+--------------------------+
|                    10.76 |
+--------------------------+
```

```sql
select round_bankers(10.745, 2);
```

```text
+--------------------------+
| round_bankers(10.745, 2) |
+--------------------------+
|                    10.74 |
+--------------------------+
```

```sql
select round_bankers(1667.2725, -2);
```

```text
+------------------------------+
| round_bankers(1667.2725, -2) |
+------------------------------+
|                         1700 |
+------------------------------+
```

```sql
SELECT number
, round_bankers(number * 2.5, number - 1) AS rb_decimal_column
, round_bankers(number * 2.5, 0) AS rb_decimal_literal
, round_bankers(cast(number * 2.5 AS DOUBLE), number - 1) AS rb_double_column
, round_bankers(cast(number * 2.5 AS DOUBLE), 0) AS rb_double_literal
FROM test_enhanced_round
WHERE rid = 1;
```

```text
+--------+-------------------+--------------------+------------------+-------------------+
| number | rb_decimal_column | rb_decimal_literal | rb_double_column | rb_double_literal |
+--------+-------------------+--------------------+------------------+-------------------+
|      1 |               2.0 |                  2 |                2 |                 2 |
+--------+-------------------+--------------------+------------------+-------------------+
```
