---
{
    "title": "ST_DISJOINT",
    "language": "en"
}
---

## Description

Determines whether two geometric shapes are completely disjoint (i.e., have no common points). Returns 1 if there is no intersection in the boundaries or interiors of the two shapes (no shared points); returns 0 if there is at least one common point (including boundary contact or interior overlap).

:::info Note
Supported since Apache Doris 3.0.6.
:::

## Sytax

```sql
ST_DISJOINT( <shape1>, <shape2> )
```

## Parameters

| Parameter       | Description                     |
|----------|------------------------|
| `<shape1>` | The first geometric shape used to determine if it is disjoint from the other, supporting types such as Point, Line, Polygon,Circle.|
| `<shape2>` | 	The second geometric shape used to determine if it is disjoint from the other, supporting types such as Point, Line, Polygon,Circle. |

## Return value

1: shape1 is completely disjoint from shape2 (no common points).
0: shape1 intersects with shape2 (at least one common point exists).

ST_DISJOINT has the following edge cases:

- Returns NULL if either input parameter is NULL.
- Returns NULL if the input geometric shapes are invalid.
- Returns 1 for empty geometric shapes (empty shapes have no points and are disjoint from any shape).

## Example

Polygon and inner point (intersect, returns 0)

```sql
SELECT ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5));
```

```text
+------------------------------------------------------------------------------------+
| ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5)) |
+------------------------------------------------------------------------------------+
|                                                                                  0 |
+------------------------------------------------------------------------------------+
```

Polygon and outer point (disjoint, returns 1)

```sql
SELECT ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(50, 50));
```

```text
+--------------------------------------------------------------------------------------+
| ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(50, 50)) |
+--------------------------------------------------------------------------------------+
|                                                                                    1 |
+--------------------------------------------------------------------------------------+
```

Point and line are disjoint (point is outside the line)

```sql
mysql> SELECT ST_Disjoint(ST_Linefromtext("LINESTRING (0 0, 10 10)"), ST_Point(1, 2));
+-------------------------------------------------------------------------+
| ST_Disjoint(ST_Linefromtext("LINESTRING (0 0, 10 10)"), ST_Point(1, 2)) |
+-------------------------------------------------------------------------+
|                                                                       1 |
```

Point and line intersect (point is on the line)

```sql
mysql> SELECT ST_Disjoint(ST_Linefromtext("LINESTRING (0 0, 10 10)"), ST_Point(5, 5));
+-------------------------------------------------------------------------+
| ST_Disjoint(ST_Linefromtext("LINESTRING (0 0, 10 10)"), ST_Point(5, 5)) |
+-------------------------------------------------------------------------+
|                                                                       0 |
+-------------------------------------------------------------------------+
```

Lines intersect

```sql
mysql> SELECT ST_Disjoint(  ST_Linefromtext("LINESTRING (0 0, 10 10)"),  ST_Linefromtext("LINESTRING (0 10, 10 0)"));
+--------------------------------------------------------------------------------------------------------+
| ST_Disjoint(  ST_Linefromtext("LINESTRING (0 0, 10 10)"),  ST_Linefromtext("LINESTRING (0 10, 10 0)")) |
+--------------------------------------------------------------------------------------------------------+
|                                                                                                      0 |
+--------------------------------------------------------------------------------------------------------+
```

Lines are disjoint (parallel and non-overlapping)

```sql
mysql> SELECT ST_Disjoint(  ST_Linefromtext("LINESTRING (0 0, 10 0)"),  ST_Linefromtext("LINESTRING (0 1, 10 1)"));
+------------------------------------------------------------------------------------------------------+
| ST_Disjoint(  ST_Linefromtext("LINESTRING (0 0, 10 0)"),  ST_Linefromtext("LINESTRING (0 1, 10 1)")) |
+------------------------------------------------------------------------------------------------------+
|                                                                                                    1 |
+------------------------------------------------------------------------------------------------------+
```

Polygons are disjoint (completely separated)

```sql
mysql> SELECT ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((20 20, 30 20, 30 30, 20 30, 20 20))"));
+------------------------------------------------------------------------------------------------------------------------------------+
| ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((20 20, 30 20, 30 30, 20 30, 20 20))")) |
+------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                  1 |
+------------------------------------------------------------------------------------------------------------------------------------+
```

Polygons intersect (partially overlapping)

```sql

mysql> SELECT ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))"));
+------------------------------------------------------------------------------------------------------------------------------+
| ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))")) |
+------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                            0 |
+------------------------------------------------------------------------------------------------------------------------------+
```

Empty geometric shape is disjoint from any shape

```sql
mysql> SELECT ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_GeometryFromText("POINT EMPTY"));
+-----------------------------------------------------------------------------------------------------------+
| ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_GeometryFromText("POINT EMPTY")) |
+-----------------------------------------------------------------------------------------------------------+
|                                                                                                      NULL |
+-----------------------------------------------------------------------------------------------------------+
```

Invalid geometric shape (self-intersecting polygon) as parameter

```sql
mysql> SELECT ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))"),  ST_Point(0.5, 0.5));
+---------------------------------------------------------------------------------------+
| ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))"),  ST_Point(0.5, 0.5)) |
+---------------------------------------------------------------------------------------+
|                                                                                  NULL |
+---------------------------------------------------------------------------------------+
```

NULL parameter returns NULL

```sql

mysql> SELECT ST_Disjoint(ST_Point(0,0), NULL);
+----------------------------------+
| ST_Disjoint(ST_Point(0,0), NULL) |
+----------------------------------+
|                             NULL |
+----------------------------------+
```

Circle joint in Polygon

```sql
mysql> SELECT ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"),  ST_Circle(5, 2.5, 2000));
+--------------------------------------------------------------------------------------------+
| ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"),  ST_Circle(5, 2.5, 2000)) |
+--------------------------------------------------------------------------------------------+
|                                                                                          0 |
+--------------------------------------------------------------------------------------------+
```

Circle DisJoint Polygon

```sql
mysql> SELECT ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Circle(20, 5, 5));
+--------------------------------------------------------------------------------------------+
| ST_Disjoint(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Circle(20, 5, 5)) |
+--------------------------------------------------------------------------------------------+
|                                                                                          1 |
+--------------------------------------------------------------------------------------------+
```