---
{
    "title": "ARRAY_FILTER",
    "language": "en",
    
}
---

## array_filter

<version since="2.0.0">

</version>

## Description

Filters array elements based on conditions and returns a new array composed of elements that satisfy the conditions. The function supports two calling methods: a higher-order function form using lambda expressions, and a filtering form directly using boolean arrays.

## Syntax

```sql
array_filter(lambda, array1, ...)
array_filter(array1, array<boolean> filter_array)
```

### Parameters

- `lambda`：lambda expression used to evaluate array elements, returns true/false or expressions that can be converted to boolean values
- `array1, ...`：one or more ARRAY\<T> type parameters
- `filter_array`：ARRAY\<BOOLEAN> type, boolean array used for filtering

**T supported types:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6
- Complex data types: ARRAY, MAP, STRUCT

### Return Value

Return type: ARRAY\<T>

Return value meaning:
- Returns a new array composed of all elements that satisfy the filtering conditions
- NULL: if the input array is NULL
- Empty array: if no elements satisfy the conditions

Usage notes:
- Lambda form: the number of lambda expression parameters must match the number of array parameters
- Boolean array form: the length of `array1` and `filter_array` should ideally be completely consistent. If the boolean array is longer, excess boolean values will be ignored; if the boolean array is shorter, only elements at corresponding positions in the boolean array will be processed
- Supports filtering of multiple arrays and complex type arrays
- Empty array returns empty array, NULL array returns NULL
- Lambda can use any scalar expression, cannot use aggregate functions
- Lambda expressions can call other higher-order functions, but need to return compatible types
- For null values in array elements: null elements will be passed to the lambda expression for processing, lambda can evaluate null values

### Examples

```sql
CREATE TABLE array_filter_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_filter_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['a', 'bb', 'ccc', 'dddd', 'eeeee']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['x', 'yy', 'zzz']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**Query examples:**

Using lambda expression to filter elements in double_array greater than or equal to 3:
```sql
SELECT array_filter(x -> x >= 3, double_array) FROM array_filter_test WHERE id = 1;
+------------------------------------------+
| array_filter(x -> x >= 3, double_array)  |
+------------------------------------------+
| [3.3, 4.4, 5.5]                          |
+------------------------------------------+
```

Using lambda expression to filter elements in string_array with length greater than 2:
```sql
SELECT array_filter(x -> length(x) > 2, string_array) FROM array_filter_test WHERE id = 1;
+--------------------------------------------------+
| array_filter(x -> length(x) > 2, string_array)   |
+--------------------------------------------------+
| ["ccc", "dddd", "eeeee"]                         |
+------------------------------------------+
```

Using boolean array to filter elements:
```sql
SELECT array_filter(int_array, [false, true, false, true, true]) FROM array_filter_test WHERE id = 1;
+-----------------------------------------------------------+
| array_filter(int_array, [false, true, false, true, true]) |
+-----------------------------------------------------------+
| [2, 4, 5]                                                 |
+-----------------------------------------------------------+
```

Boolean array filtering example, deciding whether to keep elements at corresponding positions based on boolean values:

```sql
SELECT array_filter([1,2,3], [true, false, true]);
+--------------------------------------------+
| array_filter([1,2,3], [true, false, true]) |
+--------------------------------------------+
| [1, 3]                                     |
+--------------------------------------------+
```

When the boolean array length is greater than the original array, excess boolean values will be ignored:
```sql
SELECT array_filter([1,2,3], [true, false, true, false]);
+---------------------------------------------------+
| array_filter([1,2,3], [true, false, true, false]) |
+---------------------------------------------------+
| [1, 3]                                            |
+---------------------------------------------------+
```

When the boolean array length is less than the original array, only elements at corresponding positions in the boolean array will be processed:
```sql
SELECT array_filter([1,2,3], [true, false]);
+--------------------------------------+
| array_filter([1,2,3], [true, false]) |
+--------------------------------------+
| [1]                                  |
+--------------------------------------+
```

Empty array returns empty array:
```sql
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 3;
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```

NULL array returns NULL: returning NULL when the input array is NULL without throwing an error.
```sql
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 4;
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

Array containing null values, lambda can evaluate null:
```sql
+------------------------------------------------------------+
| array_filter(x -> x is not null, [null, 1, null, 2, null]) |
+------------------------------------------------------------+
| [1, 2]                                                     |
+------------------------------------------------------------+
```

Multiple array filtering, filtering elements where int_array > double_array:
```sql
SELECT array_filter((x, y) -> x > y, int_array, double_array) FROM array_filter_test WHERE id = 1;
+--------------------------------------------------------+
| array_filter((x, y) -> x > y, int_array, double_array) |
+--------------------------------------------------------+
| []                                                     |
+--------------------------------------------------------+
```

Complex type examples:

Nested array filtering, filtering elements where each sub-array length is greater than 2:
```sql
SELECT array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]);
+-------------------------------------------------------------------+
| array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]) |
+-------------------------------------------------------------------+
| [[3, 4, 5], [7, 8, 9, 10]]                                        |
+-------------------------------------------------------------------+
```

Map type filtering, filtering elements where the value of key 'a' is greater than 10:
```sql
SELECT array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [{"a":15}, {"a":20}]                                          |
+---------------------------------------------------------------+
```

Struct type filtering, filtering elements where age is greater than 18:
```sql
SELECT array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30)));
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30))) |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Eve", "age":30}]                                                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

Incorrect number of parameters:
```sql
SELECT array_filter(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

Inconsistent array lengths will cause an error:
```sql
SELECT array_filter((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

Passing non-array type will cause an error:
```sql
SELECT array_filter(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```


**Nested higher-order function examples:**

**Correct example: calling higher-order functions that return scalars in lambda**

The current example can be nested because the inner array_count returns a scalar value (INT64), which array_filter can handle.
```sql
SELECT array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]);
+------------------------------------------------------------------------------+
| array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]) |
+------------------------------------------------------------------------------+
| [[4, 5, 6], [7, 8, 9]]                                                       |
+------------------------------------------------------------------------------+
```

**Error example: lambda returns array type**

The current example cannot be nested because the inner array_exists returns ARRAY<BOOLEAN>, while the outer array_filter expects lambda to return a scalar value
```sql
SELECT array_filter(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_filter(ARRAY<ARRAY<TINYINT>>, ARRAY<ARRAY<BOOLEAN>>)
```

### Keywords

ARRAY, FILTER, ARRAY_FILTER 