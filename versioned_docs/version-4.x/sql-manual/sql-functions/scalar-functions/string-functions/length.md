---
{
    "title": "LENGTH",
    "language": "en",
    "description": "The LENGTH function returns the byte length of a string (in bytes). This function calculates the number of bytes a string occupies in UTF-8 encoding,"
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