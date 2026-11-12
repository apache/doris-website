---
{
    "title": "MOD",
    "language": "en",
    "description": "Find the remainder of a divided by b for the integer type. For the floating-point type, please use the fmod function."
}
---

## Description

Find the remainder of a divided by b for the integer type. For the floating-point type, please use the fmod function.

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

Return an integer type. Special cases:

If col_a IS NULL or col_b IS NULL, return NULL.

## Example

```sql
select mod(10, 3);
```

```text
+----------+
| (10 % 3) |
+----------+
|        1 |
+----------+
```

```sql
select mod(10, 0);
```

```text
+----------+
| (10 % 0) |
+----------+
|     NULL |
+----------+
```