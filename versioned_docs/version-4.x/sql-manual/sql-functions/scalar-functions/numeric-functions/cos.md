---
{
    "title": "COS",
    "language": "en",
    "description": "Calculate the cosine of the parameter"
}
---

## Description

Calculate the cosine of the parameter

## Syntax

```sql
COS(<a>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | floating point number, the radian value of the parameter to calculate |

## Return Value

The cosine of the parameter `<a>`, expressed in radians.

## Special Cases
- When `a` is NaN, returns NaN
- When `a` is positive or negative infinity, returns NaN
- When `a` is NULL, returns NULL

## Examples

```sql
select cos(1);
```

```text
+---------------------+
| cos(1.0)            |
+---------------------+
| 0.54030230586813977 |
+---------------------+
```

```sql
select cos(0);
```

```text
+------------------------+
| cos(cast(0 as DOUBLE)) |
+------------------------+
|                    1.0 |
+------------------------+
```

```sql
select cos(Pi());
```

```text
+-----------+
| cos(pi()) |
+-----------+
|        -1 |
+-----------+
```

```sql
select cos(cast('nan' as double));
```

```text
+----------------------------+
| cos(cast('nan' AS DOUBLE)) |
+----------------------------+
| NaN                        |
+----------------------------+
```

```sql
select cos(cast('inf' as double));
```

```text
+----------------------------+
| cos(cast('inf' AS DOUBLE)) |
+----------------------------+
| NaN                        |
+----------------------------+
```

```sql
select cos(cast('-inf' as double));
```

```text
+-----------------------------+
| cos(cast('-inf' AS DOUBLE)) |
+-----------------------------+
| NaN                         |
+-----------------------------+
```
