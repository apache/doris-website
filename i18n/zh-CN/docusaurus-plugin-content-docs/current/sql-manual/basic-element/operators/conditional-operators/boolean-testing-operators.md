---
{
    "title": "真值检测操作符",
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

此操作符只限于使用检测是否为 TRUE，FALSE 或 NULL。关于 NULL 的介绍，请参阅 [Nulls](../../nulls.md) 章节。

## 操作符介绍

| 操作符               | 作用                                                         | 示例                     |
| -------------------- | ------------------------------------------------------------ | ------------------------ |
| <x> IS [ NOT ] TRUE  | 检测 x 是否为 TRUE。当 x 为 TRUE 时，返回 TRUE [FALSE]。否则返回 FALSE[TRUE] | `SELECT 1 IS NOT TRUE `  |
| <x> IS [ NOT ] FALSE | 检测 x 是否为 FALSE。当 x 为 FALSE 时，返回 TRUE [FALSE]。否则返回 FALSE[TRUE] | `SELECT 1 IS NOT FALSE ` |
| <x> IS [ NOT ] NULL  | 检测 x 是否为 NULL。当 x 为 NULL 时，返回 TRUE [FALSE]。否则返回 FALSE[TRUE] | `SELECT 1 IS NOT NULL `  |