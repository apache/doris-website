---
{
    "title": "ASCII",
    "language": "en",
    "description": "Returns the ASCII code value of the first character in a string. This function only processes the first character of the string,"
}
---

## Description

Returns the ASCII code value of the first character in a string. This function only processes the first character of the string, returning only the ASCII value of the first character for multi-character strings.

## Syntax

```sql
ASCII(<str>)
```

## Parameters

| Parameter | Description                      |
|---------|-----------------------------|
| `<str>` | The string to get the ASCII code of the first character. Type: VARCHAR |

## Return Value

Returns INT type, representing the ASCII code value of the first character in the string.

Special cases:
- If the parameter is NULL, returns NULL
- If the string is empty, returns 0
- If the first character is not an ASCII character (code value greater than 127), returns the corresponding byte value
- For multi-byte UTF-8 characters, returns the value of the first byte

## Examples

1. Basic numeric characters
```sql
SELECT ASCII('1'), ASCII('234');
```
```text
+------------+--------------+
| ASCII('1') | ASCII('234') |
+------------+--------------+
|         49 |           50 |
+------------+--------------+
```

2. Letter characters
```sql
SELECT ASCII('A'), ASCII('a'), ASCII('Z');
```
```text
+------------+------------+------------+
| ASCII('A') | ASCII('a') | ASCII('Z') |
+------------+------------+------------+
|         65 |         97 |         90 |
+------------+------------+------------+
```

3. Empty string handling
```sql
SELECT ASCII('');
```
```text
+-----------+
| ASCII('') |
+-----------+
|         0 |
+-----------+
```

4. NULL value handling
```sql
SELECT ASCII(NULL);
```
```text
+-------------+
| ASCII(NULL) |
+-------------+
|        NULL |
+-------------+
```

5. Special symbols
```sql
SELECT ASCII(' '), ASCII('!'), ASCII('@');
```
```text
+------------+------------+------------+
| ASCII(' ') | ASCII('!') | ASCII('@') |
+------------+------------+------------+
|         32 |         33 |         64 |
+------------+------------+------------+
```

6. Control characters
```sql
SELECT ASCII('\t'), ASCII('\n'), ASCII('\r');
```
```text
+-------------+-------------+-------------+
| ASCII('\t') | ASCII('\n') | ASCII('\r') |
+-------------+-------------+-------------+
|           9 |          10 |          13 |
+-------------+-------------+-------------+
```

7. Multi-character strings (returns only the first character)
```sql
SELECT ASCII('Hello'), ASCII('World123');
```
```text
+----------------+------------------+
| ASCII('Hello') | ASCII('World123') |
+----------------+------------------+
|             72 |               87 |
+----------------+------------------+
```

8. UTF-8 multi-byte characters
```sql
SELECT ASCII('ṭṛì'), ASCII('ḍḍumai');
```
```text
+---------------+------------------+
| ASCII('ṭṛì')  | ASCII('ḍḍumai') |
+---------------+------------------+
|           225 |              225 |
+---------------+------------------+
```

9. Mixed numbers and characters
```sql
SELECT ASCII('9abc'), ASCII('0xyz');
```
```text
+---------------+---------------+
| ASCII('9abc') | ASCII('0xyz') |
+---------------+---------------+
|            57 |            48 |
+---------------+---------------+
```
