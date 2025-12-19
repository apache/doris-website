---
{
    "title": "ST_CIRCLE",
    "language": "en",
    "description": "Converts a WKT (Well-Known Text) into a circle on the Earth's spherical surface."
}
---

## Description

Converts a WKT (Well-Known Text) into a circle on the Earth's spherical surface.

## Sytax

```sql
ST_CIRCLE( <center_lng>, <center_lat>, <radius>)
```
## Parameters

| Parameter | Description |
| -- | -- |
| `<center_lng>` | 	Longitude of the circle's center, of type DOUBLE, with a valid range of [-180, 180] |
| `<center_lat>` |	Latitude of the circle's center, of type DOUBLE, with a valid range of [-180, 180] |
| `<radius>` | 		Radius of the circle, of type DOUBLE, in meters |


## Retuen value

Returns a circle on the Earth's spherical surface, of type GeoCircle. Its WKT representation is CIRCLE ((<center_lng> <center_lat>), <radius>), which contains the center coordinates and radius information.

ST_CIRCLE has the following edge cases:

- If any input parameter is NULL, returns NULL.
- If <center_lng> is out of [-180, 180] or <center_lat> is out of [-90, 90], returns NULL.
- If <radius> is 0, returns a special circle with the center as the only point (WKT representation: CIRCLE ((<center_lng> <center_lat>), 0)).

## Example

Basic usage (normal circle)

```sql
SELECT ST_AsText(ST_Circle(111, 64, 10000));
```

```text
+--------------------------------------------+
| st_astext(st_circle(111.0, 64.0, 10000.0)) |
+--------------------------------------------+
| CIRCLE ((111 64), 10000)                   |
+--------------------------------------------+
```

Circle on the equator (latitude 0°)

```sql
mysql> SELECT ST_AsText(ST_Circle(0, 0, 5000));
+----------------------------------+
| ST_AsText(ST_Circle(0, 0, 5000)) |
+----------------------------------+
| CIRCLE ((0 0), 5000)             |
+----------------------------------+
```


Circle with radius 0 (degenerates to a point)

```sql
mysql> SELECT ST_AsText(ST_Circle(120, 30, 0));
+----------------------------------+
| ST_AsText(ST_Circle(120, 30, 0)) |
+----------------------------------+
| CIRCLE ((120 30), 0)             |
+----------------------------------+
```

Invalid parameter (longitude out of range)

```sql
mysql> SELECT ST_AsText(ST_Circle(190, 30, 1000));
+-------------------------------------+
| ST_AsText(ST_Circle(190, 30, 1000)) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

NULL parameter

```sql
mysql> SELECT ST_AsText(ST_Circle(NULL, 30, 1000));
+--------------------------------------+
| ST_AsText(ST_Circle(NULL, 30, 1000)) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```