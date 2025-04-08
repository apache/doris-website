---
{
    "title": "Operator Precedence",
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

Operator precedence determines the order in which operators are evaluated in an expression. When an expression contains multiple operators, Doris will perform calculations in descending order of operator precedence.

## Operator Precedence

The precedence decreases from top to bottom, with the highest precedence at the top.

| Precedence | Operator |
|------------|----------|
| 1          | !        |
| 2          | + (unary plus), - (unary minus), ~ (unary bitwise NOT), ^ |
| 3          | *, /, %, DIV |
| 4          | -, +     |
| 5          | &        |
| 6          | \|       |
| 7          | =(comparison), <=>, >=, >, <=, <, <>, !=, IS, LIKE, REGEXP, MATCH, IN |
| 8          | NOT      |
| 9          | AND, &&  |
| 10         | XOR      |
| 11         | OR       |
| 12         | \|\|     |