---
{
"title": "SUBSTRING_INDEX",
"language": "en"
}
---

## Description

The SUBSTRING_INDEX function is used to extract a portion of a string based on a specified delimiter. By specifying the number of delimiter occurrences, extraction can be performed from either the left or right side.

## Syntax

```sql
SUBSTRING_INDEX(<content>, <delimiter>, <field>)
```

## Parameters
| Parameter | Description |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| `<content>` | The source string to extract from. Type: VARCHAR |
| `<delimiter>` | The delimiter string, case-sensitive and supports multi-byte characters. Type: VARCHAR |
| `<field>` | Number of delimiter occurrences. Positive counts from left, negative counts from right, 0 returns empty string. Type: INT |

## Return Value

Returns VARCHAR type, representing the extracted substring.

Extraction rules:
- When field > 0: returns content before the field-th delimiter from the left
- When field < 0: returns content after the |field|-th delimiter from the right
- When field = 0: returns empty string (returns NULL when content is NULL)
- Case-sensitive exact delimiter matching

Special cases:
- If any parameter is NULL, returns NULL
- If delimiter doesn't exist in string, returns original string
- If specified count exceeds actual delimiter occurrences, returns maximum extractable portion
- If delimiter is empty string, returns empty string
- If source string is empty, returns empty string

## Examples

1. Basic left extraction
```sql
SELECT SUBSTRING_INDEX('hello world', ' ', 1), SUBSTRING_INDEX('one,two,three', ',', 2);
```
```text
+----------------------------------------+------------------------------------------+
| SUBSTRING_INDEX('hello world', ' ', 1) | SUBSTRING_INDEX('one,two,three', ',', 2) |
+----------------------------------------+------------------------------------------+
| hello                                  | one,two                                  |
+----------------------------------------+------------------------------------------+
```

2. Right extraction (negative count)
```sql
SELECT SUBSTRING_INDEX('hello world', ' ', -1), SUBSTRING_INDEX('one,two,three', ',', -1);
```
```text
+-----------------------------------------+-------------------------------------------+
| SUBSTRING_INDEX('hello world', ' ', -1) | SUBSTRING_INDEX('one,two,three', ',', -1) |
+-----------------------------------------+-------------------------------------------+
| world                                   | three                                     |
+-----------------------------------------+-------------------------------------------+
```

3. NULL value handling
```sql
SELECT SUBSTRING_INDEX(NULL, ',', 1), SUBSTRING_INDEX('test', NULL, 1);
```
```text
+--------------------------------+------------------------------------+
| SUBSTRING_INDEX(NULL, ',', 1)  | SUBSTRING_INDEX('test', NULL, 1)   |
+--------------------------------+------------------------------------+
| NULL                           | NULL                               |
+--------------------------------+------------------------------------+
```

4. Zero count handling
```sql
SELECT SUBSTRING_INDEX('hello world', ' ', 0), SUBSTRING_INDEX('a,b,c', ',', 0);
```
```text
+----------------------------------------+----------------------------------+
| SUBSTRING_INDEX('hello world', ' ', 0) | SUBSTRING_INDEX('a,b,c', ',', 0) |
+----------------------------------------+----------------------------------+
|                                        |                                  |
+----------------------------------------+----------------------------------+
```

5. Delimiter doesn't exist
```sql
SELECT SUBSTRING_INDEX('hello world', ',', 1), SUBSTRING_INDEX('no-delimiter', '|', -1);
```
```text
+----------------------------------------+------------------------------------------+
| SUBSTRING_INDEX('hello world', ',', 1) | SUBSTRING_INDEX('no-delimiter', '|', -1) |
+----------------------------------------+------------------------------------------+
| hello world                            | no-delimiter                             |
+----------------------------------------+------------------------------------------+
```

6. Count exceeds delimiter occurrences
```sql
SELECT SUBSTRING_INDEX('a,b,c', ',', 5), SUBSTRING_INDEX('a,b,c', ',', -5);
```
```text
+----------------------------------+-----------------------------------+
| SUBSTRING_INDEX('a,b,c', ',', 5) | SUBSTRING_INDEX('a,b,c', ',', -5) |
+----------------------------------+-----------------------------------+
| a,b,c                            | a,b,c                             |
+----------------------------------+-----------------------------------+
```

7. UTF-8 multi-byte character delimiter
```sql
SELECT SUBSTRING_INDEX('ṭṛì→ḍḍumai→hello', '→', 1), SUBSTRING_INDEX('ṭṛì→ḍḍumai→hello', '→', -1);
```
```text
+-----------------------------------------------+------------------------------------------------+
| SUBSTRING_INDEX('ṭṛì→ḍḍumai→hello', '→', 1)   | SUBSTRING_INDEX('ṭṛì→ḍḍumai→hello', '→', -1)  |
+-----------------------------------------------+------------------------------------------------+
| ṭṛì                                           | hello                                          |
+-----------------------------------------------+------------------------------------------------+
```

8. Multi-character delimiter
```sql
SELECT SUBSTRING_INDEX('data::field::value', '::', 2), SUBSTRING_INDEX('data::field::value', '::', -1);
```
```text
+---------------------------------------------+----------------------------------------------+
| SUBSTRING_INDEX('data::field::value', '::', 2) | SUBSTRING_INDEX('data::field::value', '::', -1) |
+---------------------------------------------+----------------------------------------------+
| data::field                                 | value                                        |
+---------------------------------------------+----------------------------------------------+
```

9. Empty source string
```sql
SELECT SUBSTRING_INDEX('', ' ', 1);
```
```text
+-----------------------------+
| SUBSTRING_INDEX('', ' ', 1) |
+-----------------------------+
|                             |
+-----------------------------+
```

### Keywords

    SUBSTRING_INDEX, SUBSTRING