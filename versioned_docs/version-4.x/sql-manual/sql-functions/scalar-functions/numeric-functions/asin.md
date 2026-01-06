---
{
    "title": "ASIN",
    "language": "en",
    "description": "Returns the arc sine of x, or NULL if x is not in the range -1 to 1."
}
---

## Description

Returns the arc sine of `x`, or `NULL` if `x` is not in the range `-1` to `1`.

## Syntax

```sql
ASIN(<x>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the arc sine is to be calculated |  

## Return Value  

The arc sine value of parameter `x`, expressed in radians.

## Special Cases

- When `x` equals 0, returns 0
- When `x` equals 1, returns π/2
- When `x` equals -1, returns -π/2
- When `x` is not in the range [-1, 1], returns `NULL`
- When `x` is NaN, returns NaN
- When `x` is positive or negative infinity, returns `NULL`
- When `x` is NULL, returns NULL

## Examples

```sql
select asin(0.5);
```

```text
+---------------------+
| asin(0.5)           |
+---------------------+
| 0.52359877559829893 |
+---------------------+
```

```sql
select asin(0.0);
```

```text
+------------+
| asin(0.0)  |
+------------+
|          0 |
+------------+
```

```sql
select asin(1.0);
```

```text
+--------------------+
| asin(1.0)          |
+--------------------+
| 1.570796326794897  |
+--------------------+
```

```sql
select asin(-1.0);
```

```text
+---------------------+
| asin(-1.0)          |
+---------------------+
| -1.570796326794897  |
+---------------------+
```

```sql
select asin(2);
```

```text
+------------+
| asin(2.0)  |
+------------+
|       NULL |
+------------+
```

```sql
select asin(cast('nan' as double));
```

```text
+---------------------------+
| asin(cast('nan' AS DOUBLE)) |
+---------------------------+
| NaN                       |
+---------------------------+
```

```sql
select asin(cast('inf' as double));
```

```text
+---------------------------+
| asin(cast('inf' AS DOUBLE)) |
+---------------------------+
| NULL                      |
+---------------------------+
```
