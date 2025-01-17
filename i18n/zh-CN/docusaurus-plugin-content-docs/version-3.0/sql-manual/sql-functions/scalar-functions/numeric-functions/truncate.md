---
{
    "title": "TRUNCATE",
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

按照保留小数的位数 d 对 x 进行数值截取。

## 语法

```sql
TRUNCATE(<x>, <d>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 需要被数值截取的值 |
| `<d>` | 保留小数的位数 |

## 返回值

按照保留小数的位数 d 对 x 进行数值截取。截取规则：

如果 `d` 为字面量：

- 当`d > 0`时：保留`x`的`d`位小数  
- 当`d = 0`时：将`x`的小数部分去除，只保留整数部分  
- 当`d < 0`时：将`x`的小数部分去除，整数部分按照 `d`所指定的位数，采用数字`0`进行替换

如果 `d` 为一个列，并且第一个参数为 Decimal 类型，那么结果 Decimal 会跟入参 Decimal 具有相同的小数部分长度。

## 举例

 d 为字面量

```sql
select truncate(124.3867, 2),truncate(124.3867, 0),truncate(124.3867, -2);
```

```text
+-----------------------+-----------------------+------------------------+
| truncate(124.3867, 2) | truncate(124.3867, 0) | truncate(124.3867, -2) |
+-----------------------+-----------------------+------------------------+
|                124.38 |                   124 |                    100 |
+-----------------------+-----------------------+------------------------+
```

 d 为一个列

```sql
select cast("123.123456" as Decimal(9,6)), number, truncate(cast ("123.123456" as Decimal(9,6)), number) from numbers("number"="5");
```

```text
+---------------------------------------+--------+----------------------------------------------------------------------+
| cast('123.123456' as DECIMALV3(9, 6)) | number | truncate(cast('123.123456' as DECIMALV3(9, 6)), cast(number as INT)) |
+---------------------------------------+--------+----------------------------------------------------------------------+
|                            123.123456 |      0 |                                                           123.000000 |
|                            123.123456 |      1 |                                                           123.100000 |
|                            123.123456 |      2 |                                                           123.120000 |
|                            123.123456 |      3 |                                                           123.123000 |
|                            123.123456 |      4 |                                                           123.123400 |
+---------------------------------------+--------+----------------------------------------------------------------------+
```
