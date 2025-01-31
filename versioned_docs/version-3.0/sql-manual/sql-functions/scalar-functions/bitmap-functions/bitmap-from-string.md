---
{
    "title": "BITMAP_FROM_STRING",
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

Convert a string into a BITMAP. The string consists of a group of unsigned bigint numbers separated by commas. (The number values are between: 0 ~ 18446744073709551615)
For example, the string "0, 1, 2" will be converted into a Bitmap, where the 0th, 1st, and 2nd bits are set. When the input field is invalid, NULL is returned

## Syntax

```sql
 BITMAP_FROM_STRING(<str>)
```

## Parameters

| Parameter | Description                                                                                    |
|-----------|------------------------------------------------------------------------------------------------|
| `<str>`   | Array string, for example "0, 1, 2" string will be converted to a Bitmap with bits 0, 1, 2 set |  

## Return Value

Returns a BITMAP
- When the input field is invalid, the result is NULL

## Examples

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 2")) bts;
```

```text
+-------+
| bts   |
+-------+
| 0,1,2 |
+-------+
```

```sql
select bitmap_from_string("-1, 0, 1, 2") bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 18446744073709551615")) bts;
```

```text
+--------------------------+
| bts                      |
+--------------------------+
| 0,1,18446744073709551615 |
+--------------------------+
```

