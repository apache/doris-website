---
{
    "title": "OVERLAY",
    "language": "en",
    "description": "The OVERLAY function is used to replace a substring at a specified position and length within a string. Starting from the specified position,"
}
---

## Description

The OVERLAY function is used to replace a substring at a specified position and length within a string. Starting from the specified position, it replaces the specified length of characters with a new string.This function is multibyte safe.

This function behaves consistently with the [INSERT function](https://dev.mysql.com/doc/refman/8.4/en/string-functions.html#function_insert) in MySQL.

## Alias

- INSERT

## Syntax

```sql
OVERLAY(<str>, <pos>, <len>, <newstr>)
```

## Parameters

| Parameter | Description |
| ---------- | ----------------------------------------- |
| `<str>` | The original string to be modified. Type: VARCHAR |
| `<pos>` | The starting position for replacement (1-based). Type: INT |
| `<len>` | The length of characters to replace. Type: INT |
| `<newstr>` | The new string to use for replacement. Type: VARCHAR |

## Return Value

Returns VARCHAR type, the new string after replacement.

Special cases:
- If any parameter is NULL, returns NULL
- If `<pos>` is less than 1 or exceeds string length, no replacement occurs and returns the original string
- If `<len>` is less than 0 or exceeds the remaining length, replaces from `<pos>` to the end of the string

## Examples

1. Basic usage: replace middle part
```sql
SELECT overlay('Quadratic', 3, 4, 'What');
```
```text
+------------------------------------+
| overlay('Quadratic', 3, 4, 'What') |
+------------------------------------+
| QuWhattic                          |
+------------------------------------+
```

2. Negative length: replace to end
```sql
SELECT overlay('Quadratic', 2, -1, 'Hi');
```
```text
+-----------------------------------+
| overlay('Quadratic', 2, -1, 'Hi') |
+-----------------------------------+
| QHi                               |
+-----------------------------------+
```

3. Position out of bounds: no replacement
```sql
SELECT overlay('Hello', 10, 2, 'X');
```
```text
+-------------------------------+
| overlay('Hello', 10, 2, 'X')  |
+-------------------------------+
| Hello                         |
+-------------------------------+
```

4. NULL value handling
```sql
SELECT overlay('Hello', NULL, 2, 'X');
```
```text
+--------------------------------+
| overlay('Hello', NULL, 2, 'X') |
+--------------------------------+
| NULL                           |
+--------------------------------+
```

```sql
SELECT INSERT('🎉🎊🎈', 2, 1, '🎁');
```
```text
+--------------------------------------+
| INSERT('🎉🎊🎈', 2, 1, '🎁')                 |
+--------------------------------------+
| 🎉🎁🎈                                     |
+--------------------------------------+
```
