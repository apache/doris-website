---
{
    "title": "比较操作符",
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

比较条件将一个表达式与另一个表达式进行比较。比较的结果可以是 TRUE、FALSE 或 UNKNOWN。

## 操作符介绍

| 操作符                    | 作用                                                         | 示例                       |
| ------------------------- | ------------------------------------------------------------ | -------------------------- |
| `=`                       | 等值比较。当比较的两侧任意一个值为 UNKNOWN 时，结果为 UNKNWON。 | `SELECT 1 = 1`             |
| `<=>`                     | NULL 安全的等值比较。不同于等值比较。NULL 安全的等值比较将 NULL 视作一个可比较的值。当比较两侧均为 NULL 时，返回 TRUE。当只有一侧为 NULL 时，返回 FALSE。此操作符永远不会返回 UNKNOWN。 | `SELECT NULL <=> NULL`     |
| `!=``<>`                  | 不等比较                                                     | `SELECT 1 != 1`            |
| `<``>`                    | 大于比较和小与比较                                           | `SELECT 1 > 1`             |
| `<=``>=`                  | 大于等于比较和小于等于比较                                   | `SELECT 1 >= 1`            |
| `<x> BETWEEN <y> AND <z>` | 等价于 `<x> >= <y> and <x> <= <z>`。大于等于 `<y>` 且小于等于 `<z>` | `SELECT 1 BETWEEN 0 AND 2` |