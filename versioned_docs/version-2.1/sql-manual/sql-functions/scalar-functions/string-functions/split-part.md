---
{
    "title": "SPLIT_PART",
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

The SPLIT_PART function splits a string into multiple parts according to the specified separator and return one of the parts.

## Syntax

```sql
SPLIT_PART ( <str>, <separator>, <part_index> )
```

## Parameters

| Parameter      | Description                                           |
|----------------|-------------------------------------------------------|
| `<str>`        | The string to be split                                |
| `<separator>`  | The string used for splitting                         |
| `<part_index>` | The index of the part to be returned. Starting from 1 |

## Return Value

Returns the specified part of the string split according to the delimiter. Special cases:

- If any of the parameters is NULL, NULL is returned.
- When `<part_index>` is 0, NULL is returned.

## Examples

```sql
select split_part("hello world", " ", 1);
```

```text
+----------------------------------+
| split_part('hello world', ' ', 1) |
+----------------------------------+
| hello                            |
+----------------------------------+
```

```sql
SELECT split_part('apple,banana,cherry', ',', 0);
```

```text
+-------------------------------------------+
| split_part('apple,banana,cherry', ',', 0) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```
