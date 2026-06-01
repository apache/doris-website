---
{
    "title": "LENGTH",
    "language": "en",
    "description": "The LENGTH function returns the byte length of a string (in bytes). This function calculates the number of bytes a string occupies in UTF-8 encoding, not the number of characters."
}
---

## Description

The LENGTH function returns the byte length of a string (in bytes). This function calculates the number of bytes a string occupies in UTF-8 encoding, not the number of characters.

**Note the difference from CHAR_LENGTH:**
- `LENGTH()` returns the number of bytes
- `CHAR_LENGTH()` and `CHARACTER_LENGTH()` return the number of characters
- For ASCII characters, byte count equals character count
- For multi-byte characters (such as Chinese, emoji), byte count is usually greater than character count

## Alias
- `OCTET_LENGTH()`

## Syntax

```sql
LENGTH(<str>)
```

## Parameters

| Parameter | Description |
|---------|---------------|
| `<str>` | The string whose byte length needs to be calculated. Type: VARCHAR |

## Return Value

Returns INT type, representing the byte length of the string.

Special cases:
- If parameter is NULL, returns NULL
- Empty string returns 0
- Result is the number of bytes in UTF-8 encoding

## Examples

1. ASCII characters (byte count = character count)
```sql
SELECT LENGTH('abc'), CHAR_LENGTH('abc');
```
```text
+---------------+--------------------+
| LENGTH('abc') | CHAR_LENGTH('abc') |
+---------------+--------------------+
|             3 |                  3 |
+---------------+--------------------+
```

2. Chinese characters (byte count > character count)
```sql
SELECT LENGTH('中国'), CHAR_LENGTH('中国');
```
```text
+------------------+---------------------+
| LENGTH('中国')   | CHAR_LENGTH('中国') |
+------------------+---------------------+
|                6 |                   2 |
+------------------+---------------------+
```

3. NULL value handling
```sql
SELECT LENGTH(NULL);
```
```text
+--------------+
| LENGTH(NULL) |
+--------------+
|         NULL |
+--------------+
```

4. Empty string
```sql
SELECT LENGTH('');
```
```text
+------------+
| LENGTH('') |
+------------+
|          0 |
+------------+
```

5. Mixed character types
```sql
SELECT LENGTH('Hello世界'), CHAR_LENGTH('Hello世界');
```
```text
+-----------------------+----------------------------+
| LENGTH('Hello世界')   | CHAR_LENGTH('Hello世界')   |
+-----------------------+----------------------------+
|                    11 |                          7 |
+-----------------------+----------------------------+
```

6. Escape characters and ASCII spaces
```sql
SELECT LENGTH('\t\n\r'), LENGTH('  ');
```
```text
+------------------+--------------+
| LENGTH('\t\n\r') | LENGTH('  ') |
+------------------+--------------+
|                3 |            2 |
+------------------+--------------+
```

7. UTF-8 multi-byte characters versus character count
```sql
SELECT LENGTH('ṭṛì'), CHAR_LENGTH('ṭṛì');
```
```text
+--------------------+-------------------------+
| LENGTH('ṭṛì')      | CHAR_LENGTH('ṭṛì')      |
+--------------------+-------------------------+
|                  8 |                       3 |
+--------------------+-------------------------+
```

8. Emoji (typically 4 bytes per glyph)
```sql
SELECT LENGTH('😀😁'), CHAR_LENGTH('😀😁');
```
```text
+--------------------+-------------------------+
| LENGTH('😀😁')         | CHAR_LENGTH('😀😁')         |
+--------------------+-------------------------+
|                  8 |                       2 |
+--------------------+-------------------------+
```

9. Numeric strings
```sql
SELECT LENGTH('12345'), CHAR_LENGTH('12345');
```
```text
+-----------------+----------------------+
| LENGTH('12345') | CHAR_LENGTH('12345') |
+-----------------+----------------------+
|               5 |                    5 |
+-----------------+----------------------+
```