---
{
    "title": "ST_AZIMUTH",
    "language": "en"
}
---

## Description

Calculates the azimuth (in radians) between two points on the Earth's surface. The azimuth is the angle from the true north direction line at the starting point (point 1) to the line connecting the two points, measured clockwise.

Azimuth is widely used in navigation and geographic information systems (GIS) to represent the direction from one point to another.

## Sytax

```sql
ST_AZIMUTH( <point1>, <point2>)
```
## Parameters

| Parameter       | Description           |
|----------|--------------|
| `<point1>` | The starting point, of type GeoPoint, serving as the reference point for azimuth calculation. |
| `<point2>` | The ending point, of type GeoPoint, for which the direction relative to the starting point is calculated. |

## Retuen value

Returns the azimuth between the two points in radians, with a range of [0, 2π). The azimuth is measured clockwise from true north, with specific direction correspondences:

- True north: 0 radians
- True east: π/2 radians (approximately 1.5708)
- True south: π radians (approximately 3.1416)
- True west: 3π/2 radians (approximately 4.7124)

Edge cases for ST_AZIMUTH:

- Returns NULL if the two input points are identical (same longitude and latitude).
- Returns NULL if the two input points are antipodal (diametrically opposite on the Earth).
- Returns NULL if any input geographic location is not a single point or is an empty geographic object.

## Example


True west (from (1,0) to (0,0))

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

True east (from (0,0) to (1,0))


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

True north (from (0,0) to (0,1))

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

Antipodal points

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

Northeast direction (from (0,0) to (1,1))

```sql
mysql> SELECT st_azimuth(ST_Point(0, 0), ST_Point(1, 1));
+--------------------------------------------+
| st_azimuth(ST_Point(0, 0), ST_Point(1, 1)) |
+--------------------------------------------+
|                         0.7854743216187384 |
+--------------------------------------------+
```

East direction crossing 180° longitude (from (170, 0) to (-170, 0))

```sql
mysql> SELECT st_azimuth(ST_Point(170, 0), ST_Point(-170, 0));
+-------------------------------------------------+
| st_azimuth(ST_Point(170, 0), ST_Point(-170, 0)) |
+-------------------------------------------------+
|                              1.5707963267948966 |
+-------------------------------------------------+
```

Non-point type input returns NULL

```sql

mysql> SELECT st_azimuth(ST_LineFromText("LINESTRING (0 0, 1 1)"), ST_Point(1, 0));
+----------------------------------------------------------------------+
| st_azimuth(ST_LineFromText("LINESTRING (0 0, 1 1)"), ST_Point(1, 0)) |
+----------------------------------------------------------------------+
|                                                                 NULL |
+----------------------------------------------------------------------+
```

