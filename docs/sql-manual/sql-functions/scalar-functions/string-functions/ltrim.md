---
{
    "title": "LTRIM",
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

The LTRIM function is used to remove consecutive spaces or specified characters from the left side (leading) of a string.

## Syntax

```sql
ltrim( <str> [, <trim_chars> ] )
```

## Parameters

| Parameter      | Description                                                                                                                                                                                                                                                                           |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>`        | String that need to be trimmed                                                                                                                                                                                                                                                        |
| `<trim_chars>` | Optional Parameter. If this parameter is provided, the LTRIM function will remove all characters from the `<trim_chars>` that appear on the left side of `<str>`. If this parameter is not provided, the LTRIM function will only remove the space character to the left of `'<str>'`. |

## Return Value

Returns a string with leading spaces or `<trim_chars>` removed. Special cases:

- If any Parameter is NULL, NULL will be returned.

## Examples

```sql
SELECT ltrim('   ab d') str;
```

```text
+------+
| str  |
+------+
| ab d |
+------+
```

```sql
SELECT ltrim('ababccaab','ab') str;
```

```text
+-------+
| str   |
+-------+
| ccaab |
+-------+
```
