---
{
    "title": "orthogonal_bitmap_intersect_count",
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

The ORTHOGONAL_BITMAP_INTERSECT_COUNT function returns the number of elements in the set after performing an intersection calculation on the Bitmap expression.

## Syntax

```sql
ORTHOGONAL_BITMAP_INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<bitmap_column>` | The Bitmap type expression needs to be obtained |
| `<column_to_filter>` | Optional. The dimension column that needs to be filtered |
| `<filter_values>` | Optional. A variable-length parameter, used to filter different values of the dimension column |


## Return Value

Returns a value of type BIGINT.

## Example

```sql
select orthogonal_bitmap_intersect_count(members, tag_group, 1150000, 1150001, 390006) from tag_map where  tag_group in ( 1150000, 1150001, 390006);
```

```text
+-------------------------------------------------------------------------------------+
| orthogonal_bitmap_intersect_count(`members`, `tag_group`, 1150000, 1150001, 390006) |
+-------------------------------------------------------------------------------------+
|                                                                                   0 |
+-------------------------------------------------------------------------------------+
```