---
{
    "title": "FMOD",
    "language": "en"
}
---

## Description

Calculate the modulo of floating-point numbers, a / b. For integer types, please use the mod function.

## Syntax

```sql
FMOD(<col_a> , <col_b>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col_a>` | Dividend |
| `<col_b>` | Divisor (cannot be 0) |

## Return Value

Returns a floating-point number. Special cases:

- When any input parameter is NULL, returns NULL.

## Examples

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

```sql
select fmod(10.1, NULL);
```

```text
+------------------+
| fmod(10.1, NULL) |
+------------------+
|             NULL |
+------------------+
```