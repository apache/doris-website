---
{
    "title": "数学操作符",
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

你可以使用一个或两个参数的算术运算符来对数值进行取反、加法、减法、乘法和除法运算。其中一些运算符也用于日期时间和间隔的算术运算。运算符的参数必须解析为数值数据类型，或者可以隐式转换为数值数据类型的任何数据类型。

一元算术运算符返回与参数数值数据类型相同的数据类型。对于二元算术运算符，Doris 会根据隐式类型转换规则将参数转换为合适的类型做运算，并返回合适的类型作为结果，具体转换规则请参阅"类型转换"部分。

## 操作符介绍

| 操作符 | 作用                                       | 示例                                              |
|--------------------|-------------------------------------------------------------|-------------------------------------------------------------|
| `+` `-`            | 一元操作符。表示对一个表达式取正值或负值操作。等价于 `0 + a` 和 `0 - a` | ```sql <br>SELECT +(5 + 3), -(5 + 3);<br>/* 结果：<br>+---------+---------------+<br>\| (5 + 3) \| (0 - (5 + 3)) \|<br>+---------+---------------+<br>\| 8       \| -8            \|<br>+---------+---------------+ */<br>``` |
| `+` `-`            | 二元操作符。表示对两个表达式求加法或减法                     | ```sql <br>SELECT 5 + 3, 5 - 3;<br>/* 结果：<br>+---------+---------+<br>\| (5 + 3) \| (5 - 3) \|<br>+---------+---------+<br>\| 8       \| 2       \|<br>+---------+---------+ */<br>``` |
| `*` `/`            | 二元操作符。表示对两个表达式求乘法或者除法。当除数为 0 时返回 NULL | ```sql <br>SELECT 5 * 3, 5 / 3;<br>/* 结果：<br>+---------+-----------------------------------------+<br>\| (5 * 3) \| (cast(5 as DOUBLE) / cast(3 as DOUBLE)) \|<br>+---------+-----------------------------------------+<br>\| 15      \| 1.6666666666666667                      \|<br>+---------+-----------------------------------------+ */<br>``` |
| `DIV`              | 二元操作符。表示对两个表达式求整数除法。当除数为 0 时返回 NULL    | ```sql <br>SELECT 5 DIV 3, 9 DIV 0;<br>/* 结果：<br>+-----------+-----------+<br>\| (5 DIV 3) \| (9 DIV 0) \|<br>+-----------+-----------+<br>\| 1         \| NULL      \|<br>+-----------+-----------+ */<br>``` |
| `%`                | 二元操作符。表示对两个表达式求余。当除数为 0 时返回 NULL         | ```sql <br>SELECT 5 % 3, 9 % 0;<br>/* 结果：<br>+---------+---------+<br>\| (5 % 3) \| (9 % 0) \|<br>+---------+---------+<br>\| 2       \| NULL    \|<br>+---------+---------+ */<br>``` |

## 注意事项

在算术表达式中：
1. 不要使用连续减号`--`表示双重否定（这是 SQL 注释符号）
2. 需要时请用空格或括号分隔：`-(-5)` 或 `- -5`
3. 更多注释规范请参阅[注释](../comments.md)章节