---
{
    "title": "TO_BITMAP",
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

Converts an unsigned bigint to a Bitmap.

The input is an unsigned bigint with a value in the range 0 to 18446744073709551615, and the output is a Bitmap containing that element.

## Syntax

```sql
TO_BITMAP(<expr>)
```

## Parameters

| Parameter | Description                                        |
|-----------|----------------------------------------------------|
| `<expr>`  | An unsigned bigint with a range of 0 to 18446744073709551615 |

## Return Value

A Bitmap containing the corresponding bigint.  
Returns `NULL` if the input value is not within the specified range.

## Examples

To convert an integer to a Bitmap and count the number of elements in the Bitmap:

```sql
select bitmap_count(to_bitmap(10));
```

The result will be:

```text
+-----------------------------+
| bitmap_count(to_bitmap(10)) |
+-----------------------------+
|                           1 |
+-----------------------------+
```

To convert a negative integer to a Bitmap, which is outside the valid range, and convert it to a string:

```sql
select bitmap_to_string(to_bitmap(-1));
```

The result will be:

```text
+---------------------------------+
| bitmap_to_string(to_bitmap(-1)) |
+---------------------------------+
|                                 |
+---------------------------------+
```
