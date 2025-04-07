---
{
    "title": "赋值操作符",
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

赋值操作符的作用是，将操作符右侧的表达式，赋给左侧的表达式。在 Doris 中，赋值操作符只能在 UPDATE 语句的 SET 部分，以及 SET 语句中使用。详细请参考 [UPDATE 语句](../../sql-statements/data-modification/DML/UPDATE.md)和 SET 语句。

## 操作符介绍

| 操作符    | 作用                      | 示例                        |
| --------- | ------------------------- | --------------------------- |
| <x> = <y> | 将 <y> 的结果赋值给 <x>。 | `SET enable_profile = true` |
