---
{
    "title": "XXHASH_32",
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

Calculate the 32-bit xxhash value of the input string

-Note: When calculating hash values, it is recommended to use `xxhash_32` instead of `murmur_hash3_32`.

## Syntax

```sql
XXHASH_32( <str> [ , <str> ... ] )
```

## Parameters

| parameter | description      |
|-----------|------------------|
| `<str>`   | The 32-bit xxhash value to be calculated |

## Return Value

Returns the 32-bit xxhash value of the input string.

## Examples

```sql
select xxhash_32(NULL), xxhash_32("hello"), xxhash_32("hello", "world");
```

```text
+-----------------+--------------------+-----------------------------+
| xxhash_32(NULL) | xxhash_32('hello') | xxhash_32('hello', 'world') |
+-----------------+--------------------+-----------------------------+
|            NULL |          -83855367 |                  -920844969 |
+-----------------+--------------------+-----------------------------+
```