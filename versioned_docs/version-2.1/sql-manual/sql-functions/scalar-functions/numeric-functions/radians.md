---
{
    "title": "RADIANS",
    "language": "en"
}
---

## Description

Returns the value of `x` in radians, converted from degrees to radians.

## Syntax

```sql
RADIANS(<x>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>`   | The angle in degrees to be converted. |

## Return value

Returns an integer or a floating-point number. Special case:

- If the parameter x is NULL, it returns NULL.

## Example

```sql
select radians(0);
```

```text
+----------------------------+
| radians(cast(0 as DOUBLE)) |
+----------------------------+
|                        0.0 |
+----------------------------+
```

```sql
select radians(30);
```

```text
+-----------------------------+
| radians(cast(30 as DOUBLE)) |
+-----------------------------+
|          0.5235987755982988 |
+-----------------------------+
```

```sql
select radians(90);
```

```text
+-----------------------------+
| radians(cast(90 as DOUBLE)) |
+-----------------------------+
|          1.5707963267948966 |
+-----------------------------+
```
