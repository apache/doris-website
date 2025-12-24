---
{
    "title": "DIGITAL_MASKING",
    "language": "en",
    "description": "The DIGITALMASKING function performs masking on numeric strings by replacing the middle part with in a fixed format,"
}
---

## Description

The DIGITAL_MASKING function performs masking on numeric strings by replacing the middle part with `****` in a fixed format, keeping the first 3 digits and last 4 digits. Equivalent to `CONCAT(LEFT(id, 3), '****', RIGHT(id, 4))`.

## Syntax

```sql
DIGITAL_MASKING(<digital_number>)
```

## Parameters

| Parameter | Description |
| ------------------ | ----------------------------------------- |
| `<digital_number>` | The numeric string to be masked. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the masked numeric string.

Special cases:
- If the parameter is NULL, returns NULL
- Masking format: first 3 digits + `****` + last 4 digits
- When string length is less than 7 digits, the result may overlap

## Examples

1. Basic usage: Mask an 11-digit phone number
```sql
SELECT digital_masking('13812345678');
```
```text
+--------------------------------+
| digital_masking('13812345678') |
+--------------------------------+
| 138****5678                    |
+--------------------------------+
```

2. Numbers of different lengths
```sql
SELECT digital_masking('1234567890');
```
```text
+-------------------------------+
| digital_masking('1234567890') |
+-------------------------------+
| 123****7890                   |
+-------------------------------+
```

3. Short number (less than 7 digits)
```sql
SELECT digital_masking('123');
```
```text
+------------------------+
| digital_masking('123') |
+------------------------+
| 123****123             |
+------------------------+
```

4. NULL value handling
```sql
SELECT digital_masking(NULL);
```
```text
+-----------------------+
| digital_masking(NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```

5. String with UTF-8 characters
```sql
SELECT digital_masking('13812ṭṛ34678');
```
```text
+-------------------------------------+
| digital_masking('13812ṭṛ34678')     |
+-------------------------------------+
| 138****4678                         |
+-------------------------------------+
```
