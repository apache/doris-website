---
{
    "title": "ATAN2",
    "language": "en"
}
---

## Description

Returns the arc tangent of 'y' / 'x'.

## Syntax

```sql
ATAN2(<y>, <x>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value representing the horizontal distance (coordinate) from the origin (0,0) along the x-axis. |  
| `<y>` | The value representing the vertical distance (coordinate) from the origin (0,0) along the y-axis. |  

## Return Value  

The atan2 value of parameter `y` / `x`. 

## Special Cases
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
select atan2(0.1, 0.2);
```

```text
+---------------------+
| atan2(0.1, 0.2)     |
+---------------------+
| 0.46364760900080609 |
+---------------------+
```

```sql
select atan2(1.0, 1.0);
```

```text
+---------------------+
| atan2(1.0, 1.0)     |
+---------------------+
| 0.78539816339744828 |
+---------------------+
```

```sql
select atan2(cast('nan' as double), 1.0);
```
```text
+----------------------------------+
| atan2(cast('nan' AS DOUBLE), 1.0)|
+----------------------------------+
| NaN                              |
+----------------------------------+
```

```sql
select atan2(1.0, cast('nan' as double));
```
```text
+----------------------------------+
| atan2(1.0, cast('nan' AS DOUBLE))|
+----------------------------------+
| NaN                              |
+----------------------------------+
```

```sql
select atan2(0.0, 1.0);
```
```text
+----------------+
| atan2(0.0, 1.0)|
+----------------+
|              0 |
+----------------+
```

```sql
select atan2(-0.0, 1.0);
```
```text
+-----------------+
| atan2(-0.0, 1.0)|
+-----------------+
|              -0 |
+-----------------+
```

```sql
select atan2(0.0, -1.0);
```
```text
+-----------------+
| atan2(0.0, -1.0)|
+-----------------+
| 3.141592653589793|
+------------------+
```

```sql
select atan2(-0.0, -1.0);
```
```text
+------------------+
| atan2(-0.0, -1.0)|
+------------------+
| -3.141592653589793|
+-------------------+
```

```sql
select atan2(1.0, 0.0);
```
```text
+----------------+
| atan2(1.0, 0.0)|
+----------------+
| 1.570796326794897 |
+--------------------+
```

```sql
select atan2(-1.0, 0.0);
```
```text
+-----------------+
| atan2(-1.0, 0.0)|
+-----------------+
| -1.570796326794897 |
+---------------------+
```

```sql
select atan2(cast('inf' as double), cast('-inf' as double));
```
```text
+--------------------------------------------+
| atan2(cast('inf' AS DOUBLE), cast('-inf' AS DOUBLE)) |
+--------------------------------------------+
| 2.356194490192345                          |
+--------------------------------------------+
```

```sql
select atan2(cast('-inf' as double), cast('inf' as double));
```
```text
+-------------------------------------------+
| atan2(cast('-inf' AS DOUBLE), cast('inf' AS DOUBLE)) |
+-------------------------------------------+
| -0.7853981633974483                       |
+-------------------------------------------+
```

```sql
select atan2(1.0, cast('-inf' as double));
```
```text
+----------------------------------+
| atan2(1.0, cast('-inf' AS DOUBLE))|
+----------------------------------+
| 3.141592653589793                |
+----------------------------------+
```

```sql
select atan2(-1.0, cast('inf' as double));
```
```text
+---------------------------------+
| atan2(-1.0, cast('inf' AS DOUBLE))|
+---------------------------------+
| -0                              |
+---------------------------------+
```
