---
{
    "title": "CHAR_LENGTH",
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

Calculates the length of a string. For multi-byte characters, returns the number of characters.

Currently only supports `utf8` encoding

## Alias

- character_length

## Syntax

```sql
char_length(VARCHAR str)
```

## Parameters

| Parameter | Description |
| -- |------------|
| `str` | The string whose length needs to be calculated |

## Return value

The length of the string str.

## Example

```sql
select char_length("abc"),char_length("中国")
```

```text
+-------------------------+----------------------------+
| character_length('abc') | character_length('中国')   |
+-------------------------+----------------------------+
|                       3 |                          2 |
+-------------------------+----------------------------+
```