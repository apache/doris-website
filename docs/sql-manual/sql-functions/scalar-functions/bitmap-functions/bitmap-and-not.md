---
{
    "title": "BITMAP_AND_NOT,BITMAP_ANDNOT",
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

Perform a NOT operation on two BITMAPs and return the result. The first input parameter is called `base BITMAP` and the second is called `exclude BITMAP`.

## Alias

- BITMAP_ANDNOT

## Syntax

```sql
BITMAP_AND_NOT(<bitmap1>, <bitmap2>)
```

## Parameters

| Parameter   | Description                      |
|-------------|----------------------------------|
| `<bitmap1>` | `Base BITMAP` to be negated      |
| `<bitmap2>` | `Exclusion BITMAP` to be negated |

## Return Value

Returns a BITMAP.
- If the parameter has a null value, returns NULL

## Examples

```sql
select bitmap_count(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) cnt;
```

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')));
```

```text
+--------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'))) |
+--------------------------------------------------------------------------------------------+
| 1,2                                                                                        |
+--------------------------------------------------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_empty()));
```

```text
+-------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), bitmap_empty())) |
+-------------------------------------------------------------------------------+
| 1,2,3                                                                         |
+-------------------------------------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),NULL));
```

```text
+---------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), NULL)) |
+---------------------------------------------------------------------+
| NULL                                                                |
+---------------------------------------------------------------------+
```
