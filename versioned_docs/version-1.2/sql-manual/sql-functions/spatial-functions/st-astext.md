---
{
    "title": "ST_ASTEXT,ST_ASWKT",
    "language": "en"
}
---

## ST_AsText,ST_AsWKT
### Description
#### Syntax

`VARCHAR ST_AsText (GEOMETRY geo)`


Converting a geometric figure into a WKT (Well Known Text) representation

### example

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
