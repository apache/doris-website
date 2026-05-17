---
{
    "title": "ST_POINT",
    "language": "en",
    "description": "Creates a Point geometry object from the given X and Y coordinates. In geospatial contexts,"
}
---

## Description

Creates a Point geometry object from the given X and Y coordinates.
In geospatial contexts, X/Y typically represent longitude and latitude respectively,

## Sytax

```sql
ST_POINT( <x>, <y>)
```
## Parameters

| Parameter  | Description  |
|-----|-----|
| `<x>` | X-coordinate (longitude) of the point, range: -180.0 to 180.0 (degrees) |
| `<y>` | Y-coordinate (latitude) of the point, range: -90.0 to 90.0 (degrees)） |

## Return value

Returns a Point geometry object representing a 2D coordinate.

- Returns NULL if <x> or <y> exceeds valid longitude/latitude ranges.
- Returns NULL if either parameter is NULL.

## Example

Valid Coordinates

```sql
SELECT ST_AsText(ST_Point(24.7, 56.7));
```

```text
+---------------------------------+
| st_astext(st_point(24.7, 56.7)) |
+---------------------------------+
| POINT (24.7 56.7)               |
+---------------------------------+
```

Invalid Longitude (Out of Range)

```sql
mysql> SELECT ST_Point(200, 50);
+-------------------+
| ST_Point(200, 50) |
+-------------------+
| NULL              |
+-------------------+
```

Invalid Latitude (Out of Range)

```sql
mysql> SELECT ST_Point(116, -100);
+---------------------+
| ST_Point(116, -100) |
+---------------------+
| NULL                |
+---------------------+
```

Any parameter NULL

```sql
mysql> SELECT ST_Point(NULL, 50);
+--------------------+
| ST_Point(NULL, 50) |
+--------------------+
| NULL               |
+--------------------+
```

```sql
mysql> SELECT ST_Point(50, NULL);
+--------------------+
| ST_Point(50, NULL) |
+--------------------+
| NULL               |
+--------------------+

```

