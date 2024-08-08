---
{
    "title": "数值类型概览",
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


数值类型包括以下 4 种：

## BOOLEAN 类型

两种取值，0 代表 false，1 代表 true。

更多信息参考 [BOOLEAN 文档](../numeric/BOOLEAN.md)。

## 整数类型

都是有符号整数，xxINT 的差异是占用字节数和表示范围

1. TINYINT 占 1 字节，范围 [-128, 127], 更多信息参考 [TINYINT 文档](../numeric/TINYINT.md)。

2. SMALLINT 占 2 字节，范围 [-32768, 32767], 更多信息参考 [SMALLINT 文档](../numeric/SMALLINT.md)。

3. INT 占 4 字节，范围 [-2147483648, 2147483647], 更多信息参考 [INT 文档](../numeric/INT.md)。

4. BIGINT 占 8 字节，范围 [-9223372036854775808, 9223372036854775807], 更多信息参考 [BIGINT 文档](../numeric/BIGINT.md)。

5. LARGEINT 占 16 字节，范围 [-2^127, 2^127 - 1], 更多信息参考 [LARGEINT 文档](../numeric/LARGEINT.md)。

## 浮点数类型

不精确的浮点数类型 FLOAT 和 DOUBLE，和常见编程语言中的 float 和 double 对应。

更多信息参考 [FLOAT](../numeric/FLOAT.md)、[DOUBLE](../numeric/DOUBLE.md) 文档。

## 定点数类型

精确的定点数类型 DECIMAL，用于金融等精度要求严格准确的场景。

更多信息参考 [DECIMAL](../numeric/DECIMAL.md) 文档。