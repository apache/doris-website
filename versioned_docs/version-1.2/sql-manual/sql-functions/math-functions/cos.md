---
{
    "title": "COS",
    "language": "en"
}
---

## cos

### description
#### Syntax

`DOUBLE cos(DOUBLE x)`
Returns the cosine of `x`, where `x` is in radians

### example

```
mysql> select cos(1);
+---------------------+
| cos(1.0)            |
+---------------------+
| 0.54030230586813977 |
+---------------------+
mysql> select cos(0);
+----------+
| cos(0.0) |
+----------+
|        1 |
+----------+
mysql> select cos(Pi());
+-----------+
| cos(pi()) |
+-----------+
|        -1 |
+-----------+
```

### keywords
	COS
