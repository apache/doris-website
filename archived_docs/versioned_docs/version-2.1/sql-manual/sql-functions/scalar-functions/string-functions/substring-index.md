---
{
    "title": "SUBSTRING_INDEX",
    "language": "en",
    "description": "The SUBSTRINGINDEX function is used to extract a substring from a string based on a specified delimiter and occurrence count."
}
---

## Description

The SUBSTRING_INDEX function is used to extract a substring from a string based on a specified delimiter and occurrence count. This function supports counting from either left or right.

## Syntax

```sql
SUBSTRING_INDEX(<content>, <delimiter>, <field>)
```

## Parameters
| Parameter | Description                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| `<content>` | The string to be extracted from. Type: VARCHAR                                                                  |
| `<delimiter>` | The delimiter string, case-sensitive and multi-byte safe. Type: VARCHAR                                         |
| `<field>` | Number of delimiter occurrences. Positive numbers count from left, negative numbers count from right. Type: INT |

## Return Value

Returns VARCHAR type, representing the extracted substring.

Special cases:
- If field > 0, returns the substring before the field-th delimiter from the left
- If field < 0, returns the substring after the |field|-th delimiter from the right
- If field = 0, returns empty string when content is not NULL, returns NULL when content is NULL
- If any parameter is NULL, returns NULL

## Examples

1. Extract content before the first space from the left
```sql
SELECT substring_index('hello world', ' ', 1);
```
```text
+----------------------------------------+
| substring_index('hello world', ' ', 1) |
+----------------------------------------+
| hello                                  |
+----------------------------------------+
```

2. Extract all content from the left (delimiter count greater than actual occurrences)
```sql
SELECT substring_index('hello world', ' ', 2);
```
```text
+----------------------------------------+
| substring_index('hello world', ' ', 2) |
+----------------------------------------+
| hello world                            |
+----------------------------------------+
```

3. Extract content after the last space from the right
```sql
SELECT substring_index('hello world', ' ', -1);
```
```text
+-----------------------------------------+
| substring_index('hello world', ' ', -1) |
+-----------------------------------------+
| world                                   |
+-----------------------------------------+
```

4. Case when field is 0
```sql
SELECT substring_index('hello world', ' ', 0);
```
```text
+----------------------------------------+
| substring_index('hello world', ' ', 0) |
+----------------------------------------+
|                                        |
+----------------------------------------+
```