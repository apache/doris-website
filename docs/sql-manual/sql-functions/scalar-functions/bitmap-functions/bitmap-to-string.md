---
{
    "title": "BITMAP_TO_STRING",
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

Converts a Bitmap into a comma-separated string containing all the set bit positions.

## Syntax

```sql
bitmap_to_string(<bitmap>)
```

## Parameters

| Parameter  | Description                     |
|------------|---------------------------------|
| `<bitmap>` | A Bitmap type column or expression |

## Return Value

A string containing all the set bit positions in the Bitmap, separated by commas.  
Returns `NULL` if the Bitmap is `NULL`.

## Examples

To convert a `NULL` Bitmap to a string:

```sql
select bitmap_to_string(null);
```

The result will be:

```text
+------------------------+
| bitmap_to_string(NULL) |
+------------------------+
| NULL                   |
+------------------------+
```

To convert an empty Bitmap to a string:

```sql
select bitmap_to_string(bitmap_empty());
```

The result will be:

```text
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+
```

To convert a Bitmap with a single element to a string:

```sql
select bitmap_to_string(to_bitmap(1));
```

The result will be:

```text
+--------------------------------+
| bitmap_to_string(to_bitmap(1)) |
+--------------------------------+
| 1                              |
+--------------------------------+
```

To convert a Bitmap with multiple elements to a string:

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
