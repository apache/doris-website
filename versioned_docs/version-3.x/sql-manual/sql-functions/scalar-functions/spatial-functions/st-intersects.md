---
{
    "title": "ST_INTERSECTS",
    "language": "en",
    "description": "Determine whether two geometric shapes intersect, i.e., there is at least one common point (including boundary contact or internal overlap)."
}
---

## Description

Determine whether two geometric shapes intersect, i.e., there is at least one common point (including boundary contact or internal overlap).

:::info Note
Supported since Apache Doris 3.0.6.
:::

## Sytax

```sql
ST_INTERSECTS( <shape1>, <shape2>)
```

## Parameters

| Parameter       | Description                     |
|----------|------------------------|
| `<shape1>` | The first geometric shape used to determine if it intersects with another, supporting types such as Point, Line, Polygon, Circle。 |
| `<shape2>` | 	The second geometric shape used to determine if it intersects with another, supporting types such as Point, Line, Polygon, Circle。 |

## Return value

Returns 1: shape1 intersects with shape2

Returns 0: shape1 does not intersect with shape2

ST_INTERSECTS has the following edge cases:

- If any input parameter is NULL, returns NULL.
- If the input geometric shape is invalid, returns NULL.
- If the input is an empty geometric shape, returns NULL.
- If the two shapes are only tangent at the boundary (with a unique common point), returns 1 (boundary contact is considered intersection)

## Example


Point inside polygon (intersect, returns 1)

```sql
SELECT ST_Intersects(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5));
```

```text
+--------------------------------------------------------------------------------------+
| ST_Intersects(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5)) |
+--------------------------------------------------------------------------------------+
|                                                                                    1 |
+--------------------------------------------------------------------------------------+
```

Point on polygon boundary (intersect, returns 1)

```sql

mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Point(0, 5));
+-----------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Point(0, 5)) |
+-----------------------------------------------------------------------------------------+
|                                                                                       1 |
+-----------------------------------------------------------------------------------------+
```

Point outside polygon (no intersection, returns 0)

```sql
mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Point(50, 50));
+-------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Point(50, 50)) |
+-------------------------------------------------------------------------------------------+
|                                                                                         0 |
+-------------------------------------------------------------------------------------------+
```

Lines cross each other (intersect, returns 1)

```sql
mysql> SELECT ST_INTERSECTS(  ST_Linefromtext("LINESTRING (0 0, 10 10)"),  ST_Linefromtext("LINESTRING (0 10, 10 0)"));
+----------------------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Linefromtext("LINESTRING (0 0, 10 10)"),  ST_Linefromtext("LINESTRING (0 10, 10 0)")) |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                        1 |
+----------------------------------------------------------------------------------------------------------+
```

Lines share one common point

```sql
mysql> SELECT ST_INTERSECTS(  ST_Linefromtext("LINESTRING (0 0, 2 2)"),  ST_Linefromtext("LINESTRING (2 2, 4 0)"));
+------------------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Linefromtext("LINESTRING (0 0, 2 2)"),  ST_Linefromtext("LINESTRING (2 2, 4 0)")) |
+------------------------------------------------------------------------------------------------------+
|                                                                                                    1 |
+------------------------------------------------------------------------------------------------------+
```

Lines are parallel and separated (no intersection, returns 0)

```sql
mysql> SELECT ST_INTERSECTS(  ST_Linefromtext("LINESTRING (0 0, 10 0)"),  ST_Linefromtext("LINESTRING (0 1, 10 1)"));
+--------------------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Linefromtext("LINESTRING (0 0, 10 0)"),  ST_Linefromtext("LINESTRING (0 1, 10 1)")) |
+--------------------------------------------------------------------------------------------------------+
|                                                                                                      0 |
+--------------------------------------------------------------------------------------------------------+
```

Line passes through the interior of a polygon (intersect, returns 1)

```sql
mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (2 2, 8 8)"));
+-------------------------------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (2 2, 8 8)")) |
+-------------------------------------------------------------------------------------------------------------------+
|                                                                                                                 1 |
+-------------------------------------------------------------------------------------------------------------------+
```


Line is tangent to polygon boundary (intersect, returns 1)

```sql
mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (0 5, 5 5)"));
+-------------------------------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (0 5, 5 5)")) |
+-------------------------------------------------------------------------------------------------------------------+
|                                                                                                                 1 |
+-------------------------------------------------------------------------------------------------------------------+
```

Line is completely outside the polygon (no intersection, returns 0)

```sql
mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (11 1, 11 9)"));
+---------------------------------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Linefromtext("LINESTRING (11 1, 11 9)")) |
+---------------------------------------------------------------------------------------------------------------------+
|                                                                                                                   0 |
+---------------------------------------------------------------------------------------------------------------------+
```

Polygons overlap (intersect, returns 1)

```sql
mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))"));
+--------------------------------------------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))")) |
+--------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                              1 |
+--------------------------------------------------------------------------------------------------------------------------------+
```

Polygons are completely separated (no intersection, returns 0)

```sql
mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((20 20, 30 20, 30 30, 20 30, 20 20))"));
+--------------------------------------------------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Polygon("POLYGON ((20 20, 30 20, 30 30, 20 30, 20 20))")) |
+--------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                    0 |
+--------------------------------------------------------------------------------------------------------------------------------------+
```

Polygons touch at boundaries (intersect, returns 1)

```sql

mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"),  ST_Polygon("POLYGON ((5 0, 10 0, 10 5, 5 5, 5 0))"));
+--------------------------------------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"),  ST_Polygon("POLYGON ((5 0, 10 0, 10 5, 5 5, 5 0))")) |
+--------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                        1 |
+--------------------------------------------------------------------------------------------------------------------------+
```

Circle and point inside (intersect, returns 1)

```sql
mysql> SELECT ST_INTERSECTS(  ST_Circle(0, 0, 1000),  ST_Point(0.005, 0));
+-------------------------------------------------------------+
| ST_INTERSECTS(  ST_Circle(0, 0, 1000),  ST_Point(0.005, 0)) |
+-------------------------------------------------------------+
|                                                           1 |
+-------------------------------------------------------------+
```

Circle is tangent to line (intersect, returns 1)

```sql
mysql> SELECT ST_INTERSECTS(  ST_Circle(0, 0, 1000),  ST_Linefromtext("LINESTRING (0.01 0.01, 0.02 0.02)"));
+-----------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Circle(0, 0, 1000),  ST_Linefromtext("LINESTRING (0.01 0.01, 0.02 0.02)")) |
+-----------------------------------------------------------------------------------------------+
|                                                                                             1 |
+-----------------------------------------------------------------------------------------------+
```

Circle and polygon are completely separated (no intersection, returns 0)
```sql
mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Circle(20, 5, 5));
+----------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_Circle(20, 5, 5)) |
+----------------------------------------------------------------------------------------------+
|                                                                                            0 |
+----------------------------------------------------------------------------------------------+
```

Circle intersects with polygon

```sql
mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"),  ST_Circle(5, 2.5, 2000));
+----------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"),  ST_Circle(5, 2.5, 2000)) |
+----------------------------------------------------------------------------------------------+
|                                                                                            1 |
+----------------------------------------------------------------------------------------------+
```

Empty geometric shape

```sql
mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_GeometryFromText("POINT EMPTY"));
+-------------------------------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"),  ST_GeometryFromText("POINT EMPTY")) |
+-------------------------------------------------------------------------------------------------------------+
|                                                                                                        NULL |
+-------------------------------------------------------------------------------------------------------------+
```

Invalid polygon (returns NULL)


```sql
mysql> SELECT ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))"),  ST_Point(0.5, 0.5));
+-----------------------------------------------------------------------------------------+
| ST_INTERSECTS(  ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))"),  ST_Point(0.5, 0.5)) |
+-----------------------------------------------------------------------------------------+
|                                                                                    NULL |
+-----------------------------------------------------------------------------------------+
```

NULL parameter (returns NULL)

```sql
mysql> SELECT ST_INTERSECTS(NULL, ST_Point(5, 5));
+-------------------------------------+
| ST_INTERSECTS(NULL, ST_Point(5, 5)) |
+-------------------------------------+
|                                NULL |
+-------------------------------------+
```