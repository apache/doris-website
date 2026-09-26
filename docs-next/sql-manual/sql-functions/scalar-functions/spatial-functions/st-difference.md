---
{
    "title": "ST_DIFFERENCE",
    "language": "en",
    "description": "Returns the geometry that represents the point set difference of two polygons (A - B)."
}
---

## Description

Returns the geometry that represents the point set difference of two polygons. The difference A - B is the set of all points that belong to polygon A but do not belong to polygon B.

Currently only supports Polygon × Polygon operations. If either input is not a Polygon type, returns NULL.

## Syntax

```sql
ST_DIFFERENCE( <polygon1>, <polygon2>)
```

## Parameters

| Parameters | Description |
|----------|------------------------|
| `<polygon1>` | The first polygon geometry (A), must be of Polygon type. |
| `<polygon2>` | The second polygon geometry (B) to subtract from the first, must be of Polygon type. |

## Return value

Returns a Polygon geometry representing the difference of polygon1 minus polygon2 (A - B).

ST_DIFFERENCE has the following edge cases:

- Returns NULL if either input parameter is NULL.
- Returns NULL if either input is not a Polygon type (e.g., Point, Line, MultiPolygon, Circle).
- Returns NULL if polygon1 is completely contained within polygon2 (result is empty).
- Returns NULL if both polygons are identical (result is empty).
- Returns the original polygon1 if the two polygons do not intersect.
- The result may contain holes (inner rings) when polygon2 is entirely within polygon1.

## Example

Difference of two overlapping polygons

```sql
SELECT ST_AsText(ST_Difference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_difference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((5 10.0374230459107, 0 10, 0 0, 10 0, 10 5.01900181748964, 5 5, 5 10.0374230459107))            |
+----------------------------------------------------------------------------------------------------------+
```

Difference of two disjoint polygons (returns original polygon)

```sql
SELECT ST_AsText(ST_Difference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((20 20, 30 20, 30 30, 20 30, 20 20))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_difference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((20 20, 30 20, 30 30, 20 30, 20 20))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))                                                                  |
+----------------------------------------------------------------------------------------------------------+
```

Difference of identical polygons (returns NULL)

```sql
SELECT ST_AsText(ST_Difference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_difference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'))) |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```

Difference with inner polygon (result has a hole)

```sql
SELECT ST_AsText(ST_Difference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((3 3, 7 3, 7 7, 3 7, 3 3))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_difference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((3 3, 7 3, 7 7, 3 7, 3 3))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0), (3 3, 7 3, 7 7, 3 7, 3 3))                                      |
+----------------------------------------------------------------------------------------------------------+
```

NULL parameter (returns NULL)

```sql
SELECT ST_AsText(ST_Difference(NULL, ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_difference(NULL, st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')))                     |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```
