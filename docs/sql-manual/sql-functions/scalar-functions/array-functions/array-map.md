---
{
    "title": "ARRAY_MAP",
    "language": "en-US"
}
---

## array_map

<version since="2.0.0">

</version>

## Description

Applies a lambda expression to elements in an array and returns a new array. The function applies the lambda expression to each element in the array and returns the corresponding result.

## Syntax

```sql
array_map(lambda, ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### Parameters

- `lambda`：lambda expression used to define transformation rules
- `arr1, arr2, ...`：ARRAY<T> type, arrays to be transformed. Supports one or more array parameters.

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6
- Complex types: ARRAY, MAP, STRUCT

### Return Value

Return type: ARRAY<R>

Return value meaning:
- Returns a new array with the same length as the input array, where each position contains the result of applying the lambda expression to the corresponding element
- NULL: if the input array is NULL

Usage notes:
- The number of parameters in the lambda expression must match the number of array parameters
- When there are multiple array parameters, all arrays must have the same length
- Lambda can use any scalar expression, but cannot use aggregate functions
- Lambda expressions can call other higher-order functions, but the return types must be compatible
- For null values in array elements: null elements will be passed to the lambda expression for processing, and lambda can check for null values

**Query Examples:**

Square each element in the array:
```sql
SELECT array_map(x -> x * x, [1, 2, 3, 4, 5]);
+------------------------------------------+
| array_map(x -> x * x, [1, 2, 3, 4, 5]) |
+------------------------------------------+
| [1, 4, 9, 16, 25]                       |
+------------------------------------------+
```

Round each element in a floating-point array:
```sql
SELECT array_map(x -> round(x), [1.1, 2.7, 3.3, 4.9, 5.5]);
+--------------------------------------------------+
| array_map(x -> round(x), [1.1, 2.7, 3.3, 4.9, 5.5]) |
+--------------------------------------------------+
| [1, 3, 3, 5, 6]                                 |
+--------------------------------------------------+
```

Calculate the length of each element in a string array:
```sql
SELECT array_map(x -> length(x), ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+--------------------------------------------------+
| array_map(x -> length(x), ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+--------------------------------------------------+
| [1, 2, 3, 4, 5]                                 |
+--------------------------------------------------+
```

Process an array containing null values:
```sql
SELECT array_map(x -> x is not null, [1, null, 3, null, 5]);
+--------------------------------------------------+
| array_map(x -> x is not null, [1, null, 3, null, 5]) |
+--------------------------------------------------+
| [1, 0, 1, 0, 1]                                 |
+--------------------------------------------------+
```

Multiple array parameters example, adding corresponding elements from two arrays:
```sql
SELECT array_map((x, y) -> x + y, [1, 2, 3, 4, 5], [10, 20, 30, 40, 50]);
+--------------------------------------------------+
| array_map((x, y) -> x + y, [1, 2, 3, 4, 5], [10, 20, 30, 40, 50]) |
+--------------------------------------------------+
| [11, 22, 33, 44, 55]                             |
+--------------------------------------------------+
```

Nested array processing, calculating the length of each sub-array:
```sql
SELECT array_map(x -> size(x), [[1,2],[3,4,5],[6],[7,8,9,10]]);
+--------------------------------------------------+
| array_map(x -> size(x), [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+--------------------------------------------------+
| [2, 3, 1, 4]                                     |
+--------------------------------------------------+
```

Map type processing, extracting the value with key 'a' from each map:
```sql
SELECT array_map(x -> x['a'], [{'a':1,'b':2}, {'a':3,'b':4}, {'a':5,'b':6}]);
+--------------------------------------------------+
| array_map(x -> x['a'], [{'a':1,'b':2}, {'a':3,'b':4}, {'a':5,'b':6}]) |
+--------------------------------------------------+
| [1, 3, 5]                                        |
+--------------------------------------------------+
```

Error when parameter count is wrong:
```sql
SELECT array_map();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_map' which has 0 arity. Candidate functions are: [array_map(Expression, Expression...)]
```

Error when the number of parameters in lambda expression doesn't match the number of array parameters:
```sql
SELECT array_map(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

Error when passing non-array type:
```sql
SELECT array_map(x -> x * 2, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_map(Expression, VARCHAR(12))
```

### Keywords

ARRAY, MAP, ARRAY_MAP
