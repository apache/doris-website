---
{
    "title": "ARRAY_EXISTS",
    "language": "en",
    "description": "<version since=\"2.0.0\">"
}
---

## array_exists

<version since="2.0.0">

</version>

## Description

Applies a lambda expression to elements in an array and returns a boolean array indicating whether each element satisfies the condition. The function applies the lambda expression to each element in the array and returns the corresponding boolean value.

## Syntax

```sql
array_exists(lambda, array1, ...)
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

Return type: ARRAY<BOOLEAN>

Return value meaning:
- Returns a boolean array with the same length as the input array, where each position contains the result of applying the lambda expression to the corresponding element
- NULL: when only the array parameter is NULL and there is no lambda expression

Usage notes:
- The number of parameters in the lambda expression must match the number of array parameters
- All input arrays must have the same length
- Supports evaluation of multi-arrays and complex type arrays
- Empty arrays return empty arrays. When only the array parameter is NULL and there is no lambda expression, returns NULL. When there is a lambda expression and the array is NULL, it will error
- Lambda can use any scalar expression, but cannot use aggregate functions
- Lambda expressions can call other higher-order functions, but the return types must be compatible
- For null values in array elements: null elements will be passed to the lambda expression for processing, and lambda can check for null values

**Query Examples:**

Check if each element in a floating-point array is greater than or equal to 3:
```sql
SELECT array_exists(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------+
| array_exists(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------+
| [0, 0, 1, 1, 1]                                 |
+--------------------------------------------------+
```

Check if the length of each element in a string array is greater than 2:
```sql
SELECT array_exists(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+--------------------------------------------------+
| array_exists(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+--------------------------------------------------+
| [0, 0, 1, 1, 1]                                 |
+--------------------------------------------------+
```

Empty array returns empty array:
```sql
SELECT array_exists(x -> x > 0, []);
+-------------------------------------+
| array_exists(x -> x > 0, [])       |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```

NULL array and lambda expression combination. When there is a lambda expression with NULL, it will error. When there is no lambda expression, it returns NULL:
```sql
SELECT array_exists(NULL);
+--------------------+
| array_exists(NULL) |
+--------------------+
| NULL               |
+--------------------+

SELECT array_exists(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL
```

Array containing null values, lambda can check for null:
Any comparison operation with null (such as >, <, =, >=, <=) will return null (except for special IS NULL or IS NOT NULL), because it's impossible to determine whether an unknown value (NULL) is greater than 2. This behavior is consistent with MYSQL, POSTGRESSQL, etc.
```sql
SELECT array_exists(x -> x is not null, [1, null, 3, null, 5]);
+------------------------------------------+
| array_exists(x -> x is not null, [1, null, 3, null, 5]) |
+------------------------------------------+
| [1, 0, 1, 0, 1]                          |
+------------------------------------------+

SELECT array_exists(x -> x > 2, [1, null, 3, null, 5]);
+-------------------------------------------------+
| array_exists(x -> x > 2, [1, null, 3, null, 5]) |
+-------------------------------------------------+
| [0, null, 1, null, 1]                           |
+-------------------------------------------------+
```

Multi-array evaluation, check if the first array is greater than the second array:
```sql
SELECT array_exists((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------------+
| array_exists((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------------+
| [0, 0, 0, 0, 0]                                       |
+--------------------------------------------------------+
```

Complex type examples:

Nested array evaluation, check if each sub-array length is greater than 2:
```sql
SELECT array_exists(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+----------------------------------------------------------------+
| array_exists(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+----------------------------------------------------------------+
| [0, 1, 0, 1]                                                   |
+----------------------------------------------------------------+
```

Map type evaluation, check if the value with key 'a' is greater than 10:
```sql
SELECT array_exists(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_exists(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [0, 1, 1]                                                     |
+---------------------------------------------------------------+
```

Error when the number of parameters in lambda expression doesn't match the number of array parameters:
```sql
SELECT array_exists(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

Error when array lengths are inconsistent:
```sql
SELECT array_exists((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

Error when passing non-array type:
```sql
SELECT array_exists(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```

### Keywords

ARRAY, EXISTS, ARRAY_EXISTS
