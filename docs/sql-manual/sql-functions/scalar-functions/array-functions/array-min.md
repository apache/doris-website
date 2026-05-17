---
{
    "title": "ARRAY_MIN",
    "language": "en",
    "description": "Calculates the minimum value in an array. The function iterates through all elements in the array, finds the minimum value and returns it."
}
---

## array_min

<version since="2.0.0">

</version>

## Description

Calculates the minimum value in an array. The function iterates through all elements in the array, finds the minimum value and returns it.

## Syntax

```sql
array_min(ARRAY<T> arr)
```

### Parameters

- `arr`：ARRAY<T> type, the array for which to calculate the minimum value.

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6

### Return Value

Return type: T

Return value meaning:
- Returns the minimum value in the array
- NULL: if the array is empty, or if all elements are null

Usage notes:
- Determines the element to return by comparing elements in the array, supports comparing elements of the same data type
- If the array is NULL, it will return a type conversion error
- For null values in array elements: null elements are not included in comparison

**Query Examples:**

Calculate the minimum value of a floating-point array:
```sql
SELECT array_min([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]);
+-------------------------------------------+
| array_min([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]) |
+-------------------------------------------+
|                                       1.1 |
+-------------------------------------------+
```

Calculate the minimum value of a string array (lexicographically):
```sql
SELECT array_min(['zebra', 'apple', 'banana', 'cherry']);
+---------------------------------------------------+
| array_min(['zebra', 'apple', 'banana', 'cherry']) |
+---------------------------------------------------+
| apple                                             |
+---------------------------------------------------+
```

Calculate the minimum value of an array containing null values, null elements are not included in comparison:
```sql
SELECT array_min([5, null, 2, null, 8, 1]);
+-------------------------------------+
| array_min([5, null, 2, null, 8, 1]) |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
```

Empty array returns NULL:
```sql
SELECT array_min([]);
+------------------+
| array_min([])    |
+------------------+
| NULL             |
+------------------+
```

Array with all null elements returns NULL:
```sql
SELECT array_min([null, null, null]);
+----------------------------------+
| array_min([null, null, null])    |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

Minimum value of a date array:
```sql
SELECT array_min(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>));
+--------------------------------------------------------------------------------+
| array_min(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>)) |
+--------------------------------------------------------------------------------+
| 2022-12-31 00:00:00                                                            |
+--------------------------------------------------------------------------------+
```

Minimum value of an IP address array:
```sql
SELECT array_min(CAST(['192.168.1.100', '192.168.1.1', '192.168.1.50'] AS ARRAY<IPV4>));
+----------------------------------------------------------------------------------+
| array_min(CAST(['192.168.1.100', '192.168.1.1', '192.168.1.50'] AS ARRAY<IPV4>)) |
+----------------------------------------------------------------------------------+
| 192.168.1.1                                                                      |
+----------------------------------------------------------------------------------+

SELECT array_min(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>));
+-------------------------------------------------------------------------------+
| array_min(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>)) |
+-------------------------------------------------------------------------------+
| 2001:db8::                                                                    |
+-------------------------------------------------------------------------------+
```

Complex type examples:

Nested array types are not supported, will error:
```sql
SELECT array_min([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_min does not support complex types: array_min([[1, 2], [3, 4], [5, 6]])
```

Map types are not supported, will error:
```sql
SELECT array_min([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_min does not support complex types: array_min([map('k', 1), map('k', 2), map('k', 3)])
```

Error when parameter count is wrong:
```sql
SELECT array_min([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_min' which has 2 arity. Candidate functions are: [array_min(Expression)]
```

Error when passing non-array type:
```sql
SELECT array_min('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

Array is NULL, will return type conversion error:
```sql
mysql> SELECT array_min(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### Keywords

ARRAY, MIN, ARRAY_MIN
