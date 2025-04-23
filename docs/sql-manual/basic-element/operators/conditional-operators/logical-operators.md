---
{
    "title": "Logic Operators",
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

Logical conditions combine the results of two components' conditions to generate a single result based on them, or to invert the result of a condition.

## Operator Introduction

| Operator | Function                                                      | Example                |
| ------- | ------------------------------------------------------------ | ---------------------- |
| NOT    | Returns TRUE if the following condition is FALSE. Returns FALSE if TRUE. If it is UNKNOWN, it remains UNKNOWN. | `SELECT NOT (TRUE)`     |
| AND    | Returns TRUE if both components' conditions are TRUE. Returns FALSE if either is FALSE. Otherwise, returns UNKNOWN. | `SELECT TRUE AND FALSE` |
| OR     | Returns TRUE if either component's condition is TRUE. Returns FALSE if both are FALSE. Otherwise, returns UNKNOWN. | `SELECT TRUE OR NULL`  |

## Truth Tables

### NOT Truth Table

|       | TRUE   | FALSE | UNKNOWN |
| :----  | :------ | :------ |
| NOT    | FALSE  | TRUE   | UNKNOWN |

### AND Truth Table

| AND      | TRUE    | FALSE | UNKNOWN |
| :------ | :------ | :---- | :------ |
| TRUE    | TRUE    | FALSE | UNKNOWN |
| FALSE   | FALSE   | FALSE | FALSE   |
| UNKNOWN | UNKNOWN | FALSE | UNKNOWN |

### OR Truth Table

| OR       | TRUE | FALSE   | UNKNOWN |
| :------ | :--- | :------ | :------ |
| TRUE    | TRUE | TRUE    | TRUE    |
| FALSE   | TRUE | FALSE   | UNKNOWN |
| UNKNOWN | TRUE | UNKNOWN | UNKNOWN |