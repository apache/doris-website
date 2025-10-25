---
{
    "title": "FROM_BASE64",
    "language": "en"
}
---

## Description

The FROM_BASE64 function decodes a Base64-encoded string back to its original string. This is the inverse operation of TO_BASE64 and follows RFC 4648 standards. Base64 encoding is commonly used to transmit binary data in text protocols, and this function can restore the encoded data. It supports standard Base64 character set (A-Z, a-z, 0-9, +, /) and padding character (=).

## Syntax

```sql
FROM_BASE64(<str>)
```

## Parameters

| Parameter | Description |
|---------|-----------------|
| `<str>` | The Base64-encoded string to decode. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the original string after Base64 decoding.

Decoding rules:
- Accepts standard Base64 character set: A-Z, a-z, 0-9, +, /
- Supports padding character =
- Follows RFC 4648 standards
- Automatically ignores whitespace characters (spaces, newlines, etc.)
- Decoding result may contain non-printable characters

Special cases:
- If input is NULL, returns NULL
- If input contains illegal Base64 characters, returns NULL
- If input is an empty string, returns an empty string
- If padding is incorrect or format is invalid, returns NULL

## Examples

1. Basic decoding
```sql
SELECT FROM_BASE64('MQ=='), FROM_BASE64('QQ==');
```
```text
+---------------------+---------------------+
| FROM_BASE64('MQ==') | FROM_BASE64('QQ==') |
+---------------------+---------------------+
| 1                   | A                   |
+---------------------+---------------------+
```

2. Multi-character decoding
```sql
SELECT FROM_BASE64('MjM0'), FROM_BASE64('SGVsbG8=');
```
```text
+---------------------+-------------------------+
| FROM_BASE64('MjM0') | FROM_BASE64('SGVsbG8=') |
+---------------------+-------------------------+
| 234                 | Hello                   |
+---------------------+-------------------------+
```

3. NULL value handling
```sql
SELECT FROM_BASE64(NULL);
```
```text
+-------------------+
| FROM_BASE64(NULL) |
+-------------------+
| NULL              |
+-------------------+
```

4. Empty string handling
```sql
SELECT FROM_BASE64('');
```
```text
+-----------------+
| FROM_BASE64('') |
+-----------------+
|                 |
+-----------------+
```

5. Illegal character handling
```sql
SELECT FROM_BASE64('!!!'), FROM_BASE64('ABC@DEF');
```
```text
+--------------------+------------------------+
| FROM_BASE64('!!!') | FROM_BASE64('ABC@DEF') |
+--------------------+------------------------+
| NULL               | NULL                   |
+--------------------+------------------------+
```