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

## 描述

将`x`四舍五入后保留d位小数，d默认为0。

如果d为负数，则小数点左边d位为0。

如果x或d为null，返回null。

如果 d 为一个列，并且第一个参数为 Decimal 类型，那么结果 Decimal 会跟入参 Decimal 具有相同的小数部分长度。

## 别名

- DROUND

## 语法

```sql
ROUND(x [ , d])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 待舍入的数字 |
| `<d>` | 精度，默认为0 |

## 返回值

返回一个整型或者浮点数：

- 默认情况，参数d = 0 , 返回 `x` 四舍五入后的整数。

- d 为 负数 , 返回小数点左边第一位为0的整数。

- x 和 d is NULL , 返回NULL。

- d 为一个列时 , 且 x 为Decimal类型 , 返回相同精度的浮点数。

## 举例

```sql
select round(2.4);
```

```text
+------------+
| round(2.4) |
+------------+
|          2 |
+------------+
```

```sql
select round(2.5);
```

```text
+------------+
| round(2.5) |
+------------+
|          3 |
+------------+
```

```sql
select round(-3.4);
```

```text
+-------------+
| round(-3.4) |
+-------------+
|          -3 |
+-------------+
```

```sql
select round(-3.5);
```

```text
+-------------+
| round(-3.5) |
+-------------+
|          -4 |
+-------------+
```

```sql
select round(1667.2725, 2);
```

```text
+---------------------+
| round(1667.2725, 2) |
+---------------------+
|             1667.27 |
+---------------------+
```

```sql
select round(1667.2725, -2);
```

```text
+----------------------+
| round(1667.2725, -2) |
+----------------------+
|                 1700 |
+----------------------+
```

```sql
SELECT number
, round(number * 2.5, number - 1) AS r_decimal_column
, round(number * 2.5, 0) AS r_decimal_literal
, round(cast(number * 2.5 AS DOUBLE), number - 1) AS r_double_column
, round(cast(number * 2.5 AS DOUBLE), 0) AS r_double_literal
FROM test_enhanced_round
WHERE rid = 1;
```

```text
+--------+------------------+-------------------+-----------------+------------------+
| number | r_decimal_column | r_decimal_literal | r_double_column | r_double_literal |
+--------+------------------+-------------------+-----------------+------------------+
|      1 |              3.0 |                 3 |               3 |                3 |
+--------+------------------+-------------------+-----------------+------------------+
```