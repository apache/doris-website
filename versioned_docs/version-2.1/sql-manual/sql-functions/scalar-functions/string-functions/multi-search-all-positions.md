---
{
    "title": "MULTI_SEARCH_ALL_POSITIONS",
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

Returns the positions of the first occurrence of a set of regular expressions in a string.

## Syntax

```sql
ARRAY<INT> multi_search_all_positions(VARCHAR haystack, ARRAY<VARCHAR> patterns)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `haystack` | The string to be checked |
| `patterns` | Array of regular expressions |

## Return Value

Returns an `ARRAY` where the `i`-th element represents the position of the first occurrence of the `i`-th element (regular expression) in the `patterns` array within the string `haystack`. Positions are counted starting from 1, and 0 indicates that the element was not found.

## Examples

```sql
mysql> SELECT multi_search_all_positions('Hello, World!', ['hello', '!', 'world']);
+----------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ['hello', '!', 'world']) |
+----------------------------------------------------------------------+
| [0, 13, 0]                                                           |
+----------------------------------------------------------------------+

mysql> SELECT multi_search_all_positions("Hello, World!", ['hello', '!', 'world', 'Hello', 'World']);
+---------------------------------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ARRAY('hello', '!', 'world', 'Hello', 'World')) |
+---------------------------------------------------------------------------------------------+
| [0, 13, 0, 1, 8]                                                                            |
+---------------------------------------------------------------------------------------------+
```
