---
{
    "title": "ST_GEOMETRYFROMTEXT,ST_GEOMFROMTEXT",
    "language": "zh-CN"
}
---

## ST_GeometryFromText,ST_GeomFromText
## 描述
## 语法

`GEOMETRY ST_GeometryFromText(VARCHAR wkt)`


将一个WKT（Well Known Text）转化为对应的内存的几何形式

## 举例

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
