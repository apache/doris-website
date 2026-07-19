---
{
    "title": "INSTR",
    "language": "en",
    "description": "The INSTR function returns the position of the first occurrence of a substring in the main string, with position counting starting from 1."
}
---

## Description

The INSTR function returns the position of the first occurrence of a substring in the main string, with position counting starting from 1. This is a commonly used string search function that supports exact matching and is case-sensitive. The function is widely used in text processing, data cleaning, and string analysis.

## Syntax

```sql
INSTR(<str>, <substr>)
```

## Parameters

| Parameter | Description |
|--------|-----------|
| `<str>` | Main string to search within. Type: VARCHAR |
| `<substr>` | Substring to find. Type: VARCHAR |

## Return Value

Returns INT type, representing the position of the first occurrence of the substring in the main string.

Search rules:
- Returns position index starting from 1 (not from 0)
- If substring does not exist, returns 0
- Search is case-sensitive
- Supports correct position calculation for UTF-8 multi-byte characters
- Special handling for empty strings

Special cases:
- If any parameter is NULL, returns NULL
- If substring is an empty string, returns 1 (empty string "exists" at any position)
- If main string is empty but substring is not, returns 0
- Supports finding substrings containing special characters and symbols

## Examples

1. Basic character search
```sql
SELECT INSTR('abc', 'b'), INSTR('abc', 'd');
```
```text
+-------------------+-------------------+
| INSTR('abc', 'b') | INSTR('abc', 'd') |
+-------------------+-------------------+
|                 2 |                 0 |
+-------------------+-------------------+
```

2. Substring search
```sql
SELECT INSTR('hello world', 'world'), INSTR('hello world', 'WORLD');
```
```text
+------------------------------+------------------------------+
| INSTR('hello world', 'world') | INSTR('hello world', 'WORLD') |
+------------------------------+------------------------------+
|                            7 |                            0 |
+------------------------------+------------------------------+
```

3. NULL value handling
```sql
SELECT INSTR(NULL, 'test'), INSTR('test', NULL);
```
```text
+---------------------+---------------------+
| INSTR(NULL, 'test') | INSTR('test', NULL) |
+---------------------+---------------------+
| NULL                | NULL                |
+---------------------+---------------------+
```

4. Empty string handling
```sql
SELECT INSTR('hello', ''), INSTR('', 'world');
```
```text
+--------------------+---------------------+
| INSTR('hello', '') | INSTR('', 'world') |
+--------------------+---------------------+
|                  1 |                   0 |
+--------------------+---------------------+
```

5. Repeated occurrences (returns first match)
```sql
SELECT INSTR('abcabc', 'abc'), INSTR('banana', 'a');
```
```text
+------------------------+----------------------+
| INSTR('abcabc', 'abc') | INSTR('banana', 'a') |
+------------------------+----------------------+
|                      1 |                    2 |
+------------------------+----------------------+
```

6. Special characters and symbols
```sql
SELECT INSTR('user@example.com', '@'), INSTR('price: $99.99', '$');
```
```text
+--------------------------------+-----------------------------+
| INSTR('user@example.com', '@') | INSTR('price: $99.99', '$') |
+--------------------------------+-----------------------------+
|                              5 |                           8 |
+--------------------------------+-----------------------------+
```

7. UTF-8 multi-byte characters
```sql
SELECT INSTR('ṭṛì ḍḍumai hello', 'ḍḍumai'), INSTR('ṭṛì ḍḍumai hello', 'hello');
```
```text
+--------------------------------------------------+---------------------------------------------+
| INSTR('ṭṛì ḍḍumai hello', 'ḍḍumai')              | INSTR('ṭṛì ḍḍumai hello', 'hello')          |
+--------------------------------------------------+---------------------------------------------+
|                                                5 |                                          12 |
+--------------------------------------------------+---------------------------------------------+
```

8. Numeric strings
```sql
SELECT INSTR('123456789', '456'), INSTR('123-456-789', '-');
```
```text
+---------------------------+---------------------------+
| INSTR('123456789', '456') | INSTR('123-456-789', '-') |
+---------------------------+---------------------------+
|                         4 |                         4 |
+---------------------------+---------------------------+
```

9. Multi-word substring search
```sql
SELECT INSTR('The quick brown fox', 'quick'), INSTR('The quick brown fox', 'slow');
```
```text
+---------------------------------------+--------------------------------------+
| INSTR('The quick brown fox', 'quick') | INSTR('The quick brown fox', 'slow') |
+---------------------------------------+--------------------------------------+
|                                     5 |                                    0 |
+---------------------------------------+--------------------------------------+
```

10. Path and URL searches
```sql
SELECT INSTR('/home/user/file.txt', '/'), INSTR('https://www.example.com', '://');
```
```text
+-----------------------------------+-----------------------------------------+
| INSTR('/home/user/file.txt', '/') | INSTR('https://www.example.com', '://') |
+-----------------------------------+-----------------------------------------+
|                                 1 |                                       6 |
+-----------------------------------+-----------------------------------------+
```