---
{
    "title": "ARRAY_DIFFERENCE",
    "language": "en"
}
---

## array_difference

<version since="2.0.0">


</version>

### Description

Calculates the difference between adjacent elements in an array. The function traverses the array from left to right, calculating the difference between each element and its previous element, and returns a new array with the same length as the original array. The difference of the first element is always 0.

### Syntax

```sql
array_difference(ARRAY<T> arr)
```

### Parameters

- `arr`：ARRAY\<T> type, the array to calculate differences for. Supports column names or constant values.

**T supported types:**
- Integer types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT
- Floating-point types: FLOAT, DOUBLE
- Decimal types: DECIMALV2, DECIMALV3 (including DECIMAL32, DECIMAL64, DECIMAL128I, DECIMAL256)

### Return Value

Return type: ARRAY\<T>

Return value meaning:
- Returns a new array with the same length as the input array, where each position contains the difference between the current element and the previous element, with the first element's difference being 0
- NULL: if the input array is NULL

Usage notes:
- The function will attempt to convert all elements to compatible numeric types for difference calculation. Only the following types support direct calculation:
  - Integer types (TINYINT, SMALLINT, INT, BIGINT, LARGEINT)
  - Floating-point types (FLOAT, DOUBLE)
  - Decimal types (DECIMALV2, DECIMALV3, including DECIMAL32, DECIMAL64, DECIMAL128I, DECIMAL256)
- If the array contains other types (such as strings, dates, etc.), it will attempt to convert elements to DOUBLE type. Elements that fail conversion will result in null and will not participate in the difference calculation.
- The return type of the difference is automatically selected based on the input type:
  - When input is DOUBLE or FLOAT, returns ARRAY\<DOUBLE>
  - When input is integer type, returns ARRAY\<BIGINT> or ARRAY\<LARGEINT>
  - When input is DECIMAL, returns ARRAY\<DECIMAL>, maintaining original precision and scale
- The difference calculation order is from left to right, where each position contains the difference between the current element and the previous element, with the first element being 0.
- Empty array returns empty array, NULL array returns NULL, array with only one element returns [0].
- Complex types (nested arrays, MAP, STRUCT) do not support difference calculation, calling will result in an error.
- The function is nullsafe
- For null values in array elements: null elements will affect subsequent difference calculations, when the previous element is null, the current difference will be null

### Examples

```sql
CREATE TABLE array_difference_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_difference_test VALUES
(1, [1, 3, 6, 10, 15], [1.1, 3.3, 6.6, 11.0, 16.5]),
(2, [10, 30, 60], [10.5, 41.0, 76.5]),
(3, [], []),
(4, NULL, NULL);
```

**Query examples:**

Difference of int_array: each position contains the difference between the current element and the previous element, with the first element being 0.
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 1;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| [0, 2, 3, 4, 5]             |
+-----------------------------+
```

Difference of double_array: difference of floating-point array, result is floating-point.

Note that the result at the second position is 2.1999999999999997, which is due to the small error caused by floating-point binary representation precision (3.3 - 1.1 cannot be precisely represented as 2.2 in binary). The subsequent values 3.3, 4.4, 5.5 may appear as "normal values", but they are actually binary approximations, just that they match the decimal after rounding. This is a phenomenon that all systems based on IEEE 754 floating-point (including MySQL, Snowflake, Python, JavaScript, etc.) will encounter.
```sql
SELECT array_difference(double_array) FROM array_difference_test WHERE id = 1;
+------------------------------------------+
| array_difference(double_array)           |
+------------------------------------------+
| [0, 2.1999999999999997, 3.3, 4.4, 5.5]  |
+------------------------------------------+
```

Empty array returns empty array:
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 3;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL array returns NULL: the function is nullsafe, returning NULL when the input array is NULL without throwing an error.
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 4;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

Array with only one element returns [0]:
```sql
SELECT array_difference([42]);
+------------------------+
| array_difference([42]) |
+------------------------+
| [0]                    |
+------------------------+
```

Array containing null values, when the previous element is null, the current difference will be null.
```sql
SELECT array_difference([1, null, 3, null, 5]);
+-----------------------------------------+
| array_difference([1, null, 3, null, 5]) |
+-----------------------------------------+
| [0, null, null, null, null]             |
+-----------------------------------------+
```

When mixing strings and numbers, elements that can be converted to numbers will participate in the difference calculation, those that cannot be converted will be null, and the result at the corresponding position will be null.
```sql
SELECT array_difference(['a', 1, 'b', 2, 'c', 3]);
+--------------------------------------------+
| array_difference(['a', 1, 'b', 2, 'c', 3]) |
+--------------------------------------------+
| [null, null, null, null, null, null]       |
+--------------------------------------------+
```

Complex type examples:

Nested array type not supported, throws error.
```sql
SELECT array_difference([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<ARRAY<TINYINT>>)
```

Map type not supported, throws error.
```sql
SELECT array_difference([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<MAP<VARCHAR(1),TINYINT>>)
```

Struct type not supported, throws error.
```sql
SELECT array_difference(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<STRUCT<name:TEXT,age:TINYINT>>)
```

Incorrect number of parameters will cause an error.
```sql
SELECT array_difference([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_difference' which has 2 arity. Candidate functions are: [array_difference(Expression)]
```

Passing non-array type will cause an error.
```sql
SELECT array_difference('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(VARCHAR(12))
```

### Keywords

ARRAY, DIFFERENCE, ARRAY_DIFFERENCE 