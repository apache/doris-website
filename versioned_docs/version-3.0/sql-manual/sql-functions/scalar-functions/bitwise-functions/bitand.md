---
{
"title": "BITAND",
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
Used to perform a bitwise AND operation. The bitwise AND operation compares each bit of two integers. The result is 1 only when both corresponding binary bits are 1, otherwise it is 0.

Integer range: TINYINT, SMALLINT, INT, BIGINT, LARGEINT

## Syntax
```sql
BITAND( <lhs>, <rhs>)
```

## Parameters
| parameter | description  |
|-----------|--------------|
| `<lhs>`   | The first number involved in the bitwise AND operation |
| `<rhs>`   | The second number to be included in the bitwise AND operation |

## Return Value

Returns the result of the AND operation on two integers.


## Examples

```sql
select BITAND(3,5), BITAND(4,7);
```

```text
+---------+---------+
| (3 & 5) | (4 & 7) |
+---------+---------+
|       1 |       4 |
+---------+---------+

```
