---
{
    "title": "NEGATIVE",
    "language": "en"
}
---

## Description

Returns the negative value of the parameter x.

## Syntax

```sql
NEGATIVE(<x>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>` | The independent variable supports the types `BIGINT, DOUBLE, and DECIMAL` |

## Return value

Returns an integer or a floating-point number. Special cases:

- If the parameter is NULL, return NULL.
- If the parameter is 0, return 0.

## Example

```sql
SELECT negative(-10);
```

```text
+---------------+
| negative(-10) |
+---------------+
|            10 |
+---------------+
```

```sql
SELECT negative(12);
```

```text
+--------------+
| negative(12) |
+--------------+
|          -12 |
+--------------+
```

```sql
SELECT negative(0);
```

```text
+-------------+
| negative(0) |
+-------------+
|           0 |
+-------------+
```

```sql
SELECT negative(null);
```

```text
+----------------+
| negative(NULL) |
+----------------+
|           NULL |
+----------------+
```