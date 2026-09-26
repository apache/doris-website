---
{
    "title": "ST_NUMPOINTS",
    "language": "en",
    "description": "Returns the total number of points in a geometry object."
}
---

## Description

Returns the total number of vertices (points) in a geometry object. For different geometry types, the counting rules are as follows: a Point returns 1, a LineString returns the number of vertices, a Polygon returns the total number of vertices across all rings (including the closing point), and a MultiPolygon returns the sum of all sub-polygon point counts.

## Syntax

```sql
ST_NUMPOINTS( <shape> )
```

## Parameters

| Parameter | Description |
| :--- | :--- |
| `<shape>` | The input geometry, of type GEOMETRY or VARCHAR (in WKT format) that can be converted to GEOMETRY. |

## Return Value

Returns a BIGINT value representing the total number of points in the geometry object.

`ST_NUMPOINTS` has the following edge cases:
-   If the input parameter is `NULL`, returns `NULL`.
-   If the input parameter cannot be parsed into a valid geometry object, returns `NULL`.
-   For `POINT`, returns `1`.
-   For `LINESTRING`, returns the number of vertices in the line.
-   For `POLYGON`, returns the total number of vertices across all rings (exterior ring + interior rings). Each ring includes the closing point.
-   For `MULTIPOLYGON`, returns the sum of point counts of all sub-polygons.
-   For `CIRCLE`, returns `-1` (circles do not have discrete vertices).

## Example

**Number of points in a Point**
```sql
SELECT ST_NUMPOINTS(ST_Point(1, 2));
```
```text
+------------------------------+
| ST_NUMPOINTS(ST_Point(1, 2)) |
+------------------------------+
|                            1 |
+------------------------------+
```

**Number of points in a LineString**
```sql
SELECT ST_NUMPOINTS(ST_GeometryFromText('LINESTRING(0 0, 1 1, 2 2)'));
```
```text
+-------------------------------------------------------------------+
| ST_NUMPOINTS(ST_GeometryFromText('LINESTRING(0 0, 1 1, 2 2)'))   |
+-------------------------------------------------------------------+
|                                                                 3 |
+-------------------------------------------------------------------+
```

**Number of points in a Polygon (square)**
```sql
SELECT ST_NUMPOINTS(ST_GeometryFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))'));
```
```text
+----------------------------------------------------------------------------+
| ST_NUMPOINTS(ST_GeometryFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))'))  |
+----------------------------------------------------------------------------+
|                                                                          5 |
+----------------------------------------------------------------------------+
```

**Number of points in a Polygon with a hole**
```sql
SELECT ST_NUMPOINTS(ST_GeometryFromText('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0),(1 1, 2 1, 2 2, 1 2, 1 1))'));
```
```text
+-----------------------------------------------------------------------------------------------------------+
| ST_NUMPOINTS(ST_GeometryFromText('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0),(1 1, 2 1, 2 2, 1 2, 1 1))'))   |
+-----------------------------------------------------------------------------------------------------------+
|                                                                                                        10 |
+-----------------------------------------------------------------------------------------------------------+
```

**Number of points in a MultiPolygon**
```sql
SELECT ST_NUMPOINTS(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))'));
```
```text
+--------------------------------------------------------------------------------------------------------------+
| ST_NUMPOINTS(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))')) |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                           10 |
+--------------------------------------------------------------------------------------------------------------+
```

**Number of points in a Circle (returns -1)**
```sql
SELECT ST_NUMPOINTS(ST_Circle(0, 0, 100));
```
```text
+--------------------------------------+
| ST_NUMPOINTS(ST_Circle(0, 0, 100))  |
+--------------------------------------+
|                                   -1 |
+--------------------------------------+
```

**NULL Parameter**
```sql
SELECT ST_NUMPOINTS(NULL);
```
```text
+---------------------+
| ST_NUMPOINTS(NULL)  |
+---------------------+
|                NULL |
+---------------------+
```

**Invalid Parameter (Returns NULL)**
```sql
SELECT ST_NUMPOINTS(ST_GeometryFromText('INVALID'));
```
```text
+------------------------------------------------+
| ST_NUMPOINTS(ST_GeometryFromText('INVALID'))   |
+------------------------------------------------+
|                                           NULL |
+------------------------------------------------+
```
