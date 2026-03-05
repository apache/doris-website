---
{
    "title": "ARRAY_INTERSECT",
    "language": "en",
    "description": "Returns the intersection of multiple arrays, i.e., elements that exist in all arrays."
}
---

## array_intersect

<version since="2.0.0">

</version>

### Description

Returns the intersection of multiple arrays, i.e., elements that exist in all arrays. The function finds elements that exist in all input arrays and forms a new array after deduplication.

### Syntax

```sql
array_intersect(ARRAY<T> arr1, ARRAY<T> arr2, [ARRAY<T> arr3, ...])
```

### Parameters

- `arr1, arr2, arr3, ...`：ARRAY<T> type, arrays for which to calculate the intersection. Supports two or more array parameters.

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6

### Return Value

Return type: ARRAY<T>

Return value meaning:
- Returns a new array containing unique elements that exist in all input arrays
- Empty array: when there are no common elements among all input parameter arrays

Usage notes:
- The function finds elements that exist in all input arrays, and elements in the result array will be deduplicated
- Empty arrays and any non-NULL array result in empty arrays. If there are no overlapping elements, the function will return an empty array.
- The function does not support NULL arrays
- Element comparison follows type compatibility rules. When types are incompatible, conversion will be attempted, and failure results in null
- For null values in array elements: null elements are treated as regular elements in operations, and null is considered the same as null

**Query Examples:**

Intersection of two arrays:
```sql
SELECT array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8]);
+------------------------------------------------+
| array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8]) |
+------------------------------------------------+
| [4, 2]                                         |
+------------------------------------------------+
```

Intersection of multiple arrays:
```sql
SELECT array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8], [2, 4, 10, 12]);
+----------------------------------------------------------------+
| array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8], [2, 4, 10, 12]) |
+----------------------------------------------------------------+
| [2, 4]                                                         |
+----------------------------------------------------------------+
```

Intersection of string arrays:
```sql
SELECT array_intersect(['a', 'b', 'c'], ['b', 'c', 'd']);
+--------------------------------------------+
| array_intersect(['a','b','c'], ['b','c','d']) |
+--------------------------------------------+
| ["b", "c"]                                 |
+--------------------------------------------+
```

Array containing null values, null is treated as a value that can be compared for equality:
```sql
SELECT array_intersect([1, null, 2, null, 3], [null, 2, 3, 4]);
+---------------------------------------------------------+
| array_intersect([1, null, 2, null, 3], [null, 2, 3, 4]) |
+---------------------------------------------------------+
| [null, 2, 3]                                            |
+---------------------------------------------------------+
```

Intersection of string array and integer array:
String '2' can be converted to integer 2, 'b' conversion fails and becomes null:
```sql
SELECT array_intersect([1, 2, null, 3], ['2', 'b']);
+----------------------------------------------+
| array_intersect([1, 2, null, 3], ['2', 'b']) |
+----------------------------------------------+
| [null, 2]                                    |
+----------------------------------------------+
```

Empty array with any array:
```sql
SELECT array_intersect([], [1, 2, 3]);
+-----------------------------+
| array_intersect([], [1,2,3]) |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL input arrays will error:
```sql
SELECT array_intersect(NULL, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

Complex types are not supported and will error:
Nested array types are not supported, will error:
```sql
SELECT array_intersect([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_intersect does not support type ARRAY<ARRAY<TINYINT>>, expression is array_intersect([[1, 2], [3, 4], [5, 6]])
```

Map types are not supported, will error:
```sql
SELECT array_intersect([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_intersect does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_intersect([map('k', 1), map('k', 2), map('k', 3)])
```

Error when parameter count is wrong:
```sql
SELECT array_intersect([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_intersect' which has 1 arity. Candidate functions are: [array_intersect(Expression, Expression, ...)]
```

Error when passing non-array type:
```sql
SELECT array_intersect('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_intersect(VARCHAR(12), ARRAY<INT>)
```

### Keywords

ARRAY, INTERSECT, ARRAY_INTERSECT
