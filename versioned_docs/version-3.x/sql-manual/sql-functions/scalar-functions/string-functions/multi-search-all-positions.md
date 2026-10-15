---
{
    "title": "MULTI_SEARCH_ALL_POSITIONS",
    "language": "en",
    "description": "Returns an ARRAY where the i-th element is the position of the i-th element in needles(i.e. needle)'s first occurrence in the string haystack."
}
---

## multi_search_all_positions
### Description
#### Syntax

`ARRAY<INT> multi_search_all_positions(VARCHAR haystack, ARRAY<VARCHAR> needles)`

Returns an `ARRAY` where the `i`-th element is the position of the `i`-th element in `needles`(i.e. `needle`)'s **first** occurrence in the string `haystack`. Positions are counted from 1, with 0 meaning the element was not found. **Case-sensitive**.

### example

NULL inputs:

```sql
SELECT multi_search_all_positions(NULL, ['a', 'b']) AS null_haystack,
       multi_search_all_positions('a', NULL) AS null_needles,
       multi_search_all_positions(NULL, NULL) AS both_null;
```
```text
+---------------+--------------+-----------+
| null_haystack | null_needles | both_null |
+---------------+--------------+-----------+
| [0, 0]        | []           | []        |
+---------------+--------------+-----------+
```


```
mysql> select multi_search_all_positions('Hello, World!', ['hello', '!', 'world']);
+----------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ['hello', '!', 'world']) |
+----------------------------------------------------------------------+
| [0,13,0]                                                             |
+----------------------------------------------------------------------+

select multi_search_all_positions("Hello, World!", ['hello', '!', 'world', 'Hello', 'World']);
+---------------------------------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ARRAY('hello', '!', 'world', 'Hello', 'World')) |
+---------------------------------------------------------------------------------------------+
| [0, 13, 0, 1, 8]                                                                            |
+---------------------------------------------------------------------------------------------+
```

### keywords
    MULTI_SEARCH,SEARCH,POSITIONS
