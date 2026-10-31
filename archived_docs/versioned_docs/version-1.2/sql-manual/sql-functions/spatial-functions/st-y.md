---
{
    "title": "ST_Y",
    "language": "en"
}
---

## ST_Y
### Description
#### Syntax

`DOUBLE ST_Y(POINT point)`


When point is a valid POINT type, the corresponding Y coordinate value is returned.

### example

```
mysql> SELECT ST_Y(ST_Point(24.7, 56.7));
+----------------------------+
| ST_Y(ST_Point(24.7, 56.7)) |
+----------------------------+
| 56.7                       |
+----------------------------+
```
### keywords
ST_Y,ST,Y
