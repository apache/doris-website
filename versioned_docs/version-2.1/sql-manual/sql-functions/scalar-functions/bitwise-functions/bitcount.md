---
{
"title": "BIT_COUNT",
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
Used to return the number of 1 bits in the binary representation of an integer value. This function can be used to quickly count the number of "active" bits of an integer in the binary representation, and is usually used to analyze data distribution or perform certain bit operations

## Syntax
```sql
BIT_COUNT( <x>)
```

## Parameters
| parameter | description                                                     |
|-----------|-----------------------------------------------------------------|
| `<x>`     | Counts the number of 1s in the binary representation of integer x. Integer types can be: TINYINT, SMALLINT, INT, BIGINT, LARGEINT |

## Return Value

Returns the number of 1s in the binary representation of `<x>`

## Examples

```sql
select "0b11111111", bit_count(-1);
```
```text
+--------------+---------------+
| '0b11111111' | bit_count(-1) |
+--------------+---------------+
| 0b11111111   |             8 |
+--------------+---------------+
```
