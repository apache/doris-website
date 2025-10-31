---
{
    "title": "MASK_FIRST_N",
    "language": "en"
}
---

## Description

The MASK_FIRST_N function is mainly used to mask the first N bytes of data to protect sensitive information, and is commonly used in data anonymization scenarios. Its behavior is to replace a uppercase letter with `X`, a lowercase letter with `x`, and a number with `n` in the first N bytes.

## Syntax

```sql
MASK_FIRST_N( <str> [, <n> ])
```

## Parameters

| Parameter | Description                                                                                            |
|-----------|--------------------------------------------------------------------------------------------------------|
| `<str>`   | String that need to be masked                                                                          |
| `<n>`     | Optional Parameter, limit data masking to only the first N bytes, default to masking the entire string |

## Return Value

Returns a string after masking uppercase character, lowercase character and lnumeric character in first N bytes. Special cases:

- If any Parameter is NULL, NULL will be returned.
- Non-alphabetic and non-numeric characters will do not masking
- Only ASCII letters are supported for replacement, non-ASCII letters (such as accented Latin letters) will be preserved as is

## Examples

```sql
select mask_first_n("1234-5678-8765-4321", 4);
```

```text
+----------------------------------------+
| mask_first_n('1234-5678-8765-4321', 4) |
+----------------------------------------+
| nnnn-5678-8765-4321                    |
+----------------------------------------+
```

```sql
select mask_first_n("1234-5678-8765-4321", null);
```

```text
+-------------------------------------------+
| mask_first_n('1234-5678-8765-4321', NULL) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```

```sql
select mask_first_n('eeeéèêëìí1234');
```

```text
+-------------------------------------+
| mask_first_n('eeeéèêëìí1234')       |
+-------------------------------------+
| xxxéèêëìínnnn                       |
+-------------------------------------+
```
