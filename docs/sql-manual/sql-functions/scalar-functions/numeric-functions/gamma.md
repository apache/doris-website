---
{
    "title": "GAMMA",
    "language": "en",
    "description": "Calculate the gamma function of the parameter"
}
---

## Description

Calculate the gamma function of the parameter, which generalizes the factorial to real numbers.

## Syntax

```sql
GAMMA(<a>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | Floating point parameter |

## Return Value

Returns the gamma function value of parameter `<a>`, a floating point number.

For a positive integer `n`, `gamma(n)` equals `(n - 1)!`, so `gamma(5)` is `4! = 24`. Because the
result is computed in double precision, the value actually returned for `gamma(5)` is
`24.000000000000004`. For other values it follows the standard gamma function, for example
`gamma(0.5)` is `sqrt(pi)`. Note that `gamma(1) = 1` and `gamma(2) = 1`, matching `0!` and `1!`.

## Special Cases

- When `a` is `0` (including `-0.0`) or a negative integer (`-1`, `-2`, ...), the function has a pole and returns NULL
- When `a` is negative infinity, returns NULL
- When `a` is NaN, returns NaN
- When `a` is positive infinity, returns Infinity
- When `a` is so large that the value overflows a double (for example `172`), returns Infinity
- When `a` is a very small positive number, `gamma(a)` is about `1 / a` and overflows to Infinity as well (for example `1e-320`, or even the smallest subnormal `5e-324`)
- When `a` is a large negative non-integer, the result is extremely close to zero and can underflow to a signed zero, for example `gamma(-1000.5)` returns `-0.0`
- When `a` is NULL, returns NULL

## Examples

```sql
select gamma(5);
```

```text
+--------------------+
| gamma(5)           |
+--------------------+
| 24.000000000000004 |
+--------------------+
```

```sql
select gamma(0.5);
```

```text
+-------------------+
| gamma(0.5)        |
+-------------------+
| 1.772453850905516 |
+-------------------+
```

```sql
select gamma(-2.5);
```

```text
+---------------------+
| gamma(-2.5)         |
+---------------------+
| -0.9453087204829418 |
+---------------------+
```

```sql
select gamma(0);
```

```text
+----------+
| gamma(0) |
+----------+
|     NULL |
+----------+
```

```sql
select gamma(-1);
```

```text
+-----------+
| gamma(-1) |
+-----------+
|      NULL |
+-----------+
```

```sql
select gamma(cast('nan' as double));
```

```text
+------------------------------+
| gamma(cast('nan' as double)) |
+------------------------------+
|                          NaN |
+------------------------------+
```

```sql
select gamma(cast('inf' as double));
```

```text
+------------------------------+
| gamma(cast('inf' as double)) |
+------------------------------+
|                     Infinity |
+------------------------------+
```

```sql
select gamma(cast('-inf' as double));
```

```text
+-------------------------------+
| gamma(cast('-inf' as double)) |
+-------------------------------+
|                          NULL |
+-------------------------------+
```

```sql
select gamma(172);
```

```text
+------------+
| gamma(172) |
+------------+
|   Infinity |
+------------+
```
