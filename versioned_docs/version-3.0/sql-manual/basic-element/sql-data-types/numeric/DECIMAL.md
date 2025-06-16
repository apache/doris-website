---
{
    "title": "DECIMAL",
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

## DECIMAL

DECIMAL

### Description
    DECIMAL(P[,S])
    High-precision fixed-point number, where P represents the total count of significant digits (precision), and S is the count of decimal digits in the fractional part, to the right of the decimal point.
    The range of significant digits P is [1, MAX_P], where MAX_P=38 when enable_decimal256=false, and MAX_P=76 when enable_decimal256=true.
    The range of decimal places S is [0, P].

    By default, precision is 38, and scale is 9(that is DECIMAL(38, 9)).

    The default value of enable_decimal256 is false. Setting it to true can get more accurate results, but it will bring some performance loss.

### Precision Deduction

DECIMAL has a very complex set of type inference rules. For different expressions, different rules will be applied for precision inference.

#### Arithmetic Operations

Assuming e1(p1, s1) and e2(p2, s2) are two DECIMAL numbers, the precision deduction rules for operation results are as follows:

|Operation|Result precision|Result scale|Result precision if overflow|Result scale if overflow|Intermediate e1 type|Intermediate e2 type|
|-------|------------|---------|-----------------|--------------|--------|------|
|e1 + e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|Cast according to result|Cast according to result|
|e1 - e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|Cast according to result|Cast according to result|
|e1 * e2|p1 + p2|s1 + s2|MAX_P|<ol><li>Integer part less than 32 bits: min(scale, 38 - (precision - scale))</li><li>Integer part greater than 32 bits, and decimal part less than 6 bits: s1 + s2</li><li>Integer part greater than 32 bits, decimal part greater than or equal to 6 bits: 6</li></ol>|Unchanged|Unchanged|
|e1 / e2|p1 + s2 + `div_precision_increment`|s1 + `div_precision_increment`|MAX_P|<ol><li>precision - s1 less than max_precision - `decimal_overflow_scale`: (max_precision - (precision - s1)) + `div_precision_increment`</li><li>precision - s1 greater than max_precision - `decimal_overflow_scale`, and s1 less than `decimal_overflow_scale`: s1 + `div_precision_increment`</li><li>precision - s1 greater than max_precision - `decimal_overflow_scale`, and s1 greater than or equal to `decimal_overflow_scale`: `decimal_overflow_scale` + `div_precision_increment`</li></ol>|p cast according to result, s cast according to result+e2.scale||
|e1 % e2|max(p1 - s1,p2 - s2) + max(s1, s2)|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|Cast according to result|Cast according to result|

`div_precision_increment` is a configuration parameter of FE, see [div_precision_increment](../../../../admin-manual/config/fe-config#div_precision_increment).

`decimal_overflow_scale` is a session variable of FE, which indicates the maximum number of decimal places that can be retained in the calculation result when the precision of the decimal value calculation result overflows. The default value is 6.

#### Aggregation Operations

* SUM / MULTI_DISTINCT_SUM: SUM(DECIMAL(a, b)) -> DECIMAL(MAX_P, b).
* AVG: AVG(DECIMAL(a, b)) -> DECIMAL(MAX_P, max(b, 4)).

#### Default Rules

Except for the expressions mentioned above, other expressions use default rules for precision deduction. That is, for the expression `expr(DECIMAL(a, b))`, the result type is also DECIMAL(a, b).

#### Adjusting Result Precision

Different users have different precision requirements for DECIMAL. The above rules are the default behavior of Doris. If users **have different precision requirements, they can adjust the precision in the following ways**:

* If the expected result precision is greater than the default precision, you can adjust the result precision by adjusting the parameter's precision. For example, if the user expects to calculate `AVG(col)` and get DECIMAL(x, y) as the result, where the type of `col` is DECIMAL (a, b), the expression can be rewritten to `AVG(CAST(col as DECIMAL (x, y))`.
* If the expected result precision is less than the default precision, the desired precision can be obtained by approximating the output result. For example, if the user expects to calculate `AVG(col)` and get DECIMAL(x, y) as the result, where the type of `col` is DECIMAL(a, b), the expression can be rewritten as `ROUND(AVG(col), y)`.

### Why DECIMAL is Required

DECIMAL in Doris is a real high-precision fixed-point number. Decimal has the following core advantages:
1. It can represent a wider range. The value ranges of both precision and scale in DECIMAL have been significantly expanded.
2. Higher performance. The old version of DECIMAL requires 16 bytes in memory and 12 bytes in storage, while DECIMAL has made adaptive adjustments as shown below.

|     precision        | Space occupied (memory/disk) |
|----------------------|-------------------|
| 0 < precision <= 9   |      4 bytes      |
| 9 < precision <= 18  |      8 bytes      |
| 18 < precision <= 38 |     16 bytes      |
| 38 < precision <= 76 |     32 bytes      |

3. More complete precision deduction. For different expressions, different precision inference rules are applied to deduce the precision of the results.

### keywords
DECIMAL
