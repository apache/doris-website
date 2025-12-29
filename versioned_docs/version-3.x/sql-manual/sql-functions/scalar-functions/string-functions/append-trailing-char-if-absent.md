---
{
    "title": "APPEND_TRAILING_CHAR_IF_ABSENT",
    "language": "en",
    "description": "The APPENDTRAILINGCHARIFABSENT function ensures that a string ends with a specified character."
}
---

## Description

The APPEND_TRAILING_CHAR_IF_ABSENT function ensures that a string ends with a specified character. If the character does not exist at the end of the string, it is added; if it already exists, the string remains unchanged.

## Syntax

```sql
APPEND_TRAILING_CHAR_IF_ABSENT(<str>, <trailing_char>)
```

## Parameters

| Parameter | Description |
| ------------------ | ----------------------------------------- |
| `<str>` | The target string to process. Type: VARCHAR |
| `<trailing_char>` | The character that must appear at the end of the string. Type: VARCHAR |

## Return Value

Returns VARCHAR type:
- If `<trailing_char>` does not exist at the end of `<str>`, returns the concatenation of `<str>` and `<trailing_char>`
- If `<trailing_char>` already exists at the end of `<str>`, returns the original `<str>`

Special cases:
- If any argument is NULL, returns NULL
- If `<str>` is an empty string, returns `<trailing_char>`

## Examples

1. Basic usage: Add character when it doesn't exist
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('a', 'c');
```
```text
+------------------------------------------+
| append_trailing_char_if_absent('a', 'c') |
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
| append_trailing_char_if_absent('ac', 'c') |
+-------------------------------------------+
| ac                                        |
+-------------------------------------------+
```

3. Empty string handling
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('', '/');
```
```text
+------------------------------------------+
| append_trailing_char_if_absent('', '/')  |
+------------------------------------------+
| /                                        |
+------------------------------------------+
```

4. NULL value handling
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT(NULL, 'c');
```
```text
+-------------------------------------------+
| append_trailing_char_if_absent(NULL, 'c') |
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
