---
{
    "title": "BITMAP_SUBSET_IN_RANGE",
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

Returns a subset of the Bitmap within the specified range (excluding the range end).

## Syntax

```sql
BITMAP_SUBSET_IN_RANGE(<bitmap>, <range_start_include>, <range_end_exclude>)
```

## Parameters

| Parameter             | Description                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | The Bitmap value              |
| `<range_start_include>` | The start of the range (inclusive) |
| `<range_end_exclude>`   | The end of the range (exclusive)   |

## Return Value

A subset Bitmap within the specified range.

## Examples

To get a subset of a Bitmap within the range 0 to 9:

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 0, 9)) value;
```

The result will be:

```text
+-----------+
| value     |
+-----------+
| 1,2,3,4,5 |
+-----------+
```

To get a subset of a Bitmap within the range 2 to 3:

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, 3)) value;
```

The result will be:

```text
+-------+
| value |
+-------+
| 2     |
+-------+
```
