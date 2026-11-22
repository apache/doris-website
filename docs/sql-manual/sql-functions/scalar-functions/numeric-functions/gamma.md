---
{
    "title": "GAMMA",
    "sidebar_label": "GAMMA (proposal)",
    "language": "en",
    "description": "Unreleased GAMMA proposal: definition, DOUBLE conversion, NULL, poles and floating-point boundaries. Not supported in current 4.x.",
    "keywords": [
        "GAMMA",
        "Gamma function",
        "factorial",
        "DOUBLE",
        "NULL"
    ]
}
---

## Description

The proposed `GAMMA(<x>)` implementation computes the real gamma function `Γ(x)`, extending the factorial beyond positive integers: `Γ(n) = (n - 1)!` for a positive integer `n`. In the candidate implementation, NULL input, zero and negative integer poles return NULL; negative non-integers can produce valid numeric results.

:::caution Version availability
This function is still a development proposal. It has not merged into current master and has no supported release version. This reference is checked against [implementation PR apache/doris#68029](https://github.com/apache/doris/pull/68029), [candidate revision `1197c62327b8`](https://github.com/apache/doris/tree/1197c62327b83898337267e8be15898977072c08). The first supported version must be confirmed after implementation and any backport merge.
:::

For `x > 0`, the mathematical definition is `Γ(x) = ∫₀^∞ t^(x-1) exp(-t) dt`. Analytic continuation defines negative non-integer arguments and satisfies `Γ(x + 1) = x Γ(x)`; `0, -1, -2, ...` are poles. In particular, `Γ(1) = Γ(2) = 1` and `Γ(0.5) = √π`.

## Syntax

```sql
GAMMA(<x>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<x>` | Required DOUBLE numeric expression; NULL is allowed. Convertible numeric inputs, including integer, FLOAT and DECIMAL values, follow normal conversion to DOUBLE before evaluation. Use `CAST(... AS DOUBLE)` to make the conversion explicit. |

No optional arguments or other overloads are proposed. DOUBLE conversion does not preserve arbitrary DECIMAL or large-integer precision. Pole detection uses the converted value, so a high-precision input close to a negative integer can round to a pole. Conversion of nonnumeric input follows Doris type-conversion rules.

## Return Value

The candidate returns `Nullable(DOUBLE)`. These rules apply to the converted DOUBLE argument. NULL, NaN and Infinity are distinct outcomes:

| Input or condition | Candidate result |
| --- | --- |
| NULL | NULL |
| `+0.0`, `-0.0` | NULL |
| Negative integer | NULL |
| Negative infinity | NULL |
| NaN | NaN |
| Positive infinity | Positive Infinity |
| Positive finite number, or a finite negative non-integer, with a representable result | DOUBLE approximation of the gamma function |
| Overflow for a valid finite argument | Infinity with the corresponding sign, rather than NULL |
| Underflow for a valid finite argument | A subnormal value or signed zero, rather than NULL |

Double-precision evaluation does not make mathematical identities bit-exact. For example, the mathematical value of `Γ(5)` is 24, but the last digits can vary with the platform's math library. Compare finite values with a tolerance. The ordinary numeric examples below use ROUND to round finite values to six decimal places without depending on the last platform-specific digits. Nonfinite examples use ISNAN, ISINF, SIGNBIT and IS NULL so the expected output does not depend on a client's spelling of NaN or infinity.

An argument below 172 does not guarantee a finite result: `171.5` is finite, while `171.8` and `172` overflow. Near zero, `Γ(x)` is approximately `1/x`, so tiny nonzero arguments can also overflow. Large negative non-integers can underflow to signed zero; other small results remain nonzero subnormals.

## Example

These expected results apply only to a development build containing the candidate implementation. They do not assert support in current master or 4.x. Each example is a standalone SELECT and requires no table.

### Positive integers

```sql
SELECT GAMMA(1) AS gamma_1, GAMMA(2) AS gamma_2,
       ROUND(GAMMA(5), 6) AS gamma_5;
```

```text
gamma_1  gamma_2  gamma_5
1        1        24
```

### Positive non-integers and numeric type conversion

```sql
SELECT ROUND(GAMMA(0.5), 6) AS gamma_half,
       ROUND(GAMMA(CAST(3.5 AS DECIMAL(3, 1))), 6) AS gamma_decimal;
```

```text
gamma_half  gamma_decimal
1.772454    3.323351
```

### Negative non-integers

```sql
SELECT ROUND(GAMMA(-0.5), 6) AS gamma_negative_half,
       ROUND(GAMMA(-1.5), 6) AS gamma_negative_one_half,
       ROUND(GAMMA(-2.5), 6) AS gamma_negative_two_half;
```

```text
gamma_negative_half  gamma_negative_one_half  gamma_negative_two_half
-3.544908            2.363272                 -0.945309
```

### Zero, negative zero, and negative integer poles

```sql
SELECT GAMMA(0) AS zero_pole,
       GAMMA(CAST('-0.0' AS DOUBLE)) AS negative_zero_pole,
       GAMMA(-1) AS negative_one_pole,
       GAMMA(-2) AS negative_two_pole;
```

```text
zero_pole  negative_zero_pole  negative_one_pole  negative_two_pole
NULL       NULL                NULL               NULL
```

### NULL input

```sql
SELECT GAMMA(NULL) AS null_input;
```

```text
null_input
NULL
```

### NaN and infinities

```sql
SELECT ISNAN(GAMMA(CAST('nan' AS DOUBLE))) AS nan_propagates,
       ISINF(GAMMA(CAST('inf' AS DOUBLE))) AS positive_infinity,
       GAMMA(CAST('-inf' AS DOUBLE)) IS NULL AS negative_infinity_is_null;
```

```text
nan_propagates  positive_infinity  negative_infinity_is_null
1               1                  1
```

### Large positive arguments and overflow

```sql
SELECT GAMMA(171.5) < 1.7e308 AS finite_before_overflow,
       ISINF(GAMMA(171.8)) AS overflow_171_8,
       ISINF(GAMMA(172)) AS overflow_172;
```

```text
finite_before_overflow  overflow_171_8  overflow_172
1                       1               1
```

### Arguments close to zero

```sql
SELECT GAMMA(1e-300) > 1e299 AS large_finite_result,
       ISINF(GAMMA(1e-320)) AS positive_overflow,
       ISINF(GAMMA(-1e-320)) AS negative_overflow,
       SIGNBIT(GAMMA(-1e-320)) AS negative_overflow_sign,
       ISINF(GAMMA(5e-324)) AS smallest_subnormal_overflow;
```

```text
large_finite_result  positive_overflow  negative_overflow  negative_overflow_sign  smallest_subnormal_overflow
1                    1                  1                  1                       1
```

### A nonzero subnormal result

```sql
SELECT GAMMA(-171.5) > 0 AS positive_result,
       GAMMA(-171.5) < 2.2250738585072014e-308 AS below_min_normal;
```

```text
positive_result  below_min_normal
1                1
```

### Underflow to a signed zero

```sql
SELECT GAMMA(-1000.5) = 0 AS zero_result,
       SIGNBIT(GAMMA(-1000.5)) AS negative_sign;
```

```text
zero_result  negative_sign
1            1
```
