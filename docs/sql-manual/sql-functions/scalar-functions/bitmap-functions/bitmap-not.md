---
{
    "title": "BITMAP_NOT",
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

Computes the difference between the first Bitmap and the second Bitmap, and returns the result as a new Bitmap.

## Syntax

```sql
bitmap_not(<bitmap1>, <bitmap2>)
```

## Parameters

| Parameter   | Description          |
|-------------|----------------------|
| `<bitmap1>` | The first Bitmap     |
| `<bitmap2>` | The second Bitmap    |

## Return Value

A Bitmap representing the elements in `<bitmap1>` that are not in `<bitmap2>`.

## Examples

To compute the difference between two Bitmaps:

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4')));
```

The result will be an empty Bitmap, as all elements in `<bitmap1>` are also in `<bitmap2>`:

```text
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_not(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) |
+----------------------------------------------------------------------------------------+
|                                                                                        |
+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```

To compute the difference where `<bitmap1>` has elements not present in `<bitmap2>`:

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4')));
```

The result will be a Bitmap containing the element `5`:

```text
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4'))) |
+----------------------------------------------------------------------------------------+
| 5                                                                                      |
+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```
