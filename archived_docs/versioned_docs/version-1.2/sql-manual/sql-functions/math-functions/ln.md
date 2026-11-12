---
{
    "title": "LN",
    "language": "en"
}
---

## ln

### description
#### Syntax

`DOUBLE ln(DOUBLE x)`
Returns the natural logarithm of `x` to base `e`.

:::tip
Another alias for this function is `dlog1`.
:::

### example

```
mysql> select ln(1);
+---------+
| ln(1.0) |
+---------+
|       0 |
+---------+
mysql> select ln(e());
+---------+
| ln(e()) |
+---------+
|       1 |
+---------+
mysql> select ln(10);
+--------------------+
| ln(10.0)           |
+--------------------+
| 2.3025850929940459 |
+--------------------+
```

### keywords
	LN, DLOG1
