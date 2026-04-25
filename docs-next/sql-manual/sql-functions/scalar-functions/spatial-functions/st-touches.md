---
{
    "title": "ST_TOUCHES",
    "language": "en",
    "description": "Determine whether two geometric shapes have boundary contact only (i.e., there are common points on the boundaries, but no internal intersection)."
}
---

## Description

Determine whether two geometric shapes have boundary contact only (i.e., there are common points on the boundaries, but no internal intersection). Specifically:

Returns 1 if the boundaries of the two shapes have at least one common point, and their interiors are completely non-intersecting (no overlapping areas).
Returns 0 if there are no common points on the boundaries, or if there is an internal intersection (even if the boundaries are in contact).

This function is used to distinguish between "boundary-only contact" and "internal intersection" scenarios, such as shared edges of adjacent polygons (boundary-only contact) or tangent points between a line and a polygon (boundary-only contact).

## Sytax

```sql
ST_TOUCHES( <shape1>, <shape2>)
```

## Parameter

| Parameter| Description                     |
|----------|------------------------|
| `<shape1>` | The first geometric shape used to determine contact, supporting types such as Point, LineString, Polygon, Circle, etc. |
| `<shape2>` | The second geometric shape used to determine contact, supporting types such as Point, LineString, Polygon, Circle, etc. |

## Return value

Returns 1: shape1 is in contact with shape2.
Returns 0: shape1 is not in contact with shape2.

ST_TOUCHES has the following edge cases:

- If any input parameter is NULL, returns NULL.
- If the input geometric shape is invalid, returns NULL.
- If the input is an empty geometric object (e.g., POINT EMPTY), returns NULL.
- If one shape is completely contained within another (with internal intersection), returns 0 even if their boundaries are in contact.
- When a point is in contact with the boundary of a shape (a point has no interior), returns 1 (the "boundary" of a point is itself, which coincides with the shape's boundary with no internal intersection).。

## Example

Point on polygon boundary

```sql
mysql> SELECT ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Point(0, 5));
+--------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Point(0, 5)) |
+--------------------------------------------------------------------------------------+
|                                                                                    1 |
+--------------------------------------------------------------------------------------+
```

Point not on polygon boundary (inside the geometric shape)

```sql
mysql> SELECT ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Point(5, 5));
+--------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Point(5, 5)) |
+--------------------------------------------------------------------------------------+
|                                                                                    0 |
+--------------------------------------------------------------------------------------+
```


Lines touch at endpoints

```sql
mysql> SELECT ST_TOUCHES(  ST_Linefromtext("LINESTRING (0 0, 2 2)"),  ST_Linefromtext("LINESTRING (2 2, 4 0)"));
+---------------------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Linefromtext("LINESTRING (0 0, 2 2)"),  ST_Linefromtext("LINESTRING (2 2, 4 0)")) |
+---------------------------------------------------------------------------------------------------+
|                                                                                                 1 |
+---------------------------------------------------------------------------------------------------+
```

Lines intersect internally (not boundary contact, returns 0)

```sql
mysql> SELECT ST_TOUCHES(  ST_Linefromtext("LINESTRING (0 0, 10 10)"),  ST_Linefromtext("LINESTRING (0 10, 10 0)"));
+-------------------------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Linefromtext("LINESTRING (0 0, 10 10)"),  ST_Linefromtext("LINESTRING (0 10, 10 0)")) |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                     0 |
+-------------------------------------------------------------------------------------------------------+
```


Line is tangent to polygon boundary

```sql

mysql> SELECT ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (10 5, 15 5)"));
+------------------------------------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (10 5, 15 5)")) |
+------------------------------------------------------------------------------------------------------------------+
|                                                                                                                1 |
+------------------------------------------------------------------------------------------------------------------+
```

Line passes through the interior of the polygon (internal intersection, returns 0)

```sql


mysql> SELECT ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (5 5, 15 5)"));
+-----------------------------------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (5 5, 15 5)")) |
+-----------------------------------------------------------------------------------------------------------------+
|                                                                                                               0 |
+-----------------------------------------------------------------------------------------------------------------+
```

Polygons share a boundary (boundary-only contact, returns 1)

```sql
mysql> SELECT ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"),  ST_Polygon("POLYGON ((5 0, 10 0, 10 5, 5 5, 5 0))"));
+-----------------------------------------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"),  ST_Polygon("POLYGON ((5 0, 10 0, 10 5, 5 5, 5 0))")) |
+-----------------------------------------------------------------------------------------------------------------------+
|                                                                                                                     1 |
+-----------------------------------------------------------------------------------------------------------------------+
```

Polygons partially overlap (internal intersection, returns 0)

```sql
mysql> SELECT ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))"));
+-----------------------------------------------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))")) |
+-----------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                           0 |
+-----------------------------------------------------------------------------------------------------------------------------+
```

Empty shape and polygon (no contact, returns 0)

```sql
mysql> SELECT ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_GeometryFromText("POINT EMPTY"))
    -> ;
+----------------------------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_GeometryFromText("POINT EMPTY")) |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                     NULL |
+----------------------------------------------------------------------------------------------------------+
```

Invalid self-intersecting polygon (returns NULL)

```sql

mysql> SELECT ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))"),ST_Point(0.5, 0.5));
+------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))"),ST_Point(0.5, 0.5)) |
+------------------------------------------------------------------------------------+
|                                                                               NULL |
+------------------------------------------------------------------------------------+
```

Parameter is NULL (returns NULL)

```sql
mysql> SELECT ST_TOUCHES(NULL, ST_Point(5, 5));
+----------------------------------+
| ST_TOUCHES(NULL, ST_Point(5, 5)) |
+----------------------------------+
|                             NULL |
+----------------------------------+
```

```sql
mysql> SELECT ST_TOUCHES(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), NULL);
+-------------------------------------------------------------------------+
| ST_TOUCHES(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), NULL) |
+-------------------------------------------------------------------------+
|                                                                    NULL |
+-------------------------------------------------------------------------+
```


Circle is tangent to line

```sql
mysql> SELECT ST_TOUCHES(  ST_Circle(0, 0, 5),  ST_Linefromtext("LINESTRING (-10 5, 10 5)"));
+--------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Circle(0, 0, 5),  ST_Linefromtext("LINESTRING (-10 5, 10 5)")) |
+--------------------------------------------------------------------------------+
|                                                                              1 |
+--------------------------------------------------------------------------------+
```

Point intersects circle boundary

```sql

mysql> SELECT ST_TOUCHES(  ST_Circle(0, 0, 5),  ST_Point(5, 0));
+---------------------------------------------------+
| ST_TOUCHES(  ST_Circle(0, 0, 5),  ST_Point(5, 0)) |
+---------------------------------------------------+
|                                                 1 |
+---------------------------------------------------+
```

Two circles are tangent

```sql
mysql> SELECT ST_TOUCHES(  ST_Circle(0, 0, 5),  ST_Circle(10, 0, 5));
+--------------------------------------------------------+
| ST_TOUCHES(  ST_Circle(0, 0, 5),  ST_Circle(10, 0, 5)) |
+--------------------------------------------------------+
|                                                      1 |
+--------------------------------------------------------+
```

Point is inside circle (not tangent)

```sql
mysql> SELECT ST_TOUCHES(  ST_Circle(0, 0, 5),  ST_Point(4, 0));
+---------------------------------------------------+
| ST_TOUCHES(  ST_Circle(0, 0, 5),  ST_Point(4, 0)) |
+---------------------------------------------------+
|                                                 0 |
+---------------------------------------------------+
```

Line intersects circle, returns 0
```sql
mysql> SELECT ST_TOUCHES(  ST_Circle(0, 0, 5),  ST_Linefromtext("LINESTRING (-10 0, 10 0)"));
+--------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Circle(0, 0, 5),  ST_Linefromtext("LINESTRING (-10 0, 10 0)")) |
+--------------------------------------------------------------------------------+
|                                                                              0 |
+--------------------------------------------------------------------------------+
```

Circle is tangent to polygon

```sql
mysql> SELECT ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Circle(15, 5, 5));
+-------------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Circle(15, 5, 5)) |
+-------------------------------------------------------------------------------------------+
|                                                                                         1 |
+-------------------------------------------------------------------------------------------+
```

Circle intersects polygon, returns 0

```sql
mysql> SELECT ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Circle(8, 5, 3));
+------------------------------------------------------------------------------------------+
| ST_TOUCHES(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Circle(8, 5, 3)) |
+------------------------------------------------------------------------------------------+
|                                                                                        0 |
+------------------------------------------------------------------------------------------+
```