---
{
    "title": "ST_ANGLE_SPHERE",
    "language": "en"
}
---

## ST_Angle_Sphere
### description
#### Syntax

`DOUBLE ST_Angle_Sphere(DOUBLE x_lng, DOUBLE x_lat, DOUBLE y_lng, DOUBLE y_lat)`


Calculates the central angle between two points on the Earth's surface. The incoming parameters are the longitude of point X, the latitude of point X, the longitude of point Y and the latitude of point Y.

x_lng and y_lng are Longitude values, must be in the range [-180, 180].
x_lat and y_lat are Latitude values, must be in the range [-90, 90].

### example

```
mysql> select ST_Angle_Sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219);
+---------------------------------------------------------------------------+
| st_angle_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219) |
+---------------------------------------------------------------------------+
|                                                        0.0659823452409903 |
+---------------------------------------------------------------------------+
1 row in set (0.06 sec)

mysql> select ST_Angle_Sphere(0, 0, 45, 0);
+----------------------------------------+
| st_angle_sphere(0.0, 0.0, 45.0, 0.0) |
+----------------------------------------+
|                                     45 |
+----------------------------------------+
1 row in set (0.06 sec)
```
### keywords
ST_ANGLE_SPHERE,ST,ANGLE,SPHERE
