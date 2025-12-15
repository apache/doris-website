---
{
    "title": "FMOD",
    "language": "en"
}
---

## Description

Find the remainder of a / b for the floating-point type. For the integer type, please use the mod function.

## Syntax

```sql
MOD(<col_a> , <col_b>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<col_a>`   | Dividend |
| `<col_b>`   | Divisor should not be 0 |

## Return value

Return a float-point type. Special cases:

If col_a IS NULL or col_b IS NULL, return NULL.

## Example

```sql
select fmod(10.1, 3.2);
```

```text
+-----------------+
| fmod(10.1, 3.2) |
+-----------------+
|      0.50000024 |
+-----------------+
```

```sql
select fmod(10.1, 0);
```

```text
+---------------+
| fmod(10.1, 0) |
+---------------+
|          NULL |
+---------------+
```