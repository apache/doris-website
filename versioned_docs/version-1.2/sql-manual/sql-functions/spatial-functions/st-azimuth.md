---
{
    "title": "ST_AZIMUTH",
    "language": "en"
}
---

## ST_Azimuth

### Syntax

`DOUBLE ST_Azimuth(GEOPOINT point1, GEOPOINT point2)`

### description

Enter two point, and returns the azimuth of the line segment formed by points 1 and 2. The azimuth is the angle in radians measured between the line from point 1 facing true North to the line segment from point 1 to point 2.

The positive angle is measured clockwise on the surface of a sphere. For example, the azimuth for a line segment:

* Pointing North is 0
* Pointing East is PI/2
* Pointing South is PI
* Pointing West is 3PI/2

ST_Azimuth has the following edge cases:

* If the two input points are the same, returns NULL.
* If the two input points are exactly antipodal, returns NULL.
* If either of the input geographies are not single points or are the empty geography, throws an error.

### example

```
mysql> SELECT st_azimuth(ST_Point(1, 0),ST_Point(0, 0));
+----------------------------------------------------+
| st_azimuth(st_point(1.0, 0.0), st_point(0.0, 0.0)) |
+----------------------------------------------------+
|                                   4.71238898038469 |
+----------------------------------------------------+
1 row in set (0.03 sec)

mysql> SELECT st_azimuth(ST_Point(0, 0),ST_Point(1, 0));
+----------------------------------------------------+
| st_azimuth(st_point(0.0, 0.0), st_point(1.0, 0.0)) |
+----------------------------------------------------+
|                                 1.5707963267948966 |
+----------------------------------------------------+
1 row in set (0.01 sec)

mysql> SELECT st_azimuth(ST_Point(0, 0),ST_Point(0, 1));
+----------------------------------------------------+
| st_azimuth(st_point(0.0, 0.0), st_point(0.0, 1.0)) |
+----------------------------------------------------+
|                                                  0 |
+----------------------------------------------------+
1 row in set (0.01 sec)

mysql> SELECT st_azimuth(ST_Point(0, 1),ST_Point(0, 1));
+----------------------------------------------------+
| st_azimuth(st_point(0.0, 1.0), st_point(0.0, 1.0)) |
+----------------------------------------------------+
|                                               NULL |
+----------------------------------------------------+
1 row in set (0.02 sec)

mysql> SELECT st_azimuth(ST_Point(-30, 0),ST_Point(150, 0));
+--------------------------------------------------------+
| st_azimuth(st_point(-30.0, 0.0), st_point(150.0, 0.0)) |
+--------------------------------------------------------+
|                                                   NULL |
+--------------------------------------------------------+
1 row in set (0.02 sec)

```
### keywords
ST_AZIMUTH,ST,AZIMUTH
