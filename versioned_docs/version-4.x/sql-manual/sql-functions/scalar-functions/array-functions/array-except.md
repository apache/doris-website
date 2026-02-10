---
{
    "title": "ARRAY_EXCEPT",
    "language": "en",
    
}
---

## array_except

<version since="2.0.0">

</version>

## Description

Returns elements that exist in the first array but not in the second array, forming a new array after deduplication while maintaining the original order.

## Syntax

```sql
array_except(ARRAY<T> arr1, ARRAY<T> arr2)
```

### Parameters

- `arr1`：ARRAY<T> type, the first array.
- `arr2`：ARRAY<T> type, the second array.

**T supported types:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6

### Return Value

Return type: ARRAY<T>

Return value meaning:
- Returns a new array containing all unique elements that exist in arr1 but not in arr2, maintaining the same order as arr1.
- NULL: if either input array is NULL.

Usage notes:
- Only supports basic type arrays, does not support complex types (ARRAY, MAP, STRUCT).
- Empty array with any array results in an empty array.
- Element comparison follows type compatibility rules, attempts conversion when types are incompatible, fails to null.
- For null values in array elements: null elements are treated as regular elements in operations, null and null are considered the same

### Examples

```sql
CREATE TABLE array_except_test (
    id INT,
    arr1 ARRAY<INT>,
    arr2 ARRAY<INT>,
    str_arr1 ARRAY<STRING>,
    str_arr2 ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_except_test VALUES
(1, [1, 2, 3, 4, 5], [2, 4]),
(2, [10, 20, 30], [30, 40]),
(3, [], [1, 2]),
(4, NULL, [1, 2]),
(5, [1, null, 2, null, 3], [null, 2]),
(6, [1, 2, 3], NULL),
(7, [1, 2, 3], []),
(8, [], []),
(9, [1, 2, 2, 3, 3, 3, 4, 5, 5], [2, 3, 5]),
(10, [1], [1]);
```

**Query examples:**

Basic integer array except:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 1;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3, 5]                   |
+-----------------------------+
```

Partial element overlap:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 2;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [10, 20]                    |
+-----------------------------+
```

Empty array with any array:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 3;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL array: returning NULL when either input array is NULL without throwing an error.
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 4;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

Array containing null values:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 5;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3]                      |
+-----------------------------+
```

Second array is NULL: returning NULL when either input array is NULL without throwing an error.
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 6;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

Second array is empty:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 7;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 2, 3]                   |
+-----------------------------+
```

Both arrays are empty:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 8;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

Deduplication example:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 9;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 4]                      |
+-----------------------------+
```

All elements are excepted:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 10;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

String array except:
```sql
SELECT array_except(['a', 'b', 'c', 'd'], ['b', 'd']);
+----------------------------------+
| array_except(['a','b','c','d'],['b','d']) |
+----------------------------------+
| ["a", "c"]                      |
+----------------------------------+
```

### Exception examples

Incorrect number of parameters:
```sql
SELECT array_except([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_except' which has 1 arity. Candidate functions are: [array_except(Expression, Expression)]
```

Incompatible types:
```sql
SELECT array_except([1, 2, 3], ['a', 'b']);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<INT>, ARRAY<VARCHAR(1)>)
```

Passing non-array type:
```sql
SELECT array_except('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(VARCHAR(12), ARRAY<INT>)
```

Complex types not supported:
```sql
SELECT array_except([[1,2],[3,4]], [[3,4]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<ARRAY<INT>>, ARRAY<ARRAY<INT>>)
```

### Keywords

ARRAY, EXCEPT, ARRAY_EXCEPT 