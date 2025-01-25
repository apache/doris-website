---
{
    "title": "MULTI_MATCH_ANY",
    "language": "en"
}
---


Returns whether the string matches any of the given regular expressions.

## Syntax

```sql
TINYINT multi_match_any(VARCHAR haystack, ARRAY<VARCHAR> patterns)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `haystack` | The string to be checked |
| `patterns` | Array of regular expressions |

## Return Value

Returns 1 if the string `haystack` matches any of the regular expressions in the `patterns` array, otherwise returns 0.

## Examples

```sql
mysql> SELECT multi_match_any('Hello, World!', ['hello', '!', 'world']);
+-----------------------------------------------------------+
| multi_match_any('Hello, World!', ['hello', '!', 'world']) |
+-----------------------------------------------------------+
| 1                                                         |
+-----------------------------------------------------------+

mysql> SELECT multi_match_any('abc', ['A', 'bcd']);
+--------------------------------------+
| multi_match_any('abc', ['A', 'bcd']) |
+--------------------------------------+
| 0                                    |
+--------------------------------------+
```
