---
{
    "title": "ACOS",
    "language": "en",
    "description": "Returns the arc cosine of x, or NULL if x is not in the range -1 to 1."
}
---

## Description

Returns the arc cosine of `x`, or `NULL` if `x` is not in the range `-1` to `1`.

## Syntax

```sql
ACOS(<x>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the arc cosine is to be calculated |  

## Return Value  

The arc cosine value of parameter `x`, expressed in radians.

## Special Cases

- When `x` equals 1, returns 0
- When `x` equals 0, returns π/2
- When `x` equals -1, returns π
- When `x` is not in the range [-1, 1], returns `NULL`
- When `x` is NaN, returns NaN
- When `x` is positive or negative infinity, returns `NULL`
- When `x` is NULL, returns NULL

## Examples

```sql
select acos(1);
```

```text
+-----------+
| acos(1.0) |
+-----------+
|         0 |
+-----------+
```

```sql
select acos(0);
```

```text
+--------------------+
| acos(0.0)          |
+--------------------+
| 1.5707963267948966 |
+--------------------+
```

```sql
select acos(-1);
```

```text
+--------------------+
| acos(-1.0)         |
+--------------------+
| 3.141592653589793  |
+--------------------+
```

```sql
select acos(-2);
```

```text
+------------+
| acos(-2.0) |
+------------+
|       NULL |
+------------+
```

```sql
select acos(1.0000001);
```

```text
+-----------------+
| acos(1.0000001) |
+-----------------+
|            NULL |
+-----------------+
```

```sql
select acos(cast('nan' as double));
```

```text
+---------------------------+
| acos(cast('nan' AS DOUBLE)) |
+---------------------------+
| NaN                       |
+---------------------------+
```

```sql
select acos(cast('inf' as double));
```

```text
+---------------------------+
| acos(cast('inf' AS DOUBLE)) |
+---------------------------+
| NULL                      |
+---------------------------+
```
