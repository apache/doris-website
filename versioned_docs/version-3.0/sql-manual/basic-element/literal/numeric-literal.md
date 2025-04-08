---
{
    "title": "Numeric Type Literal",
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


Use numeric literals to specify fixed-point and floating-point numbers.

## Integer Literal

Integers are represented as a sequence of digits. They may have a sign. For example: +1, -2, 345.

Doris determines the type used to store integer literals based on the input value. The range mapping is shown in the table below:

| Value Range         | Type     |
| :------------------ | :------- |
| -2^8 to 2^8 - 1     | TINYINT  |
| -2^16 to 2^16 - 1   | SMALLINT |
| -2^32 to 2^32 - 1   | INT      |
| -2^64 to 2^64 - 1   | BIGINT   |
| -2^128 to 2^128 - 1 | LARGEINT |

## Fixed and Floating Point Numeric Literals

Fixed and floating point numeric literals can have an integer part, a fractional part, or both. They may have a sign. For example: 1, .2, 3.4, -5, -6.78, +9.10.

They can also be represented in scientific notation, including the significand and exponent. Either part or both can have a sign. For example: 1.2E3, 1.2E-3, -1.2E3, -1.2E-3.

Numbers represented in this way are preferentially parsed as fixed-point numbers. The range of supported fixed-point numbers is controlled by the variable `enable_decimal256`. When `enable_decimal256` is `TRUE`, the maximum precision is 76. When `enable_decimal256` is `FALSE`, the maximum precision is 38.

When the precision required by a number exceeds the maximum value representable by fixed-point numbers, it is parsed as a floating-point number, with the type DOUBLE.
