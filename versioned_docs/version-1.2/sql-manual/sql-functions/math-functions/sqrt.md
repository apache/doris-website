---
{
    "title": "SQRT",
    "language": "en"
}
---

## sqrt

### description
#### Syntax

`DOUBLE sqrt(DOUBLE x)`
Returns the square root of `x`.`x` is required to be greater than or equal to `0`.

:::tip
Another alias for this function is `dsqrt`.
:::

### example

```
mysql> select sqrt(9);
+-----------+
| sqrt(9.0) |
+-----------+
|         3 |
+-----------+
mysql> select sqrt(2);
+--------------------+
| sqrt(2.0)          |
+--------------------+
| 1.4142135623730951 |
+--------------------+
mysql> select sqrt(100.0);
+-------------+
| sqrt(100.0) |
+-------------+
|          10 |
+-------------+
```

### keywords
	SQRT, DSQRT
