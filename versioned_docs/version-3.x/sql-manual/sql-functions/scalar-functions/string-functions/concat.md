---
{
    "title": "CONCAT",
    "language": "en",
    "description": "Concatenates multiple strings. Special cases:"
}
---

## Description

Concatenates multiple strings. Special cases:

- If any of the parameter values ​​is NULL, the result returned is NULL

## Syntax

```sql
CONCAT ( <expr> [ , <expr> ... ] )
```

## Parameters

| Parameter | Description |
|-----------|--------------|
| `<expr>`  | The strings to be concatenated |

## Return value

Parameter list `<expr>` The strings to be concatenated. Special cases:

- If any of the parameter values ​​is NULL, the result returned is NULL

## Example

```sql
SELECT  CONCAT("a", "b"),CONCAT("a", "b", "c"),CONCAT("a", null, "c")
```

```text
+------------------+-----------------------+------------------------+
| concat('a', 'b') | concat('a', 'b', 'c') | concat('a', NULL, 'c') |
+------------------+-----------------------+------------------------+
| ab               | abc                   | NULL                   |
+------------------+-----------------------+------------------------+
```