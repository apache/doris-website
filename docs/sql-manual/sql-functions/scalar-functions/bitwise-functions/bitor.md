---
{
"title": "BITOR",
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
Used to perform a bitwise OR operation on two integers.

Integer range: TINYINT, SMALLINT, INT, BIGINT, LARGEINT

## Syntax
```sql
BITOR( <lhs>, <rhs>)
```

## Parameters
| parameter | description  |
|-----------|--------------|
| `<lhs>`   | The first number involved in the bitwise AND operation |
| `<rhs>`   | The second number to be included in the bitwise AND operation |

## Return Value

Returns the result of the OR operation on two integers.

## Examples
```sql
select BITOR(3,5), BITOR(4,7);
```

```text
+---------+---------+
| (3 | 5) | (4 | 7) |
+---------+---------+
|       7 |       7 |
+---------+---------+
```