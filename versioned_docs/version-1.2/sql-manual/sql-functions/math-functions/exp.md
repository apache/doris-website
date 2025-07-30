---
{
    "title": "EXP",
    "language": "en"
}
---

## exp

### description
#### Syntax

`DOUBLE exp(DOUBLE x)`
Returns `x` raised to the base `e`.

:::tip
Another alias for this function is `dexp`.
:::

### example

```
mysql> select exp(2);
+------------------+
| exp(2.0)         |
+------------------+
| 7.38905609893065 |
+------------------+
mysql> select exp(3.4);
+--------------------+
| exp(3.4)           |
+--------------------+
| 29.964100047397011 |
+--------------------+
```

### keywords
	EXP, DEXP
