---
{
    "title": "INSTR",
    "language": "en"
}
---

## Description

Returns the first occurrence position of substr in str (counting starts from 1). Special cases:

- If substr does not appear in str, returns 0.

## Syntax

```sql
INSTR ( <str> , <substr> )
```

## Parameters

| Parameter | Description |
|--------|-----------|
| `<str>` | String to search for |
| `<substr>` | String to be searched for |

## Return value

Parameters The first occurrence position of `<substr>` in `<str>` (counting starts from 1). Special cases:

- If `<substr>` does not appear in `<str>`, returns 0.

## Example

```sql
SELECT INSTR("abc", "b"),INSTR("abc", "d")
```

```text
+-------------------+-------------------+
| instr('abc', 'b') | instr('abc', 'd') |
+-------------------+-------------------+
|                 2 |                 0 |
+-------------------+-------------------+
```