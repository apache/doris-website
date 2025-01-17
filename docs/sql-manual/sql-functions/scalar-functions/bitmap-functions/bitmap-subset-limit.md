---
{
    "title": "BITMAP_SUBSET_LIMIT",
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

Extracts a subset of Bitmap elements starting from a specified position, with a limit on the number of elements specified by the cardinality limit, and returns the subset as a new Bitmap.

## Syntax

```sql
bitmap_subset_limit(<bitmap>, <position>, <cardinality_limit>)
```

## Parameters

| Parameter             | Description                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | The Bitmap value              |
| `<position>`          | The starting position (inclusive) |
| `<cardinality_limit>` | The maximum number of elements |

## Return Value

A subset Bitmap within the specified range and limit.

## Examples

To get a subset of a Bitmap starting from position 0 with a cardinality limit of 3:

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 0, 3)) value;
```

The result will be:

```text
+-----------+
| value     |
+-----------+
| 1,2,3     |
+-----------+
```

To get a subset of a Bitmap starting from position 4 with a cardinality limit of 3:

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, 3)) value;
```

The result will be:

```text
+-------+
| value |
+-------+
| 4,5   |
+-------+
```
