---
{
    "title": "ST_X",
    "language": "en"
}
---

## Description

When the point is a valid POINT type, returns the corresponding X coordinate value.

## Sytax

```sql
ST_X( <point>)
```

## Parameters

| Parameter   | Description       |
|------|----------|
| `<point>` | The geometric object from which to extract the X coordinate. It must be a valid POINT type (2D point), where the X (longitude) range is [-180, 180] and the Y (latitude) range is [-90, 90].|

## Retuen value

The X value in the geometric coordinates, of type double-precision floating-point number (Double).

- Returns the X coordinate of the point (double-precision floating-point number, Double) if the input is a valid POINT object.
- Returns NULL if the input is NULL, a non-POINT type object, an empty point (POINT EMPTY), or an invalid point (e.g., 3D point).

## Example


Extract X coordinate of a valid point

```sql
SELECT ST_X(ST_Point(24.7, 56.7));
```

```text
+----------------------------+
| st_x(st_point(24.7, 56.7)) |
+----------------------------+
|                       24.7 |
+----------------------------+
```

Input is an empty point (POINT EMPTY)

```sql
mysql> SELECT ST_X(ST_GeometryFromText("POINT EMPTY"));
+------------------------------------------+
| ST_X(ST_GeometryFromText("POINT EMPTY")) |
+------------------------------------------+
|                                     NULL |
+------------------------------------------+
```

Input is a 3D point (not supported)

```sql

mysql> SELECT ST_X(ST_GeometryFromText("POINT (10 20 30)"));
+-----------------------------------------------+
| ST_X(ST_GeometryFromText("POINT (10 20 30)")) |
+-----------------------------------------------+
|                                          NULL |
+-----------------------------------------------+
```

Input is NULL

```sql
mysql> SELECT ST_X(NULL);
+------------+
| ST_X(NULL) |
+------------+
|       NULL |
+------------+
```


Longitude out of range

```sql
mysql> SELECT ST_X(ST_Point(244.7, 56.7));
+-----------------------------+
| ST_X(ST_Point(244.7, 56.7)) |
+-----------------------------+
|                        NULL |
+-----------------------------+
```

Latitude out of range

```sql
mysql> SELECT ST_X(ST_Point(44.7, 156.7));
+-----------------------------+
| ST_X(ST_Point(44.7, 156.7)) |
+-----------------------------+
|                        NULL |
+-----------------------------+
```

