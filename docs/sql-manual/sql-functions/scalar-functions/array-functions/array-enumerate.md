---
{
    "title": "ARRAY_ENUMERATE",
    "language": "en",
    "description": "Returns the position index (starting from 1) for each element in the array."
}
---

## array_enumerate

<version since="2.0.0">

</version>

## Description

Returns the position index (starting from 1) for each element in the array. The function generates corresponding position numbers for each element in the array.

## Syntax

```sql
array_enumerate(ARRAY<T> arr)
```

### Parameters

- `arr`：ARRAY<T> type, the array for which to generate position indices. Supports column names or constant values.

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6
- Complex types: ARRAY, MAP, STRUCT

### Return Value

Return type: ARRAY<BIGINT>

Return value meaning:
- Returns a new array with the same length as the input array, where each position contains the position index (starting from 1) of the corresponding element in the array
- NULL: if the input array is NULL

Usage notes:
- The function generates position indices for each element in the array, starting from 1 and incrementing
- Empty arrays return empty arrays, NULL arrays return NULL
- For null values in array elements: null elements also generate corresponding position indices

### Examples

**Query Examples:**

Generate position indices for an array:
```sql
SELECT array_enumerate([1, 2, 1, 4, 5]);
+----------------------------------+
| array_enumerate([1, 2, 1, 4, 5]) |
+----------------------------------+
| [1, 2, 3, 4, 5]                  |
+----------------------------------+
```

Empty array returns empty array:
```sql
SELECT array_enumerate([]);
+----------------------+
| array_enumerate([])  |
+----------------------+
| []                   |
+----------------------+
```

Array containing null values, null elements also generate position indices:
```sql
SELECT array_enumerate([1, null, 3, null, 5]);
+--------------------------------------------+
| array_enumerate([1, null, 3, null, 5])     |
+--------------------------------------------+
| [1, 2, 3, 4, 5]                            |
+--------------------------------------------+
```

Complex type examples:

Nested array types:
```sql
SELECT array_enumerate([[1,2],[3,4],[5,6]]);
+----------------------------------------+
| array_enumerate([[1,2],[3,4],[5,6]])   |
+----------------------------------------+
| [1, 2, 3]                              |
+----------------------------------------+
```

Map types:
```sql
SELECT array_enumerate([{'k':1},{'k':2},{'k':3}]);
+----------------------------------------------+
| array_enumerate([{'k':1},{'k':2},{'k':3}])   |
+----------------------------------------------+
| [1, 2, 3]                                    |
+----------------------------------------------+
```

Struct types:
```sql
SELECT array_enumerate(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
+----------------------------------------------------------------------------------------+
| array_enumerate(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30))) |
+----------------------------------------------------------------------------------------+
| [1, 2]                                                                                  |
+----------------------------------------------------------------------------------------+
```

Error when parameter count is wrong:
```sql
SELECT array_enumerate([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_enumerate' which has 2 arity. Candidate functions are: [array_enumerate(Expression)]
```

Error when passing non-array type:
```sql
SELECT array_enumerate('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_enumerate(VARCHAR(12))
```

### Keywords

ARRAY, ENUMERATE, ARRAY_ENUMERATE
