---
{
    "title": "ST_LINEFROMTEXT,ST_LINESTRINGFROMTEXT",
    "language": "zh-CN"
}
---

## ST_LineFromText,ST_LineStringFromText
## 描述
## 语法

`GEOMETRY ST_LineFromText(VARCHAR wkt)`


将一个WKT（Well Known Text）转化为一个Line形式的内存表现形式

## 举例

```
mysql> SELECT ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)"));
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```
### keywords
ST_LINEFROMTEXT,ST_LINESTRINGFROMTEXT,ST,LINEFROMTEXT,LINESTRINGFROMTEXT
