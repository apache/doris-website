---
title: LEVENSHTEIN
---

## Description
The `LEVENSHTEIN` function returns the Levenshtein edit distance between two strings.  
The distance is the minimum number of single-character insertions, deletions, or substitutions required to transform one string into the other.

This function counts characters in UTF-8.

## Syntax
```sql
LEVENSHTEIN(<str1>, <str2>)
```

## Parameters
| Parameter | Description |
| -- | -- |
| `<str1>` | First string |
| `<str2>` | Second string |

## Return Value
Returns an INT value.

## Examples
```sql
SELECT levenshtein('kitten', 'sitting'); -- 3
SELECT levenshtein('数据库', '数据');    -- 1
```

## Notes
- Supports UTF-8 characters.
- NULL input returns NULL.
