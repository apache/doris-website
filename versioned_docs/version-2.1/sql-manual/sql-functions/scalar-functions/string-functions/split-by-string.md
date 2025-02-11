---
{
    "title": "SPLIT_BY_STRING",
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

Split the input string into a string array according to the specified string.

## Syntax

```sql
SPLIT_BY_STRING ( <str>, <separator> )
```

## Parameters

| Parameter     | Description                    |
|---------------|--------------------------------|
| `<str>`       | The string to be split.        |
| `<separator>` | The string used for splitting. |

## Return Value

Returns a string array split according to the specified string. Special cases:

- If any of the parameters is NULL, NULL is returned.
- When `<separator>` is an empty string, `<str>` will be split to byte sequence.

## Examples

```sql
SELECT split_by_string('hello','l');
```

```text
+-------------------------------+
| split_by_string('hello', 'l') |
+-------------------------------+
| ["he", "", "o"]               |
+-------------------------------+
```

```sql
SELECT split_by_string('hello','');
```

```text
+------------------------------+
| split_by_string('hello', '') |
+------------------------------+
| ["h", "e", "l", "l", "o"]    |
+------------------------------+
```
