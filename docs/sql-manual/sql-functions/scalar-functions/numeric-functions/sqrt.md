---
{
    "title": "SQRT",
    "language": "en",
    "description": "Returns the square root of a value, where the input value must be greater than or equal to 0."
}
---

## Description

Returns the square root of a value, where the input value must be greater than or equal to 0.

## Syntax

```sql
SQRT(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The value whose square root is to be calculated |

## Return Value

The square root of parameter `x`.

## Special Cases

- When `x` equals 0, returns 0
- When `x` equals -0, returns -0
- When `x` is less than 0, returns `NULL`
- When `x` is NaN, returns NaN
- When `x` is positive infinity, returns Infinity
- When `x` is negative infinity, returns `NULL`
- When `x` is NULL, returns NULL

## Examples

```sql
select sqrt(9), sqrt(2);
```

```text
+-------------------------+-------------------------+
| sqrt(cast(9 as DOUBLE)) | sqrt(cast(2 as DOUBLE)) |
+-------------------------+-------------------------+
|                     3.0 |      1.4142135623730951 |
+-------------------------+-------------------------+
```

```sql
select sqrt(1.0);
```

```text
+------------+
| sqrt(1.0)  |
+------------+
|          1 |
+------------+
```

```sql
select sqrt(0.0);
```

```text
+------------+
| sqrt(0.0)  |
+------------+
|          0 |
+------------+
```

```sql
select sqrt(-0.0);
```

```text
+-------------+
| sqrt(-0.0)  |
+-------------+
|          -0 |
+-------------+
```

```sql
select sqrt(-1.0);
```

```text
+-------------+
| sqrt(-1.0)  |
+-------------+
|        NULL |
+-------------+
```

```sql
select sqrt(cast('nan' as double));
```

```text
+---------------------------+
| sqrt(cast('nan' AS DOUBLE)) |
+---------------------------+
| NaN                       |
+---------------------------+
```

```sql
select sqrt(cast('inf' as double));
```

```text
+---------------------------+
| sqrt(cast('inf' AS DOUBLE)) |
+---------------------------+
| Infinity                  |
+---------------------------+
```

```sql
select sqrt(cast('-inf' as double));
```

```text
+----------------------------+
| sqrt(cast('-inf' AS DOUBLE)) |
+----------------------------+
| NULL                       |
+----------------------------+
```