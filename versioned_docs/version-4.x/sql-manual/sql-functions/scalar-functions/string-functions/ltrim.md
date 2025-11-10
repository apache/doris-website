---
{
    "title": "LTRIM",
    "language": "en"
}
---

## Description

The LTRIM function removes consecutive occurrences of spaces or specified character sets from the left side (beginning) of a string. This function scans from the left end of the string and removes all consecutive target characters until it encounters a character not in the target character set.

## Syntax

```sql
LTRIM(<str> [, <trim_chars>])
```

## Parameters

| Parameter      | Description                                                                                                                                                                                                                                                                           |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>`        | The source string to be left-trimmed. Type: VARCHAR                                                                                                                                                                                                                                  |
| `<trim_chars>` | Optional parameter, specifies the set of characters to remove. If not provided, defaults to removing space characters. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the string after removing specified characters from the left side.

Trimming rules:
- Only removes characters from the left side (beginning) of the string
- Removes all consecutive characters that appear in trim_chars
- Stops removing once a character not in trim_chars is encountered
- If trim_chars is not specified, defaults to removing space characters (including spaces, tabs, newlines, etc.)

Special cases:
- If any parameter is NULL, returns NULL
- If str is empty string, returns empty string
- If trim_chars is empty string, returns original string
- If entire string consists of characters in trim_chars, returns empty string

## Examples

1. Remove left spaces
```sql
SELECT LTRIM('   ab d');
```
```text
+-------------------+
| LTRIM('   ab d')  |
+-------------------+
| ab d              |
+-------------------+
```

2. Remove specified characters
```sql
SELECT LTRIM('ababccaab', 'ab');
```
```text
+----------------------------+
| LTRIM('ababccaab', 'ab')   |
+----------------------------+
| ccaab                      |
+----------------------------+
```

3. NULL value handling
```sql
SELECT LTRIM(NULL), LTRIM('test', NULL);
```
```text
+-------------+---------------------+
| LTRIM(NULL) | LTRIM('test', NULL) |
+-------------+---------------------+
| NULL        | NULL                |
+-------------+---------------------+
```
