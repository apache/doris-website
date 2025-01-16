---
{
"title": "BIT_TEST",
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
Convert the value of `<x>` to binary form and return the value of the specified position `<bits>`, where `<bits>` starts from 0 and goes from right to left.

If `<bits>` has multiple values, the values at multiple `<bits>` positions are combined using the AND operator and the final result is returned.

If the value of `<bits>` is negative or exceeds the total number of bits in `<x>`, the result will be 0.

Integer `<x>` range: TINYINT, SMALLINT, INT, BIGINT, LARGEINT.

## Alias
BIT_TEST_ALL

## Syntax
```sql
BIT_TEST( <x>, <bits>[, <bits> ... ])
```

## Parameters
| parameter | description |
|-----------|-------------|
| `<x>`     | The integer to be calculated     |
| `<bits>`  | The value at the specified position      |

## Return Value

Returns the value at the specified position

## Examples

```sql
select BIT_TEST(43, 1), BIT_TEST(43, -1), BIT_TEST(43, 0, 1, 3, 5,2);
```

```text
+-----------------+------------------+-----------------------------+
| bit_test(43, 1) | bit_test(43, -1) | bit_test(43, 0, 1, 3, 5, 2) |
+-----------------+------------------+-----------------------------+
|               1 |                0 |                           0 |
+-----------------+------------------+-----------------------------+
```