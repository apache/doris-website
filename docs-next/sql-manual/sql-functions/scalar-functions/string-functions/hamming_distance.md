---
title: HAMMING_DISTANCE
---

## Description
The `HAMMING_DISTANCE` function returns the number of positions at which two strings of equal length differ.

This function counts characters in UTF-8.

## Syntax
```sql
HAMMING_DISTANCE(<str1>, <str2>)
```

## Parameters
| Parameter | Description |
| -- | -- |
| `<str1>` | First string |
| `<str2>` | Second string |

## Return Value
Returns a BIGINT value.

## Examples
```sql
SELECT hamming_distance('karolin', 'kathrin'); -- 3
SELECT hamming_distance('数据库', '数据仓');   -- 1
```

## Notes
- The two strings must have the same length. Otherwise, an error is returned.
- Supports UTF-8 characters.
- NULL input returns NULL.
