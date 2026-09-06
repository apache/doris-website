---
{
    "title": "ST_INTERSECTION",
    "language": "en",
    "description": "Returns the geometry that represents the point set intersection of two polygons."
}
---

## Description

Returns the geometry that represents the point set intersection of two polygons. The intersection is the set of all points that are common to both input polygons.

Currently only supports Polygon × Polygon operations. If either input is not a Polygon type, returns NULL.

## Syntax

```sql
ST_INTERSECTION( <polygon1>, <polygon2>)
```

## Parameters

| Parameters | Description |
|----------|------------------------|
| `<polygon1>` | The first polygon geometry, must be of Polygon type. |
| `<polygon2>` | The second polygon geometry, must be of Polygon type. |

## Return value

Returns a Polygon geometry representing the intersection of the two input polygons.

ST_INTERSECTION has the following edge cases:

- Returns NULL if either input parameter is NULL.
- Returns NULL if either input is not a Polygon type (e.g., Point, Line, MultiPolygon, Circle).
- Returns NULL if the two polygons do not intersect (disjoint).
- Returns the original polygon if both inputs are the same polygon.

## Example

Intersection of two overlapping polygons

```sql
SELECT ST_AsText(ST_Intersection(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_intersection(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((5 5, 10 5.01900181748964, 10 10, 5 10.0374230459107, 5 5))                                     |
+----------------------------------------------------------------------------------------------------------+
```

Intersection of two disjoint polygons (returns NULL)

```sql
SELECT ST_AsText(ST_Intersection(ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"), ST_Polygon("POLYGON ((10 10, 15 10, 15 15, 10 15, 10 10))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_intersection(st_polygon('POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))'), st_polygon('POLYGON ((10 10, 15 10, 15 15, 10 15, 10 10))'))) |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```

Intersection of identical polygons (returns the polygon itself)

```sql
SELECT ST_AsText(ST_Intersection(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_intersection(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))                                                                  |
+----------------------------------------------------------------------------------------------------------+
```

Unsupported type (Point × Polygon, returns NULL)

```sql
SELECT ST_AsText(ST_Intersection(ST_Point(1, 1), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_intersection(st_point(1.0, 1.0), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')))    |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```

NULL parameter (returns NULL)

```sql
SELECT ST_AsText(ST_Intersection(NULL, ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_intersection(NULL, st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')))                   |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```
