---
{
    "title": "MULTI_SEARCH_ALL_POSITIONS",
    "language": "en"
}
---


Returns the positions of the first occurrence of a set of regular expressions in a string.

## Syntax

```sql
ARRAY<INT> multi_search_all_positions(VARCHAR haystack, ARRAY<VARCHAR> patterns)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `haystack` | The string to be checked |
| `patterns` | Array of regular expressions |

## Return Value

Returns an `ARRAY` where the `i`-th element represents the position of the first occurrence of the `i`-th element (regular expression) in the `patterns` array within the string `haystack`. Positions are counted starting from 1, and 0 indicates that the element was not found.

## Examples

```sql
mysql> SELECT multi_search_all_positions('Hello, World!', ['hello', '!', 'world']);
+----------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ['hello', '!', 'world']) |
+----------------------------------------------------------------------+
| [0, 13, 0]                                                           |
+----------------------------------------------------------------------+

mysql> SELECT multi_search_all_positions("Hello, World!", ['hello', '!', 'world', 'Hello', 'World']);
+---------------------------------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ARRAY('hello', '!', 'world', 'Hello', 'World')) |
+---------------------------------------------------------------------------------------------+
| [0, 13, 0, 1, 8]                                                                            |
+---------------------------------------------------------------------------------------------+
```
