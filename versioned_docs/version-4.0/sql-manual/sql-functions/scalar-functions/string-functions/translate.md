---
{
    "title": "TRANSLATE",
    "language": "en"
}
---

## Description

The TRANSLATE function is used for string replacement, converting characters in the source string according to mapping rules. It replaces characters in the source string that appear in the 'from' string with corresponding characters in the 'to' string.

## Syntax

```sql
TRANSLATE(<source>, <from>, <to>)
```

## Parameters
| Parameter | Description                                         |
| --------- | --------------------------------------------------- |
| `<source>` | The source string to be converted. Type: VARCHAR    |
| `<from>` | The set of characters to be replaced. Type: VARCHAR |
| `<to>` | The set of replacement characters. Type: VARCHAR    |

## Return Value

Returns VARCHAR type, representing the transformed string.

Special cases:
- Returns NULL if any parameter is NULL
- If there are duplicate characters in the 'from' string, only the first occurrence is used
- If a source character is not in the 'from' string, it remains unchanged
- If a character's position in the 'from' string exceeds the length of the 'to' string, the corresponding source character will be deleted
- If both 'from' and 'to' are empty strings, returns the original string

## Examples

1. Basic character replacement
```sql
SELECT translate('abcd', 'a', 'z');
```
```text
+---------------------------+
| translate('abcd', 'a', 'z') |
+---------------------------+
| zbcd                      |
+---------------------------+
```

2. Multiple replacements of the same character
```sql
SELECT translate('abcda', 'a', 'z');
```
```text
+----------------------------+
| translate('abcda', 'a', 'z') |
+----------------------------+
| zbcdz                      |
+----------------------------+
```

3. Special character replacement
```sql
SELECT translate('Palhoça', 'ç', 'c');
```
```text
+--------------------------------+
| translate('Palhoça', 'ç', 'c') |
+--------------------------------+
| Palhoca                        |
+--------------------------------+
```

4. Character deletion (empty 'to' string)
```sql
SELECT translate('abcd', 'a', '');
```
```text
+----------------------------+
| translate('abcd', 'a', '') |
+----------------------------+
| bcd                        |
+----------------------------+
```

5. Duplicate characters in 'from' string
```sql
SELECT translate('abcd', 'aac', 'zq');
```
```text
+--------------------------------+
| translate('abcd', 'aac', 'zq') |
+--------------------------------+
| zbd                            |
+--------------------------------+
```