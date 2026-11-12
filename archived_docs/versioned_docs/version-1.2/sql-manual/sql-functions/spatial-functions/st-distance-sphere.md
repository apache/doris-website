---
{
    "title": "ST_DISTANCE_SPHERE",
    "language": "en"
}
---

## ST_Distance_Sphere
### description
#### Syntax

`DOUBLE ST_Distance_Sphere(DOUBLE x_lng, DOUBLE x_lat, DOUBLE y_lng, DOUBLE y_lat)`


Calculate the spherical distance between two points of the earth in meters. The incoming parameters are the longitude of point X, the latitude of point X, the longitude of point Y and the latitude of point Y.

x_lng and y_lng are Longitude values, must be in the range [-180, 180].
x_lat and y_lat are Latitude values, must be in the range [-90, 90].

### example

```
mysql> select st_distance_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219);
+----------------------------------------------------------------------------+
| st_distance_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219) |
+----------------------------------------------------------------------------+
|                                                         7336.9135549995917 |
+----------------------------------------------------------------------------+
```
### keywords
ST_DISTANCE_SPHERE,ST,DISTANCE,SPHERE
