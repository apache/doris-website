---
{
    "title": "CONCAT",
    "language": "en",
    "description": "The CONCAT function concatenates multiple strings in sequence into one string."
}
---

## Description

The CONCAT function concatenates multiple strings in sequence into one string. This function supports a variable number of arguments and is one of the most basic and commonly used functions in string processing. It is widely used in scenarios such as data concatenation, report generation, and dynamic SQL construction. Note that if any argument is NULL, the entire result will be NULL.

## Syntax

```sql
CONCAT(<expr> [, <expr> ...])
```

## Parameters

| Parameter       | Description           |
|----------|--------------|
| `<expr>` | String expression to be concatenated, can be a string constant, column name, or other expression. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the concatenated string of all arguments.

Concatenation rules:
- Concatenates strings in argument order
- Supports any number of arguments (at least 1)
- Supports correct concatenation of UTF-8 multi-byte characters
- Numbers and other types are automatically converted to strings

Special cases:
- If any argument is NULL, returns NULL (this is the main difference from CONCAT_WS)
- If no arguments are provided, syntax error
- Empty string arguments do not affect the concatenation result
- Supports mixing with non-string types

## Examples

1. Basic string concatenation
```sql
SELECT CONCAT('a', 'b'), CONCAT('a', 'b', 'c');
```
```text
+------------------+-----------------------+
| CONCAT('a', 'b') | CONCAT('a', 'b', 'c') |
+------------------+-----------------------+
| ab               | abc                   |
+------------------+-----------------------+
```

2. NULL value handling (key feature)
```sql
SELECT CONCAT('a', NULL, 'c'), CONCAT('hello', NULL);
```
```text
+------------------------+---------------------+
| CONCAT('a', NULL, 'c') | CONCAT('hello', NULL) |
+------------------------+---------------------+
| NULL                   | NULL                |
+------------------------+---------------------+
```

3. Empty string handling
```sql
SELECT CONCAT('hello', '', 'world'), CONCAT('', 'test', '');
```
```text
+-----------------------------+------------------------+
| CONCAT('hello', '', 'world') | CONCAT('', 'test', '') |
+-----------------------------+------------------------+
| helloworld                  | test                   |
+-----------------------------+------------------------+
```

4. Mixed numbers and strings
```sql
SELECT CONCAT('User', 123), CONCAT('Price: $', 99.99);
```
```text
+---------------------+---------------------------+
| CONCAT('User', 123) | CONCAT('Price: $', 99.99) |
+---------------------+---------------------------+
| User123             | Price: $99.99             |
+---------------------+---------------------------+
```

5. Multiple argument concatenation
```sql
SELECT CONCAT('A', 'B', 'C', 'D', 'E'), CONCAT('1', '2', '3', '4', '5');
```
```text
+----------------------------------+----------------------------------+
| CONCAT('A', 'B', 'C', 'D', 'E') | CONCAT('1', '2', '3', '4', '5') |
+----------------------------------+----------------------------------+
| ABCDE                            | 12345                            |
+----------------------------------+----------------------------------+
```

6. UTF-8 multi-byte character concatenation
```sql
SELECT CONCAT('ṭṛì', ' ', 'ḍḍumai'), CONCAT('Hello', ' ', 'ṭṛì', ' ', 'ḍḍumai');
```
```text
+------------------------------+--------------------------------------+
| CONCAT('ṭṛì', ' ', 'ḍḍumai') | CONCAT('Hello', ' ', 'ṭṛì', ' ', 'ḍḍumai') |
+------------------------------+--------------------------------------+
| ṭṛì ḍḍumai                   | Hello ṭṛì ḍḍumai                     |
+------------------------------+--------------------------------------+
```

7. Path and URL construction
```sql
SELECT CONCAT('/home/', 'user/', 'file.txt'), CONCAT('https://', 'www.example.com', '/api');
```
```text
+--------------------------------------+----------------------------------------------+
| CONCAT('/home/', 'user/', 'file.txt') | CONCAT('https://', 'www.example.com', '/api') |
+--------------------------------------+----------------------------------------------+
| /home/user/file.txt                  | https://www.example.com/api                 |
+--------------------------------------+----------------------------------------------+
```

8. Email address construction
```sql
SELECT CONCAT('user', '@', 'example.com'), CONCAT('admin.', 'support', '@', 'company.org');
```
```text
+------------------------------------+-----------------------------------------------+
| CONCAT('user', '@', 'example.com') | CONCAT('admin.', 'support', '@', 'company.org') |
+------------------------------------+-----------------------------------------------+
| user@example.com                   | admin.support@company.org                    |
+------------------------------------+-----------------------------------------------+
```
