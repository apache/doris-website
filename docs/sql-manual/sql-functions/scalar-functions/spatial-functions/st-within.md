---
{
    "title": "ST_WITHIN",
    "language": "en",
    "description": "Determines whether one geometric shape (shape1) is completely inside another geometric shape (shape2)."
}
---

<version since="dev">

</version>

## Description

For development-version typed GEOGRAPHY inputs, see [Typed Geography](#typed-geography). The existing examples below use the historical STRING spatial interface.

Determines whether one geometric shape (shape1) is completely inside another geometric shape (shape2). Returns 1 if shape1 is entirely within shape2; otherwise, returns 0.

`ST_WITHIN(shape1, shape2)` is logically equivalent to `ST_CONTAINS(shape2, shape1)`.

- For points: The point must lie inside the polygon. A point on a polygon boundary returns 0.
- For lines: Containment follows the same spherical geometry rules as `ST_CONTAINS` with the arguments reversed.
- For polygons: The inner polygon must be contained by the outer polygon, according to the S2 containment rules used by `ST_CONTAINS`.

## Syntax

```sql
ST_WITHIN( <shape1>, <shape2>)
```

## Parameters

| Parameter        | Description                     |
|----------|------------------------|
| `<shape1>` | An encoded geometry value (`VARCHAR`) returned by a spatial constructor such as `ST_Point` or `ST_GeometryFromText`. |
| `<shape2>` | An encoded containing geometry (`VARCHAR`). Polygon and MultiPolygon support Point, LineString, Polygon, and MultiPolygon inputs; Circle supports Point inputs. Other valid shape combinations return 0. |

## Return Value

Returns `BOOLEAN`, displayed as 1 or 0 in SQL results. Raw WKT must first be converted with a spatial constructor.

- 1: Indicates that shape1 is completely inside shape2.
- 0: Indicates that shape1 is not inside shape2.

ST_WITHIN has the following edge cases:

- Returns NULL if either input parameter is NULL.
- Returns NULL if the input geometric shape is invalid (e.g., a self-intersecting polygon).
- Returns 0 if shape1 lies partially on the boundary but also partially outside shape2.

## Example

Point inside polygon

```sql
SELECT ST_Within(ST_Point(5, 5), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+-------------------------------------------------------------------------------------+
| st_within(st_point(5.0, 5.0), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+-------------------------------------------------------------------------------------+
|                                                                                   1 |
+-------------------------------------------------------------------------------------+
```

Point outside polygon

```sql
SELECT ST_Within(ST_Point(50, 50), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+---------------------------------------------------------------------------------------+
| st_within(st_point(50.0, 50.0), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+---------------------------------------------------------------------------------------+
|                                                                                     0 |
+---------------------------------------------------------------------------------------+
```

Line completely inside polygon

```sql
SELECT ST_Within(ST_LineFromText("LINESTRING (2 2, 8 8)"), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+-----------------------------------------------------------------------------------------------------------+
| st_within(st_linefromtext('LINESTRING (2 2, 8 8)'), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+-----------------------------------------------------------------------------------------------------------+
|                                                                                                         1 |
+-----------------------------------------------------------------------------------------------------------+
```

Line partially outside polygon

```sql
SELECT ST_Within(ST_LineFromText("LINESTRING (5 5, 15 15)"), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+-------------------------------------------------------------------------------------------------------------+
| st_within(st_linefromtext('LINESTRING (5 5, 15 15)'), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+-------------------------------------------------------------------------------------------------------------+
|                                                                                                           0 |
+-------------------------------------------------------------------------------------------------------------+
```

Polygon completely inside polygon

```sql
SELECT ST_Within(ST_Polygon("POLYGON ((2 2, 8 2, 8 8, 2 8, 2 2))"), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+-----------------------------------------------------------------------------------------------------------------------+
| st_within(st_polygon('POLYGON ((2 2, 8 2, 8 8, 2 8, 2 2))'), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+-----------------------------------------------------------------------------------------------------------------------+
|                                                                                                                     1 |
+-----------------------------------------------------------------------------------------------------------------------+
```

Polygon partially outside polygon

```sql
SELECT ST_Within(ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))"), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+---------------------------------------------------------------------------------------------------------------------------+
| st_within(st_polygon('POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))'), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+---------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                         0 |
+---------------------------------------------------------------------------------------------------------------------------+
```

Point on polygon boundary

```sql
SELECT ST_Within(ST_Point(0, 5), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+-----------------------------------------------------------------------------------+
| st_within(st_point(0.0, 5.0), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+-----------------------------------------------------------------------------------+
|                                                                                 0 |
+-----------------------------------------------------------------------------------+
```

NULL parameter (returns NULL)

```sql
SELECT ST_Within(ST_Point(5, 5), NULL);
```

```text
+-----------------------------------+
| ST_Within(ST_Point(5, 5), NULL)   |
+-----------------------------------+
|                              NULL |
+-----------------------------------+
```

Self-intersecting polygon as parameter

```sql
SELECT ST_Within(ST_Point(0.5, 0.5), ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))"));
```

```text
+-----------------------------------------------------------------------------------+
| st_within(st_point(0.5, 0.5), st_polygon('POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))')) |
+-----------------------------------------------------------------------------------+
|                                                                              NULL |
+-----------------------------------------------------------------------------------+
```

## Typed Geography (development version) {#typed-geography}

The development-version typed interface accepts nonempty XY Point, LineString and Polygon values with default `GEOGRAPHY(OGC:CRS84, spherical)` semantics. Geometry, other CRS/algorithms, Z/M, Multi*/GeometryCollection and EMPTY are not supported for calculations; valid raw values remain available for storage and access. NULL arguments return NULL. Edges are spherical geodesics, with the existing smaller-region polygon-ring interpretation. No spatial index or predicate pushdown is provided.

ST_Within(a,b) is evaluated as ST_Contains(b,a), for combinations of the three admitted shape kinds, with the same interior and boundary rules.
