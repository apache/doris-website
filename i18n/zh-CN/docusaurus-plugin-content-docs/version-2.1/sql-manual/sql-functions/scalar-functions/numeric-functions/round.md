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

将数字 `x` 四舍五入后保留 `d` 位小数。
- 如果没有指定 `d`，则将 `x` 四舍五入到最近的整数。
- 如果 `d` 为负数，则结果小数点左边 `d` 位为 0。
- 如果 `x` 或 `d` 为 `null` ，返回 `null`。
- 如果 `d` 为一个列，并且第一个参数为 `Decimal` 类型，那么结果 `Decimal` 会跟入参 `Decimal` 具有相同的小数部分长度。

## 别名

- `DROUND`

## 语法
```sql
ROUND(<x> [ , <d> ])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 需要四舍五入的数值 |
| `<d>` | 可选，四舍五入需要保留的小数位数 |

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
CREATE TABLE test_enhanced_round (
    rid int, flo float, dou double,
    dec90 decimal(9, 0), dec91 decimal(9, 1), dec99 decimal(9, 9),
    dec100 decimal(10,0), dec109 decimal(10,9), dec1010 decimal(10,10),
    number int DEFAULT 1)
DISTRIBUTED BY HASH(rid)
PROPERTIES("replication_num" = "1" );

INSERT INTO test_enhanced_round
VALUES
(1, 12345.123, 123456789.123456789,
    123456789, 12345678.1, 0.123456789,
    123456789.1, 1.123456789, 0.123456789, 1);

SELECT number, dec90, round(dec90, number), dec91, round(dec91, number), dec99, round(dec99, number) FROM test_enhanced_round order by rid;
```

```text
+--------+-----------+----------------------+------------+----------------------+-------------+----------------------+
| number | dec90     | round(dec90, number) | dec91      | round(dec91, number) | dec99       | round(dec99, number) |
+--------+-----------+----------------------+------------+----------------------+-------------+----------------------+
|      1 | 123456789 |            123456789 | 12345678.1 |           12345678.1 | 0.123456789 |          0.100000000 |
+--------+-----------+----------------------+------------+----------------------+-------------+----------------------+
```

## 注意事项
2.5 会舍入到 3，如果想要舍入到 2 的算法，请使用 `round_bankers` 函数。
