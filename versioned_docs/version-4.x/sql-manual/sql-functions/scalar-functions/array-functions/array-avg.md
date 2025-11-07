---
{
    "title": "ARRAY_AVG",
    "language": "en"
}
---

## array_avg

<version since="2.0.0">

</version>

## Description

Calculates the average of all numeric elements in an array. The function skips null values and non-numeric elements in the array, only calculating the average for valid numeric elements.

## Syntax

```sql
array_avg(ARRAY<T> arr)
```

### Parameters

- `arr`：ARRAY<T> type, the array for which to calculate the average. Supports column names or constant values.

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING (will attempt to convert to numeric)
- Boolean type: BOOLEAN (will attempt to convert to numeric)

### Return Value

Return type: Automatically selected based on input type

Return value meaning:
- Returns the average of all valid numeric elements in the array
- NULL: if the array is empty, or all elements are NULL or cannot be converted to numeric

Usage notes:
- If the array contains other types (such as strings), it will attempt to convert elements to DOUBLE type. Elements that fail conversion will be skipped and not included in the average calculation
- The function will attempt to convert all elements to compatible numeric types for average calculation. The return type of the average is automatically selected based on the input type:
  - When input is DOUBLE or FLOAT, returns DOUBLE
  - When input is integer types, returns DOUBLE
  - When input is DECIMAL, returns DECIMAL, maintaining original precision and scale
- Empty arrays return NULL, arrays with only one element return that element's value
- If the array is NULL, it will return a type conversion error
- Nested arrays, MAP, STRUCT and other complex types are not supported for average calculation, calling will result in an error
- For null values in array elements: null elements are not included in the average calculation

### Examples

```sql
CREATE TABLE array_avg_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    mixed_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_avg_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['1', '2', '3', '4', '5']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['10', '20', '30']),
(3, [], [], []),
(4, NULL, NULL, NULL),
(5, [1, null, 3, null, 5], [1.1, null, 3.3, null, 5.5], ['1', null, '3', null, '5']);
```

**Query Examples:**

Calculate the average of double_array:
```sql
SELECT array_avg(double_array) FROM array_avg_test WHERE id = 1;
+-------------------------+
| array_avg(double_array) |
+-------------------------+
|                     3.3 |
+-------------------------+
```

Calculate the average of a mixed-type array, strings will be converted to numeric:
```sql
SELECT array_avg(mixed_array) FROM array_avg_test WHERE id = 1;
+------------------------+
| array_avg(mixed_array) |
+------------------------+
|                      3 |
+------------------------+
```

Empty array returns NULL:
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 3;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                 NULL |
+----------------------+
```

NULL array returns NULL:
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 4;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                 NULL |
+----------------------+
```

Array containing null values, null elements are not included in calculation:
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 5;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                    3 |
+----------------------+
```

Complex type examples:

Nested array types are not supported, will error:
```sql
SELECT array_avg([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_avg([[1, 2, 3]]) does not support type: ARRAY<TINYINT>
```

Map types are not supported, will error:
```sql
SELECT array_avg([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_avg([map('k', 1), map('k', 2)]) does not support type: MAP<VARCHAR(1),TINYINT>
```

Error when parameter count is wrong:
```sql
SELECT array_avg([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_avg' which has 2 arity. Candidate functions are: [array_avg(Expression)]
```

Error when passing non-array type:
```sql
SELECT array_avg('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_avg(VARCHAR(12))
```

Array is NULL, will return type conversion error
```
mysql> SELECT array_max(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### Keywords

ARRAY, AVG, ARRAY_AVG
