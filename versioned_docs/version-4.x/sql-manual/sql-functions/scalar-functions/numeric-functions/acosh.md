---
{
    "title": "ACOSH",
    "language": "en",
    "description": "Returns the hyperbolic arc cosine of x, or NULL if x is less than 1."
}
---

## Description

Returns the hyperbolic arc cosine of `x`, or `NULL` if `x` is less than `1`.

## Syntax

```sql
ACOSH(<x>)
```

## Parameters

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the hyperbolic arc cosine is to be calculated |  

## Return Value  

The hyperbolic arc cosine value of parameter `x`.

## Special Cases

- When `x` equals 1, returns 0
- When `x` is less than 1, returns `NULL`
- When `x` is NaN, returns NaN
- When `x` is positive infinity, returns Infinity
- When `x` is negative infinity, returns `NULL`
- When `x` is NULL, returns NULL

## Examples

```sql
select acosh(0.0);
```

```text
+------------+
| acosh(0.0) |
+------------+
|       NULL |
+------------+
```

```sql
select acosh(-1.0);
```

```text
+-------------+
| acosh(-1.0) |
+-------------+
|        NULL |
+-------------+
```

```sql
select acosh(1.0);
```

```text
+------------+
| acosh(1.0) |
+------------+
|          0 |
+------------+
```

```sql
select acosh(1.0000001);
```

```text
+-------------------------+
| acosh(1.0000001)        |
+-------------------------+
| 0.0004472135918947727   |
+-------------------------+
```

```sql
select acosh(cast('nan' as double));
```

```text
+----------------------------+
| acosh(cast('nan' AS DOUBLE)) |
+----------------------------+
| NaN                        |
+----------------------------+
```

```sql
select acosh(cast('inf' as double));
```

```text
+----------------------------+
| acosh(cast('inf' AS DOUBLE)) |
+----------------------------+
| Infinity                   |
+----------------------------+
```

```sql
select acosh(10.0);
```

```text
+-------------------+
| acosh(10.0)       |
+-------------------+
| 2.993222846126381 |
+-------------------+
```
