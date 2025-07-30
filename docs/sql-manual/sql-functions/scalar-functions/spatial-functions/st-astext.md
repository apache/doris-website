---
{
    "title": "ST_ASTEXT",
    "language": "en"
}
---

## Description

Converts a geometric object into its WKT (Well-Known Text) text representation. WKT is a text-based format for representing geospatial data, widely used in Geographic Information Systems (GIS).

Currently supported geometric types include: Point, LineString, Polygon, MultiPolygon, Circle.

## Aliases

- ST_ASWKT

## Sytax

```sql
ST_ASTEXT( <geo>)
```

# Parameters

| Parameter | Description     |
| -- |----------|
| `<geo>` | The geometric object to be converted to WKT format. |

## Return value

Returns the WKT text representation of the geometric object.

ST_ASTEXT has the following edge cases:

- If the input parameter is NULL, returns NULL.

## Example


Point object conversion
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
LineString object conversion

```sql
mysql> SELECT ST_AsText(ST_GeometryFromText("LINESTRING (1 1, 2 2)"));
+---------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("LINESTRING (1 1, 2 2)")) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```

Polygon object conversion

```sql
mysql> SELECT ST_AsText(ST_Polygon("POLYGON ((114.104486 22.547119,114.093758 22.547753,114.096504 22.532057,114.104229 22.539826,114.106203 22.542680,114.104486 22.547119))"));
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_Polygon("POLYGON ((114.104486 22.547119,114.093758 22.547753,114.096504 22.532057,114.104229 22.539826,114.106203 22.542680,114.104486 22.547119))")) |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| POLYGON ((114.104486 22.547119, 114.093758 22.547753, 114.096504 22.532057, 114.104229 22.539826, 114.106203 22.54268, 114.104486 22.547119))                      |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

MultiPolygon object conversion

```sql
mysql> SELECT ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))"));
+-----------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))")) |
+-----------------------------------------------------------------------------------------------------------+
| MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))                                   |
+-----------------------------------------------------------------------------------------------------------+
```

Circle object conversion

```sql
mysql> SELECT ST_AsText(ST_Circle(116.39748, 39.90882, 0.5));
+------------------------------------------------+
| ST_AsText(ST_Circle(116.39748, 39.90882, 0.5)) |
+------------------------------------------------+
| CIRCLE ((116.39748 39.90882), 0.5)             |
+------------------------------------------------+
```


NULL input

```sql
mysql> SELECT ST_AsText(NULL);
+-----------------+
| ST_AsText(NULL) |
+-----------------+
| NULL            |
+-----------------+
```