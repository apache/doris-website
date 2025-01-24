---
{
    "title": "INSTR",
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

Returns the first occurrence position of substr in str (counting starts from 1). Special cases:

- If substr does not appear in str, returns 0.

## Syntax

```sql
INSTR ( <str> , <substr> )
```

## Parameters

| Parameter | Description |
|--------|-----------|
| `<str>` | String to search for |
| `<substr>` | String to be searched for |

## Return value

Parameters The first occurrence position of `<substr>` in `<str>` (counting starts from 1). Special cases:

- If `<substr>` does not appear in `<str>`, returns 0.

## Example

```sql
SELECT INSTR("abc", "b"),INSTR("abc", "d")
```

```text
+-------------------+-------------------+
| instr('abc', 'b') | instr('abc', 'd') |
+-------------------+-------------------+
|                 2 |                 0 |
+-------------------+-------------------+
```