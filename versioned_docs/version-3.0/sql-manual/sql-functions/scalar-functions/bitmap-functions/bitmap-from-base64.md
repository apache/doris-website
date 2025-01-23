---
{
    "title": "BITMAP_FROM_BASE64",
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

Convert a base64 string (which can be converted by `bitmap_to_base64` function) to a BITMAP. Returns NULL when the input string is invalid.

## Syntax

```sql
 BITMAP_FROM_BASE64(<base64_str>)
```

## Parameters

| Parameter      | Description                                                     |
|----------------|-----------------------------------------------------------------|
| `<base64_str>` | base64 string (can be converted by `bitmap_to_base64` function) |

## Return Value

Returns a BITMAP
- When the input field is invalid, the result is NULL

## Examples

```sql
select bitmap_to_string(bitmap_from_base64("AA==")) bts;
```

```text
+------+
| bts  |
+------+
|      |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AQEAAAA=")) bts;
```

```text
+------+
| bts  |
+------+
| 1    |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=")) bts;
```

```text
+-----------+
| bts       |
+-----------+
| 1,9999999 |
+-----------+
```
