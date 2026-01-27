---
{
    "title": "SPLIT_BY_REGEXP/REGEXP_SPLIT_TO_ARRAY",
    "language": "en",
    "description": "The SPLITBYREGEXP function splits a string into an array of strings based on a specified regular expression pattern. Unlike SPLITBYSTRING,"
}
---

## Description

The SPLIT_BY_REGEXP function splits a string into an array of strings based on a specified regular expression pattern. Unlike SPLIT_BY_STRING, this function supports complex regular expression matching for more flexible splitting rules. It optionally supports a maximum split count limit, which is useful for structured text processing, data cleansing, and pattern matching.

## Syntax

```sql
SPLIT_BY_REGEXP(<str>, <pattern> [, <max_limit>])
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<str>` | The source string to be split. Type: VARCHAR |
| `<pattern>` | Regular expression pattern used as the delimiter. Type: VARCHAR |
| `<max_limit>` | Optional parameter, limits the maximum number of elements in the returned array. Type: INT |

## Return Value

Returns ARRAY<VARCHAR> type, representing an array of strings split by the regular expression.

Splitting rules:
- Uses regular expression pattern to match split points
- Supports standard regular expression syntax
- Empty string pattern will split the string into individual characters
- If pattern doesn't match anything, returns single-element array containing the original string
- max_limit restricts the maximum length of the result array

Special cases:
- If any parameter is NULL, returns NULL
- If string is empty, returns single-element array containing empty string
- If regular expression is empty string, splits by characters
- If max_limit is 0 or negative, no limit is applied
- Consecutive matches produce empty string elements

## Examples

1. Empty pattern splits by characters
```sql
SELECT SPLIT_BY_REGEXP('abcde', '');
```
```text
+------------------------------+
| SPLIT_BY_REGEXP('abcde', '') |
+------------------------------+
| ["a", "b", "c", "d", "e"]    |
+------------------------------+
```

2. Digit pattern splitting
```sql
SELECT SPLIT_BY_REGEXP('a12bc23de345f', '\\d+');
```
```text
+-----------------------------------------+
| SPLIT_BY_REGEXP('a12bc23de345f', '\d+') |
+-----------------------------------------+
| ["a", "bc", "de", "f"]                  |
+-----------------------------------------+
```

3. NULL value handling
```sql
SELECT SPLIT_BY_REGEXP(NULL, '\\d+'), SPLIT_BY_REGEXP('test', NULL);
```
```text
+--------------------------------+--------------------------------+
| SPLIT_BY_REGEXP(NULL, '\d+')   | SPLIT_BY_REGEXP('test', NULL)  |
+--------------------------------+--------------------------------+
| NULL                           | NULL                           |
+--------------------------------+--------------------------------+
```

4. Empty string handling
```sql
SELECT SPLIT_BY_REGEXP('', ','), SPLIT_BY_REGEXP('hello', 'xyz');
```
```text
+---------------------------+-------------------------------+
| SPLIT_BY_REGEXP('', ',')  | SPLIT_BY_REGEXP('hello', 'xyz') |
+---------------------------+-------------------------------+
| [""]                      | ["hello"]                     |
+---------------------------+-------------------------------+
```

5. Using maximum limit parameter
```sql
SELECT SPLIT_BY_REGEXP('a,b,c,d,e', ',', 3), SPLIT_BY_REGEXP('1-2-3-4-5', '-', 2);
```
```text
+--------------------------------------+--------------------------------------+
| SPLIT_BY_REGEXP('a,b,c,d,e', ',', 3) | SPLIT_BY_REGEXP('1-2-3-4-5', '-', 2) |
+--------------------------------------+--------------------------------------+
| ["a", "b", "c,d,e"]                  | ["1", "2-3-4-5"]                    |
+--------------------------------------+--------------------------------------+
```

6. Whitespace pattern
```sql
SELECT SPLIT_BY_REGEXP('hello world  test', '\\s+'), SPLIT_BY_REGEXP('a\tb\nc\rd', '\\s');
```
```text
+------------------------------------------+------------------------------------+
| SPLIT_BY_REGEXP('hello world  test', '\s+') | SPLIT_BY_REGEXP('a\tb\nc\rd', '\s') |
+------------------------------------------+------------------------------------+
| ["hello", "world", "test"]               | ["a", "b", "c", "d"]               |
+------------------------------------------+------------------------------------+
```

7. Special characters and escaping
```sql
SELECT SPLIT_BY_REGEXP('a.b.c.d', '\\.'), SPLIT_BY_REGEXP('x(y)z[w]', '[\\(\\)\\[\\]]');
```
```text
+----------------------------------+--------------------------------------------+
| SPLIT_BY_REGEXP('a.b.c.d', '\.') | SPLIT_BY_REGEXP('x(y)z[w]', '[\(\)\[\]]') |
+----------------------------------+--------------------------------------------+
| ["a", "b", "c", "d"]             | ["x", "y", "z", "w"]                   |
+----------------------------------+--------------------------------------------+
```

8. Word boundaries and complex patterns
```sql
SELECT SPLIT_BY_REGEXP('TheQuickBrownFox', '[A-Z]'), SPLIT_BY_REGEXP('user@example.com', '@|\\.');
```
```text
+------------------------------------------+-------------------------------------------+
| SPLIT_BY_REGEXP('TheQuickBrownFox', '[A-Z]') | SPLIT_BY_REGEXP('user@example.com', '@|\.') |
+------------------------------------------+-------------------------------------------+
| ["", "he", "uick", "rown", "ox"]         | ["user", "example", "com"]                |
+------------------------------------------+-------------------------------------------+
```

9. UTF-8 multi-byte characters
```sql
SELECT SPLIT_BY_REGEXP('ṭṛì→ḍḍumai→hello', '→'), SPLIT_BY_REGEXP('αβγδε', '[βδ]');
```
```text
+------------------------------------------+----------------------------------+
| SPLIT_BY_REGEXP('ṭṛì→ḍḍumai→hello', '→') | SPLIT_BY_REGEXP('αβγδε', '[βδ]') |
+------------------------------------------+----------------------------------+
| ["ṭṛì", "ḍḍumai", "hello"]               | ["α", "γ", "ε"]                  |
+------------------------------------------+----------------------------------+
```

10. Consecutive matches and empty elements
```sql
SELECT SPLIT_BY_REGEXP('a,,b,c', ','), SPLIT_BY_REGEXP('123abc456def', '[a-z]+');
```
```text
+-------------------------------+---------------------------------------+
| SPLIT_BY_REGEXP('a,,b,c', ',') | SPLIT_BY_REGEXP('123abc456def', '[a-z]+') |
+-------------------------------+---------------------------------------+
| ["a", "", "b", "c"]           | ["123", "456", ""]                    |
+-------------------------------+---------------------------------------+
```

### Keywords

    SPLIT_BY_REGEXP, SPLIT, REGEXP, REGEXP_SPLIT_TO_ARRAY
