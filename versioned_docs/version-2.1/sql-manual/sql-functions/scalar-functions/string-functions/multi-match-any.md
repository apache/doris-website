---
{
    "title": "MULTI_MATCH_ANY",
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

Returns whether the string matches any of the given regular expressions.

## Syntax

```sql
TINYINT multi_match_any(VARCHAR haystack, ARRAY<VARCHAR> patterns)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `haystack` | The string to be checked |
| `patterns` | Array of regular expressions |

## Return Value

Returns 1 if the string `haystack` matches any of the regular expressions in the `patterns` array, otherwise returns 0.

## Examples

```sql
mysql> SELECT multi_match_any('Hello, World!', ['hello', '!', 'world']);
+-----------------------------------------------------------+
| multi_match_any('Hello, World!', ['hello', '!', 'world']) |
+-----------------------------------------------------------+
| 1                                                         |
+-----------------------------------------------------------+

mysql> SELECT multi_match_any('abc', ['A', 'bcd']);
+--------------------------------------+
| multi_match_any('abc', ['A', 'bcd']) |
+--------------------------------------+
| 0                                    |
+--------------------------------------+
```
