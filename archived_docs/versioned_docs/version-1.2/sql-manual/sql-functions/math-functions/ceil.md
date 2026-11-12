---
{
    "title": "CEIL",
    "language": "en"
}
---

## ceil

### description
#### Syntax

`BIGINT ceil(DOUBLE x)`
Returns the smallest integer value greater than or equal to `x`.

:::tip
The other alias for this function are `dceil` and `ceiling`.
:::

### example

```
mysql> select ceil(1);
+-----------+
| ceil(1.0) |
+-----------+
|         1 |
+-----------+
mysql> select ceil(2.4);
+-----------+
| ceil(2.4) |
+-----------+
|         3 |
+-----------+
mysql> select ceil(-10.3);
+-------------+
| ceil(-10.3) |
+-------------+
|         -10 |
+-------------+
```

### keywords
	CEIL, DCEIL, CEILING
