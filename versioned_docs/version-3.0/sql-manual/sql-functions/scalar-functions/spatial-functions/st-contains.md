---
{
    "title": "ST_CONTAINS",
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

Determines whether one geometric shape (shape1) completely contains another geometric shape (shape2). Returns 1 if shape1 contains all points of shape2; otherwise, returns 0.

- For points: The point must lie inside or on the boundary of the polygon.
- For lines: All points of the line must lie inside or on the boundary of the polygon.
- For polygons: The contained polygon must be entirely inside the outer polygon (boundaries can overlap).
## Sytax

```sql
ST_CONTAINS( <shape1>, <shape2>)
```

## Parameters

| Parameters       | Description                     |
|----------|------------------------|
| `<shape1>` | The geometric shape used to check if it contains another shape, supporting the Polygon type.。 |
| `<shape2>` | The geometric shape used to check if it is contained, supporting types such as Point, Line, Polygon, etc. |

## Retuen value

- 1: Indicates that shape1 completely contains shape2.
- 0: Indicates that shape1 does not contain shape2.

ST_CONTAINS has the following edge cases:

- Returns NULL if either input parameter is NULL.
- Returns NULL if the input geometric shape is invalid (e.g., a self-intersecting polygon).
- Returns 0 if the boundary of shape2 partially overlaps with the boundary of shape1, but part of shape2 lies outside  shape1.

## Example

Polygon contains a point (point inside)

```sql
SELECT ST_Contains(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5));
```

```text
+----------------------------------------------------------------------------------------+
| st_contains(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_point(5.0, 5.0)) |
+----------------------------------------------------------------------------------------+
|                                                                                      1 |
+----------------------------------------------------------------------------------------+
```

Polygon does not contain a point (point outside)

```sql
SELECT ST_Contains(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(50, 50));
```

```text
+------------------------------------------------------------------------------------------+
| st_contains(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_point(50.0, 50.0)) |
+------------------------------------------------------------------------------------------+
|                                                                                        0 |
+------------------------------------------------------------------------------------------+
```
Polygon contains a line (line entirely inside)

```sql
mysql> SELECT ST_Contains(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (2 2, 8 8)"));
+-----------------------------------------------------------------------------------------------------------------+
| ST_Contains(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (2 2, 8 8)")) |
+-----------------------------------------------------------------------------------------------------------------+
|                                                                                                               1 |
+-----------------------------------------------------------------------------------------------------------------+
```

Polygon does not contain a line (line partially outside)

```sql

mysql> SELECT ST_Contains(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (5 5, 15 15)"));
+-------------------------------------------------------------------------------------------------------------------+
| ST_Contains(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (5 5, 15 15)")) |
+-------------------------------------------------------------------------------------------------------------------+
|                                                                                                                 0 |
+-------------------------------------------------------------------------------------------------------------------+
```

Polygon contains a polygon (inner polygon entirely contained)

```sql
mysql> SELECT ST_Contains(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((2 2, 8 2, 8 8, 2 8, 2 2))"));
+--------------------------------------------------------------------------------------------------------------------------+
| ST_Contains(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((2 2, 8 2, 8 8, 2 8, 2 2))")) |
+--------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                        1 |
+--------------------------------------------------------------------------------------------------------------------------+

```

Polygon does not contain a polygon (inner polygon partially outside)

```sql
mysql> SELECT ST_Contains(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))"));
+------------------------------------------------------------------------------------------------------------------------------+
| ST_Contains(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))")) |
+------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                            0 |
+------------------------------------------------------------------------------------------------------------------------------+
```

Polygon and boundary point (point on polygon boundary)

```sql
mysql> SELECT ST_Contains(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Point(0, 5));
+---------------------------------------------------------------------------------------+
| ST_Contains(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Point(0, 5)) |
+---------------------------------------------------------------------------------------+
|                                                                                     0 |
+---------------------------------------------------------------------------------------+
```

NULL parameter (returns NULL)

```sql
mysql> SELECT ST_Contains(NULL, ST_Point(5, 5));
+-----------------------------------+
| ST_Contains(NULL, ST_Point(5, 5)) |
+-----------------------------------+
|                              NULL |
+-----------------------------------+
```


Self-intersecting polygon as parameter

```sql

mysql> SELECT ST_Contains(  ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))"), ST_Point(0.5, 0.5));
+--------------------------------------------------------------------------------------+
| ST_Contains(  ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))"), ST_Point(0.5, 0.5)) |
+--------------------------------------------------------------------------------------+
|                                                                                 NULL |
+--------------------------------------------------------------------------------------+
```
