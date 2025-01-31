---
{
    "title": "BIT_LENGTH",
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

It is used to return the median of the binary representation of a string (that is, the total number of binary digits). It calculates the number of bits occupied by the binary encoding of the string.

## Syntax
```sql
BIT_LENGTH( <str>)
```

## Parameters
| parameter | description |
|-----------|-------------|
| `<str>`   | The string to be calculated     |

## Return Value

Returns the number of bits occupied by `<str>` in the binary representation, including all 0 and 1.

## Examples

```sql
select BIT_LENGTH("abc"), BIT_LENGTH("中国"), BIT_LENGTH(123);
```

```text
+-------------------+----------------------+-----------------------------------------+
| bit_length('abc') | bit_length('中国')   | bit_length(cast(123 as VARCHAR(65533))) |
+-------------------+----------------------+-----------------------------------------+
|                24 |                   48 |                                      24 |
+-------------------+----------------------+-----------------------------------------+
```

