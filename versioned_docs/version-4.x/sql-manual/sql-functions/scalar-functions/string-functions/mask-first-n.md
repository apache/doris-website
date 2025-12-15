---
{
    "title": "MASK_FIRST_N",
    "language": "en"
}
---

## Description

The MASK_FIRST_N function is used to mask the first N bytes of a string. It replaces uppercase letters with `X`, lowercase letters with `x`, and digits with `n` in the first N bytes.

## Syntax

```sql
MASK_FIRST_N(<str>[, <n>])
```

## Parameters

| Parameter | Description |
| ------- | ----------------------------------------- |
| `<str>` | The string to be masked. Type: VARCHAR |
| `<n>` | The number of first N bytes to mask (optional, defaults to entire string). Type: INT |

## Return Value

Returns VARCHAR type, the string with the first N bytes masked.

Special cases:
- If any parameter is NULL, returns NULL
- Non-alphanumeric characters remain unchanged
- If `<n>` is greater than string length, masks the entire string

## Examples

1. Basic usage: mask first 4 bytes
```sql
SELECT mask_first_n('1234-5678', 4);
```
```text
+------------------------------+
| mask_first_n('1234-5678', 4) |
+------------------------------+
| nnnn-5678                    |
+------------------------------+
```

2. Without specifying n (masks entire string)
```sql
SELECT mask_first_n('abc123');
```
```text
+-----------------------+
| mask_first_n('abc123') |
+-----------------------+
| xxxnnn                |
+-----------------------+
```

3. n exceeds string length
```sql
SELECT mask_first_n('Hello', 100);
```
```text
+----------------------------+
| mask_first_n('Hello', 100) |
+----------------------------+
| Xxxxx                      |
+----------------------------+
```

4. NULL value handling
```sql
SELECT mask_first_n(NULL, 5);
```
```text
+-----------------------+
| mask_first_n(NULL, 5) |
+-----------------------+
| NULL                  |
+-----------------------+
```

5. n is 0 (masks no characters)
```sql
SELECT mask_first_n('Hello123', 0);
```
```text
+-----------------------------+
| mask_first_n('Hello123', 0) |
+-----------------------------+
| Hello123                    |
+-----------------------------+
```

6. n greater than string length (masks entire string)
```sql
SELECT mask_first_n('Test', 100);
```
```text
+---------------------------+
| mask_first_n('Test', 100) |
+---------------------------+
| Xxxx                      |
+---------------------------+
```

7. Mask email address prefix
```sql
SELECT mask_first_n('user@example.com', 6);
```
```text
+-------------------------------------+
| mask_first_n('user@example.com', 6) |
+-------------------------------------+
| xxxx@xxample.com                    |
+-------------------------------------+
```

8. Mask first 3 digits of phone number
```sql
SELECT mask_first_n('13812345678', 3);
```
```text
+--------------------------------+
| mask_first_n('13812345678', 3) |
+--------------------------------+
| nnn12345678                    |
+--------------------------------+
```

9. Mixed letters, digits and special characters
```sql
SELECT mask_first_n('Abc-123-XYZ', 7);
```
```text
+---------------------------------+
| mask_first_n('Abc-123-XYZ', 7)  |
+---------------------------------+
| Xxx-nnn-XYZ                     |
+---------------------------------+
```

10. UTF-8 character handling (masks by byte)
```sql
SELECT mask_first_n('ṭṛWorld123', 7);
```
```text
+-----------------------------------+
| mask_first_n('ṭṛWorld123', 7)     |
+-----------------------------------+
| ṭṛXorld123                        |
+-----------------------------------+
```

```sql
SELECT mask_first_n('eeeéèêëìí1234');
```
```text
+-------------------------------------+
| mask_first_n('eeeéèêëìí1234')       |
+-------------------------------------+
| xxxéèêëìínnnn                       |
+-------------------------------------+
```
