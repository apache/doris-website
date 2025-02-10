---
{
"title": "BIT_SHIFT_LEFT",
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
Functions for left shift operations are usually used to perform bit shift operations, which shift all bits of a binary number to the left by a specified number of bits. It is a form of bitwise operation that is often used to process binary data or perform efficient mathematical calculations.

For the maximum value of BIGINT type, 9223372036854775807, a one-bit left shift results in -2.
## Syntax
```sql
BIT_SHIFT_LEFT( <x>, <bits>)
```

## Parameters
| parameter | description                       |
|-----------|-----------------------------------|
| `<x>`     | The number to be shifted                         |
| `<bits>`  |The number of bits to shift left. It is an integer that determines how many bits `<x>` will be shifted left |

## Return Value

Returns an integer representing the result of a left shift operation.

## Examples
```sql
select BIT_SHIFT_LEFT(5, 2), BIT_SHIFT_LEFT(-5, 2), BIT_SHIFT_LEFT(9223372036854775807, 1);
```

```text
+----------------------+-----------------------+----------------------------------------+
| bit_shift_left(5, 2) | bit_shift_left(-5, 2) | bit_shift_left(9223372036854775807, 1) |
+----------------------+-----------------------+----------------------------------------+
|                   20 |                   -20 |                                     -2 |
+----------------------+-----------------------+----------------------------------------+
```

