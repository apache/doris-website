---
{
    "title": "FLOOR",
    "language": "en"
}
---

## floor

### description
#### Syntax

`BIGINT floor(DOUBLE x)`
Returns the largest integer value less than or equal to `x`.

:::tip
Another alias for this function is `dfloor`.
:::

### example

```
mysql> select floor(1);
+------------+
| floor(1.0) |
+------------+
|          1 |
+------------+
mysql> select floor(2.4);
+------------+
| floor(2.4) |
+------------+
|          2 |
+------------+
mysql> select floor(-10.3);
+--------------+
| floor(-10.3) |
+--------------+
|          -11 |
+--------------+
```

### keywords
	FLOOR, DFLOOR
