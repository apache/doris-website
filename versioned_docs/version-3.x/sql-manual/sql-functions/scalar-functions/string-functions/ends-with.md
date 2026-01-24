---
{
    "title": "ENDS_WITH",
    "language": "en",
    "description": "Returns true if the string ends with the specified suffix, otherwise returns false. Special cases:"
}
---

## Description

Returns true if the string ends with the specified suffix, otherwise returns false. Special cases:

- If either of the two parameters is NULL, returns NULL.

## Syntax

```sql
ENDS_WITH ( <str> , <suffix> )
```

## Parameters

| Parameter | Description |
|-----------|--------------|
| `str`     | Specifies the original string to be judged |
| `suffix`  | Specifies the ending string to be judged |

## Return value

true or false, type is `BOOLEAN`. Special cases:

- If either of the two parameters is NULL, returns NULL.

## Example

```sql
SELECT ENDS_WITH("Hello doris", "doris"),ENDS_WITH("Hello doris", "Hello")
```

```text
+-----------------------------------+-----------------------------------+
| ends_with('Hello doris', 'doris') | ends_with('Hello doris', 'Hello') |
+-----------------------------------+-----------------------------------+
|                                 1 |                                 0 |
+-----------------------------------+-----------------------------------+
```