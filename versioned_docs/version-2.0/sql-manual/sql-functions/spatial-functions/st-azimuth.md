---
{
    "title": "ST_AZIMUTH",
    "language": "en"
}
---

## Description

Enter two points and return the azimuth of the line segment formed by points 1 and 2. Azimuth is the arc of the Angle between the true north line of point 1 and the line segment formed by points 1 and 2.

## Syntax

```sql
ST_AZIMUTH( <point1>, <point2>)
```
## Parameters

| Parameters | Instructions                                   |
|----------|------------------------------------------------|
| `<point1>` | The first point used to calculate the azimuth  |
| `<point2>` | The second point used to calculate the azimuth |

## Return Value

Positive angles are measured clockwise on the sphere. For example, the azimuth of a line segment:

- North is 0
- East is PI/2
- The guide is PI
- The west is 3PI/2

ST_Azimuth has the following edge cases:

- Return NULL if both input points are the same.
- NULL is returned if the two input points are perfect mapping points.
- An error is thrown if any of the input geographies are not a single point or are empty geographies

## Examples

```sql
SELECT st_azimuth(ST_Point(1, 0),ST_Point(0, 0));
```

```text
+----------------------------------------------------+
| st_azimuth(st_point(1.0, 0.0), st_point(0.0, 0.0)) |
+----------------------------------------------------+
|                                   4.71238898038469 |
+----------------------------------------------------+
```

```sql
SELECT st_azimuth(ST_Point(0, 0),ST_Point(1, 0));
```

```text
+----------------------------------------------------+
| st_azimuth(st_point(0.0, 0.0), st_point(1.0, 0.0)) |
+----------------------------------------------------+
|                                 1.5707963267948966 |
+----------------------------------------------------+
```

```sql
SELECT st_azimuth(ST_Point(0, 0),ST_Point(0, 1));
```

```text
+----------------------------------------------------+
| st_azimuth(st_point(0.0, 0.0), st_point(0.0, 1.0)) |
+----------------------------------------------------+
|                                                  0 |
+----------------------------------------------------+
```

```sql
SELECT st_azimuth(ST_Point(-30, 0),ST_Point(150, 0));
```

```text
+--------------------------------------------------------+
| st_azimuth(st_point(-30.0, 0.0), st_point(150.0, 0.0)) |
+--------------------------------------------------------+
|                                                   NULL |
+--------------------------------------------------------+
```

