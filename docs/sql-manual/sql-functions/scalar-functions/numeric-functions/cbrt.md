---
{
    "title": "CBRT",
    "language": "en"
}
---

## Description

Calculate the cube root of the parameter

## Syntax

```sql
CBRT(<a>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | Floating point parameter |

## Return Value

Cubic root of parameter `<a>`, a floating point number.

## Special Cases
- When `a` is NaN, returns NaN
- When `a` is positive infinity, returns Infinity
- When `a` is negative infinity, returns -Infinity
- When `a` is NULL, returns NULL

## Examples

```sql
select cbrt(0);
```

```text
+-------------------------+
| cbrt(cast(0 as DOUBLE)) |
+-------------------------+
|                     0.0 |
+-------------------------+
```

```sql
select cbrt(-111);
```

```text
+----------------------------+
| cbrt(cast(-111 as DOUBLE)) |
+----------------------------+
|         -4.805895533705333 |
+----------------------------+
```

```sql
select cbrt(1234);
```

```text
+----------------------------+
| cbrt(cast(1234 as DOUBLE)) |
+----------------------------+
|         10.726014668827325 |
+----------------------------+
```

```sql
select cbrt(cast('nan' as double));
```

```text
+------------------------------+
| cbrt(cast('nan' AS DOUBLE))  |
+------------------------------+
| NaN                          |
+------------------------------+
```

```sql
select cbrt(cast('inf' as double));
```

```text
+------------------------------+
| cbrt(cast('inf' AS DOUBLE))  |
+------------------------------+
| Infinity                     |
+------------------------------+
```

```sql
select cbrt(cast('-inf' as double));
```

```text
+-------------------------------+
| cbrt(cast('-inf' AS DOUBLE))  |
+-------------------------------+
| -Infinity                     |
+-------------------------------+
```
