---
{
    "title": "ARRAY_CUM_SUM",
    "language": "en"
}
---

## array_cum_sum

<version since="2.0.0">

</version>

## Description

Calculates the cumulative sum of an array. The function traverses the array from left to right, calculating the sum of all elements from the beginning to the current position (including the current position), and returns a new array with the same length as the original array.

## Syntax

```sql
array_cum_sum(ARRAY<T> arr)
```

### Parameters

- `arr`：ARRAY\<T> type, the array to calculate cumulative sum for. Supports column names or constant values.

**T supported types:**
  - Integer types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT
  - Floating-point types: FLOAT, DOUBLE
  - Decimal types: DECIMALV2, DECIMALV3 (including DECIMAL32, DECIMAL64, DECIMAL128I, DECIMAL256)

### Return Value

Return type: ARRAY\<T>

Return value meaning:

- Returns a new array with the same length as the input array, where each position contains the sum of all elements from the beginning to the current position in the original array
- NULL: if the input array is NULL

Usage notes:
- The function will attempt to convert all elements to compatible numeric types for cumulative sum calculation. Only the following types support direct accumulation:
  - Integer types (TINYINT, SMALLINT, INT, BIGINT, LARGEINT)
  - Floating-point types (FLOAT, DOUBLE)
  - Decimal types (DECIMALV2, DECIMALV3, including DECIMAL32, DECIMAL64, DECIMAL128I, DECIMAL256)
- If the array contains other types (such as strings, dates, etc.), it will attempt to convert elements to DOUBLE type. Elements that fail conversion will result in null and will not participate in the cumulative sum.
- The return type of the cumulative sum is automatically selected based on the input type:
  - When input is DOUBLE or FLOAT, returns ARRAY\<DOUBLE>
  - When input is integer type, returns ARRAY\<BIGINT> or ARRAY\<LARGEINT>
  - When input is DECIMAL, returns ARRAY\<DECIMAL>, maintaining original precision and scale
- The cumulative sum calculation order is from left to right, where each position contains the sum of all non-null elements before it.
- Empty array returns empty array, NULL array returns NULL, array with only one element returns the original array.
- Nested arrays, MAP, STRUCT and other complex types do not support cumulative sum, calling will result in an error.
- For null values in array elements: null elements do not participate in cumulative sum calculation, and the result at the corresponding position is null

### Examples

```sql
CREATE TABLE array_cum_sum_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_cum_sum_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]),
(2, [10, 20, 30], [10.5, 20.5, 30.5]),
(3, [], []),
(4, NULL, NULL);
```

**Query examples:**

Cumulative sum of int_array: each position contains the sum of all elements from the beginning to the current position (including the current position).
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 1;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| [1, 3, 6, 10, 15]           |
+-----------------------------+
```

Cumulative sum of double_array: cumulative sum of floating-point array, result is floating-point.

Note that the result at the second position is 3.3000000000000003, which is due to the small error caused by floating-point binary representation precision. 1.1 and 2.2 cannot be precisely represented in binary floating-point (IEEE 754 double), they can only be stored approximately. After adding them together, the error accumulates, resulting in 3.3000000000000003. Subsequent cumulative sums (such as 6.6, 11, 16.5) may appear as "normal values", but they are actually approximate values, just that they match the decimal after rounding. This is a phenomenon that all systems based on IEEE 754 floating-point (including MySQL, Snowflake, Python, JavaScript, etc.) will encounter.
```sql
SELECT array_cum_sum(double_array) FROM array_cum_sum_test WHERE id = 1;
+------------------------------------------+
| array_cum_sum(double_array)              |
+------------------------------------------+
| [1.1, 3.3000000000000003, 6.6, 11, 16.5] |
+------------------------------------------+
```

When mixing strings and numbers, elements that can be converted to numbers will participate in the cumulative sum, those that cannot be converted will be null, and the result at the corresponding position will be null.
```sql
SELECT array_cum_sum(['a', 1, 'b', 2, 'c', 3]);
+------------------------------------------+
| array_cum_sum(['a', 1, 'b', 2, 'c', 3]) |
+------------------------------------------+
| [null, 1, null, 3, null, 6]             |
+------------------------------------------+
```

Empty array returns empty array:
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 3;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL array returns NULL: returning NULL when the input array is NULL without throwing an error.
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 4;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

Array with only one element returns the original array:
```sql
SELECT array_cum_sum([42]);
+----------------------+
| array_cum_sum([42])  |
+----------------------+
| [42]                 |
+----------------------+
```

Array containing null values, null elements do not participate in cumulative sum, result at corresponding position is null.
```sql
SELECT array_cum_sum([1, null, 3, null, 5]);
+-----------------------------+
| array_cum_sum([1, null, 3, null, 5]) |
+-----------------------------+
| [1, null, 4, null, 9]                |
+-----------------------------+
```

Complex type examples:

Nested array type not supported, throws error.
```sql
SELECT array_cum_sum([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<ARRAY<TINYINT>>)
```

Map type not supported, throws error.
```sql
SELECT array_cum_sum([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<MAP<VARCHAR(1),TINYINT>>)
```

Struct type not supported, throws error.
```sql
SELECT array_cum_sum(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<STRUCT<name:TEXT,age:TINYINT>>)
```

Incorrect number of parameters will cause an error.
```sql
SELECT array_cum_sum([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_cum_sum' which has 2 arity. Candidate functions are: [array_cum_sum(Expression)]
```

Passing non-array type will cause an error.
```sql
SELECT array_cum_sum('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(VARCHAR(12))
```

### Keywords

ARRAY, CUM, SUM, CUM_SUM, ARRAY_CUM_SUM 