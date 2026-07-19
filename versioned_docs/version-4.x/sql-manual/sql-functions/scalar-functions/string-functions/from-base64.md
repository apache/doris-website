---
{
    "title": "FROM_BASE64",
    "language": "en",
    "description": "The FROMBASE64 function decodes a Base64-encoded string back to its original string."
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

6. Longer payloads
```sql
SELECT FROM_BASE64('SGVsbG8gV29ybGQ='), FROM_BASE64('VGhlIHF1aWNrIGJyb3duIGZveA==');
```
```text
+---------------------------------+---------------------------------------------+
| FROM_BASE64('SGVsbG8gV29ybGQ=') | FROM_BASE64('VGhlIHF1aWNrIGJyb3duIGZveA==') |
+---------------------------------+---------------------------------------------+
| Hello World                     | The quick brown fox                         |
+---------------------------------+---------------------------------------------+
```

7. UTF-8 multi-byte payloads
```sql
SELECT FROM_BASE64('4bmt4bmbw6w='), FROM_BASE64('4biN4biNdW1haSBoZWxsbw==');
```
```text
+-----------------------------+-----------------------------------------+
| FROM_BASE64('4bmt4bmbw6w=') | FROM_BASE64('4biN4biNdW1haSBoZWxsbw==') |
+-----------------------------+-----------------------------------------+
| ṭṛì                         | ḍḍumai hello                            |
+-----------------------------+-----------------------------------------+
```

8. Email addresses
```sql
SELECT FROM_BASE64('dXNlckBleGFtcGxlLmNvbQ=='), FROM_BASE64('YWRtaW4udGVzdEBjb21wYW55Lm9yZw==');
```
```text
+-----------------------------------------+-------------------------------------------------+
| FROM_BASE64('dXNlckBleGFtcGxlLmNvbQ==') | FROM_BASE64('YWRtaW4udGVzdEBjb21wYW55Lm9yZw==') |
+-----------------------------------------+-------------------------------------------------+
| user@example.com                        | admin.test@company.org                          |
+-----------------------------------------+-------------------------------------------------+
```

9. JSON payloads
```sql
SELECT FROM_BASE64('eyJuYW1lIjoiSm9obiIsImFnZSI6MzB9'), FROM_BASE64('WzEsMiwzLDQsNV0=');
```
```text
+-------------------------------------------------+---------------------------------+
| FROM_BASE64('eyJuYW1lIjoiSm9obiIsImFnZSI6MzB9') | FROM_BASE64('WzEsMiwzLDQsNV0=') |
+-------------------------------------------------+---------------------------------+
| {"name":"John","age":30}                        | [1,2,3,4,5]                     |
+-------------------------------------------------+---------------------------------+
```

10. Round-trip with `TO_BASE64`
```sql
SELECT FROM_BASE64(TO_BASE64('Hello')), FROM_BASE64(TO_BASE64('测试'));
```
```text
+---------------------------------+----------------------------------+
| FROM_BASE64(TO_BASE64('Hello')) | FROM_BASE64(TO_BASE64('测试'))   |
+---------------------------------+----------------------------------+
| Hello                           | 测试                             |
+---------------------------------+----------------------------------+
```