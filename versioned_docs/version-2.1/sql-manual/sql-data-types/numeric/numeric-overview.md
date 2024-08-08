---
{
    "title": "Overview",
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



Doris supports the following numeric data types:

## BOOLEAN

There are two possible values: 0 represents false, and 1 represents true.

For more info, please refer [BOOLEAN](../numeric/BOOLEAN.md)。

## Integer

All are signed integers. The differences among the INT types are the number of bytes occupied and the range of values they can represent:

- **[TINYINT](../numeric/TINYINT.md)**: 1 byte, [-128, 127]

- **[SMALLINT](../numeric/SMALLINT.md)**: 2 bytes, [-32768, 32767]

- **[INT](../numeric/INT.md)**: 4 bytes, [-2147483648, 2147483647]

- **[BIGINT](../numeric/BIGINT.md)**: 8 bytes, [-9223372036854775808, 9223372036854775807]

- **[LARGEINT](../numeric/LARGEINT.md)**: 16 bytes, [-2^127, 2^127 - 1]


## Floating-point types


Including imprecise floating-point types [FLOAT](../numeric/FLOAT.md) and [DOUBLE](../numeric/DOUBLE.md), corresponding to the `float` and `double` in common programming languages

## Fixed-point type

The precise fixed-point type [DECIMAL](../numeric/DECIMAL.md), used in financial and other cases that require strict accuracy.