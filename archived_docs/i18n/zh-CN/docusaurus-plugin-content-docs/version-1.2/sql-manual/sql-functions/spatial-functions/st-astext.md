---
{
    "title": "ST_ASTEXT,ST_ASWKT",
    "language": "zh-CN"
}
---

## ST_AsText,ST_AsWKT
## 描述
## 语法

`VARCHAR ST_AsText(GEOMETRY geo)`


将一个几何图形转化为WKT（Well Known Text）的表示形式

## 举例

```
mysql> SELECT ST_AsText(ST_Point(24.7, 56.7));
+---------------------------------+
| st_astext(st_point(24.7, 56.7)) |
+---------------------------------+
| POINT (24.7 56.7)               |
+---------------------------------+
```
### keywords
ST_ASTEXT,ST_ASWKT,ST,ASTEXT,ASWKT
