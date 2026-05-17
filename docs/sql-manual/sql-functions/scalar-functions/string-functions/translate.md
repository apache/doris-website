---
{
    "title": "TRANSLATE",
    "language": "en",
    "description": "The TRANSLATE function performs character-by-character string replacement, converting characters in the source string according to mapping rules."
}
---

## Description

The TRANSLATE function performs character-by-character string replacement, converting characters in the source string according to mapping rules. This function replaces each character in the source string that appears in the 'from' string with the corresponding character at the same position in the 'to' string.

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

Returns VARCHAR type, representing the string transformed according to character mapping rules.

Character mapping rules:
- Establishes one-to-one character mapping based on positions in 'from' and 'to' strings
- 1st character in 'from' maps to 1st character in 'to', 2nd to 2nd, and so on
- If 'from' contains duplicate characters, uses the first occurrence's mapping and ignores subsequent duplicates
- Characters in source string not in 'from' string remain unchanged

Special cases:
- Returns NULL if any parameter is NULL
- Returns empty string if source is empty string
- Returns original source string if 'from' is empty string
- Deletes all characters from source that appear in 'from' if 'to' is empty string
- If 'to' string is shorter than 'from', characters in source corresponding to excess 'from' characters are deleted

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

5. Duplicate characters in 'from' string (uses first mapping only)
```sql
SELECT TRANSLATE('abacad', 'aac', 'zxy');
```
```text
+-----------------------------------+
| TRANSLATE('abacad', 'aac', 'zxy') |
+-----------------------------------+
| zbzyzd                            |
+-----------------------------------+
```

6. 'to' string shorter than 'from' (deletes excess characters)
```sql
SELECT TRANSLATE('abcde', 'ace', 'xy');
```
```text
+-------------------------------+
| TRANSLATE('abcde', 'ace', 'xy') |
+-------------------------------+
| xbyd                          |
+-------------------------------+
```

7. UTF-8 character replacement
```sql
SELECT TRANSLATE('ṭṛì ḍḍumai', 'ṭṛ', 'ab');
```
```text
+-----------------------------------+
| TRANSLATE('ṭṛì ḍḍumai', 'ṭṛ', 'ab') |
+-----------------------------------+
| abì ḍḍumai                        |
+-----------------------------------+
```

8. Numeric character replacement
```sql
SELECT TRANSLATE('a1b2c3', '123', 'xyz');
```
```text
+----------------------------------+
| TRANSLATE('a1b2c3', '123', 'xyz') |
+----------------------------------+
| axbycz                           |
+----------------------------------+
```

9. Special symbol replacement
```sql
SELECT TRANSLATE('hello@world.com', '@.', '-_');
```
```text
+--------------------------------------------+
| TRANSLATE('hello@world.com', '@.', '-_')   |
+--------------------------------------------+
| hello-world_com                            |
+--------------------------------------------+
```

### Keywords

    TRANSLATE