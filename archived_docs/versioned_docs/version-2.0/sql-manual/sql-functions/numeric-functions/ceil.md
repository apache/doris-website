---
{
    "title": "CEIL",
    "language": "en"
}
---

## Description

Round up floating-point and fixed-point decimals to a specific number of places and return the rounded floating-point or fixed-point number.

## Syntax

```sql
CEIL(<a>[, <d>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | Floating-point (Double) or fixed-point (Decimal) parameter indicating the parameter to be rounded |
| `<d>` | Optional, integer, indicates rounding to the target number of digits, a positive number means rounding to the next decimal point, a negative number means rounding to the next decimal point, and `0` indicates rounding to an integer. When not filled, it is equivalent to `<d> = 0`. |

## Return Value

Returns the smallest rounded number greater than or equal to `<a>` according to the following rules.

Round to `1/(10^d)` digit, i.e., make the result divisible by `1/(10^d)`. If `1/(10^d)` is not exact, the rounding digit is the nearest number of the corresponding data type.

For an entry `<a>` of type Decimal, assuming it is of type `Decimal(p, s)`, the return value is:

- `Decimal(p, 0)`，if `<d> <= 0`
- `Decimal(p, <d>)`，if `0 < <d> <= s`
- `Decimal(p, s)`，if `<d> > s`

## Alias

- DCEIL
- CEILING

## Examples

```sql
select ceil(123.456);
```

```text
+---------------+
| ceil(123.456) |
+---------------+
|           124 |
+---------------+
```

```sql
select ceil(123.456, 2);
```

```text
+------------------+
| ceil(123.456, 2) |
+------------------+
|           123.46 |
+------------------+
```

```sql
select ceil(123.456, -2);
```

```text
+-------------------+
| ceil(123.456, -2) |
+-------------------+
|               200 |
+-------------------+
```

```sql
select ceil(123.45, 1), ceil(123.45), ceil(123.45, 0), ceil(123.45, -1);
```

```text
+-----------------+--------------+-----------------+------------------+
| ceil(123.45, 1) | ceil(123.45) | ceil(123.45, 0) | ceil(123.45, -1) |
+-----------------+--------------+-----------------+------------------+
|           123.5 |          124 |             124 |              130 |
+-----------------+--------------+-----------------+------------------+
```

```sql
select ceil(x, 2) from ( select cast(123.456 as decimal(6,3)) as x from numbers("number"="5") )t;
```

```text
+------------+
| ceil(x, 2) |
+------------+
|     123.46 |
|     123.46 |
|     123.46 |
|     123.46 |
|     123.46 |
+------------+
```
