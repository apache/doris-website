---
{
    "title": "ST_DISTANCE_SPHERE",
    "language": "en",
    "description": "Calculate the spherical distance in meters between two points on the Earth. The parameters passed in are the longitude of point X,"
}
---

## Description

Calculate the spherical distance in meters between two points on the Earth. The parameters passed in are the longitude of point X, latitude of point X, longitude of point Y, and latitude of point Y.

## Syntax

```sql
ST_DISTANCE_SPHERE( <x_lng>, <x_lat>, <y_lng>, <y_lat>)
```

## Parameters

| Parameters | Instructions |
| -- | -- |
| `<x_lng>` | Longitude data, reasonable value range is [-180, 180] |
| `<y_lng>` | Longitude data, reasonable value range is [-180, 180] |
| `<x_lat>` | Latitude data, reasonable value range is [-90, 90] |
| `<y_lat>` | Latitude data, reasonable value range is [-90, 90] |

## Return Value

The spherical distance between two points

## Examples

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

