---
{
    "title": "逻辑操作符",
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

逻辑条件将两个组成部分的条件的结果进行组合，基于它们生成一个单一的结果，或者对一个条件的结果进行取反。

## 操作符介绍

| 操作符 | 作用                                                         | 示例                    |
| ------ | ------------------------------------------------------------ | ----------------------- |
| NOT    | 如果以下条件为 FALSE，则返回 TRUE。如果为 TRUE，则返回 FALSE。如果为 UNKNOWN，则保持 UNKNOWN。 | `SELECT NOT (TRUE)`     |
| AND    | 如果两个组成部分的条件都为 TRUE，则返回 TRUE。如果其中任何一个为 FALSE，则返回 FALSE。否则返回 UNKNOWN。 | `SELECT TRUE AND FALSE` |
| OR     | 如果任一组成部分的条件为 TRUE，则返回 TRUE。如果两者都为 FALSE，则返回 FALSE。否则返回 UNKNOWN。 | `SELECT TRUE OR NULL`   |

## 真值表

### NOT 真值表

|      | TRUE  | FALSE | UNKNOWN |
| :--- | :---- | :---- | :------ |
| NOT  | FALSE | TRUE  | UNKNOWN |

### AND 真值表

| AND     | TRUE    | FALSE | UNKNOWN |
| :------ | :------ | :---- | :------ |
| TRUE    | TRUE    | FALSE | UNKNOWN |
| FALSE   | FALSE   | FALSE | FALSE   |
| UNKNOWN | UNKNOWN | FALSE | UNKNOWN |

### OR 真值表

| AND     | TRUE | FALSE   | UNKNOWN |
| :------ | :--- | :------ | :------ |
| TRUE    | TRUE | TRUE    | TRUE    |
| FALSE   | TRUE | FALSE   | UNKNOWN |
| UNKNOWN | TRUE | UNKNOWN | UNKNOWN |