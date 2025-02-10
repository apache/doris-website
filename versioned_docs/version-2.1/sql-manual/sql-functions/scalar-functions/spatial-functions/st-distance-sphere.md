---
{
    "title": "ST_DISTANCE_SPHERE",
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

Calculate the spherical distance in meters between two points on the Earth. The parameters passed in are the longitude of point X, latitude of point X, longitude of point Y, and latitude of point Y.

## Syntax

```sql
ST_DISTANCE_SPHERE( <x_lng>, <x_lat>, <y_lng>, <y_lat>)
```

## Parameters

| Parameters | Instructions |
| -- | -- |
| `<x_lng>` | Longitude data, reasonable value range is [-180, 180] |
| `<y_lng>` | Longitude data, reasonable value range is [-180, 180] |
| `<x_lat>` | Latitude data, reasonable value range is [-90, 90] |
| `<y_lat>` | Latitude data, reasonable value range is [-90, 90] |

## Return Value

The spherical distance between two points

## Examples

```sql
select st_distance_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219);
```

```text
+----------------------------------------------------------------------------+
| st_distance_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219) |
+----------------------------------------------------------------------------+
|                                                         7336.9135549995917 |
+----------------------------------------------------------------------------+
```

