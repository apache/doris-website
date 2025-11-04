---
{
    "title": "MASK",
    "language": "en"
}
---

## Description

The MASK function is to shield data to protect sensitive information, and it is commonly used in data anonymization scenarios. Its default behavior is to convert a uppercase letter in the input string to `X`, a lowercase letter to `x`, and a number to `n`. 

## Syntax

```sql
MASK(<str> [, <upper> [, <lower> [, <number> ]]])
```

## Parameters

| Parameter  | Description                                                                                                                                                                                                       |
|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>`    | String that need to be masked                                                                                                                                                                                     |
| `<upper>`  | Optional Parameter, replaces uppercase character to `X` by default. If a sequence of characters are input, the first character will be taken, and if non ASCII characters are input, the first byte will be taken |
| `<lower>`  | Optional Parameter, replaces lowercase character to `x` by default. If a sequence of characters are input, the first character will be taken, and if non ASCII characters are input, the first byte will be taken |
| `<number>` | Optional Parameter, replaces numeric character to `n` by default. If a sequence of characters are input, the first character will be taken, and if non ASCII characters are input, the first byte will be taken   |

## Return Value

Returns a string after masking uppercase character, lowercase character and lnumeric character. Special cases:

- If any Parameter is NULL, NULL will be returned.
- Non-alphabetic and non-numeric characters will do not masking
- Only ASCII letters are supported for replacement, non-ASCII letters (such as accented Latin letters) will be preserved as is

## Examples

```sql
select mask('abc123EFG');
```

```text
+-------------------+
| mask('abc123EFG') |
+-------------------+
| xxxnnnXXX         |
+-------------------+
```

```sql
select mask(null);
```

```text
+------------+
| mask(NULL) |
+------------+
| NULL       |
+------------+
```

```sql
select mask('abc123EFG', '*', '#', '$');
```

```text
+----------------------------------+
| mask('abc123EFG', '*', '#', '$') |
+----------------------------------+
| ###$$$***                        |
+----------------------------------+
```

```sql
select mask('eeeéèêëìí1234');
```

```text
+-----------------------------+
| mask('eeeéèêëìí1234')       |
+-----------------------------+
| xxxéèêëìínnnn               |
+-----------------------------+
```
