---
{
    "title": "RTRIM",
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

The RTRIM function is used to remove consecutive spaces or specified characters from the right side (trailing) of a string.

## Syntax

```sql
rtrim( <str> [, <trim_chars> ] )
```

## Parameters

| Parameter      | Description                                                                                                                                                                                                                                                                      |
|----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>`        | The string that needs to be trimmed.                                                                                                                                                                                                                                             |
| `<trim_chars>` | Optional parameter. If this parameter is provided, the RTRIM function will remove all characters in `<trim_chars>` that appear on the right side of `<str>`. If this parameter is not provided, the RTRIM function will only remove the space characters on the right side of `<str>`. |

## Return Value

Returns a string with trailing spaces or `<trim_chars>` removed. Special cases:

- If any Parameter is NULL, NULL will be returned.


## Examples

```sql
SELECT rtrim('ab d   ') str;
```

```text
+------+
| str  |
+------+
| ab d |
+------+
```

```sql
SELECT rtrim('ababccaab','ab') str;
```

```text
+---------+
| str     |
+---------+
| ababcca |
+---------+
```
