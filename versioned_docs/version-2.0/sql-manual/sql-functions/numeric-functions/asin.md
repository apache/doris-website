---
{
    "title": "ASIN",
    "language": "en"
}
---

## asin

### description
#### Syntax

`DOUBLE asin(DOUBLE x)`
Returns the arc sine of `x`, or `nan` if `x` is not in the range `-1` to `1`.

### example

```
mysql> select asin(0.5);
+---------------------+
| asin(0.5)           |
+---------------------+
| 0.52359877559829893 |
+---------------------+
mysql> select asin(2);
+-----------+
| asin(2.0) |
+-----------+
|       nan |
+-----------+
```

### keywords
	ASIN
