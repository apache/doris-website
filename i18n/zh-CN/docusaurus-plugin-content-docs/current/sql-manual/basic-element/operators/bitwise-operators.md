---
{
    "title": "位操作符",
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

位操作符对一个表达式或者两个表达式按照位进行制定的操作。位操作符只能接收 BIGINT 类型作为参数。所以，位操作处理的表达式都会被转换为 BIGINT 类型。

## 操作符介绍

| 操作符 | 作用                                                         | 示例           |
| ------ | ------------------------------------------------------------ | -------------- |
| &      | 按位执行与操作。当两个表达式对应的位均为 1 时，结果对应的位置为 1，否则为 0。 | `SELECT 1 & 2` |
| \|     | 按位执行或操作。当两个表达式对应的位任意一个为 1 时，结果对应的位置为 1，否则为 0。 | `SELECT 1 | 2` |
| ^      | 按位执行异或操作。当两个表达式对应不同时，结果对应的位置为 1，否则为 0。 | `SELECT 1 ^ 2` |
| ~      | 按位执行取反操作。当表达式的位为 1 时，结果对应的位置为 0，否则为 1。 | `SELECT ~1`    |