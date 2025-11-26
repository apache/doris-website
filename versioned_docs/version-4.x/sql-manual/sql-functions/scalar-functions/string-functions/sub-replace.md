---
{
"title": "SUB_REPLACE",
"language": "en"
}
---

## Description

The `sub_replace` function is used to replace substrings within a string. You can specify the substring to be replaced and the target string to replace it with. It returns a new string where the substring starting from `start` with length `len` in `str` is replaced by `new_str`. If `start` or `len` is a negative integer, it returns NULL. The default value for `len` is the length of `new_str`.

## Syntax

```sql
sub_replace(<str>, <new_str>, [ ,<start> [ , <len> ] ])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The target string in which the replacement will occur |
| `<new_str>` | The string that will replace the specified substring |
| `<start>` | `start` is the position where the replacement operation begins, indicating from which position in the string the replacement will start |
| `<len>` | `len` is an optional parameter that specifies the length of the substring to be replaced |

## Return Value

Returns the string after replacement.

## Examples

1. Basic usage: specify position and length replacement
```sql
SELECT sub_replace('doris', '***', 1, 2);
```
```text
+-----------------------------------+
| sub_replace('doris', '***', 1, 2) |
+-----------------------------------+
| d***is                            |
+-----------------------------------+
```

2. Using default length replacement
```sql
SELECT sub_replace('hello', 'Hi', 0);
```
```text
+--------------------------------+
| sub_replace('hello', 'Hi', 0)  |
+--------------------------------+
| Hillo                          |
+--------------------------------+
```

3. Negative parameter returns NULL
```sql
SELECT sub_replace('hello', 'Hi', -1, 2);
```
```text
+------------------------------------+
| sub_replace('hello', 'Hi', -1, 2)  |
+------------------------------------+
| NULL                               |
+------------------------------------+
```

4. NULL value handling
```sql
SELECT sub_replace(NULL, 'new', 0, 3);
```
```text
+-------------------------------------+
| sub_replace(NULL, 'new', 0, 3)      |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

5. UTF-8 string
```sql
SELECT sub_replace('doris', 'ṛìḍḍ', 1, 2);
```
```text
+-------------------------------------------+
| sub_replace('doris', 'ṛìḍḍ', 1, 2)        |
+-------------------------------------------+
| dṛìḍḍis                                   |
+-------------------------------------------+
```

6. Start position exceeds string length
```sql
SELECT sub_replace('hello', 'Hi', 9, 2);
```
```text
+----------------------------------+
| sub_replace('hello', 'Hi', 9, 2) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

7. Specified replacement length exceeds remaining string length
```sql
SELECT sub_replace('hello', 'Hi', 1, 9);
```
```text
+----------------------------------+
| sub_replace('hello', 'Hi', 1, 9) |
+----------------------------------+
| hHi                              |
+----------------------------------+
```

### Keywords

    SUB_REPLACE, REPLACE
