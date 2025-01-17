---
{
    "title": "BITMAP_TO_BASE64",
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

Converts a Bitmap into a Base64 encoded string.

## Syntax

```sql
bitmap_to_base64(<bitmap>)
```

## Parameters

| Parameter  | Description                     |
|------------|---------------------------------|
| `<bitmap>` | A Bitmap type column or expression |

## Return Value

A Base64 encoded string of the Bitmap.  
Returns `NULL` if the Bitmap is `NULL`.

::: note

The BE configuration option `enable_set_in_bitmap_value` changes the specific format of bitmap values in memory, which affects the result of this function.  
Due to the non-guaranteed order of elements in a bitmap, the generated Base64 string may not always be the same for the same content. However, the decoded bitmap from `bitmap_from_base64` will be the same.

:::

## Examples

To convert a `NULL` Bitmap to a Base64 string:

```sql
select bitmap_to_base64(null);
```

The result will be:

```text
+------------------------+
| bitmap_to_base64(NULL) |
+------------------------+
| NULL                   |
+------------------------+
```

To convert an empty Bitmap to a Base64 string:

```sql
select bitmap_to_base64(bitmap_empty());
```

The result will be:

```text
+----------------------------------+
| bitmap_to_base64(bitmap_empty()) |
+----------------------------------+
| AA==                             |
+----------------------------------+
```

To convert a Bitmap with a single element to a Base64 string:

```sql
select bitmap_to_base64(to_bitmap(1));
```

The result will be:

```text
+--------------------------------+
| bitmap_to_base64(to_bitmap(1)) |
+--------------------------------+
| AQEAAAA=                       |
+--------------------------------+
```

To convert a Bitmap with multiple elements to a Base64 string:

```sql
select bitmap_to_base64(bitmap_from_string("1,9999999"));
```

The result will be:

```text
+---------------------------------------------------------+
| bitmap_to_base64(bitmap_from_string("1,9999999"))       |
+---------------------------------------------------------+
| AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=                |
+---------------------------------------------------------+
```