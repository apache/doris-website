---
{
    "title": "TAN",
    "language": "en",
    "description": "Returns the tangent of x, where x is the value in radians."
}
---

## Description

Returns the tangent of x, where x is the value in radians.

## Syntax

```sql
TAN(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The value for which the tangent is to be calculated |

## Return Value

Returns the tangent of x.

## Special Cases
- When `x` is NaN, returns NaN
- When `x` is positive or negative infinity, returns NaN
- When `x` is NULL, returns NULL

## Example

```sql
select tan(0),tan(1),tan(-1);
```

```text
+------------------------+------------------------+-------------------------+
| tan(cast(0 as DOUBLE)) | tan(cast(1 as DOUBLE)) | tan(cast(-1 as DOUBLE)) |
+------------------------+------------------------+-------------------------+
|                      0 |     1.5574077246549023 |     -1.5574077246549023 |
+------------------------+------------------------+-------------------------+
```

```sql
select tan(cast('nan' as double));
```

```text
+----------------------------+
| tan(cast('nan' AS DOUBLE)) |
+----------------------------+
| NaN                        |
+----------------------------+
```

```sql
select tan(cast('inf' as double));
```

```text
+----------------------------+
| tan(cast('inf' AS DOUBLE)) |
+----------------------------+
| NaN                        |
+----------------------------+
```

```sql
select tan(cast('-inf' as double));
```

```text
+-----------------------------+
| tan(cast('-inf' AS DOUBLE)) |
+-----------------------------+
| NaN                         |
+-----------------------------+
```
