---
{
    "title": "数值类型字面量",
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

使用数字字面量表示法来指定定点数和浮点数。

## 整数字面量

整数表示为一系列数字。可能有符号。例如：+1，-2，345。

Doris 依据输入数值，来决定使用何种类型来存储整数字面量。范围映射关系，参见下表：

| 数值范围           | 类型     |
| :----------------- | :------- |
| -2^8 ~ 2^8 - 1     | TINYINT  |
| -2^16 ~ 2^16 - 1   | SMALLINT |
| -2^32 ~ 2^32 - 1   | INT      |
| -2^64 ~ 2^64 - 1   | BIGINT   |
| -2^128 ~ 2^128 - 1 | LARGEINT |

## 定点和浮点数字面量

定点和浮点数字面量有整数部分或小数部分，或两者兼有。它们可能有符号。例如：1、.2、3.4、-5、-6.78、+9.10。

也可以用科学记数法表示，包括尾数和指数。其中一部分或两部分都可能有符号。例如：1.2E3、1.2E-3、-1.2E3、-1.2E-3。

此种表示的数字，优先被解析为定点数。定点数的支持范围受变量`enable_decimal256` 控制。当`enable_decimal256`为`TRUE`时，其最大精度为 76。当`enable_decimal256`为`FALSE`时，其最大精度为 38。

当数字需要的精度超过定点数可以表示的最大值时，其被解析为浮点数，类型为 DOUBLE。