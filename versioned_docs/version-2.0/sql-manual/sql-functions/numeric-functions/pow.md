---
{
    "title": "POW",
    "language": "en"
}
---

## pow

### description

Returns the value of the first argument raised to the power of the second argument.

:::tip
The other aliases for this function are `power`, `fpow` and `dpow`.
:::

#### Syntax

`DOUBLE pow(DOUBLE a, DOUBLE b)`
Returns `a` raised to the `b` power.

### example

```
mysql> select pow(2,0);
+---------------+
| pow(2.0, 0.0) |
+---------------+
|             1 |
+---------------+
mysql> select pow(2,3);
+---------------+
| pow(2.0, 3.0) |
+---------------+
|             8 |
+---------------+
mysql> select pow(3,2.4);
+--------------------+
| pow(3.0, 2.4)      |
+--------------------+
| 13.966610165238235 |
+--------------------+
```

### keywords
	POW, POWER, FPOW, DPOW
