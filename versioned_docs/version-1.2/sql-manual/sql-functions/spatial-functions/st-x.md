---
{
    "title": "ST_X",
    "language": "en"
}
---

## ST_X
### Description
#### Syntax

`DOUBLE ST_X(POINT point)`


When point is a valid POINT type, the corresponding X coordinate value is returned.

### example

```
mysql> SELECT ST_X(ST_Point(24.7, 56.7));
+----------------------------+
| st_x(st_point(24.7, 56.7)) |
+----------------------------+
|                       24.7 |
+----------------------------+
```
### keywords
ST_X,ST,X
