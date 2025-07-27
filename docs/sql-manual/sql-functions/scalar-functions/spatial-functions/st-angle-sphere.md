---
{
    "title": "ST_ANGLE_SPHERE",
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

Calculates the central angle (in degrees) between two points on the Earth's surface. The input parameters are, in order, the longitude of point X, latitude of point X, longitude of point Y, and latitude of point Y.

The central angle refers to the angle at the center of the Earth subtended by the arc connecting the two points.

## Sytax

```sql
ST_ANGLE_SPHERE( <x_lng>, <x_lat>, <y_lng>, <y_lat>)
```

## 参数

| parameters | description |
| -- | -- |
| `<x_lng>` | Longitude of point X, of type `DOUBLE`, with a valid range of [-180, 180] |
| `<y_lng>` | Longitude of point Y, of type `DOUBLE`, with a valid range of [-180, 180] |
| `<x_lat>` | Latitude of point X, of type `DOUBLE`, with a valid range of [-90, 90] |
| `<y_lat>` | Latitude of point Y, of type `DOUBLE`, with a valid range of [-90, 90] |

## Retuen Value

Returns the central angle between the two points in degrees, of type DOUBLE, with a range of [0, 180].

Edge cases for ST_ANGLE_SPHERE:

- If any input parameter is NULL, returns NULL.
- If any coordinate is out of range (e.g., longitude > 180, latitude < -90), returns NULL.
- If the two points are identical (same longitude and latitude), returns 0.
- If the two points are antipodal (diametrically opposite on the Earth), returns 180.

## Example

Calculation of central angle between two adjacent points

```sql
select ST_Angle_Sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219);
```

```text
+---------------------------------------------------------------------------+
| st_angle_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219) |
+---------------------------------------------------------------------------+
|                                                        0.0659823452409903 |
+---------------------------------------------------------------------------+
```

Two points on the equator with a 45° longitude difference

```sql
select ST_Angle_Sphere(0, 0, 45, 0);
```

```text
+----------------------------------------+
| st_angle_sphere(0.0, 0.0, 45.0, 0.0) |
+----------------------------------------+
|                                     45 |
+----------------------------------------+
```

Two points with identical coordinates

```sql

mysql> SELECT ST_ANGLE_SPHERE(30, 60, 30, 60);
+---------------------------------+
| ST_ANGLE_SPHERE(30, 60, 30, 60) |
+---------------------------------+
|                               0 |
+---------------------------------+

```

Antipodal points (diametrically opposite)

```sql
mysql> SELECT ST_ANGLE_SPHERE(0, 0, 180, 0);
+-------------------------------+
| ST_ANGLE_SPHERE(0, 0, 180, 0) |
+-------------------------------+
|                           180 |
+-------------------------------+
```

Two points across east-west longitudes (e.g., 170°E and -170°W)
```sql
mysql> SELECT ST_ANGLE_SPHERE(170, 30, -170, 30);
+------------------------------------+
| ST_ANGLE_SPHERE(170, 30, -170, 30) |
+------------------------------------+
|                 17.298330210575152 |
+------------------------------------+
```

Two points across the equator (north and south latitudes)

```sql
mysql> SELECT ST_ANGLE_SPHERE(0, 45, 0, -45);
+--------------------------------+
| ST_ANGLE_SPHERE(0, 45, 0, -45) |
+--------------------------------+
|              89.99999999999999 |
+--------------------------------+
```

Invalid longitude (out of range)

```sql
mysql> SELECT ST_ANGLE_SPHERE(190, 30, 10, 30);
+----------------------------------+
| ST_ANGLE_SPHERE(190, 30, 10, 30) |
+----------------------------------+
|                             NULL |
+----------------------------------+
```

Any parameter is NULL

```sql
mysql> SELECT ST_ANGLE_SPHERE(NULL, 30, 10, 30);
+-----------------------------------+
| ST_ANGLE_SPHERE(NULL, 30, 10, 30) |
+-----------------------------------+
|                              NULL |
+-----------------------------------+
```

Latitude out of range (e.g., 91°N)

```sql
mysql> SELECT ST_ANGLE_SPHERE(0, 0, 180, 91);
+--------------------------------+
| ST_ANGLE_SPHERE(0, 0, 180, 91) |
+--------------------------------+
|                           NULL |
+--------------------------------+
```