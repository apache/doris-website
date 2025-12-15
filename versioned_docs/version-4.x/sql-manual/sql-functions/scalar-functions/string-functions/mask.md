---
{
    "title": "MASK",
    "language": "en"
}
---

## Description

The MASK function is used to mask data to protect sensitive information. The default behavior is to convert uppercase letters to `X`, lowercase letters to `x`, and digits to `n`.

## Syntax

```sql
MASK(<str>[, <upper>[, <lower>[, <number>]]])
```

## Parameters

| Parameter | Description |
| ---------- | ----------------------------------------- |
| `<str>` | The string to be masked. Type: VARCHAR |
| `<upper>` | Character to replace uppercase letters with, default is `X` (optional). Type: VARCHAR |
| `<lower>` | Character to replace lowercase letters with, default is `x` (optional). Type: VARCHAR |
| `<number>` | Character to replace digits with, default is `n` (optional). Type: VARCHAR |

## Return Value

Returns VARCHAR type, the string with letters and digits replaced.

Special cases:
- If any parameter is NULL, returns NULL
- Non-alphanumeric characters remain unchanged
- If replacement character parameters contain multiple characters, only the first character is used

## Examples

1. Basic usage: default replacement rules
```sql
SELECT mask('abc123XYZ');
```
```text
+-------------------+
| mask('abc123XYZ') |
+-------------------+
| xxxnnnXXX         |
+-------------------+
```

2. Custom replacement characters
```sql
SELECT mask('abc123XYZ', '*', '#', '$');
```
```text
+----------------------------------+
| mask('abc123XYZ', '*', '#', '$') |
+----------------------------------+
| ###$$$***                        |
+----------------------------------+
```

3. Special characters remain unchanged
```sql
SELECT mask('Hello-123!');
```
```text
+--------------------+
| mask('Hello-123!') |
+--------------------+
| Xxxxx-nnn!         |
+--------------------+
```

4. NULL value handling
```sql
SELECT mask(NULL);
```
```text
+------------+
| mask(NULL) |
+------------+
| NULL       |
+------------+
```

5. Digits-only string
```sql
SELECT mask('1234567890');
```
```text
+--------------------+
| mask('1234567890') |
+--------------------+
| nnnnnnnnnn         |
+--------------------+
```

6. Letters-only string
```sql
SELECT mask('AbCdEfGh');
```
```text
+------------------+
| mask('AbCdEfGh') |
+------------------+
| XxXxXxXx         |
+------------------+
```

7. Empty string handling
```sql
SELECT mask('');
```
```text
+----------+
| mask('') |
+----------+
|          |
+----------+
```

8. Single character replacement (takes first character from multiple)
```sql
SELECT mask('Test123', 'ABC', 'xyz', '999');
```
```text
+--------------------------------------+
| mask('Test123', 'ABC', 'xyz', '999') |
+--------------------------------------+
| Xxxx999                              |
+--------------------------------------+
```

9. Mask credit card number
```sql
SELECT mask('1234-5678-9012-3456');
```
```text
+-----------------------------+
| mask('1234-5678-9012-3456') |
+-----------------------------+
| nnnn-nnnn-nnnn-nnnn         |
+-----------------------------+
```

10. Mask email address
```sql
SELECT mask('user@example.com');
```
```text
+--------------------------+
| mask('user@example.com') |
+--------------------------+
| xxxx@xxxxxxx.xxx         |
+--------------------------+
```

```sql
SELECT mask('eeeéèêëìí1234');
```
```text
+-----------------------------+
| mask('eeeéèêëìí1234')       |
+-----------------------------+
| xxxéèêëìínnnn               |
+-----------------------------+
```
