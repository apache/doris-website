---
{
    "title": "RPAD",
    "language": "en"
}
---


## Description

The RPAD function (Right Padding) is used to pad the right side of a string with specified characters until it reaches a specified length. If the target length is less than the original string length, the string is truncated. This function calculates by character length, not byte length.

## Syntax

```sql
RPAD(<str>, <len>, <pad>)
```

## Parameters

| Parameter | Description |
|---------|----------------------------|
| `<str>` | The source string to be padded. Type: VARCHAR |
| `<len>` | The target character length (not byte length). Type: INT |
| `<pad>` | The string to pad with. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the padded or truncated string.

Padding rules:
- If len > original string length: repeatedly pad with pad string on the right until total length reaches len
- If len = original string length: return the original string
- If len < original string length: truncate the string, returning only the first len characters
- The pad string is used cyclically, possibly using only partial characters
- Calculated by character length, supports UTF-8 multi-byte characters

Special cases:
- If any parameter is NULL, returns NULL
- If pad is an empty string and len > str length, returns an empty string
- If len is 0, returns an empty string
- If len is negative, returns NULL

## Examples

1. Basic right padding
```sql
SELECT RPAD('hi', 5, 'xy'), RPAD('hello', 8, '*');
```
```text
+---------------------+-----------------------+
| RPAD('hi', 5, 'xy') | RPAD('hello', 8, '*') |
+---------------------+-----------------------+
| hixyx               | hello***              |
+---------------------+-----------------------+
```

2. String truncation
```sql
SELECT RPAD('hello', 1, ''), RPAD('hello world', 5, 'x');
```
```text
+----------------------+------------------------------+
| RPAD('hello', 1, '') | RPAD('hello world', 5, 'x')  |
+----------------------+------------------------------+
| h                    | hello                        |
+----------------------+------------------------------+
```

3. NULL value handling
```sql
SELECT RPAD(NULL, 5, 'x'), RPAD('hi', NULL, 'x'), RPAD('hi', 5, NULL);
```
```text
+---------------------+------------------------+----------------------+
| RPAD(NULL, 5, 'x')  | RPAD('hi', NULL, 'x')  | RPAD('hi', 5, NULL)  |
+---------------------+------------------------+----------------------+
| NULL                | NULL                   | NULL                 |
+---------------------+------------------------+----------------------+
```

4. Empty string and zero length
```sql
SELECT RPAD('', 0, ''), RPAD('hi', 0, 'x'), RPAD('', 5, '*');
```
```text
+-----------------+-------------------+--------------------+
| RPAD('', 0, '') | RPAD('hi', 0, 'x') | RPAD('', 5, '*')   |
+-----------------+-------------------+--------------------+
|                 |                   | *****              |
+-----------------+-------------------+--------------------+
```

5. Empty padding string
```sql
SELECT RPAD('hello', 10, ''), RPAD('hi', 2, '');
```
```text
+-----------------------+-------------------+
| RPAD('hello', 10, '')  | RPAD('hi', 2, '') |
+-----------------------+-------------------+
|                       | hi                |
+-----------------------+-------------------+
```

6. Long padding string and cycling
```sql
SELECT RPAD('hello', 10, 'world'), RPAD('X', 7, 'ABC');
```
```text
+----------------------------+----------------------+
| RPAD('hello', 10, 'world') | RPAD('X', 7, 'ABC')  |
+----------------------------+----------------------+
| helloworld                 | XABCABC              |
+----------------------------+----------------------+
```

7. UTF-8 multi-byte character padding
```sql
SELECT RPAD('hello', 10, 'ṭṛì'), RPAD('ḍḍumai', 3, 'x');
```
```text
+---------------------------+--------------------------+
| RPAD('hello', 10, 'ṭṛì')  | RPAD('ḍḍumai', 3, 'x')   |
+---------------------------+--------------------------+
| helloṭṛìṭṛ                | ḍḍu                      |
+---------------------------+--------------------------+
```

8. Number string formatting
```sql
SELECT RPAD('$99', 8, '.'), RPAD('Item1', 10, ' ');
```
```text
+---------------------+------------------------+
| RPAD('$99', 8, '.') | RPAD('Item1', 10, ' ') |
+---------------------+------------------------+
| $99.....            | Item1                  |
+---------------------+------------------------+
```

9. Table column alignment
```sql
SELECT RPAD('Name', 15, ' '), RPAD('Price', 10, ' ');
```
```text
+------------------------+------------------------+
| RPAD('Name', 15, ' ')  | RPAD('Price', 10, ' ') |
+------------------------+------------------------+
| Name                   | Price                  |
+------------------------+------------------------+
```

10. Negative length handling
```sql
SELECT RPAD('hello', -1, 'x'), RPAD('test', -5, '*');
```
```text
+------------------------+------------------------+
| RPAD('hello', -1, 'x') | RPAD('test', -5, '*')  |
+------------------------+------------------------+
| NULL                   | NULL                   |
+------------------------+------------------------+
```