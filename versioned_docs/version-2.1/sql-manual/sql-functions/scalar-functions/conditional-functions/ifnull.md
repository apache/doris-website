---
{
    "title": "IFNULL",
    "language": "en",
    "description": "Returns <expr1> if it is not NULL; otherwise, returns <expr2>."
}
---

## Description

Returns `<expr1>` if it is not `NULL`; otherwise, returns `<expr2>`.

## Alias

- NVL

## Syntax

```sql
IFNULL(<expr1>, <expr2>)
```

## Parameters

| Parameter  | Description |
|-----------|-------------|
| `<expr1>` | The first expression to check for `NULL`. |
| `<expr2>` | The value to return if `<expr1>` is `NULL`. |

## Return Value

- Returns `<expr1>` if it is not `NULL`.  
- Otherwise, returns `<expr2>`.

## Examples

```sql
SELECT IFNULL(1, 0);
```

```text
+--------------+
| IFNULL(1, 0) |
+--------------+
|            1 |
+--------------+
```

```sql
SELECT IFNULL(NULL, 10);
```

```text
+------------------+
| IFNULL(NULL, 10) |
+------------------+
|               10 |
+------------------+
```