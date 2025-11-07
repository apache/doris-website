---
{
    "title": "LOG10",
    "language": "en"
}
---

## log10

### description
#### Syntax

`DOUBLE log10(DOUBLE x)`
Returns the natural logarithm of `x` to base `10`.

:::tip
Another alias for this function is `dlog10`.
:::

### example

```
mysql> select log10(1);
+------------+
| log10(1.0) |
+------------+
|          0 |
+------------+
mysql> select log10(10);
+-------------+
| log10(10.0) |
+-------------+
|           1 |
+-------------+
mysql> select log10(16);
+--------------------+
| log10(16.0)        |
+--------------------+
| 1.2041199826559248 |
+--------------------+
```

### keywords
	LOG10, DLOG10
