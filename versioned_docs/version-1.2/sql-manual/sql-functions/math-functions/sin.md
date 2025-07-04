---
{
    "title": "SIN",
    "language": "en"
}
---

## sin

### description
#### Syntax

`DOUBLE sin(DOUBLE x)`
Returns the sine of `x`, where `x` is in radians

### example

```
mysql> select sin(0);
+----------+
| sin(0.0) |
+----------+
|        0 |
+----------+
mysql> select sin(1);
+--------------------+
| sin(1.0)           |
+--------------------+
| 0.8414709848078965 |
+--------------------+
mysql> select sin(0.5 * Pi());
+-----------------+
| sin(0.5 * pi()) |
+-----------------+
|               1 |
+-----------------+
```

### keywords
	SIN
