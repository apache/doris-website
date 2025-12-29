---
{
    "title": "MASK_LAST_N",
    "language": "en",
    "description": "The MASKLASTN function is mainly used to mask the last N bytes of data to protect sensitive information,"
}
---

## Description

The MASK_LAST_N function is mainly used to mask the last N bytes of data to protect sensitive information, and is commonly used in data anonymization scenarios. Its behavior is to replace a uppercase letter with `X`, a lowercase letter with `x`, and a number with `n` in the first N bytes.

## Syntax

```sql
MASK_LAST_N( <str> [, <n> ])
```

## Parameters

| Parameter | Description                                                                                           |
|-----------|-------------------------------------------------------------------------------------------------------|
| `<str>`   | String that need to be masked                                                                         |
| `<n>`     | Optional Parameter, limit data masking to only the last N bytes, default to masking the entire string |

## Return Value

Returns a string after masking uppercase character, lowercase character and lnumeric character in last N bytes. Special cases:

- If any Parameter is NULL, NULL will be returned.
- Non-alphabetic and non-numeric characters will do not masking

## Examples

```sql
select mask_last_n("1234-5678-8765-4321", 4);
```

```text
+---------------------------------------+
| mask_last_n('1234-5678-8765-4321', 4) |
+---------------------------------------+
| 1234-5678-8765-nnnn                   |
+---------------------------------------+
```

```sql
select mask_last_n("1234-5678-8765-4321", null);
```

```text
+-------------------------------------------+
| mask_last_n('1234-5678-8765-4321', NULL) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```
