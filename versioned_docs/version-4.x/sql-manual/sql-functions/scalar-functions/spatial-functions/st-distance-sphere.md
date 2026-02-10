---
{
    "title": "ST_DISTANCE_SPHERE",
    "language": "en",
    "description": "Calculate the spherical distance between two points on the Earth, in meters. The input parameters are the longitude of point X, latitude of point X,"
}
---

## Description

Calculate the spherical distance between two points on the Earth, in meters. The input parameters are the longitude of point X, latitude of point X, longitude of point Y, and latitude of point Y respectively.

## Sytax

```sql
ST_DISTANCE_SPHERE( <x_lng>, <x_lat>, <y_lng>, <y_lat>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x_lng>` | Longitude of point X, of type DOUBLE, with a valid range of [-180, 180] (returns NULL if out of range).|
| `<y_lng>` | Latitude of point X, of type DOUBLE, with a valid range of [-90, 90] (returns NULL if out of range). |
| `<x_lat>` | Longitude of point Y, of type DOUBLE, with a valid range of [-180, 180] (returns NULL if out of range). |
| `<y_lat>` | Latitude of point Y, of type DOUBLE, with a valid range of [-90, 90] (returns NULL if out of range). |

## Retuen value

Returns the shortest spherical distance between the two points, in meters (of type DOUBLE).

ST_DISTANCE_SPHERE has the following edge cases:

- If any input parameter is NULL, returns NULL.
- If longitude is out of [-180, 180] or latitude is out of [-90, 90], returns NULL.
- If the two points are completely identical (with the same longitude and latitude values), returns 0 (distance is 0).
## Example

Two identical points (returns 0)

```sql
select st_distance_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219);
```

```text
+----------------------------------------------------------------------------+
| st_distance_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219) |
+----------------------------------------------------------------------------+
|                                                         7336.9135549995917 |
+----------------------------------------------------------------------------+
```

Two points on the equator (longitude difference of 1°, latitude 0°)

```sql
mysql> SELECT ST_DISTANCE_SPHERE(0, 0, 1, 0);
+--------------------------------+
| ST_DISTANCE_SPHERE(0, 0, 1, 0) |
+--------------------------------+
|             111195.10117748393 |
+--------------------------------+
```

Actual nearby points with a longitude difference of 20°

```sql

-- Point X(170, 0), Point Y(-170, 0) (longitude difference of 20° instead of 340°, taking the shortest path)
mysql> SELECT ST_DISTANCE_SPHERE(170, 0, -170, 0);
+-------------------------------------+
| ST_DISTANCE_SPHERE(170, 0, -170, 0) |
+-------------------------------------+
|                   2223902.023549678 |
+-------------------------------------+
```

Invalid parameter (latitude out of range)

```sql
mysql> SELECT ST_DISTANCE_SPHERE(116, 39, 120, 91);
+--------------------------------------+
| ST_DISTANCE_SPHERE(116, 39, 120, 91) |
+--------------------------------------+
|                                 NULL |
+--------------------------------------+
```

NULL parameter returns NULL

```sql
mysql> SELECT ST_DISTANCE_SPHERE(NULL, 39.9, 116.4, 30);
+-------------------------------------------+
| ST_DISTANCE_SPHERE(NULL, 39.9, 116.4, 30) |
+-------------------------------------------+
|                                      NULL |
+-------------------------------------------+
```

Two identical coordinates return 0

```sql

mysql>  SELECT ST_DISTANCE_SPHERE(1,1 , 1, 1);
+--------------------------------+
| ST_DISTANCE_SPHERE(1,1 , 1, 1) |
+--------------------------------+
|                              0 |
+--------------------------------+
```