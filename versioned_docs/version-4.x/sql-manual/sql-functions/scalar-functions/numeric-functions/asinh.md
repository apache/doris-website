---
{
    "title": "ASINH",
    "language": "en",
    "description": "Returns the hyperbolic arc sine of x."
}
---

## Description

Returns the hyperbolic arc sine of `x`.

## Syntax

```sql
ASINH(<x>)
```

## Parameters

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the hyperbolic arc sine value is to be calculated |  

## Return Value  

The asinh value of parameter `x`. 

## Special Cases
- When `x` is NaN, returns NaN
- When `x` is positive infinity, returns Infinity
- When `x` is negative infinity, returns -Infinity
- When `x` is +0.0, returns 0
- When `x` is -0.0, returns -0
- Very large magnitudes may overflow to Infinity/-Infinity (for example, ±1e308)
- When `x` is NULL, returns NULL

## Example

```sql
select asinh(0.0);
```

```sql
+------------+
| asinh(0.0) |
+------------+
|          0 |
+------------+
```

```sql
select asinh(1.0);
```

```sql
+-------------------+
| asinh(1.0)        |
+-------------------+
| 0.881373587019543 |
+-------------------+
```

```sql
select asinh(-1.0);
```

```sql
+--------------------+
| asinh(-1.0)        |
+--------------------+
| -0.881373587019543 |
+--------------------+
```

```sql
select asinh(cast('nan' as double));
```

```sql
+------------------------------+
| asinh(cast('nan' AS DOUBLE)) |
+------------------------------+
| NaN                          |
+------------------------------+
```

```sql
select asinh(cast('inf' as double));
```

```sql
+------------------------------+
| asinh(cast('inf' AS DOUBLE)) |
+------------------------------+
| Infinity                     |
+------------------------------+
```

```sql
select asinh(cast('-inf' as double));
```

```sql
+-------------------------------+
| asinh(cast('-inf' AS DOUBLE)) |
+-------------------------------+
| -Infinity                     |
+-------------------------------+
```
