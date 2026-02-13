---
{
    "title": "ST_DISTANCE",
    "language": "en",
    "description": "Calculates the shortest distance on the sphere between two geometry objects, in meters."
}
---

## Description

Calculates the shortest distance on the sphere between two geometry objects, in meters. This function uses a spherical Earth model for calculation.

Unlike `ST_DISTANCE_SPHERE`, which accepts longitude and latitude coordinates, `ST_DISTANCE` accepts geometry objects (points, lines, polygons, circles, etc.) as parameters and calculates the shortest distance between their boundaries. If the two shapes intersect (including touching or containing each other), it returns 0.

:::info Note
Supported since Apache Doris 4.0.4
:::

## Syntax

```sql
ST_DISTANCE( <shape1>, <shape2> )
```

## Parameters

| Parameter | Description |
| :--- | :--- |
| `<shape1>` | The first geometry, supporting Point, Line, Polygon, Circle, MultiPolygon. |
| `<shape2>` | The second geometry, supporting Point, Line, Polygon, Circle, MultiPolygon. |

## Return Value

Returns the shortest spherical distance between the boundaries of the two geometry objects, in meters (DOUBLE type).

`ST_DISTANCE` has the following edge cases:
- If any input parameter is `NULL`, returns `NULL`.
- If any input parameter cannot be parsed into a valid geometry object, returns `NULL`.
- If the two geometry objects intersect (including one containing the other), returns `0.0`.
- Supported geometry types include: `POINT`, `LINESTRING`, `POLYGON`, `CIRCLE`, `MULTIPOLYGON`.

## Example

**Distance Between Points**
```sql
-- Calculate the distance between two points with a 1-degree longitude difference on the equator
SELECT ST_DISTANCE(ST_GeometryFromText('POINT(0 0)'), ST_GeometryFromText('POINT(1 0)'));
```
```text
+---------------------------------------------+
| ST_Distance(ST_Point(0, 0), ST_Point(1, 0)) |
+---------------------------------------------+
|                           111195.1011774839 |
+---------------------------------------------+
```

**Distance Between a Point and a Line**
```sql
-- Calculate the shortest distance from a point to a line
SELECT ST_DISTANCE(ST_GeometryFromText('POINT(2 2)'), ST_GeometryFromText('LINESTRING(0 0, 10 0)'));
```
```text
+----------------------------------------------------------------------------------------------+
| ST_DISTANCE(ST_GeometryFromText('POINT(2 2)'), ST_GeometryFromText('LINESTRING(0 0, 10 0)')) |
+----------------------------------------------------------------------------------------------+
|                                                                            222390.2023549678 |
+----------------------------------------------------------------------------------------------+
```

**Polygon and Circle Intersect (Distance 0)**
```sql
-- Circle intersects polygon; the center is outside but the circle covers part of the polygon's boundary
SELECT ST_DISTANCE(
    ST_GeometryFromText('POLYGON ((-0.00045 -0.00045, 0.00045 -0.00045, 0.00045 0.00045, -0.00045 0.00045, -0.00045 -0.00045))'),
    ST_Circle(0.0006, 0, 50)
);
```
```text
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ST_DISTANCE(
    ST_GeometryFromText('POLYGON ((-0.00045 -0.00045, 0.00045 -0.00045, 0.00045 0.00045, -0.00045 0.00045, -0.00045 -0.00045))'),
    ST_Circle(0.0006, 0, 50)
) |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                                                             0 |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

**Invalid Parameter (Returns NULL)**
```sql
-- Invalid WKT string
SELECT ST_DISTANCE(ST_GeometryFromText('NOT_A_GEOMETRY'), ST_GeometryFromText('POINT(1 1)'));
```
```text
+---------------------------------------------------------------------------------------+
| ST_DISTANCE(ST_GeometryFromText('NOT_A_GEOMETRY'), ST_GeometryFromText('POINT(1 1)')) |
+---------------------------------------------------------------------------------------+
|                                                                                  NULL |
+---------------------------------------------------------------------------------------+
```

**NULL Parameter**
```sql
SELECT ST_DISTANCE(NULL, ST_GeometryFromText('POINT(1 1)'));
```
```text
+------------------------------------------------------+
| ST_DISTANCE(NULL, ST_GeometryFromText('POINT(1 1)')) |
+------------------------------------------------------+
|                                                 NULL |
+------------------------------------------------------+
```