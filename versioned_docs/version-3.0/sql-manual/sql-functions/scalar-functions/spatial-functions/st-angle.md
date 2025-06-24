---
{
    "title": "ST_ANGLE",
    "language": "en"
}
---

## Description

Enter three points that represent two intersecting lines. Return the Angle between these lines.

## Syntax

```sql
ST_ANGLE( <point1>, <point2>, <point3>)
```

## Parameters

| Parameters       | Instructions                                                              |
|----------|---------------------------------------------------------------------------|
| `<point1>` | The first point of the first line                                         |
| `<point2>` | The second point of the first line and the first point of the second line |
| `<point3>` | The second point of the second line                                       |

## Return Value

The Angle between these lines is expressed in radians and ranges from [0, 2pi]. The Angle is measured clockwise from the first line to the second line.

ST_ANGLE has the following edge cases:

- If point 2 and point 3 are the same, NULL is returned
- If point 2 and point 1 are the same, NULL is returned
- NULL is returned if points 2 and 3 are perfect Antipodes
- NULL is returned if points 2 and 1 are perfect AntipodesL
- If any input geography is not a single point or is an empty geography, an error is thrown

## Examples

```sql
SELECT ST_Angle(ST_Point(1, 0),ST_Point(0, 0),ST_Point(0, 1));
```

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

```text
+----------------------------------------------------------------------+
| st_angle(st_point(1.0, 0.0), st_point(0.0, 0.0), st_point(1.0, 0.0)) |
+----------------------------------------------------------------------+
|                                                                    0 |
+----------------------------------------------------------------------+
```

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

