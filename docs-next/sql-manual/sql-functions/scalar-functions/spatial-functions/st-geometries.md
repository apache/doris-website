---
{
    "title": "ST_GEOMETRIES",
    "language": "en",
    "description": "Returns an array of sub-geometries from a geometry collection."
}
---

## Description

Decomposes a geometry object into an array of its sub-geometries. For collection types (MultiPolygon), it returns each sub-polygon as a separate element in the array. For non-collection types (Point, LineString, Polygon, Circle), it returns a single-element array containing the geometry itself.

## Syntax

```sql
ST_GEOMETRIES( <shape> )
```

## Parameters

| Parameter | Description |
| :--- | :--- |
| `<shape>` | The input geometry, of type GEOMETRY or VARCHAR (in WKT format) that can be converted to GEOMETRY. |

## Return Value

Returns an `ARRAY<STRING>` where each element is an encoded geometry object that can be used with other spatial functions such as `ST_AsText` or `ST_GeometryType`.

`ST_GEOMETRIES` has the following edge cases:
-   If the input parameter is `NULL`, returns `NULL`.
-   If the input parameter cannot be parsed into a valid geometry object, returns `NULL`.
-   For non-collection types (`POINT`, `LINESTRING`, `POLYGON`, `CIRCLE`), returns a single-element array containing the input geometry.
-   For `MULTIPOLYGON`, returns an array where each element is one of the sub-polygons.
-   Array elements can be passed to other spatial functions for further processing.

## Example

**Geometries of a Point (single-element array)**
```sql
SELECT ST_AsText(ST_GEOMETRIES(ST_Point(1, 2))[1]);
```
```text
+------------------------------------------------+
| ST_AsText(ST_GEOMETRIES(ST_Point(1, 2))[1])    |
+------------------------------------------------+
| POINT (1 2)                                    |
+------------------------------------------------+
```

**Geometries of a Polygon (single-element array)**
```sql
SELECT ST_GeometryType(ST_GEOMETRIES(ST_GeometryFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))'))[1]);
```
```text
+----------------------------------------------------------------------------------------------------+
| ST_GeometryType(ST_GEOMETRIES(ST_GeometryFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))'))[1])    |
+----------------------------------------------------------------------------------------------------+
| ST_POLYGON                                                                                         |
+----------------------------------------------------------------------------------------------------+
```

**Geometries of a MultiPolygon (multiple elements)**
```sql
SELECT SIZE(ST_GEOMETRIES(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))')));
```
```text
+----------------------------------------------------------------------------------------------------------------------+
| SIZE(ST_GEOMETRIES(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))))') |
+----------------------------------------------------------------------------------------------------------------------+
|                                                                                                                    2 |
+----------------------------------------------------------------------------------------------------------------------+
```

**Accessing individual elements of a MultiPolygon**
```sql
SELECT ST_AsText(ST_GEOMETRIES(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))'))[1]);
```
```text
+----------------------------------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_GEOMETRIES(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))'))[1])    |
+----------------------------------------------------------------------------------------------------------------------------------+
| POLYGON ((1 0, 1 1, 0 1, 0 0, 1 0))                                                                                             |
+----------------------------------------------------------------------------------------------------------------------------------+
```

```sql
SELECT ST_AsText(ST_GEOMETRIES(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))'))[2]);
```
```text
+----------------------------------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_GEOMETRIES(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))'))[2])    |
+----------------------------------------------------------------------------------------------------------------------------------+
| POLYGON ((3 2, 3 3, 2 3, 2 2, 3 2))                                                                                             |
+----------------------------------------------------------------------------------------------------------------------------------+
```

**Out-of-bound index (Returns NULL)**
```sql
SELECT ST_GEOMETRIES(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))'))[3];
```
```text
+----------------------------------------------------------------------------------------------------------------------------+
| ST_GEOMETRIES(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))'))[3]          |
+----------------------------------------------------------------------------------------------------------------------------+
| NULL                                                                                                                       |
+----------------------------------------------------------------------------------------------------------------------------+
```

**NULL Parameter**
```sql
SELECT ST_GEOMETRIES(NULL);
```
```text
+----------------------+
| ST_GEOMETRIES(NULL)  |
+----------------------+
| NULL                 |
+----------------------+
```

**Invalid Parameter (Returns NULL)**
```sql
SELECT ST_GEOMETRIES(ST_GeometryFromText('INVALID'));
```
```text
+----------------------------------------------------+
| ST_GEOMETRIES(ST_GeometryFromText('INVALID'))      |
+----------------------------------------------------+
| NULL                                               |
+----------------------------------------------------+
```
