---
{
    "title": "STRCMP",
    "language": "en",
    "description": "The STRCMP function compares two strings lexicographically. It returns an integer value indicating the result of the comparison."
}
---

## Description

The STRCMP function compares two strings lexicographically. It returns an integer value indicating the result of the comparison.

## Syntax

```sql
STRCMP(<str0>, <str1>)
```

## Parameters
| Parameter | Description |
| -- | -- |
| `<str0>` | The first string to compare. Type: VARCHAR |
| `<str1>` | The second string to compare. Type: VARCHAR |

## Return Value

Returns a TINYINT value indicating the comparison result:
- Returns 0: if str0 equals str1
- Returns 1: if str0 is lexicographically greater than str1
- Returns -1: if str0 is lexicographically less than str1

Special cases:
- Returns NULL if any argument is NULL

## Examples

1. Comparing identical strings
```sql
SELECT strcmp('test', 'test');
```
```text
+------------------------+
| strcmp('test', 'test') |
+------------------------+
|                      0 |
+------------------------+
```

2. First string is greater
```sql
SELECT strcmp('test1', 'test');
```
```text
+-------------------------+
| strcmp('test1', 'test') |
+-------------------------+
|                       1 |
+-------------------------+
```

3. First string is smaller
```sql
SELECT strcmp('test', 'test1');
```
```text
+-------------------------+
| strcmp('test', 'test1') |
+-------------------------+
|                      -1 |
+-------------------------+
```