---
{
    "title": "ACOS",
    "language": "en"
}
---

## acos

### description
#### Syntax

`DOUBLE acos(DOUBLE x)`
Returns the arc cosine of `x`, or `nan` if `x` is not in the range `-1` to `1`.

### example

```
mysql> select acos(1);
+-----------+
| acos(1.0) |
+-----------+
|         0 |
+-----------+
mysql> select acos(0);
+--------------------+
| acos(0.0)          |
+--------------------+
| 1.5707963267948966 |
+--------------------+
mysql> select acos(-2);
+------------+
| acos(-2.0) |
+------------+
|        nan |
+------------+
```

### keywords
	ACOS
