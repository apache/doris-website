---
{
    "title": "MASK_LAST_N",
    "language": "en"
}
---

## Description

The MASK_LAST_N function is used to mask the last N bytes of a string. It replaces uppercase letters with `X`, lowercase letters with `x`, and digits with `n` in the last N bytes.

## Syntax

```sql
MASK_LAST_N(<str>[, <n>])
```

## Parameters

| Parameter | Description |
| ------- | ----------------------------------------- |
| `<str>` | The string to be masked. Type: VARCHAR |
| `<n>` | The number of last N bytes to mask (optional, defaults to entire string). Type: INT |

## Return Value

Returns VARCHAR type, the string with the last N bytes masked.

Special cases:
- If any parameter is NULL, returns NULL
- Non-alphanumeric characters remain unchanged
- If `<n>` is greater than string length, masks the entire string

## Examples

1. Basic usage: mask last 4 bytes
```sql
SELECT mask_last_n('1234-5678', 4);
```
```text
+-----------------------------+
| mask_last_n('1234-5678', 4) |
+-----------------------------+
| 1234-nnnn                   |
+-----------------------------+
```

2. Without specifying n (masks entire string)
```sql
SELECT mask_last_n('abc123');
```
```text
+----------------------+
| mask_last_n('abc123') |
+----------------------+
| xxxnnn               |
+----------------------+
```

3. n exceeds string length
```sql
SELECT mask_last_n('Hello', 100);
```
```text
+---------------------------+
| mask_last_n('Hello', 100) |
+---------------------------+
| Xxxxx                     |
+---------------------------+
```

4. NULL value handling
```sql
SELECT mask_last_n(NULL, 5);
```
```text
+----------------------+
| mask_last_n(NULL, 5) |
+----------------------+
| NULL                 |
+----------------------+
```

5. n is 0 (masks no characters)
```sql
SELECT mask_last_n('Hello123', 0);
```
```text
+----------------------------+
| mask_last_n('Hello123', 0) |
+----------------------------+
| Hello123                   |
+----------------------------+
```

6. n greater than string length (masks entire string)
```sql
SELECT mask_last_n('Test', 100);
```
```text
+--------------------------+
| mask_last_n('Test', 100) |
+--------------------------+
| Xxxx                     |
+--------------------------+
```

7. Mask email domain part
```sql
SELECT mask_last_n('user@example.com', 11);
```
```text
+-------------------------------------+
| mask_last_n('user@example.com', 11) |
+-------------------------------------+
| user@xxxxxxx.xxx                    |
+-------------------------------------+
```

8. Mask last 4 digits of phone number
```sql
SELECT mask_last_n('13812345678', 4);
```
```text
+-------------------------------+
| mask_last_n('13812345678', 4) |
+-------------------------------+
| 1381234nnnn                   |
+-------------------------------+
```

9. Mixed letters, digits and special characters
```sql
SELECT mask_last_n('ABC-123-xyz', 7);
```
```text
+--------------------------------+
| mask_last_n('ABC-123-xyz', 7)  |
+--------------------------------+
| ABC-nnn-xxx                    |
+--------------------------------+
```

10. UTF-8 character handling (masks by byte)
```sql
SELECT mask_last_n('Helloṭṛ123', 9);
```
```text
+--------------------------------+
| mask_last_n('Hello你好123', 9) |
+--------------------------------+
| Hello你好nnn                   |
+--------------------------------+
```

```sql
SELECT mask_last_n('eeeéèêëìí1234');
```
```text
+------------------------------------+
| mask_last_n('eeeéèêëìí1234')       |
+------------------------------------+
| xxxéèêëìínnnn                      |
+------------------------------------+
```
