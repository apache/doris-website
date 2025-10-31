---
{
    "title": "ARRAY_FIRST_INDEX",
    "language": "en"
}
---

## array_first_index

<version since="2.0.0">

</version>

### Description

Returns the position index (starting from 1) of the first element in the array that satisfies the lambda expression condition. The function applies the lambda expression to elements in the array, finds the first element that satisfies the condition and returns its position index.

### Syntax

```sql
array_first_index(lambda, array1, ...)
```

### Parameters

- `lambda`：lambda expression used to evaluate array elements, returns true/false or expressions that can be converted to boolean values
- `array1, ...`：one or more ARRAY<T> type parameters

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6
- Complex data types: ARRAY, MAP, STRUCT

### Return Value

Return type: BIGINT

Return value meaning:
- Returns the position index of the first element in the array that satisfies the lambda expression condition. The return value starts from 1, not 0. If the found element that satisfies the condition matches the first element in the array, this function returns 1, not 0
- 0: if the input array is NULL and there is no lambda expression, or the array is empty, or no element satisfies the condition

Usage notes:
- The number of parameters in the lambda expression must match the number of array parameters
- All input arrays must have the same length
- Supports searching in multi-arrays and complex type arrays
- Empty arrays return 0. When the input parameter is a NULL array and there is no lambda expression, returns 0. If the input parameter is a NULL array with a lambda expression, it will error
- Lambda can use any scalar expression, but cannot use aggregate functions
- Lambda expressions can call other higher-order functions, but the return types must be compatible
- For null values in array elements: null elements will be passed to the lambda expression for processing, and lambda can check for null values

**Query Examples:**

Find the position index of the first element greater than or equal to 3 in a floating-point array:
```sql
SELECT array_first_index(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+-----------------------------------------------------------+
| array_first_index(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+-----------------------------------------------------------+
|                                                         3 |
+-----------------------------------------------------------+
```

Find the position index of the first element with length greater than 2 in a string array:
```sql
SELECT array_first_index(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+----------------------------------------------------------------------------+
| array_first_index(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+----------------------------------------------------------------------------+
|                                                                          3 |
+----------------------------------------------------------------------------+
```

Empty array returns 0:
```sql
SELECT array_first_index(x -> x > 0, []);
+-----------------------------------+
| array_first_index(x -> x > 0, []) |
+-----------------------------------+
|                                 0 |
+-----------------------------------+
```

NULL array and lambda expression combination. When there is a lambda expression with NULL, it will error. When there is no lambda expression, it returns 0:
```sql
SELECT array_first_index(NULL);
+-------------------------+
| array_first_index(NULL) |
+-------------------------+
|                       0 |
+-------------------------+

SELECT array_first_index(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL
```

Array containing null values, lambda can check for null:
```sql
SELECT array_first_index(x -> x is not null, [null, 1, null, 3, null, 5]);
+--------------------------------------------------------------------+
| array_first_index(x -> x is not null, [null, 1, null, 3, null, 5]) |
+--------------------------------------------------------------------+
|                                                                  2 |
+--------------------------------------------------------------------+
```

Multi-array search, find the position index of the first element where the first array is greater than the second array:
```sql
SELECT array_first_index((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------------------------------------+
| array_first_index((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------------------------------------+
|                                                                              0 |
+--------------------------------------------------------------------------------+
```

Complex type examples:

Nested array search, find the position index of the first sub-array with length greater than 2:
```sql
SELECT array_first_index(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+---------------------------------------------------------------------+
| array_first_index(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+---------------------------------------------------------------------+
|                                                                   2 |
+---------------------------------------------------------------------+
```

Map type search, find the position index of the first element where the value with key 'a' is greater than 10:
```sql
SELECT array_first_index(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+--------------------------------------------------------------------+
| array_first_index(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+--------------------------------------------------------------------+
|                                                                  2 |
+--------------------------------------------------------------------+
```

Error when the number of parameters in lambda expression doesn't match the number of array parameters:
```sql
SELECT array_first_index(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

Error when array lengths are inconsistent:
```sql
SELECT array_first_index((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

Error when passing non-array type:
```sql
SELECT array_first_index(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```

### Keywords

ARRAY, FIRST, INDEX, ARRAY_FIRST_INDEX
