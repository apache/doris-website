---
{
    "title": "ARRAY_CONCAT",
    "language": "en",
    "description": "<version since=\"2.0.0\">"
}
---

## array_concat

<version since="2.0.0">


</version>

## Description

Concatenates all input arrays into a single array. The function accepts one or more arrays as parameters and connects them into a new array in the order of the parameters.

## Syntax

```sql
array_concat(ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### Parameters

- `arr1, arr2, ...`：ARRAY\<T> type, the arrays to concatenate. Supports column names or constant values.

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
- The concatenated new array containing all elements from the input arrays, maintaining the original order
- NULL: if any input array is NULL

Usage notes:
- Empty arrays will be ignored and will not add any elements
- When there is only one array and it is empty, returns an empty array; when there is only one array and it is NULL, returns NULL
- Complex types (nested arrays, MAP, STRUCT) require completely consistent structure when concatenating, otherwise an error will be thrown
- For null values in array elements: null elements will be normally retained in the concatenation result

### Examples

```sql
CREATE TABLE array_concat_test (
    id INT,
    int_array1 ARRAY<INT>,
    int_array2 ARRAY<INT>,
    string_array1 ARRAY<STRING>,
    string_array2 ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_concat_test VALUES
(1, [1, 2, 3], [4, 5, 6], ['a', 'b'], ['c', 'd']),
(2, [10, 20], [30, 40], [], ['x', 'y']),
(3, NULL, [100, 200], NULL, ['z']),
(4, [], [], [], []),
(5, [1, null, 3], [null, 5, 6], ['a', null, 'c'], ['d', 'e']);
```

**Query examples:**

Concatenating multiple array literals:
```sql
SELECT array_concat([1, 2], [7, 8], [5, 6]);
+--------------------------------------+
| array_concat([1, 2], [7, 8], [5, 6]) |
+--------------------------------------+
| [1, 2, 7, 8, 5, 6]                   |
+--------------------------------------+
```

String array concatenation:
```sql
SELECT array_concat(string_array1, string_array2) FROM array_concat_test WHERE id = 1;
+--------------------------------------------+
| array_concat(string_array1, string_array2) |
+--------------------------------------------+
| ["a", "b", "c", "d"]                       |
+--------------------------------------------+
```

Empty array concatenation:
```sql
SELECT array_concat([], []);
+----------------------+
| array_concat([], []) |
+----------------------+
| []                   |
+----------------------+
```

NULL array concatenation:
```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 3;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```

Array concatenation containing null elements: null elements will be normally retained in the concatenation result.
```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 5;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| [1, null, 3, null, 5, 6]             |
+--------------------------------------+
```

Type compatibility example: concatenating int_array1 and string_array1, string elements cannot be converted to int, resulting in null.
```sql
SELECT array_concat(int_array1, string_array1) FROM array_concat_test WHERE id = 1;
+-----------------------------------------+
| array_concat(int_array1, string_array1) |
+-----------------------------------------+
| [1, 2, 3, null, null]                   |
+-----------------------------------------+
```

Complex type examples:

Nested array concatenation, can be concatenated when structures are consistent.
```sql
SELECT array_concat([[1,2],[3,4]], [[5,6],[7,8]]);
+--------------------------------------------+
| array_concat([[1,2],[3,4]], [[5,6],[7,8]]) |
+--------------------------------------------+
| [[1, 2], [3, 4], [5, 6], [7, 8]]           |
+--------------------------------------------+
```

When nested array structures are inconsistent, an error is thrown.
```sql
SELECT array_concat([[1,2]], [{'k':1}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<ARRAY<INT>> to target type=ARRAY<DOUBLE>
```

Map type concatenation, can be concatenated when structures are consistent.
```sql
SELECT array_concat([{'k':1}], [{'k':2}]);
+------------------------------------+
| array_concat([{'k':1}], [{'k':2}]) |
+------------------------------------+
| [{"k":1}, {"k":2}]                 |
+------------------------------------+
```

Struct type concatenation, can be concatenated when structures are consistent.
```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30)));
+--------------------------------------------------------------------------------------------------------+
| array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30))) |
+--------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}]                                                 |
+--------------------------------------------------------------------------------------------------------+
```

When struct structures are inconsistent, an error is thrown.
```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('id',1,'score',95.5,'age',10)));
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<STRUCT<name:VARCHAR(5),age:TINYINT>> to target type=ARRAY<DOUBLE>
```

Incorrect number of parameters will cause an error.
```sql
SELECT array_concat();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_concat' which has 0 arity. Candidate functions are: [array_concat(Expression, Expression, ...)]
```

Passing non-array type will cause an error.
```sql
SELECT array_concat('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_concat(VARCHAR(12))
```

### Notes

Ensure that all input array element types are compatible, especially for nested complex types where the structure should be consistent to avoid type conversion errors at runtime.

### Keywords

ARRAY, CONCAT, ARRAY_CONCAT 