---
{
    "title": "ST_ANGLE",
    "language": "en",
    "description": "Input three points. The first line is the straight line connecting point1 (first endpoint) and point2 (second endpoint)."
}
---

## Description
 
Input three points. The first line is the straight line connecting point1 (first endpoint) and point2 (second endpoint). The second line is the straight line connecting point2 (first endpoint) and point3 (second endpoint). These two lines intersect at point2. The function returns the angle from the first line to the second line in the clockwise direction. For each endpoint coordinate, the x value (longitude) must be in the range [-180, 180], and the y value (latitude) must be in the range [-90, 90].

## Sytax

```sql
ST_ANGLE( <point1>, <point2>, <point3>)
```

## Parameters

| parameters       | descriptions                       |
|----------|--------------------------|
| `<point1>` | The first endpoint of the first line, of type `GeoPoint`             |
| `<point2>` | The second endpoint of the first line and the first endpoint of the second line, of type `GeoPoint` |
| `<point3>` | The second endpoint of the second line, of type  `GeoPoint` |

## Retuen Value

Returns the angle between the two lines in radians, as a double-precision floating-point number, with a range of [0, 2π). The angle is measured clockwise from the first line to the second line.

ST_ANGLE has the following edge cases:

- Returns NULL if point2 and point3 are the same.
- Returns NULL if point2 and point1 are the same.
- Returns NULL if point2 and point3 are exact antipodal points.
- Returns NULL if point2 and point1 are exact antipodal points.
- Returns NULL if any point's coordinates exceed the specified ranges for x (longitude) or y (latitude).
- Returns NULL if any input point is NULL.

## Example

```sql
SELECT ST_Angle(ST_Point(1, 0),ST_Point(0, 0),ST_Point(0, 1));
```

The clockwise angle from the first line to the second line is 4.7 radians.

```text
+----------------------------------------------------------------------+
| st_angle(st_point(1.0, 0.0), st_point(0.0, 0.0), st_point(0.0, 1.0)) |
+----------------------------------------------------------------------+
|                                                     4.71238898038469 |
+----------------------------------------------------------------------+
```

```sql
SELECT ST_Angle(ST_Point(0, 0),ST_Point(1, 0),ST_Point(0, 1));
```

The clockwise angle from the first line to the second line is 0.78 radians.

```text
+----------------------------------------------------------------------+
| st_angle(st_point(0.0, 0.0), st_point(1.0, 0.0), st_point(0.0, 1.0)) |
+----------------------------------------------------------------------+
|                                                  0.78547432161873854 |
+----------------------------------------------------------------------+
```

```sql
SELECT ST_Angle(ST_Point(1, 0),ST_Point(0, 0),ST_Point(1, 0));
```

The two lines overlap, so the clockwise angle is 0.

```text
+----------------------------------------------------------------------+
| st_angle(st_point(1.0, 0.0), st_point(0.0, 0.0), st_point(1.0, 0.0)) |
+----------------------------------------------------------------------+
|                                                                    0 |
+----------------------------------------------------------------------+
```

point2 and point3 are the same, returns NULL.

```sql
SELECT ST_Angle(ST_Point(1, 0),ST_Point(0, 0),ST_Point(0, 0));
```


```text
+----------------------------------------------------------------------+
| st_angle(st_point(1.0, 0.0), st_point(0.0, 0.0), st_point(0.0, 0.0)) |
+----------------------------------------------------------------------+
|                                                                 NULL |
+----------------------------------------------------------------------+
```

The two lines are antipodal in direction, returns NULL.

```sql
SELECT ST_Angle(ST_Point(0, 0),ST_Point(-30, 0),ST_Point(150, 0));
```

```text
+--------------------------------------------------------------------------+
| st_angle(st_point(0.0, 0.0), st_point(-30.0, 0.0), st_point(150.0, 0.0)) |
+--------------------------------------------------------------------------+
|                                                                     NULL |
+--------------------------------------------------------------------------+
```

If any point is NULL, returns NULL.

```sql
mysql> SELECT ST_Angle(NULL,ST_Point(-30, 0),ST_Point(-150, 0)) ;
+---------------------------------------------------+
| ST_Angle(NULL,ST_Point(-30, 0),ST_Point(-150, 0)) |
+---------------------------------------------------+
|                                              NULL |
+---------------------------------------------------+
```

If any coordinate exceeds the specified range, returns NULL.

```sql

mysql> SELECT ST_Angle(ST_Point(0, 0),ST_Point(-30, 0),ST_Point(180, 91));
+-------------------------------------------------------------+
| ST_Angle(ST_Point(0, 0),ST_Point(-30, 0),ST_Point(180, 91)) |
+-------------------------------------------------------------+
|                                                        NULL |
+-------------------------------------------------------------+

```

If any coordinate is NULL, returns NULL.

```sql
mysql> SELECT ST_Angle(NULL,ST_Point(-30, 0),ST_Point(150, 90));
+---------------------------------------------------+
| ST_Angle(NULL,ST_Point(-30, 0),ST_Point(150, 90)) |
+---------------------------------------------------+
|                                              NULL |
+---------------------------------------------------+
```