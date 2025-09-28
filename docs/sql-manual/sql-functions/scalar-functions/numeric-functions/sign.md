---
{
    "title": "SIGN",
    "language": "en"
}
---

## Description

Returns the sign of `x`. Negative, zero or positive numbers correspond to -1, 0 or 1 respectively.

## Syntax

```sql
SIGN(x)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>`   | independent variable |

## Return value

Returns an integer:

- If x > 0, it returns 1, representing a positive number.

- If x = 0, it returns 0, representing zero.

- If x < 0, it returns -1, representing a negative number.

- If x is NULL, it returns NULL.

Note that for floating-point positive and negative zeros, they all return 0 here. If you want to distinguish between positive and negative zeros of floating-point numbers, you can use the `<signbit>` function.

## Example

```sql
select sign(3);
```

```text
+-------------------------+
| sign(cast(3 as DOUBLE)) |
+-------------------------+
|                       1 |
+-------------------------+
```

```sql
select sign(0);
```

```text
+-------------------------+
| sign(cast(0 as DOUBLE)) |
+-------------------------+
|                       0 |
+-------------------------+
```

```sql
select sign(-10.0);
```

```text
+-----------------------------+
| sign(cast(-10.0 as DOUBLE)) |
+-----------------------------+
|                          -1 |
+-----------------------------+
```

```sql
select sign(null);
```

```text
+------------+
| sign(NULL) |
+------------+
|       NULL |
+------------+
```

```sql
select sign(cast('+0.0' as double)) , sign(cast('-0.0' as double));
```

```text
+------------------------------+------------------------------+
| sign(cast('+0.0' as double)) | sign(cast('-0.0' as double)) |
+------------------------------+------------------------------+
|                            0 |                            0 |
+------------------------------+------------------------------+
```
