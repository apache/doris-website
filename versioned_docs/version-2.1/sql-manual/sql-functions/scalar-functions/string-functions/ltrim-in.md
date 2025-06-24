---
{
    "title": "LTRIM_IN",
    "language": "en"
}
---

## Description

The LTRIM_IN function removes specified characters from the left side of a string. When no character set is specified, it removes leading spaces by default. When a character set is specified, it removes all specified characters from the left side (regardless of their order in the set).
The key feature of LTRIM_IN is that it removes any combination of characters from the specified set, while the LTRIM function removes characters based on exact string matching.

## Syntax

```sql
LTRIM_IN(<str> [, <rhs>])
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
- If rhs is not specified, removes all leading spaces
- If rhs is specified, removes all characters from the left side that appear in rhs until encountering the first character not in rhs

## Examples

1. Remove leading spaces
```sql
SELECT ltrim_in('   ab d') str;
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
SELECT ltrim_in('ababccaab', 'ab') str;
```
```text
+-------+
| str   |
+-------+
| ccaab |
+-------+
```

3. Comparison with LTRIM function
```sql
SELECT ltrim_in('abcd', 'ae'),ltrim('abcd', 'abe');
```
```text
+------------------------+----------------------+
| ltrim_in('abcd', 'ae') | ltrim('abcd', 'abe') |
+------------------------+----------------------+
| bcd                    | abcd                 |
+------------------------+----------------------+
```