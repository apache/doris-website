---
{
    "title": "SPLIT_BY_STRING",
    "language": "en",
    "description": "The SPLITBYSTRING function splits an input string into an array of strings based on a specified delimiter string."
}
---

## Description

The SPLIT_BY_STRING function splits an input string into an array of strings based on a specified delimiter string. This function supports multi-character delimiters and may differ from similar functions in other databases in handling empty strings.

## Syntax

```sql
SPLIT_BY_STRING(<str>, <separator>)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<str>` | The source string to be split. Type: VARCHAR |
| `<separator>` | The delimiter string used for splitting. Type: VARCHAR |

## Return Value

Returns ARRAY<VARCHAR> type, containing an array of strings split by the delimiter.

Splitting rules:
- Splits at each occurrence of separator in str
- Consecutive separators produce empty string elements
- Separators at the beginning or end of the string produce empty string elements

Special cases:
- If any parameter is NULL, returns NULL
- If str is empty string, returns array with one empty string [""]
- If separator is empty string, str is split by characters (each character becomes an array element)
- If separator doesn't exist in str, returns array containing the original string
- If str contains only separators, returns corresponding number of empty strings based on separator count

## Examples

1. Basic string splitting
```sql
SELECT SPLIT_BY_STRING('hello', 'l');
```
```text
+-------------------------------+
| SPLIT_BY_STRING('hello', 'l') |
+-------------------------------+
| ["he", "", "o"]               |
+-------------------------------+
```

2. Empty separator (split by characters)
```sql
SELECT SPLIT_BY_STRING('hello', '');
```
```text
+------------------------------+
| SPLIT_BY_STRING('hello', '') |
+------------------------------+
| ["h", "e", "l", "l", "o"]    |
+------------------------------+
```

3. Multi-character separator
```sql
SELECT SPLIT_BY_STRING('apple::banana::cherry', '::');
```
```text
+------------------------------------------------+
| SPLIT_BY_STRING('apple::banana::cherry', '::') |
+------------------------------------------------+
| ["apple", "banana", "cherry"]                  |
+------------------------------------------------+
```

4. NULL value handling
```sql
SELECT SPLIT_BY_STRING(NULL, ','), SPLIT_BY_STRING('hello', NULL);
```
```text
+-----------------------------+----------------------------------+
| SPLIT_BY_STRING(NULL, ',')  | SPLIT_BY_STRING('hello', NULL)   |
+-----------------------------+----------------------------------+
| NULL                        | NULL                             |
+-----------------------------+----------------------------------+
```

5. Empty string handling
```sql
SELECT SPLIT_BY_STRING('', ','), SPLIT_BY_STRING('hello', 'xyz');
```
```text
+---------------------------+----------------------------------+
| SPLIT_BY_STRING('', ',')  | SPLIT_BY_STRING('hello', 'xyz')  |
+---------------------------+----------------------------------+
| [""]                      | ["hello"]                       |
+---------------------------+----------------------------------+
```

6. Consecutive separators
```sql
SELECT SPLIT_BY_STRING('a,,b,c', ',');
```
```text
+-------------------------------+
| SPLIT_BY_STRING('a,,b,c', ',') |
+-------------------------------+
| ["a", "", "b", "c"]           |
+-------------------------------+
```

7. Separators at beginning and end
```sql
SELECT SPLIT_BY_STRING(',a,b,', ',');
```
```text
+------------------------------+
| SPLIT_BY_STRING(',a,b,', ',') |
+------------------------------+
| ["", "a", "b", ""]           |
+------------------------------+
```

8. Only contains separators
```sql
SELECT SPLIT_BY_STRING('|||', '|');
```
```text
+----------------------------+
| SPLIT_BY_STRING('|||', '|') |
+----------------------------+
| ["", "", "", ""]           |
+----------------------------+
```

9. UTF-8 character splitting
```sql
SELECT SPLIT_BY_STRING('ṭṛì ḍḍumai ṭṛì', ' ');
```
```text
+--------------------------------------+
| SPLIT_BY_STRING('ṭṛì ḍḍumai ṭṛì', ' ') |
+--------------------------------------+
| ["ṭṛì", "ḍḍumai", "ṭṛì"]              |
+--------------------------------------+
```

10. Non-existent separator
```sql
SELECT SPLIT_BY_STRING('hello world', 'xyz');
```
```text
+--------------------------------------+
| SPLIT_BY_STRING('hello world', 'xyz') |
+--------------------------------------+
| ["hello world"]                      |
+--------------------------------------+
```

### Keywords

    SPLIT_BY_STRING, SPLIT
