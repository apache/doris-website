---
{
    "title": "ACOSH",
    "language": "en"
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
| `<x>` | The value for which the hyperbolic arc cosine value is to be calculated |  

## Return Value  

The acosh value of parameter `x`. 

## Example

```sql
select acosh(0.0);
```

```sql
+------------+
| acosh(0.0) |
+------------+
|       NULL |
+------------+
```

```sql
select acosh(-1.0);
```

```sql
+-------------+
| acosh(-1.0) |
+-------------+
|        NULL |
+-------------+
```

```sql
select acosh(1.0);
```

```sql
+------------+
| acosh(1.0) |
+------------+
|          0 |
+------------+
```

```sql
select acosh(10.0);
```

```sql
+-------------------+
| acosh(10.0)       |
+-------------------+
| 2.993222846126381 |
+-------------------+
```
