---
{
    "title": "Arithmetic Operators",
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

## Description

You can use arithmetic operators with one or two parameters to perform negation, addition, subtraction, multiplication, and division on numbers. Some of these operators are also used for arithmetic operations on date and time intervals. The parameters of the operators must be parsed as numeric data types, or any data type that can be implicitly converted to numeric data types.

Unary arithmetic operators return the same data type as the parameter numeric data type. For binary arithmetic operators, Doris will convert the parameters to the appropriate type for computation according to implicit type conversion rules, and return the appropriate type as the result. For specific conversion rules, please refer to the "Type Conversion" section.

## Operators

| Operator | Purpose | Example |
|----------|---------|---------|
| `+` `-`  | Unary operators. Indicate taking the positive or negative value of an expression. Equivalent to `0 + a` and `0 - a` | ```sql <br>SELECT +(5 + 3), -(5 + 3);<br>/* Result:<br>+---------+---------------+<br>\| (5 + 3) \| (0 - (5 + 3)) \|<br>+---------+---------------+<br>\| 8       \| -8            \|<br>+---------+---------------+ */<br>``` |
| `+` `-`  | Binary operators. Indicate addition or subtraction of two expressions | ```sql <br>SELECT 5 + 3, 5 - 3;<br>/* Result:<br>+---------+---------+<br>\| (5 + 3) \| (5 - 3) \|<br>+---------+---------+<br>\| 8       \| 2       \|<br>+---------+---------+ */<br>``` |
| `*` `/`  | Binary operators. Indicate multiplication or division of two expressions. Returns NULL when the divisor is 0 | ```sql <br>SELECT 5 * 3, 5 / 3;<br>/* Result:<br>+---------+-----------------------------------------+<br>\| (5 * 3) \| (cast(5 as DOUBLE) / cast(3 as DOUBLE)) \|<br>+---------+-----------------------------------------+<br>\| 15      \| 1.6666666666666667                      \|<br>+---------+-----------------------------------------+ */<br>``` |
| `DIV`    | Binary operator. Indicates integer division of two expressions. Returns NULL when the divisor is 0 | ```sql <br>SELECT 5 DIV 3, 9 DIV 0;<br>/* Result:<br>+-----------+-----------+<br>\| (5 DIV 3) \| (9 DIV 0) \|<br>+-----------+-----------+<br>\| 1         \| NULL      \|<br>+-----------+-----------+ */<br>``` |
| `%`      | Binary operator. Indicates the remainder of two expressions. Returns NULL when the divisor is 0 | ```sql <br>SELECT 5 % 3, 9 % 0;<br>/* Result:<br>+---------+---------+<br>\| (5 % 3) \| (9 % 0) \|<br>+---------+---------+<br>\| 2       \| NULL    \|<br>+---------+---------+ */<br>``` |

## Usage Notes

In arithmetic expressions:
1. Do not use consecutive minus signs `--` to indicate double negation (this is the SQL comment symbol)
2. Use spaces or parentheses to separate as needed: `-(-5)` or `- -5`
3. For more comment standards, please refer to the "Comments" section