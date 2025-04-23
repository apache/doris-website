---
{
    "title": "Boolean Testing Operators",
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

This operator is used exclusively to check for TRUE, FALSE, or NULL. For an introduction to NULL, please refer to the "Nulls" section.

## Operator Introduction

| Operator | Function | Example |
| -------------------- | ------------------------------------------------------------ | ------------------------ |
| `x IS [NOT] TRUE` | Checks if x is TRUE. Returns TRUE if x is TRUE, otherwise returns FALSE. | `SELECT 1 IS NOT TRUE` |
| `x IS [NOT] FALSE` | Checks if x is FALSE. Returns TRUE if x is FALSE, otherwise returns FALSE. | `SELECT 1 IS NOT FALSE` |
| `x IS [NOT] NULL` | Checks if x is NULL. Returns TRUE if x is NULL, otherwise returns FALSE. | `SELECT 1 IS NOT NULL` |