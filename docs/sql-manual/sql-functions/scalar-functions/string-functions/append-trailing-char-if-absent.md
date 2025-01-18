---
{
    "title": "APPEND_TRAILING_CHAR_IF_ABSENT",
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

Used to add a specific character (such as a space, a specific symbol, etc.) to the end of a string if the character does not exist at the end of the string. The function is to ensure that the string ends with a specific character.

## Syntax

```sql
APPEND_TRAILING_CHAR_IF_ABSENT ( <str> , <trailing_char> )
```

## Parameters

| Parameters        | Description |
|-------------------|-----------------------------|
| `<str>`           | Target string to be judged |
| `<trailing_char>` | Character to be added to the end of the string (if the character does not exist) |

## Return value

Parameters The string after concatenation of `<str>` and `<trailing_char>` (if `<trailing_char>` does not exist in `<str>`)

## Example

``` sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('a','c'),APPEND_TRAILING_CHAR_IF_ABSENT('ac', 'c'),APPEND_TRAILING_CHAR_IF_ABSENT('ac', 'cd')
```

```text 
+------------------------------------------+-------------------------------------------+--------------------------------------------+
| append_trailing_char_if_absent('a', 'c') | append_trailing_char_if_absent('ac', 'c') | append_trailing_char_if_absent('ac', 'cd') |
+------------------------------------------+-------------------------------------------+--------------------------------------------+
| ac                                       | ac                                        | accd                                       |
+------------------------------------------+-------------------------------------------+--------------------------------------------+
```
