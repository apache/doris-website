---
{
    "title": "ATANH",
    "language": "en"
}
---

## Description

Returns the hyperbolic arc tangent of `x`, or `NULL` if `x` is not in the range `-1` to `1` (excluding `-1` and `1`).

## Syntax

```sql
ATANH(<x>)
```

## Parameters

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the hyperbolic arc tangent is to be calculated |  

## Return Value  

The hyperbolic arc tangent value of parameter `x`.

## Special Cases

- When `x` equals 0, returns 0
- When `x` equals 1 or -1, returns `NULL`
- When `x` is outside the range (-1, 1), returns `NULL`
- When `x` is NaN, returns NaN
- When `x` is positive or negative infinity, returns `NULL`
- When `x` is NULL, returns NULL

## Examples

```sql
select atanh(0.0);
```

```text
+------------+
| atanh(0.0) |
+------------+
|          0 |
+------------+
```

```sql
select atanh(-1.0);
```

```text
+-------------+
| atanh(-1.0) |
+-------------+
|        NULL |
+-------------+
```

```sql
select atanh(1.0);
```

```text
+------------+
| atanh(1.0) |
+------------+
|       NULL |
+------------+
```

```sql
select atanh(0.5);
```

```text
+--------------------+
| atanh(0.5)         |
+--------------------+
| 0.5493061443340548 |
+--------------------+
```

```sql
select atanh(cast('nan' as double));
```

```text
+---------------------------+
| atanh(cast('nan' AS DOUBLE)) |
+---------------------------+
| NaN                       |
+---------------------------+
```

```sql
select atanh(cast('inf' as double));
```

```text
+---------------------------+
| atanh(cast('inf' AS DOUBLE)) |
+---------------------------+
| NULL                      |
+---------------------------+
```
