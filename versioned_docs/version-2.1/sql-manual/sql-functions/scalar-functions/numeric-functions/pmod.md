---
{
    "title": "PMOD",
    "language": "en"
}
---

## Description

Returns the smallest positive solution of the modulo operation x mod y within the modular system, which is obtained by calculating (x % y + y) % y.

## Syntax

```sql
PMOD(<x> , <y>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>` | Dividend |
| `<y>` | Divisor  should not be 0 |

## Return value

Returns an integer or a floating-point number. Special cases:

- If x = 0, returns 0.
- If x is NULL or y is NULL, returns NULL.

## Example

```sql
SELECT PMOD(13,5);
```

```text
+-------------+
| pmod(13, 5) |
+-------------+
|           3 |
+-------------+
```

```sql
SELECT PMOD(-13,5);
```

```text
+--------------+
| pmod(-13, 5) |
+--------------+
|            2 |
+--------------+
```

```sql
SELECT PMOD(0,-12);
```

```text
+--------------+
| pmod(0, -12) |
+--------------+
|            0 |
+--------------+
```

```sql
SELECT PMOD(0,null);
```

```text
+-------------------------------+
| pmod(cast(0 as DOUBLE), NULL) |
+-------------------------------+
|                          NULL |
+-------------------------------+
```