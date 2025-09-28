---
{
    "title": "ATAN",
    "language": "en"
}
---

## Description

Returns the arctangent of `x`, where `x` is in radians.

## Syntax

```sql
ATAN(<x>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the atan value is to be calculated |  

## Return Value  

The atan value of parameter `x`. 

## Special Cases
- When `x` is NaN, returns NaN
- When `x` is positive infinity, returns π/2 (approximately 1.570796326794897)
- When `x` is negative infinity, returns -π/2 (approximately -1.570796326794897)
- When `x` is NULL, returns NULL

## Examples

```sql
select atan(0);
```

```text
+-----------+
| atan(0.0) |
+-----------+
|         0 |
+-----------+
```

```sql
select atan(2);
```

```text
+--------------------+
| atan(2.0)          |
+--------------------+
| 1.1071487177940904 |
+--------------------+
```

```sql
select atan(cast('nan' as double));
```

```text
+-----------------------------+
| atan(cast('nan' AS DOUBLE)) |
+-----------------------------+
| NaN                         |
+-----------------------------+
```

```sql
select atan(cast('inf' as double));
```

```text
+-----------------------------+
| atan(cast('inf' AS DOUBLE)) |
+-----------------------------+
| 1.570796326794897           |
+-----------------------------+
```

```sql
select atan(cast('-inf' as double));
```

```text
+------------------------------+
| atan(cast('-inf' AS DOUBLE)) |
+------------------------------+
| -1.570796326794897           |
+------------------------------+
```
