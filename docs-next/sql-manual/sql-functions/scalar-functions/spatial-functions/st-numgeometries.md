---
{
    "title": "ST_NUMGEOMETRIES",
    "language": "en",
    "description": "Returns the number of geometries in a geometry collection."
}
---

## Description

Returns the number of sub-geometries contained in a geometry object. For non-collection types (Point, LineString, Polygon, Circle), it always returns 1. For collection types (MultiPolygon), it returns the number of sub-geometries in the collection.

## Syntax

```sql
ST_NUMGEOMETRIES( <shape> )
```

## Parameters

| Parameter | Description |
| :--- | :--- |
| `<shape>` | The input geometry, of type GEOMETRY or VARCHAR (in WKT format) that can be converted to GEOMETRY. |

## Return Value

Returns a BIGINT value representing the number of sub-geometries in the geometry object.

`ST_NUMGEOMETRIES` has the following edge cases:
-   If the input parameter is `NULL`, returns `NULL`.
-   If the input parameter cannot be parsed into a valid geometry object, returns `NULL`.
-   For non-collection types (`POINT`, `LINESTRING`, `POLYGON`, `CIRCLE`), always returns `1`.
-   For `MULTIPOLYGON`, returns the number of polygons in the collection.

## Example

**Number of geometries in a Point**
```sql
SELECT ST_NUMGEOMETRIES(ST_Point(1, 2));
```
```text
+----------------------------------+
| ST_NUMGEOMETRIES(ST_Point(1, 2)) |
+----------------------------------+
|                                1 |
+----------------------------------+
```

**Number of geometries in a Polygon**
```sql
SELECT ST_NUMGEOMETRIES(ST_GeometryFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))'));
```
```text
+------------------------------------------------------------------------------+
| ST_NUMGEOMETRIES(ST_GeometryFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))')) |
+------------------------------------------------------------------------------+
|                                                                            1 |
+------------------------------------------------------------------------------+
```

**Number of geometries in a MultiPolygon with two polygons**
```sql
SELECT ST_NUMGEOMETRIES(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))'));
```
```text
+------------------------------------------------------------------------------------------------------------------+
| ST_NUMGEOMETRIES(ST_GeometryFromText('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)),((2 2, 3 2, 3 3, 2 3, 2 2)))')) |
+------------------------------------------------------------------------------------------------------------------+
|                                                                                                                2 |
+------------------------------------------------------------------------------------------------------------------+
```

**Number of geometries in a Circle**
```sql
SELECT ST_NUMGEOMETRIES(ST_Circle(0, 0, 100));
```
```text
+----------------------------------------+
| ST_NUMGEOMETRIES(ST_Circle(0, 0, 100)) |
+----------------------------------------+
|                                      1 |
+----------------------------------------+
```

**NULL Parameter**
```sql
SELECT ST_NUMGEOMETRIES(NULL);
```
```text
+------------------------+
| ST_NUMGEOMETRIES(NULL) |
+------------------------+
|                   NULL |
+------------------------+
```

**Invalid Parameter (Returns NULL)**
```sql
SELECT ST_NUMGEOMETRIES(ST_GeometryFromText('INVALID'));
```
```text
+--------------------------------------------------+
| ST_NUMGEOMETRIES(ST_GeometryFromText('INVALID')) |
+--------------------------------------------------+
|                                             NULL |
+--------------------------------------------------+
```
