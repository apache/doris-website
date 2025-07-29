---
{
    "title": "SIGN",
    "language": "en"
}
---

## sign

### description
#### Syntax

`TINYINT sign(DOUBLE x)`
Returns the sign of `x`. Negative, zero or positive numbers correspond to -1, 0 or 1 respectively.

### example

```
mysql> select sign(3);
+-----------+
| sign(3.0) |
+-----------+
|         1 |
+-----------+
mysql> select sign(0);
+-----------+
| sign(0.0) |
+-----------+
|         0 |
mysql> select sign(-10.0);
+-------------+
| sign(-10.0) |
+-------------+
|          -1 |
+-------------+
1 row in set (0.01 sec)
```

### keywords
	SIGN
