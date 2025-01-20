---
{
"title": "INTERSECT_COUNT",
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

The INTERSECT_COUNT function is used to calculate the number of intersecting elements of the Bitmap data structure.

## Syntax

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<bitmap_column>` | The expression that needs to be obtained. |
| `<column_to_filter>` | The dimension column that needs to be filtered. |
| `<filter_values>` | Different values of the filtering dimension column. |

## Return Value

Returns a value of type BIGINT.

## Example

```sql
select dt,bitmap_to_string(user_id) from pv_bitmap where dt in (3,4);
```

```text
+------+-----------------------------+
| dt   | bitmap_to_string(`user_id`) |
+------+-----------------------------+
| 4    | 1,2,3                       |
| 3    | 1,2,3,4,5                   |
+------+-----------------------------+
```

```sql
select intersect_count(user_id,dt,3,4) from pv_bitmap;
```

```text
+----------------------------------------+
| intersect_count(`user_id`, `dt`, 3, 4) |
+----------------------------------------+
|                                      3 |
+----------------------------------------+
```
