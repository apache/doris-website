---
{
    "title": "REPLACE_EMPTY",
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

The REPLACE_EMPTY function is used to replace a part of the characters in a string with other characters. Unlike the [REPLACE](./replace.md) function, when old is an empty string, the new string will be inserted before each character of the str string and at the end of the str string.

Apart from this, all other behaviors are exactly the same as the REPLACE() function.

This function is mainly used to be compatible with Presto and Trino, and its behavior is exactly the same as the `REPLACE()` function in Presto and Trino.

Supported since version 2.1.5.

## Syntax

```sql
REPLACE_EMPTY ( <str>, <old>, <new> )
```

## Parameters

| Parameter      | Description                                                                                                                                                                                                         |
|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>` | The string that needs to be replaced.                                                                                                                                                                               |
| `<old>` | The substring that needs to be replaced. If `<old>` is not in `<str>`, no replacement will be performed. If `<old>` is an empty string, the `<new>` string will be inserted before each character of the str string. |
| `<new>` | The new substring used to replace `<old>`.                                                                                                                                                                           |

## Return Value

Returns the new string after replacing the substring. Special cases:

- If any Parameter is NULL, NULL will be returned.
- If `<old>` is an empty string, the string with the `<new>` string inserted before each character of the `<str>` string will be returned.

## Examples


```sql
SELECT replace('hello world', 'world', 'universe');
```

```text
+---------------------------------------------+
| replace('hello world', 'world', 'universe') |
+---------------------------------------------+
| hello universe                              |
+---------------------------------------------+
```

```sql
SELECT replace_empty("abc", '', 'xyz');
```

```text
+---------------------------------+
| replace_empty('abc', '', 'xyz') |
+---------------------------------+
| xyzaxyzbxyzcxyz                 |
+---------------------------------+
```

```sql
SELECT replace_empty("", "", "xyz");
```

```text
+------------------------------+
| replace_empty('', '', 'xyz') |
+------------------------------+
| xyz                          |
+------------------------------+
```
