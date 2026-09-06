---
{
    "title": "ST_SYMDIFFERENCE",
    "language": "en",
    "description": "Returns the geometry that represents the symmetric difference of two polygons (A ∪ B - A ∩ B)."
}
---

## Description

Returns the geometry that represents the symmetric difference of two polygons. The symmetric difference is the set of all points that belong to either polygon A or polygon B, but not to both. It is equivalent to (A ∪ B) - (A ∩ B), or equivalently (A - B) ∪ (B - A).

Currently only supports Polygon × Polygon operations. If either input is not a Polygon type, returns NULL.

## Syntax

```sql
ST_SYMDIFFERENCE( <polygon1>, <polygon2>)
```

## Parameters

| Parameters | Description |
|----------|------------------------|
| `<polygon1>` | The first polygon geometry, must be of Polygon type. |
| `<polygon2>` | The second polygon geometry, must be of Polygon type. |

## Return value

Returns a Polygon geometry representing the symmetric difference of the two input polygons.

ST_SYMDIFFERENCE has the following edge cases:

- Returns NULL if either input parameter is NULL.
- Returns NULL if either input is not a Polygon type (e.g., Point, Line, MultiPolygon, Circle).
- Returns NULL if both polygons are identical (symmetric difference is empty).
- Returns a multi-region polygon if the two polygons are disjoint (the result contains both polygons).
- The operation is symmetric: ST_SYMDIFFERENCE(A, B) = ST_SYMDIFFERENCE(B, A).

## Example

Symmetric difference of two overlapping polygons

```sql
SELECT ST_AsText(ST_SymDifference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_symdifference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((5 10.0374230459107, 0 10, 0 0, 10 0, 10 5.01900181748964, 5 5, 5 10.0374230459107), (5 10.0374230459107, 10 10, 10 5.01900181748964, 15 5, 15 15, 5 15, 5 10.0374230459107)) |
+----------------------------------------------------------------------------------------------------------+
```

Symmetric difference of two disjoint polygons (returns both polygons)

```sql
SELECT ST_AsText(ST_SymDifference(ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"), ST_Polygon("POLYGON ((10 10, 15 10, 15 15, 10 15, 10 10))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_symdifference(st_polygon('POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))'), st_polygon('POLYGON ((10 10, 15 10, 15 15, 10 15, 10 10))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0), (10 10, 15 10, 15 15, 10 15, 10 10))                                |
+----------------------------------------------------------------------------------------------------------+
```

Symmetric difference of identical polygons (returns NULL)

```sql
SELECT ST_AsText(ST_SymDifference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_symdifference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'))) |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```

NULL parameter (returns NULL)

```sql
SELECT ST_AsText(ST_SymDifference(NULL, ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_symdifference(NULL, st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')))                  |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```
