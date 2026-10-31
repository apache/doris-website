---
{
    "title": "ST_GEOMETRYFROMTEXT,ST_GEOMFROMTEXT",
    "language": "en"
}
---

## ST_GeometryFromText,ST_GeomFromText
### Description
#### Syntax

`GEOMETRY ST_GeometryFromText (VARCHAR wkt)`


Converting a WKT (Well Known Text) into a corresponding memory geometry

### example

```
mysql> SELECT ST_AsText(ST_GeometryFromText("LINESTRING (1 1, 2 2)"));
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```
### keywords
ST_GEOMETRYFROMTEXT,ST_GEOMFROMTEXT,ST,GEOMETRYFROMTEXT,GEOMFROMTEXT
