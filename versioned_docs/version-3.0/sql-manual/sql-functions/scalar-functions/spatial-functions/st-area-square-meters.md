---
{
    "title": "ST_AREA_SQUARE_METERS",
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

Calculates the area of a closed region on the Earth's surface in square meters. The input parameter is a geometric object representing a region on the Earth's surface (such as polygons, circles, polyhedrons, etc.).

For non-closed geometric objects (such as points, line segments), their area is 0; for invalid geometric objects (such as self-intersecting polygons), returns NULL.


## Sytax

```sql
ST_AREA_SQUARE_METERS( <geo>)
```
## Parameters

| Parameter | Description     |
| -- |--------|
| `<geo>` | A geometric object on the Earth's surface, supporting closed region types such as GeoPolygon, GeoCircle, and GeoMultiPolygon. |

## Return value

Returns the area of the region in square meters, of type DOUBLE.

ST_AREA_SQUARE_METERS has the following edge cases:

- If the input parameter is NULL, returns NULL.
- If the input is a non-closed geometric object (such as point GeoPoint, line segment GeoLineString), returns 0.
- If the input geometric object is invalid (such as self-intersecting polygon, unclosed polygon), returns NULL.
- If the input coordinates exceed the longitude/latitude range (longitude [-180, 180], latitude [-90, 90]), returns NULL.

## Example

Circular region (circle with a radius of 1 degree)

```sql
SELECT ST_Area_Square_Meters(ST_Circle(0, 0, 1));
```

```text
+-------------------------------------------------+
| st_area_square_meters(st_circle(0.0, 0.0, 1.0)) |
+-------------------------------------------------+
|                              3.1415926535897869 |
+-------------------------------------------------+
```

Point object (no area)

```sql
SELECT ST_Area_Square_Meters(ST_Point(0, 1));
```

```text
+-------------------------------------------+
| st_area_square_meters(st_point(0.0, 1.0)) |
+-------------------------------------------+
|                                         0 |
+-------------------------------------------+
```

Line segment object (no area)

```sql
SELECT ST_Area_Square_Meters(ST_LineFromText("LINESTRING (1 1, 2 2)"));
```

```text
+-----------------------------------------------------------------+
| st_area_square_meters(st_linefromtext('LINESTRING (1 1, 2 2)')) |
+-----------------------------------------------------------------+
|                                                               0 |
+-----------------------------------------------------------------+
```

Simple square region (small longitude/latitude range)

```sql

mysql> SELECT ST_Area_Square_Meters(ST_Polygon("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))"));
+--------------------------------------------------------------------------+
| ST_Area_Square_Meters(ST_Polygon("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))")) |
+--------------------------------------------------------------------------+
|                                                       12364036567.076408 |
+--------------------------------------------------------------------------+
```

Complex polygon region

```sql
mysql> SELECT ST_Area_Square_Meters(ST_Polygon("POLYGON ((0 0, 5 1, 10 0, 5 -1, 0 0))"));
+----------------------------------------------------------------------------+
| ST_Area_Square_Meters(ST_Polygon("POLYGON ((0 0, 5 1, 10 0, 5 -1, 0 0))")) |
+----------------------------------------------------------------------------+
|                                                         123725166420.83101 |
+----------------------------------------------------------------------------+
```

Rectangular region crossing 180° longitude

```sql

mysql> SELECT ST_Area_Square_Meters(ST_Polygon("POLYGON ((179 0, 180 0, 180 1, 179 1, 179 0))"));
+------------------------------------------------------------------------------------+
| ST_Area_Square_Meters(ST_Polygon("POLYGON ((179 0, 180 0, 180 1, 179 1, 179 0))")) |
+------------------------------------------------------------------------------------+
|                                                                  12364036567.07628 |
+------------------------------------------------------------------------------------+
```

Circular region in the Southern Hemisphere

```sql
mysql> SELECT ST_Area_Square_Meters(ST_Circle(0, -30, 2));
+---------------------------------------------+
| ST_Area_Square_Meters(ST_Circle(0, -30, 2)) |
+---------------------------------------------+
|                          12.566370614359073 |
+---------------------------------------------+
```

Invalid polygon (self-intersecting)

```sql
mysql>  SELECT ST_Area_Square_Meters(ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))"));
+--------------------------------------------------------------------------+
| ST_Area_Square_Meters(ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))")) |
+--------------------------------------------------------------------------+
|                                                                     NULL |
+--------------------------------------------------------------------------+
```

Unclosed polygon

```sql
mysql> SELECT ST_Area_Square_Meters(ST_Polygon("POLYGON ((0 0, 1 0, 1 1, 0 1))"));
+---------------------------------------------------------------------+
| ST_Area_Square_Meters(ST_Polygon("POLYGON ((0 0, 1 0, 1 1, 0 1))")) |
+---------------------------------------------------------------------+
|                                                                NULL |
+---------------------------------------------------------------------+
```

Coordinates out of range

```sql
mysql>  SELECT ST_Area_Square_Meters(ST_Polygon("POLYGON ((0 0, 200 0, 200 1, 0 1, 0 0))"));
+------------------------------------------------------------------------------+
| ST_Area_Square_Meters(ST_Polygon("POLYGON ((0 0, 200 0, 200 1, 0 1, 0 0))")) |
+------------------------------------------------------------------------------+
|                                                                         NULL |
+------------------------------------------------------------------------------+
```

Null input

```sql
mysql> SELECT ST_Area_Square_Meters(NULL);
+-----------------------------+
| ST_Area_Square_Meters(NULL) |
+-----------------------------+
|                        NULL |
+-----------------------------+
```