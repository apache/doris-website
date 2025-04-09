---
{
    "title": "Comparison Operators",
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

## Description

Comparison conditions compare one expression with another. The result of the comparison can be TRUE, FALSE, or UNKNOWN.

## Operator Introduction

| Operator | Function | Example |
| ------------------- | ----------------------------------------------------------- | ------------------- |
| `=` | Equality comparison. If either side of the comparison is UNKNOWN, the result is UNKNOWN. | `SELECT 1 = 1` |
| `<=>` | NULL-safe equality comparison. Unlike equality comparison, NULL-safe equality treats NULL as a comparable value. Returns TRUE when both sides are NULL. Returns FALSE when only one side is NULL. This operator never returns UNKNOWN. | `SELECT NULL <=> NULL` |
| `!=` `<>` | Inequality comparison | `SELECT 1 != 1` |
| `<` `>` | Greater than and less than comparison | `SELECT 1 > 1` |
| `<=` `>=` | Greater than or equal to and less than or equal to comparison | `SELECT 1 >= 1` |
| `<x> BETWEEN <y> AND <z>` | Equivalent to `<x> >= <y> and <x> <= <z>`. Greater than or equal to `<y>` and less than or equal to `<z>` | `SELECT 1 BETWEEN 0 AND 2` |