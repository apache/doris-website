---
{
    "title": "ST_WITHIN",
    "language": "en",
    "description": "Determines whether one geometric shape (shape1) is completely inside another geometric shape (shape2)."
}
---

## Description

Determines whether one geometric shape (shape1) is completely inside another geometric shape (shape2). Returns 1 if shape1 is entirely within shape2; otherwise, returns 0.

`ST_WITHIN(shape1, shape2)` is logically equivalent to `ST_CONTAINS(shape2, shape1)`.

- For points: The point must lie inside or on the boundary of the polygon.
- For lines: All points of the line must lie inside or on the boundary of the polygon.
- For polygons: The inner polygon must be entirely inside the outer polygon (boundaries can overlap).

## Syntax

```sql
ST_WITHIN( <shape1>, <shape2>)
```

## Parameters

| Parameters       | Description                     |
|----------|------------------------|
| `<shape1>` | The geometric shape to check if it is inside the other shape, supporting types such as Point, Line, Polygon, etc. |
| `<shape2>` | The geometric shape used to check if it contains shape1, supporting the Polygon type. |

## Return Value

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
|                                                                                 1 |
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
