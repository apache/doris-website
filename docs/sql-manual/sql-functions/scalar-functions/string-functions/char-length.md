---
{
    "title": "CHAR_LENGTH",
    "language": "en",
    "description": "The CHARLENGTH function calculates the number of characters (not bytes) in a string. For multi-byte characters (such as Chinese characters),"
}
---

## Description

The CHAR_LENGTH function calculates the number of characters (not bytes) in a string. For multi-byte characters (such as Chinese characters), it returns the number of characters.

Currently only supports UTF-8 encoding.

## Alias

- CHARACTER_LENGTH

## Syntax

```sql 
CHAR_LENGTH(<str>)
```

## Parameters

| Parameter | Description |
| ------- | ----------------------------------------- |
| `<str>` | The string to calculate character length. Type: VARCHAR |

## Return Value

Returns INT type, representing the number of characters in the string.

Special cases:
- If the parameter is NULL, returns NULL
- Empty string returns 0
- Multi-byte UTF-8 characters each count as 1 character

## Examples

1. English characters
```sql
SELECT CHAR_LENGTH('hello');
```
```text
+----------------------+
| char_length('hello') |
+----------------------+
|                    5 |
+----------------------+
```

2. Chinese characters (each Chinese character counts as one character)
```sql
SELECT CHAR_LENGTH('中国');
```
```text
+----------------------+
| char_length('中国')  |
+----------------------+
|                    2 |
+----------------------+
```

3. NULL value handling
```sql
SELECT CHAR_LENGTH(NULL);
```
```text
+--------------------+
| char_length(NULL)  |
+--------------------+
|               NULL |
+--------------------+
```

4. Comparison with LENGTH function (LENGTH returns byte count)
```sql
SELECT CHAR_LENGTH('中国') AS char_len, LENGTH('中国') AS byte_len;
```
```text
+----------+----------+
| char_len | byte_len |
+----------+----------+
|        2 |        6 |
+----------+----------+
```
