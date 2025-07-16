---
{
    "title": "FIND_IN_SET",
    "language": "en"
}
---

## Description

Returns the position of the first occurrence of str in strlist (counting starts at 1).

strlist is a comma-delimited string. Special cases:

- If not found, returns 0.
- If any parameter is NULL, returns NULL.

## Syntax

```sql
FIND_IN_SET ( <str> , <strlist> )
```

## Parameters

| Parameter   | Description |
|-------------|----------|
| `<str>`     | String to be searched |
| `<strlist>` | String to be searched |

## Return value

The position of the first occurrence of parameter `<str>` in parameter `<strlist>`. Special cases:

- If not found, returns 0.
- If any parameter is NULL, returns NULL.

## Example

```sql
SELECT FIND_IN_SET("b", "a,b,c")
```

```text
| find_in_set('b', 'a,b,c') |
+---------------------------+
|                         2 |
+---------------------------+
```
