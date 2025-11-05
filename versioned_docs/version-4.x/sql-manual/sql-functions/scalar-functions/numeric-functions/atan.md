---
{
    "title": "ATAN",
    "language": "en"
}
---

## Description

Return the arctangent value.

- When there is only one parameter: Return the arctangent of `x`, with the result range of [-π/2, π/2]

- When there are two parameters: Return the arctangent of `y/x`, with the same behavior as [ATAN2(y, x)](https://doris.apache.org/docs/dev/sql-manual/sql-functions/scalar-functions/numeric-functions/atan2), with the result range of [-π, π]

## Syntax

```sql
ATAN([<y>, ]<x>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<x>` | When there is only one parameter, it indicates the value that needs to be calculated as the arctangent; when there are two parameters, it indicates the horizontal coordinate (or x-value), the distance along the x-axis from the origin (0,0). |  
| `<y>` | Optional, representing the vertical coordinate (or y-value), the distance along the y-axis from the origin (0,0)|

## Return Value  

The atan value of parameter `x`. 

## Special Cases

### Single-parameter version
- When `x` is NaN, returns NaN
- When `x` is positive infinity, returns π/2 (approximately 1.570796326794897)
- When `x` is negative infinity, returns -π/2 (approximately -1.570796326794897)
- When `x` is NULL, returns NULL

### Two-parameter version
- If `y` or `x` is NaN, returns NaN
- If `x > 0` and `y = ±0.0`, returns ±0 (sign follows `y`)
- If `x = 0.0` (either +0.0 or -0.0) and `y > 0`, returns π/2 (about 1.570796326794897)
- If `x = 0.0` (either +0.0 or -0.0) and `y < 0`, returns -π/2 (about -1.570796326794897)
- If `x < 0` and `y = +0.0`, returns π (about 3.141592653589793); if `x < 0` and `y = -0.0`, returns -π
- If `y = +Infinity` and `x` is finite, returns π/2; if `y = -Infinity` and `x` is finite, returns -π/2
- If `y = +Infinity` and `x = +Infinity`, returns π/4 (about 0.7853981633974483)
- If `y = -Infinity` and `x = +Infinity`, returns -π/4 (about -0.7853981633974483)
- If `y = +Infinity` and `x = -Infinity`, returns 3π/4 (about 2.356194490192345)
- If `y = -Infinity` and `x = -Infinity`, returns -3π/4 (about -2.356194490192345)
- If `x = +Infinity` and finite `y` > 0, returns 0; if finite `y` < 0, returns -0
- If `x = -Infinity` and finite `y` > 0, returns π; if finite `y` < 0, returns -π
- If `y` or `x` is NULL, returns NULL

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
