---
{
    "title": "TO_BASE64",
    "language": "en"
}
---

## Description

The TO_BASE64 function converts an input string to Base64 encoded format. Base64 is an encoding method based on 64 printable characters, commonly used to transmit data in protocols that don't support binary data, such as email, URL parameters, JSON, etc. This function follows the RFC 4648 standard, using the standard Base64 character set (A-Z, a-z, 0-9, +, /) and padding character (=).

## Syntax

```sql
TO_BASE64(<str>)
```

## Parameters
| Parameter | Description |
| --------- | ---------------------------------------------- |
| `<str>` | The string to be Base64 encoded. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the Base64 encoded string.

Encoding rules:
- Uses standard Base64 character set: A-Z, a-z, 0-9, +, /
- Uses = as padding character, ensuring output length is a multiple of 4
- Supports correct encoding of UTF-8 multi-byte characters
- Output string contains only ASCII printable characters

Special cases:
- If input is NULL, returns NULL
- If input is empty string, returns empty string
- Automatically handles UTF-8 character encoding
- Output length is always 4/3 times the input byte count (rounded up to multiple of 4)

## Examples

1. Basic character encoding
```sql
SELECT TO_BASE64('1'), TO_BASE64('A');
```
```text
+----------------+----------------+
| TO_BASE64('1') | TO_BASE64('A') |
+----------------+----------------+
| MQ==           | QQ==           |
+----------------+----------------+
```

2. Multi-character string encoding
```sql
SELECT TO_BASE64('234'), TO_BASE64('Hello');
```
```text
+------------------+--------------------+
| TO_BASE64('234') | TO_BASE64('Hello') |
+------------------+--------------------+
| MjM0             | SGVsbG8=           |
+------------------+--------------------+
```

3. NULL and empty string handling
```sql
SELECT TO_BASE64(NULL), TO_BASE64('');
```
```text
+-----------------+---------------+
| TO_BASE64(NULL) | TO_BASE64('') |
+-----------------+---------------+
| NULL            |               |
+-----------------+---------------+
```

4. Long string encoding
```sql
SELECT TO_BASE64('Hello World'), TO_BASE64('The quick brown fox');
```
```text
+-------------------------+-------------------------------+
| TO_BASE64('Hello World') | TO_BASE64('The quick brown fox') |
+-------------------------+-------------------------------+
| SGVsbG8gV29ybGQ=        | VGhlIHF1aWNrIGJyb3duIGZveA==  |
+-------------------------+-------------------------------+
```

5. Numbers and special characters
```sql
SELECT TO_BASE64('123456'), TO_BASE64('!@#$%^&*()');
```
```text
+---------------------+------------------------+
| TO_BASE64('123456') | TO_BASE64('!@#$%^&*()') |
+---------------------+------------------------+
| MTIzNDU2            | IUAjJCVeJiooKQ==       |
+---------------------+------------------------+
```

6. UTF-8 multi-byte characters
```sql
SELECT TO_BASE64('ṭṛì'), TO_BASE64('ḍḍumai hello');
```
```text
+-------------------+---------------------------+
| TO_BASE64('ṭṛì')  | TO_BASE64('ḍḍumai hello') |
+-------------------+---------------------------+
| 4bmt4bmb4bmA      | 4bmN4bmNdW1haSBoZWxsbw==  |
+-------------------+---------------------------+
```

7. Email address encoding
```sql
SELECT TO_BASE64('user@example.com'), TO_BASE64('admin.test@company.org');
```
```text
+------------------------------+-----------------------------------+
| TO_BASE64('user@example.com') | TO_BASE64('admin.test@company.org') |
+------------------------------+-----------------------------------+
| dXNlckBleGFtcGxlLmNvbQ==     | YWRtaW4udGVzdEBjb21wYW55Lm9yZw== |
+------------------------------+-----------------------------------+
```

8. JSON data encoding
```sql
SELECT TO_BASE64('{"name":"John","age":30}'), TO_BASE64('[1,2,3,4,5]');
```
```text
+--------------------------------------+----------------------+
| TO_BASE64('{"name":"John","age":30}') | TO_BASE64('[1,2,3,4,5]') |
+--------------------------------------+----------------------+
| eyJuYW1lIjoiSm9obiIsImFnZSI6MzB9     | WzEsMiwzLDQsNV0=     |
+--------------------------------------+----------------------+
```

9. Different length strings and padding
```sql
SELECT TO_BASE64('a'), TO_BASE64('ab'), TO_BASE64('abc');
```
```text
+----------------+-----------------+------------------+
| TO_BASE64('a') | TO_BASE64('ab') | TO_BASE64('abc') |
+----------------+-----------------+------------------+
| YQ==           | YWI=            | YWJj             |
+----------------+-----------------+------------------+
```

### Keywords

    TO_BASE64, BASE64