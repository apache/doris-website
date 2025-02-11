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

Calculate the intersection of two or more bitmaps
Usage: intersect_count(bitmap_column_to_count, filter_column, filter_values ...)
Example: intersect_count(user_id, event, 'A', 'B', 'C'), meaning find the intersect count of user_id in all A/B/C 3 bitmaps
Calculate the intersection count of elements in bitmap_column that match column_to_filter within filter_values, i.e., bitmap intersection count.

## Syntax

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values> [, ...])
```

## Parameters  

| Parameter         | Description                                      |
|------------------|--------------------------------------------------|
| `<bitmap_column>`  | The input bitmap parameter column               |
| `<column_to_filter>` | The dimension column used for filtering       |
| `<filter_values>`  | The different values used to filter the dimension column |


## Return Value  

Return the number of elements in the intersection of the given bitmaps.

## Example

```sql
select dt,bitmap_to_string(user_id) from pv_bitmap;
```

```text
+------+---------------------------+
| dt   | bitmap_to_string(user_id) |
+------+---------------------------+
|    1 | 1,2                       |
|    2 | 2,3                       |
|    4 | 1,2,3,4,5                 |
|    3 | 1,2,3                     |
+------+---------------------------+
```

```sql
select intersect_count(user_id,dt,3,4) from pv_bitmap;
```

```text
+------------------------------------+
| intersect_count(user_id, dt, 3, 4) |
+------------------------------------+
|                                  3 |
+------------------------------------+
```
