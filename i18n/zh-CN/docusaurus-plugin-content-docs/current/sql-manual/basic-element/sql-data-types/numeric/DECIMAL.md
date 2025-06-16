---
{
"title": "DECIMAL",
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

## DECIMAL

DECIMAL

## 描述
    DECIMAL(P[,S])
    高精度定点数，P 代表一共有多少个有效数字(precision)，S 代表小数位有多少数字(scale)。
    有效数字 P 的范围是 [1, MAX_P]，enable_decimal256=false时，MAX_P=38, enable_decimal256=true时，MAX_P=76。
    小数位数字数量 S 的范围是 [0, P]。

    P默认值是38，S默认是9（DECIMAL(38, 9)）。

    enable_decimal256 的默认值是false，设置为true 可以获得更加精确的结果，但是会带来一些性能损失。

### 精度推演

DECIMAL 有一套很复杂的类型推演规则，针对不同的表达式，会应用不同规则进行精度推断。

#### 四则运算

假定e1(p1, s1)和e2(p2, s2)是两个DECIMAL类型的数字，运算结果精度推演规则如下：

|运算|结果precision|结果scale|溢出时结果precision|溢出时结果scale|中间结果e1类型|中间e2类型|
|-------|------------|---------|-----------------|--------------|--------|------|
|e1 + e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|按照结果cast|按照结果cast|
|e1 - e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2) |按照结果cast|按照结果cast|
|e1 * e2|p1 + p2|s1 + s2|MAX_P|<ol><li>整数部分小于32位：min(scale, 38 - (precision - scale))</li><li>整数部分大于32位，且小数部分小于6位：s1 + s2</li><li>整数部分大于32位，小数部分大于等于6位：6</li></ol>|不变|不变|
|e1 / e2|p1 + s2 + `div_precision_increment`|s1 + `div_precision_increment`|MAX_P|<ol><li>precision - s1小于max_precision - `decimal_overflow_scale`：(max_precision - (precision - s1))+  `div_precision_increment`</li><li>precision - s1大于max_precision - `decimal_overflow_scale`，且s1小于`decimal_overflow_scale`：s1 +  `div_precision_increment`</li><li>precision - s1大于max_precision - `decimal_overflow_scale`，且s1大于等于`decimal_overflow_scale`：`decimal_overflow_scale` +  `div_precision_increment`</li></ol>|p按照结果cast，s按照结果+e2.scale cast||
|e1 % e2|max(p1 - s1,p2 - s2) + max(s1, s2) |max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2) |按照结果cast|按照结果cast|

`div_precision_increment`是FE的配置参数，参见[div_precision_increment](../../../../admin-manual/config/fe-config#div_precision_increment)。

`decimal_overflow_scale`是FE的session variable，表示当decimal数值计算结果精度溢出时，计算结果最多可保留的小数位数，默认值是6。

#### 聚合运算

* SUM / MULTI_DISTINCT_SUM: SUM(DECIMAL(a, b)) -> DECIMAL(MAX_P, b).
* AVG: AVG(DECIMAL(a, b)) -> DECIMAL(MAX_P, max(b, 4)).

#### 默认规则

除上述提到的函数外，其余表达式都使用默认规则进行精度推演。即对于表达式 `expr(DECIMAL(a, b))`，结果类型同样也是 DECIMAL(a, b)。

#### 调整结果精度

不同用户对 DECIMAL 的精度要求各不相同，上述规则为当前 Doris 的默认行为，如果用户**有不同的精度需求，可以通过以下方式进行精度调整**：
1. 如果期望的结果精度大于默认精度，可以通过调整入参精度来调整结果精度。例如用户期望计算`AVG(col)`得到 DECIMAL(x, y) 作为结果，其中`col`的类型为 DECIMAL(a, b)，则可以改写表达式为`AVG(CAST(col as DECIMAL(x, y)))`。
2. 如果期望的结果精度小于默认精度，可以通过对输出结果求近似得到想要的精度。例如用户期望计算`AVG(col)`得到 DECIMAL(x, y) 作为结果，其中`col`的类型为 DECIMAL(a, b)，则可以改写表达式为`ROUND(AVG(col), y)`。

### 为什么需要 DECIMAL

Doris 中的 DECIMAL 是真正意义上的高精度定点数，Decimal 有以下核心优势：
1. 可表示范围更大。DECIMAL 中 precision 和 scale 的取值范围都进行了明显扩充。
2. 性能更高。老版本的 DECIMAL 在内存中需要占用 16 bytes，在存储中占用 12 bytes，而 DECIMAL 进行了自适应调整（如下表格）。

|     precision        | 占用空间（内存/磁盘）|
|----------------------|-------------------|
| 0 < precision <= 9   |      4 bytes      |
| 9 < precision <= 18  |      8 bytes      |
| 18 < precision <= 38 |     16 bytes      |
| 38 < precision <= 76 |     32 bytes      |

3. 更完备的精度推演。对于不同的表达式，应用不同的精度推演规则对结果的精度进行推演。

### keywords
    DECIMAL
