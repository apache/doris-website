---
{
    "title": "BITMAP_HAS_ALL",
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

Determines whether one Bitmap contains all the elements of another Bitmap.

## Syntax

```sql
BITMAP_HAS_ALL(<bitmap1>, <bitmap2>)
```

## Parameters

| Parameter   | Description       |
|-------------|-------------------|
| `<bitmap1>` | The first Bitmap  |
| `<bitmap2>` | The second Bitmap |

## Return Value

Returns `true` if `<bitmap1>` contains all the elements of `<bitmap2>`;  
Returns `true` if `<bitmap2>` contains no elements;  
Otherwise, returns `false`.

## Examples

To check if one Bitmap contains all elements of another Bitmap:

```sql
select bitmap_has_all(bitmap_from_string('0, 1, 2'), bitmap_from_string('1, 2'));
```

The result will be:

```text
+---------------------------------------------------------------------------+
| bitmap_has_all(bitmap_from_string('0, 1, 2'), bitmap_from_string('1, 2')) |
+---------------------------------------------------------------------------+
|                                                                         1 |
+---------------------------------------------------------------------------+
```

To check if an empty Bitmap contains all elements of another Bitmap:

```sql
select bitmap_has_all(bitmap_empty(), bitmap_from_string('1, 2'));
```

The result will be:

```text
+------------------------------------------------------------+
| bitmap_has_all(bitmap_empty(), bitmap_from_string('1, 2')) |
+------------------------------------------------------------+
|                                                          0 |
+------------------------------------------------------------+
```
