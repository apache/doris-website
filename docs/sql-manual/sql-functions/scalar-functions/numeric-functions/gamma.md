---
{
    "title": "GAMMA",
    "language": "en",
    "description": "Returns the Gamma function value of x."
}
---

## Description

Returns the Gamma function value of `x`. The Gamma function is defined as `Γ(x) = ∫₀^∞ t^(x-1)e^(-t)dt` for x > 0, and extends to other real numbers through analytic continuation.

For positive integers, `Γ(n) = (n-1)!`

## Syntax

```sql
GAMMA(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The input value for which to compute the Gamma function |

## Return Value

Returns a value of type DOUBLE. Special cases:
- If the parameter is NULL, returns NULL
- If the parameter is a positive integer n, returns (n-1)!
- If the parameter is 0 or a negative integer, returns NaN
- For very large positive values, may return Infinity

## Examples

```sql
SELECT gamma(5);
```

```text
+----------+
| gamma(5) |
+----------+
|       24 |
+----------+
```

```sql
SELECT gamma(3.5);
```

```text
+--------------------+
| gamma(3.5)         |
+--------------------+
| 3.3233509704478426 |
+--------------------+
```

```sql
SELECT gamma(0.5);
```

```text
+--------------------+
| gamma(0.5)         |
+--------------------+
| 1.7724538509055159 |
+--------------------+
```

```sql
SELECT gamma(-1);
```

```text
+-----------+
| gamma(-1) |
+-----------+
|       nan |
+-----------+