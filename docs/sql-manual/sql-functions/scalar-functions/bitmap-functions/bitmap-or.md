---
{
    "title": "BITMAP_OR",
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

Computes the union of two or more Bitmaps and returns a new Bitmap.

## Syntax

```sql
BITMAP_OR(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## Parameters

| Parameter   | Description    |
|-------------|----------------|
| `<bitmap1>` | The first Bitmap   |
| `<bitmap2>` | The second Bitmap  |
| ...         | ...            |
| `<bitmapN>` | The N-th Bitmap   |

## Return Value

A Bitmap that represents the union of multiple Bitmaps.

## Examples

To compute the union of two identical Bitmaps:

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(1))) cnt;
```

The result will be:

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```

To convert the union of two identical Bitmaps to a string:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(1)));
```

The result will be:

```text
+---------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(1))) |
+---------------------------------------------------------+
| 1                                                       |
+---------------------------------------------------------+
```

To compute the union of two different Bitmaps:

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(2))) cnt;
```

The result will be:

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

To convert the union of two different Bitmaps to a string:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2)));
```

The result will be:

```text
+---------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) |
+---------------------------------------------------------+
| 1,2                                                     |
+---------------------------------------------------------+
```

To compute the union of multiple Bitmaps, including a `NULL` value:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), NULL));
```

The result will be:

```text
+--------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), NULL)) |
+--------------------------------------------------------------------------------------------+
| 0,1,2,10                                                                                   |
+--------------------------------------------------------------------------------------------+
```

To compute the union of multiple Bitmaps, including an empty Bitmap:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), bitmap_empty()));
```

The result will be:

```text
+------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), bitmap_empty())) |
+------------------------------------------------------------------------------------------------------+
| 0,1,2,10                                                                                             |
+------------------------------------------------------------------------------------------------------+
```

To compute the union of Bitmaps created from strings and individual values:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(10), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5')));
```

The result will be:

```text
+--------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(10), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) |
+--------------------------------------------------------------------------------------------------------+
| 1,2,3,4,5,10                                                                                           |
+--------------------------------------------------------------------------------------------------------+
```
