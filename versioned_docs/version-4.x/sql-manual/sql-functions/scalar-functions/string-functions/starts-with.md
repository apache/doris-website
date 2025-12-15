---
{
    "title": "STARTS_WITH",
    "language": "en"
}
---


## Description

The STARTS_WITH function checks if a string starts with a specified prefix. This is a boolean function that performs exact prefix matching and is case-sensitive.

## Syntax

```sql
STARTS_WITH(<str>, <prefix>)
```

## Parameters
| Parameter | Description |
| --------- | ----------------------------------------- |
| `<str>` | The main string to check. Type: VARCHAR |
| `<prefix>` | The prefix string to match. Type: VARCHAR |

## Return Value

Returns BOOLEAN type (displayed as TINYINT in Doris, 1 for true, 0 for false).

Matching rules:
- Exact prefix match, case-sensitive
- Empty prefix matches any string (returns true)
- Supports correct matching of UTF-8 multi-byte characters
- Prefix length cannot exceed main string length (unless prefix is empty)

Special cases:
- Returns NULL if any argument is NULL
- Returns true if prefix is empty string (any string starts with empty string)
- Returns false if main string is empty but prefix is not
- Returns true if both are empty strings

## Examples

1. Basic prefix matching
```sql
SELECT STARTS_WITH('hello world', 'hello'), STARTS_WITH('hello world', 'world');
```
```text
+-------------------------------------+-------------------------------------+
| STARTS_WITH('hello world', 'hello') | STARTS_WITH('hello world', 'world') |
+-------------------------------------+-------------------------------------+
|                                   1 |                                   0 |
+-------------------------------------+-------------------------------------+
```

2. Case sensitivity
```sql
SELECT STARTS_WITH('Hello World', 'hello'), STARTS_WITH('Hello World', 'Hello');
```
```text
+-------------------------------------+-------------------------------------+
| STARTS_WITH('Hello World', 'hello') | STARTS_WITH('Hello World', 'Hello') |
+-------------------------------------+-------------------------------------+
|                                   0 |                                   1 |
+-------------------------------------+-------------------------------------+
```

3. NULL value handling
```sql
SELECT STARTS_WITH(NULL, 'test'), STARTS_WITH('test', NULL);
```
```text
+----------------------------+----------------------------+
| STARTS_WITH(NULL, 'test')  | STARTS_WITH('test', NULL)  |
+----------------------------+----------------------------+
| NULL                       | NULL                       |
+----------------------------+----------------------------+
```

4. Empty string handling
```sql
SELECT STARTS_WITH('hello', ''), STARTS_WITH('', 'world');
```
```text
+---------------------------+----------------------------+
| STARTS_WITH('hello', '')  | STARTS_WITH('', 'world')   |
+---------------------------+----------------------------+
|                         1 |                          0 |
+---------------------------+----------------------------+
```

5. Complete string match
```sql
SELECT STARTS_WITH('test', 'test'), STARTS_WITH('test', 'testing');
```
```text
+-----------------------------+--------------------------------+
| STARTS_WITH('test', 'test') | STARTS_WITH('test', 'testing') |
+-----------------------------+--------------------------------+
|                           1 |                              0 |
+-----------------------------+--------------------------------+
```

6. File path checking
```sql
SELECT STARTS_WITH('/home/user/file.txt', '/home'), STARTS_WITH('C:\\Windows\\file.txt', 'C:\\');
```
```text
+--------------------------------------------+------------------------------------------------+
| STARTS_WITH('/home/user/file.txt', '/home') | STARTS_WITH('C:\\Windows\\file.txt', 'C:\\')   |
+--------------------------------------------+------------------------------------------------+
|                                          1 |                                              1 |
+--------------------------------------------+------------------------------------------------+
```

7. UTF-8 multi-byte characters
```sql
SELECT STARTS_WITH('ṭṛì ḍḍumai hello', 'ṭṛì'), STARTS_WITH('ṭṛì ḍḍumai hello', 'ḍḍumai');
```
```text
+------------------------------------------+---------------------------------------------+
| STARTS_WITH('ṭṛì ḍḍumai hello', 'ṭṛì')   | STARTS_WITH('ṭṛì ḍḍumai hello', 'ḍḍumai')  |
+------------------------------------------+---------------------------------------------+
|                                        1 |                                           0 |
+------------------------------------------+---------------------------------------------+
```

8. URL and protocol checking
```sql
SELECT STARTS_WITH('https://example.com', 'https://'), STARTS_WITH('ftp://server.com', 'http://');
```
```text
+----------------------------------------------+---------------------------------------------+
| STARTS_WITH('https://example.com', 'https://') | STARTS_WITH('ftp://server.com', 'http://') |
+----------------------------------------------+---------------------------------------------+
|                                            1 |                                           0 |
+----------------------------------------------+---------------------------------------------+
```

9. Numeric string prefix
```sql
SELECT STARTS_WITH('123456789', '123'), STARTS_WITH('987654321', '123');
```
```text
+----------------------------------+----------------------------------+
| STARTS_WITH('123456789', '123')  | STARTS_WITH('987654321', '123')  |
+----------------------------------+----------------------------------+
|                                1 |                                0 |
+----------------------------------+----------------------------------+
```

10. Special characters and symbols
```sql
SELECT STARTS_WITH('@username', '@'), STARTS_WITH('#hashtag', '#');
```
```text
+-------------------------------+--------------------------------+
| STARTS_WITH('@username', '@') | STARTS_WITH('#hashtag', '#')   |
+-------------------------------+--------------------------------+
|                             1 |                              1 |
+-------------------------------+--------------------------------+
```

### Keywords

    STARTS_WITH