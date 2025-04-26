---
{
    "title": "Bitwise Operators",
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

Bitwise operators perform specified operations on one or two expressions at the bit level. These operators only accept arguments of the `BIGINT` type. Therefore, any expressions processed by bitwise operators will be converted to the `BIGINT` type.  

## Operator Overview  

| Operator | Function                                                                                     | Example         |  
|----------|----------------------------------------------------------------------------------------------|-----------------|  
| `&`      | Performs a bitwise AND operation. If both corresponding bits are `1`, the result bit is `1`; otherwise, it is `0`. | `SELECT 1 & 2` |  
| `\|`     | Performs a bitwise OR operation. If either corresponding bit is `1`, the result bit is `1`; otherwise, it is `0`.  | `SELECT 1 | 2` |  
| `^`      | Performs a bitwise XOR operation. If the corresponding bits differ, the result bit is `1`; otherwise, it is `0`.   | `SELECT 1 ^ 2` |  
| `~`      | Performs a bitwise NOT operation. Inverts each bit: `1` becomes `0`, and `0` becomes `1`.                          | `SELECT ~1`    |  


