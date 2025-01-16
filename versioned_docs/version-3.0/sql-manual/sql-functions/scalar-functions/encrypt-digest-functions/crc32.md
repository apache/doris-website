---
{
    "title": "CRC32",
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

Use CRC32 to compute the result.

## Syntax

```sql
BIGINT crc32( VARCHAR <str> )
```
## Parameters

| parameter | description |
| -- | -- |
| `<str>` | The value to be used for CRC calculation |

## Return Value

Returns the Cyclic Redundancy Check value of this string.

## Examples

```sql
select crc32("abc"),crc32("中国");
```
```text
+--------------+-----------------+
| crc32('abc') | crc32('中国')   |
+--------------+-----------------+
|    891568578 |       737014929 |
+--------------+-----------------+
```
