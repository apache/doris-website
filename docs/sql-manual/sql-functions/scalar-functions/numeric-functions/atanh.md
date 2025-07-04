---
{
    "title": "ATANH",
    "language": "en"
}
---

## Description

Returns the hyperbolic arc tangent of `x`, or `NULL` if `x` is not in the range `-1` to `1`(excluding `-1` and `1`).

## Syntax

```sql
ATANH(<x>)
```

## Parameters

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the hyperbolic arc tangent value is to be calculated |  

## Return Value  

The atanh value of parameter `x`. 

## Example

```sql
select atanh(1.0);
```

```sql
+------------+
| atanh(1.0) |
+------------+
|       NULL |
+------------+
```

```sql
select atanh(1.0);
```

```sql
+-------------+
| atanh(-1.0) |
+-------------+
|        NULL |
+-------------+
```

```sql
select atanh(1.0);
```

```sql
+------------+
| atanh(0.0) |
+------------+
|          0 |
+------------+
```

```sql
select atanh(1.0);
```

```sql
+--------------------+
| atanh(0.5)         |
+--------------------+
| 0.5493061443340548 |
+--------------------+
```
