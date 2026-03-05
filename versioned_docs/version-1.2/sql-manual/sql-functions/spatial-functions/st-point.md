---
{
    "title": "ST_POINT",
    "language": "en"
}
---

## St_Point
### Description
#### Syntax

`POINT ST_Point(DOUBLE x, DOUBLE y)`


Given the X coordinate value, the Y coordinate value returns the corresponding Point.
The current value is meaningful only for spherical sets, and X/Y corresponds to longitude/latitude.

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
ST_POINT,ST,POINT
