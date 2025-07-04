---
{
    "title": "CBRT",
    "language": "en"
}
---

## cbrt

### description
#### Syntax

`DOUBLE cbrt(DOUBLE x)`
Returns the cube root of x.

### example

```
mysql> select cbrt(8);
+-----------+
| cbrt(8.0) |
+-----------+
|         2 |
+-----------+
mysql> select cbrt(2.0);
+--------------------+
| cbrt(2.0)          |
+--------------------+
| 1.2599210498948734 |
+--------------------+
mysql> select cbrt(-1000.0);
+---------------+
| cbrt(-1000.0) |
+---------------+
|           -10 |
+---------------+
```

### keywords
	CBRT
