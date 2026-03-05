---
{
    "title": "ARRAY_MATCH_ALL",
    "language": "en",
    "description": "Returns true if all elements in the array match the given condition, false otherwise."
}
---

## Description

Returns true if all elements in the array match the given condition, false otherwise. If the array contains NULL elements and all non-NULL elements match the condition, returns NULL.

## Syntax

```sql
array_match_all(lambda, <arr> [, <arr> ...])
```

## Parameters

- `lambda`: A lambda expression that defines the condition to check for each element
- `<arr>`: One or more arrays to check. The lambda function will be applied to each element of these arrays

## Return value

Returns a nullable boolean value:
- `true` if all elements in the array match the condition
- `false` if any element in the array does not match the condition
- `NULL` if the array contains NULL elements and all non-NULL elements match the condition

## Examples

```sql
-- Check if all numbers in array are greater than 5
mysql> SELECT array_match_all(x -> x > 5, [1, 2, 3, 4, 7]);
+----------------------------------------------+
| array_match_all(x -> x > 5, [1, 2, 3, 4, 7]) |
+----------------------------------------------+
|                                            0 |
+----------------------------------------------+

-- Check if all numbers in array are greater than corresponding numbers in another array
mysql> SELECT array_match_all((x, i) -> x > i, [1, 2, 3, 4, 5], [1, 2, 3, 4, 7]);
+--------------------------------------------------------------------+
| array_match_all((x, i) -> x > i, [1, 2, 3, 4, 5], [1, 2, 3, 4, 7]) |
+--------------------------------------------------------------------+
|                                                                  0 |
+--------------------------------------------------------------------+
```

## Notes

1. The function handles NULL values in the following way:
   - If there are NULL elements and all non-NULL elements match the condition, returns NULL
   - If any non-NULL element does not match the condition, returns false regardless of NULL elements

2. This function is useful for:
   - Validating all elements in an array meet certain criteria
   - Combining with other array functions for complex array operations