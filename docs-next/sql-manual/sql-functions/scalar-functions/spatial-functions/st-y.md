---
{
    "title": "ST_Y",
    "language": "en",
    "description": "Returns the Y coordinate of a valid POINT geometry. In geospatial contexts, the Y coordinate typically corresponds to Latitude, ranging from [-90.0,"
}
---

## Description

Returns the Y coordinate of a valid POINT geometry. In geospatial contexts, the Y coordinate typically corresponds to Latitude, ranging from [-90.0, 90.0] (in degrees).

## Sytax

```sql
ST_Y( <point>)
```

## Parameters

| Parameters   | Description      |
|------|----------|
| `<point>` | A valid 2D POINT geometry from which to extract the Y coordinate. The Y value (latitude) must be within [-90.0, 90.0], and the X value (longitude) must be within [-180.0, 180.0]. |

## Retuen value

The Y coordinate of the input POINT, returned as a DOUBLE PRECISION FLOAT.

Returns the Y coordinate (latitude) for valid POINT inputs.
Returns NULL for NULL inputs, empty points (POINT EMPTY), 3D points, or invalid points (e.g., latitude outside [-90.0, 90.0]).

## Examples

Valid  Point

```sql
SELECT ST_Y(ST_Point(24.7, 56.7));
```

```text
+----------------------------+
| ST_Y(ST_Point(24.7, 56.7)) |
+----------------------------+
| 56.7                       |
+----------------------------+
```

Empty Point (POINT EMPTY)

```sql
mysql> SELECT ST_Y(ST_GeometryFromText("POINT EMPTY"));
+------------------------------------------+
| ST_Y(ST_GeometryFromText("POINT EMPTY")) |
+------------------------------------------+
|                                     NULL |
+------------------------------------------+
```
3D Point (Not Supported)

```sql
mysql> SELECT ST_Y(ST_GeometryFromText("POINT (10 20 30)"));
+-----------------------------------------------+
| ST_Y(ST_GeometryFromText("POINT (10 20 30)")) |
+-----------------------------------------------+
|                                          NULL |
+-----------------------------------------------+
```


NULL Input

```sql
mysql> SELECT ST_Y(NULL);
+------------+
| ST_Y(NULL) |
+------------+
|       NULL |
+------------+
```

Invalid Latitude (Out of Range)

```sql
mysql> SELECT ST_Y(ST_Point(116.4, 91));
+---------------------------+
| ST_Y(ST_Point(116.4, 91)) |
+---------------------------+
|                      NULL |
+---------------------------+
```

Invalid Longitude (Out of Range)

```sql
mysql> SELECT ST_Y(ST_Point(190, 39.9));
+---------------------------+
| ST_Y(ST_Point(190, 39.9)) |
+---------------------------+
|                      NULL |
+---------------------------+
```