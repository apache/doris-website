---
{
    "title": "BITMAP_AND_COUNT",
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

Computes the intersection of two or more input BITMAPs and returns the number of intersections.

## Syntax

```sql
BITMAP_AND_COUNT(<bitmap>, <bitmap>,[, <bitmap>...])
```

## Parameters

| Parameter  | Description                                                    |
|------------|----------------------------------------------------------------|
| `<bitmap>` | One of the original BITMAPs whose intersection is being sought |

## Return Value

Returns an integer
- If the parameter has a null value, it returns NULL

## Examples

```sql
MySQL> select bitmap_and_count(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'));
```

```text
+----------------------------------------------------------------------------+
| bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) |
+----------------------------------------------------------------------------+
|                                                                          1 |
+----------------------------------------------------------------------------+
```

```sql
MySQL> select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'));
```

```text
+-------------------------------------------------------------------------------------------------------------+
| (bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) |
+-------------------------------------------------------------------------------------------------------------+
|                                                                                                           2 |
+-------------------------------------------------------------------------------------------------------------+
```

```sql
MySQL> select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty());
```

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| (bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'), bitmap_empty())) |
+-----------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                           0 |
+-----------------------------------------------------------------------------------------------------------------------------+
```

```sql
MySQL> select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'), NULL);
```

```text
+-------------------------------------------------------------------------------------------------------------------+
| (bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'), NULL)) |
+-------------------------------------------------------------------------------------------------------------------+
|                                                                                                              NULL |
+-------------------------------------------------------------------------------------------------------------------+
```

