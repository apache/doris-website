---
{
    "title": "RTRIM_IN",
    "language": "en"
}
---

## Description

The RTRIM_IN function removes specified characters from the right side of a string. When no character set is specified, it removes trailing spaces by default. When a character set is specified, it removes all specified characters from the right side (regardless of their order in the set).
The key feature of RTRIM_IN is that it removes any combination of characters from the specified set, while the RTRIM function removes characters based on exact string matching.

## Syntax

```sql
RTRIM_IN(<str>[, <rhs>])
```

## Parameters
| Parameter | Description                                                            |
| --------- | ---------------------------------------------------------------------- |
| `<str>` | The string to be processed. Type: VARCHAR                              |
| `<rhs>` | Optional parameter, the set of characters to be removed. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the processed string.

Special cases:
- If str is NULL, returns NULL
- If rhs is not specified, removes all trailing spaces
- If rhs is specified, removes all characters from the right side that appear in rhs until encountering the first character not in rhs

## Examples

1. Remove trailing spaces
```sql
SELECT rtrim_in('ab d   ') str;
```
```text
+------+
| str  |
+------+
| ab d |
+------+
```

2. Remove specified character set
```sql
-- RTRIM_IN removes any 'a' and 'b' characters from the right end
SELECT rtrim_in('ababccaab', 'ab') str;
```
```text
+---------+
| str     |
+---------+
| ababcc  |
+---------+
```

3. Comparison with RTRIM function
```sql
SELECT rtrim_in('ababccaab', 'ab'),rtrim('ababccaab', 'ab');
```
```text
+-----------------------------+--------------------------+
| rtrim_in('ababccaab', 'ab') | rtrim('ababccaab', 'ab') |
+-----------------------------+--------------------------+
| ababcc                      | ababcca                  |
+-----------------------------+--------------------------+
```