---
{
    "title": "RADIANS",
    "language": "en"
}
---

## radians

### description
#### Syntax

`DOUBLE radians(DOUBLE x)`
Returns the value of `x` in radians, converted from degrees to radians.

### example

```
mysql> select radians(0);
+--------------+
| radians(0.0) |
+--------------+
|            0 |
+--------------+
mysql> select radians(30);
+---------------------+
| radians(30.0)       |
+---------------------+
| 0.52359877559829882 |
+---------------------+
mysql> select radians(90);
+--------------------+
| radians(90.0)      |
+--------------------+
| 1.5707963267948966 |
+--------------------+
```

### keywords
	RADIANS
