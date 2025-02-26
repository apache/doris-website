---
{
    "title": "MURMUR_HASH3_64",
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

Calculate 64-bit murmur3 hash value

-Note: After testing, the performance of `xxhash_64` is about twice that of `murmur_hash3_64`, so when calculating hash values, it is recommended to use `xxhash_64` instead of `murmur_hash3_64`.


## Syntax

```sql
MURMUR_HASH3_64( <str> [ , <str> ... ] )
```

## Parameters

| parameter      | description                                             |
|---------|------------------------------------------------|
| `<str>` | The 64-bit murmur3 hash value to be calculated |

## Return Value

Returns the 64-bit murmur3 hash of the input string.



## Examples

```sql
select murmur_hash3_64(null), murmur_hash3_64("hello"), murmur_hash3_64("hello", "world");
```

```text
+-----------------------+--------------------------+-----------------------------------+
| murmur_hash3_64(NULL) | murmur_hash3_64('hello') | murmur_hash3_64('hello', 'world') |
+-----------------------+--------------------------+-----------------------------------+
|                  NULL |     -3215607508166160593 |               3583109472027628045 |
+-----------------------+--------------------------+-----------------------------------+
```