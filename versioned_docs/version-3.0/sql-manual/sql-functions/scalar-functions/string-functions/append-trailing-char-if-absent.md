---
{
    "title": "APPEND_TRAILING_CHAR_IF_ABSENT",
    "language": "en"
}
---

## Description

Used to add a specific character (such as a space, a specific symbol, etc.) to the end of a string if the character does not exist at the end of the string. The function is to ensure that the string ends with a specific character.

## Syntax

```sql
APPEND_TRAILING_CHAR_IF_ABSENT ( <str> , <trailing_char> )
```

## Parameters

| Parameters        | Description |
|-------------------|-----------------------------|
| `<str>`           | Target string to be judged |
| `<trailing_char>` | Character to be added to the end of the string (if the character does not exist) |

## Return value

Parameters The string after concatenation of `<str>` and `<trailing_char>` (if `<trailing_char>` does not exist in `<str>`)

## Example

``` sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('a','c'),APPEND_TRAILING_CHAR_IF_ABSENT('ac', 'c'),APPEND_TRAILING_CHAR_IF_ABSENT('ac', 'cd')
```

```text 
+------------------------------------------+-------------------------------------------+--------------------------------------------+
| append_trailing_char_if_absent('a', 'c') | append_trailing_char_if_absent('ac', 'c') | append_trailing_char_if_absent('ac', 'cd') |
+------------------------------------------+-------------------------------------------+--------------------------------------------+
| ac                                       | ac                                        | accd                                       |
+------------------------------------------+-------------------------------------------+--------------------------------------------+
```
