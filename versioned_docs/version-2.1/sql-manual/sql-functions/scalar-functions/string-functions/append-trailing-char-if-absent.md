---
{
    "title": "APPEND_TRAILING_CHAR_IF_ABSENT",
    "language": "en",
    "description": "Used to add a specific character (such as a space, a specific symbol, etc."
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

1. Basic usage: Add character when it doesn't exist
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('a', 'c');
```
```text
+------------------------------------------+
| APPEND_TRAILING_CHAR_IF_ABSENT('a', 'c') |
+------------------------------------------+
| ac                                       |
+------------------------------------------+
```

2. Character already exists, don't add
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('ac', 'c');
```
```text
+-------------------------------------------+
| APPEND_TRAILING_CHAR_IF_ABSENT('ac', 'c') |
+-------------------------------------------+
| ac                                        |
+-------------------------------------------+
```

3. Empty string handling
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('', '/');
```
```text
+-----------------------------------------+
| APPEND_TRAILING_CHAR_IF_ABSENT('', '/') |
+-----------------------------------------+
| /                                       |
+-----------------------------------------+
```

4. NULL value handling
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT(NULL, 'c');
```
```text
+-------------------------------------------+
| APPEND_TRAILING_CHAR_IF_ABSENT(NULL, 'c') |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```

5. UTF-8 character
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('acf', 'ṛ');
```
```text
+----------------------------------------------+
| APPEND_TRAILING_CHAR_IF_ABSENT('acf', 'ṛ')   |
+----------------------------------------------+
| acfṛ                                         |
+----------------------------------------------+
```
