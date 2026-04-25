---
{
    "title": "MULTI_SEARCH_ALL_POSITIONS",
    "language": "en",
    "description": "The MULTISEARCHALLPOSITIONS function searches for multiple substrings in a string in batch."
}
---

## Description

The MULTI_SEARCH_ALL_POSITIONS function searches for multiple substrings in a string in batch. Returns an array containing the position of the first occurrence of each substring. The search is case-sensitive.

## Syntax

```sql
MULTI_SEARCH_ALL_POSITIONS(<haystack>, <needles>)
```

## Parameters

| Parameter | Description |
| ------------ | ----------------------------------------- |
| `<haystack>` | The target string to search in. Type: VARCHAR |
| `<needles>` | Array containing multiple substrings to search for. Type: ARRAY<VARCHAR> |

## Return Value

Returns ARRAY<INT> type, where the i-th element in the array represents the position of the first occurrence of the i-th substring in `<needles>` within `<haystack>`.

Special cases:
- Position counting starts from 1
- If substring is not found, the corresponding position returns 0
- Search is case-sensitive
- If `<haystack>` or `<needles>` is NULL, returns NULL
- Returns byte position, not the n-th character position

## Examples

1. Basic usage: Search for multiple substrings
```sql
SELECT multi_search_all_positions('Hello, World!', ['Hello', 'World']);
```
```text
+----------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ['Hello', 'World']) |
+----------------------------------------------------------+
| [1, 8]                                                   |
+----------------------------------------------------------+
```

2. Case-sensitive: Lowercase not found
```sql
SELECT multi_search_all_positions('Hello, World!', ['hello', '!', 'world']);
```
```text
+----------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ['hello', '!', 'world']) |
+----------------------------------------------------------------------+
| [0, 13, 0]                                                           |
+----------------------------------------------------------------------+
```

3. Mixed search: Partially found
```sql
SELECT multi_search_all_positions('Hello, World!', ['Hello', '!', 'xyz']);
```
```text
+--------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ['Hello', '!', 'xyz']) |
+--------------------------------------------------------------------+
| [1, 13, 0]                                                         |
+--------------------------------------------------------------------+
```

4. Empty array
```sql
SELECT multi_search_all_positions('Hello', []);
```
```text
+------------------------------------------+
| multi_search_all_positions('Hello', [])  |
+------------------------------------------+
| []                                       |
+------------------------------------------+
```

5. UTF-8 special character support
```sql
SELECT multi_search_all_positions('ṭṛì ḍḍumai Hello', ['ṭṛì', 'Hello', 'test']);
```
```text
+----------------------------------------------------------------------------------------+
| multi_search_all_positions('ṭṛì ḍḍumai Hello', ['ṭṛì', 'Hello', 'test'])               |
+----------------------------------------------------------------------------------------+
| [1, 21, 0]                                                                             |
+----------------------------------------------------------------------------------------+
```

### Keywords

    MULTI_SEARCH,SEARCH,POSITIONS
