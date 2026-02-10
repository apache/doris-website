---
{
    "title": "NULLIF",
    "language": "en",
    "description": "Returns NULL if the two input values are equal; otherwise, returns the first input value."
}
---

## Description

Returns `NULL` if the two input values are equal; otherwise, returns the first input value. This function is equivalent to the following `CASE WHEN` expression:

```sql
CASE
    WHEN <expr1> = <expr2> THEN NULL
    ELSE <expr1>
END
```

## Syntax

```sql
NULLIF(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<expr1>` | The first input value to compare. |
| `<expr2>` | The second input value to compare against the first. |

## Return Value

- Returns `NULL` if `<expr1>` is equal to `<expr2>`.
- Otherwise, returns the value of `<expr1>`.

## Examples

```sql
SELECT NULLIF(1, 1);
```

```text
+--------------+
| NULLIF(1, 1) |
+--------------+
|         NULL |
+--------------+
```

```sql
SELECT NULLIF(1, 0);
```

```text
+--------------+
| NULLIF(1, 0) |
+--------------+
|            1 |
+--------------+
```