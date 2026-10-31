---
{
    "title": "ST_ANGLE_SPHERE",
    "language": "en"
}
---

## Description

Calculate the center Angle between two points on the Earth's surface in degrees. The parameters passed in are the longitude of point X, latitude of point X, longitude of point Y, and latitude of point Y.

## Syntax

```sql
ST_ANGLE_SPHERE( <x_lng>, <x_lat>, <y_lng>, <y_lat>)
```

## Parameters

| Parameters | Instructions |
| -- | -- |
| `<x_lng>` | Longitude data, reasonable value range is [-180, 180] |
| `<y_lng>` | Longitude data, reasonable value range is [-180, 180] |
| `<x_lat>` | Latitude data, reasonable value range is [-90, 90] |
| `<y_lat>` | Latitude data, reasonable value range is [-90, 90] |

## Return Value

The Angle of the center between two points

## Examples

```sql
select ST_Angle_Sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219);
```

```text
+---------------------------------------------------------------------------+
| st_angle_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219) |
+---------------------------------------------------------------------------+
|                                                        0.0659823452409903 |
+---------------------------------------------------------------------------+
```

```sql
select ST_Angle_Sphere(0, 0, 45, 0);
```

```text
+----------------------------------------+
| st_angle_sphere(0.0, 0.0, 45.0, 0.0) |
+----------------------------------------+
|                                     45 |
+----------------------------------------+
```

