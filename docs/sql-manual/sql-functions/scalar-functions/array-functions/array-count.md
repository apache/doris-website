---
{
    "title": "ARRAY_COUNT",
    "language": "en"
}
---

## array_count

<version since="2.0.0">



## Description

Applies a lambda expression to elements in an array and counts the number of elements whose return value is not 0.

## Syntax

```sql
array_count(lambda, array1, ...)
```

### Parameters

- `lambda`：lambda expression, used to evaluate and calculate array elements
- `array1, ...`：one or more ARRAY\<T> type parameters

**T supported types:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6
- Complex data types: ARRAY, MAP, STRUCT

### Return Value

Return type: BIGINT

Return value meaning:
- Returns the number of elements whose lambda expression result is true
- 0: if no elements satisfy the condition, or the input array is NULL

Usage notes:
- The number of parameters in the lambda expression must match the number of array parameters
- All input arrays must have the same length
- Supports counting on multiple arrays and complex type arrays
- Empty array returns 0, NULL array returns 0
- Lambda expressions can call other higher-order functions, but the return types must be compatible
- For null values in array elements: null elements will be passed to the lambda expression for processing, and the lambda can evaluate null values

### Examples

```sql
CREATE TABLE array_count_test (
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

INSERT INTO array_count_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['a', 'bb', 'ccc', 'dddd', 'eeeee']),
(2, [1, null, 3, null, 5], [1.1, null, 3.3, null, 5.5], ['a', null, 'ccc', null, 'eeeee']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**Query examples:**

Count elements in int_array that are greater than 2:
```sql
SELECT array_count(x -> x > 2, int_array) FROM array_count_test WHERE id = 1;
+-------------------------------------+
| array_count(x -> x > 2, int_array)  |
+-------------------------------------+
|                                   3 |
+-------------------------------------+
```

Count elements in double_array that are greater than or equal to 3:
```sql
SELECT array_count(x -> x >= 3, double_array) FROM array_count_test WHERE id = 1;
+------------------------------------------+
| array_count(x -> x >= 3, double_array)   |
+------------------------------------------+
|                                        3 |
+------------------------------------------+
```

Count elements in string_array with length greater than 2:
```sql
SELECT array_count(x -> length(x) > 2, string_array) FROM array_count_test WHERE id = 1;
+--------------------------------------------------+
| array_count(x -> length(x) > 2, string_array)    |
+--------------------------------------------------+
|                                              3   |
+--------------------------------------------------+
```

For empty array calculation:
```sql
SELECT array_count(x -> x > 0, int_array) FROM array_count_test WHERE id = 3;
+-------------------------------------+
| array_count(x -> x > 0, int_array)  |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

For NULL array calculation:
```sql
SELECT array_count(x -> x > 0, int_array) FROM array_count_test WHERE id = 4;
+-------------------------------------+
| array_count(x -> x > 0, int_array)  |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

Count null elements in an array containing null values:
```sql
SELECT array_count(x -> x is null, int_array) FROM array_count_test WHERE id = 2;
+------------------------------------------+
| array_count(x -> x is null, int_array)   |
+------------------------------------------+
|                                        2 |
+------------------------------------------+
```

Count non-null elements in an array containing null values:
```sql
SELECT array_count(x -> x is not null, int_array) FROM array_count_test WHERE id = 2;
+----------------------------------------------+
| array_count(x -> x is not null, int_array)   |
+----------------------------------------------+
|                                            3 |
+----------------------------------------------+
```

Multiple array parameters example:
```sql
SELECT array_count((x, y) -> x > y, [1, 2, 3], [0, 3, 2]);
+--------------------------------------------------+
| array_count((x, y) -> x > y, [1, 2, 3], [0, 3, 2]) |
+--------------------------------------------------+
|                                              2   |
+--------------------------------------------------+
```

Complex type example - count arrays with more than 2 elements:
```sql
SELECT array_count(x -> array_length(x) > 2, [[1,2],[1,2,3],[4,5,6,7]]);
+--------------------------------------------------+
| array_count(x -> array_length(x) > 2, [[1,2],[1,2,3],[4,5,6,7]]) |
+--------------------------------------------------+
|                                              2   |
+--------------------------------------------------+
```

Nested higher-order function example - count arrays that contain elements greater than 5:
```sql
SELECT array_count(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6],[7,8,9]]);
+--------------------------------------------------+
| array_count(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6],[7,8,9]]) |
+--------------------------------------------------+
|                                              2   |
+--------------------------------------------------+
```

Literal array example:
```sql
SELECT array_count(x -> x % 2 = 0, [1, 2, 3, 4, 5, 6]);
+------------------------------------------+
| array_count(x -> x % 2 = 0, [1, 2, 3, 4, 5, 6]) |
+------------------------------------------+
|                                        3 |
+------------------------------------------+
```

### Keywords

ARRAY, COUNT, ARRAY_COUNT 