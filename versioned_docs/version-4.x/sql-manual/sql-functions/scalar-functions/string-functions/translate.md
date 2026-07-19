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
SELECT TRANSLATE('abcd', 'a', 'z');
```
```text
+-----------------------------+
| TRANSLATE('abcd', 'a', 'z') |
+-----------------------------+
| zbcd                        |
+-----------------------------+
```

2. Every occurrence of a source character is replaced
```sql
SELECT TRANSLATE('abcda', 'a', 'z');
```
```text
+------------------------------+
| TRANSLATE('abcda', 'a', 'z') |
+------------------------------+
| zbcdz                        |
+------------------------------+
```

3. Multi-character mapping (positional)
```sql
SELECT TRANSLATE('abcd', 'ac', 'zx');
```
```text
+-------------------------------+
| TRANSLATE('abcd', 'ac', 'zx') |
+-------------------------------+
| zbxd                          |
+-------------------------------+
```

4. Duplicate characters in `<from>` (only the first mapping is used)
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

5. `<to>` shorter than `<from>` (excess characters are deleted)
```sql
SELECT TRANSLATE('abcde', 'ace', 'xy');
```
```text
+---------------------------------+
| TRANSLATE('abcde', 'ace', 'xy') |
+---------------------------------+
| xbyd                            |
+---------------------------------+
```

6. NULL handling — any NULL argument returns NULL
```sql
SELECT TRANSLATE(NULL, 'a', 'z'), TRANSLATE('abc', NULL, 'z'), TRANSLATE('abc', 'a', NULL);
```
```text
+---------------------------+-----------------------------+-----------------------------+
| TRANSLATE(NULL, 'a', 'z') | TRANSLATE('abc', NULL, 'z') | TRANSLATE('abc', 'a', NULL) |
+---------------------------+-----------------------------+-----------------------------+
| NULL                      | NULL                        | NULL                        |
+---------------------------+-----------------------------+-----------------------------+
```

7. Empty-string edge cases — empty source returns empty, empty `<from>` returns source unchanged, empty `<to>` deletes the matching characters
```sql
SELECT TRANSLATE('', 'a', 'z'), TRANSLATE('abc', '', 'z'), TRANSLATE('abc', 'a', '');
```
```text
+-------------------------+---------------------------+---------------------------+
| TRANSLATE('', 'a', 'z') | TRANSLATE('abc', '', 'z') | TRANSLATE('abc', 'a', '') |
+-------------------------+---------------------------+---------------------------+
|                         | abc                       | bc                        |
+-------------------------+---------------------------+---------------------------+
```

8. UTF-8 multi-byte characters
```sql
SELECT TRANSLATE('ṭṛì ḍḍumai', 'ṭṛ', 'ab');
```
```text
+--------------------------------------------------+
| TRANSLATE('ṭṛì ḍḍumai', 'ṭṛ', 'ab')              |
+--------------------------------------------------+
| abì ḍḍumai                                       |
+--------------------------------------------------+
```

9. Numeric character replacement
```sql
SELECT TRANSLATE('a1b2c3', '123', 'xyz');
```
```text
+-----------------------------------+
| TRANSLATE('a1b2c3', '123', 'xyz') |
+-----------------------------------+
| axbycz                            |
+-----------------------------------+
```

10. Repeated mapping with duplicates on both sides
```sql
SELECT TRANSLATE('aabbccaa', 'abab', 'xyuv');
```
```text
+---------------------------------------+
| TRANSLATE('aabbccaa', 'abab', 'xyuv') |
+---------------------------------------+
| xxyyccxx                              |
+---------------------------------------+
```

11. Special-symbol replacement
```sql
SELECT TRANSLATE('hello@world.com', '@.', '-_');
```
```text
+------------------------------------------+
| TRANSLATE('hello@world.com', '@.', '-_') |
+------------------------------------------+
| hello-world_com                          |
+------------------------------------------+
```

### Keywords

    TRANSLATE