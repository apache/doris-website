---
{
    "title": "ST_POLYGON,ST_POLYFROMTEXT,ST_POLYGONFROMTEXT",
    "language": "zh-CN"
}
---

## ST_Polygon,ST_PolyFromText,ST_PolygonFromText
## 描述
## 语法

`GEOMETRY ST_Polygon(VARCHAR wkt)`


将一个WKT（Well Known Text）转化为对应的多边形内存形式

## 举例

```
mysql> SELECT ST_AsText(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
+------------------------------------------------------------------+
| st_astext(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+------------------------------------------------------------------+
| POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))                          |
+------------------------------------------------------------------+
```
### keywords
ST_POLYGON,ST_POLYFROMTEXT,ST_POLYGONFROMTEXT,ST,POLYGON,POLYFROMTEXT,POLYGONFROMTEXT
