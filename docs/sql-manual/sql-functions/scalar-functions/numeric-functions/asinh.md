---
{
    "title": "ASINH",
    "language": "en"
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
