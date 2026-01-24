---
{
    "title": "array_match_any",
    "language": "en",
    "description": "Returns true if any element in the array matches the given condition, false otherwise."
}
---

## Description

Returns true if any element in the array matches the given condition, false otherwise. If the array contains NULL elements and all non-NULL elements are false, returns NULL.

## Syntax

```sql
array_match_any(lambda, <arr> [, <arr> ...])
```

## Parameters

- `lambda`: A lambda expression that defines the condition to check for each element
- `<arr>`: One or more arrays to check. The lambda function will be applied to each element of these arrays

## Return value

Returns a nullable boolean value:
- `true` if any element in the array matches the condition
- `false` if all elements in the array do not match the condition
- `NULL` if the array contains NULL elements and all non-NULL elements do not match the condition

## Examples

```sql
-- Check if any number in array is greater than 5
mysql> SELECT array_match_any(x -> x > 5, [1, 2, 3, 4, 7]);
+----------------------------------------------+
| array_match_any(x -> x > 5, [1, 2, 3, 4, 7]) |
+----------------------------------------------+
|                                            1 |
+----------------------------------------------+

-- Check if any number in array is greater than corresponding numbers in another array
mysql> SELECT array_match_any((x, i) -> x > i, [1, 2, 3, 4, 5], [1, 2, 3, 4, 7]);
+--------------------------------------------------------------------+
| array_match_any((x, i) -> x > i, [1, 2, 3, 4, 5], [1, 2, 3, 4, 7]) |
+--------------------------------------------------------------------+
|                                                                  0 |
+--------------------------------------------------------------------+

mysql> SELECT array_match_any((x, i) -> i > x, [1, 2, 3, 4, 5], [1, 2, 3, 4, 7]);
+--------------------------------------------------------------------+
| array_match_any((x, i) -> i > x, [1, 2, 3, 4, 5], [1, 2, 3, 4, 7]) |
+--------------------------------------------------------------------+
|                                                                  1 |
+--------------------------------------------------------------------+
```

## Notes

1. The function handles NULL values in the following way:
   - If there are NULL elements and all non-NULL elements do not match the condition, returns NULL
   - If any non-NULL element matches the condition, returns true regardless of NULL elements

2. This function is useful for:
   - Checking if any element in an array meets certain criteria
   - Combining with other array functions for complex array operations