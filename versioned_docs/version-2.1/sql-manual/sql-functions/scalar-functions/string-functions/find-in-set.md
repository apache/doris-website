---
{
    "title": "FIND_IN_SET",
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

Returns the position of the first occurrence of str in strlist (counting starts from 1).

strlist is a string separated by commas. Special cases:

- If not found, returns 0.
- If any parameter is NULL, returns NULL.

## Syntax

```sql
find_in_set(VARCHAR str, VARCHAR strlist)
```

## Parameters

| Parameters | Description |
| -- |----------|
| `str` | String to be searched |
| `strlist` | String to be searched |

## Return value

Parameter str The position of the first occurrence of parameter strlist. Special cases:

- If not found, returns 0.
- If any parameter is NULL, returns NULL.

## Example

```sql
select find_in_set("b", "a,b,c")
```

```text
| find_in_set('b', 'a,b,c') |
+---------------------------+
|                         2 |
+---------------------------+
```
