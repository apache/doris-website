---
{
    "title": "ARRAY_ENUMERATE_UNIQ",
    "language": "en"
}
---

## array_enumerate_uniq

<version since="2.0.0">

</version>

## Description

Returns the unique occurrence count number for each element in the array. The function generates a number for each element in the array, indicating how many times that element has appeared in the array.

## Syntax

```sql
array_enumerate_uniq(ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### Parameters

- `arr1, arr2, ...`：ARRAY<T> type, arrays for which to generate unique numbers. Supports one or more array parameters.

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6

### Return Value

Return type: ARRAY<BIGINT>

Return value meaning:
- Returns a new array with the same length as the input array, where each position contains the unique occurrence count number for the corresponding element in the array
- NULL: if the input array is NULL

Usage notes:
- The function generates unique numbers for each element in the array, starting from 1 and incrementing
- For elements that appear multiple times, each occurrence gets an incremented number
- When there are multiple array parameters, all arrays must have the same length, otherwise an error will occur. The corresponding positions of multiple arrays are combined to form element pairs, which are used to generate numbers
- Empty arrays return empty arrays, NULL arrays return NULL
- For null values in array elements: null elements also generate corresponding numbers

**Query Examples:**

Generate unique numbers for an array. For elements that appear multiple times, each occurrence gets an incremented number:
```sql
SELECT array_enumerate_uniq([1, 2, 1, 3, 2, 1]);
+------------------------------------------+
| array_enumerate_uniq([1, 2, 1, 3, 2, 1]) |
+------------------------------------------+
| [1, 1, 2, 1, 2, 3]                       |
+------------------------------------------+
```

Empty array returns empty array:
```sql
SELECT array_enumerate_uniq([]);
+----------------------+
| array_enumerate_uniq([]) |
+----------------------+
| []                   |
+----------------------+
```

NULL array returns NULL:
```sql
SELECT array_enumerate_uniq(NULL), array_enumerate_uniq(NULL, NULL);
+----------------------------+----------------------------------+
| array_enumerate_uniq(NULL) | array_enumerate_uniq(NULL, NULL) |
+----------------------------+----------------------------------+
| NULL                       | NULL                             |
+----------------------------+----------------------------------+
```

Array containing null values, null elements also generate numbers:
```sql
SELECT array_enumerate_uniq([1, null, 1, null, 1]);
+--------------------------------------------+
| array_enumerate_uniq([1, null, 1, null, 1]) |
+--------------------------------------------+
| [1, 1, 2, 2, 3]                            |
+--------------------------------------------+
```

Multiple array parameters example, generating numbers based on combinations of multiple arrays:
```sql
SELECT array_enumerate_uniq([1, 2, 1], [10, 20, 10]);
+----------------------------------------------+
| array_enumerate_uniq([1, 2, 1], [10, 20, 10]) |
+----------------------------------------------+
| [1, 1, 2]                                    |
+----------------------------------------------+
```

Error when array lengths are inconsistent:
```sql
SELECT array_enumerate_uniq([1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lengths of all arrays of function array_enumerate_uniq must be equal.
```

IP type support examples:
```sql
SELECT array_enumerate_uniq(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>));
+------------------------------------------------------------------------------------------+
| array_enumerate_uniq(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>)) |
+------------------------------------------------------------------------------------------+
| [1, 1, 2]                                                                                |
+------------------------------------------------------------------------------------------+

mysql> SELECT array_enumerate_uniq(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>));
+------------------------------------------------------------------------------------------+
| array_enumerate_uniq(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>)) |
+------------------------------------------------------------------------------------------+
| [1, 1, 2]                                                                                |
+------------------------------------------------------------------------------------------+
```

Complex type examples:

Nested array types are not supported, will error:
```sql
SELECT array_enumerate_uniq([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_enumerate_uniq does not support type ARRAY<ARRAY<TINYINT>>, expression is array_enumerate_uniq([[1, 2], [3, 4], [5, 6]])
```

Map types are not supported, will error:
```sql
SELECT array_enumerate_uniq([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_enumerate_uniq does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_enumerate_uniq([map('k', 1), map('k', 2), map('k', 3)])
```

Error when parameter count is wrong:
```sql
SELECT array_enumerate_uniq();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_enumerate_uniq' which has 0 arity. Candidate functions are: [array_enumerate_uniq(Expression, Expression...)]
```

Error when passing non-array type:
```sql
SELECT array_enumerate_uniq('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_enumerate_uniq(VARCHAR(12))
```

### Keywords

ARRAY, ENUMERATE, UNIQ, ARRAY_ENUMERATE_UNIQ
