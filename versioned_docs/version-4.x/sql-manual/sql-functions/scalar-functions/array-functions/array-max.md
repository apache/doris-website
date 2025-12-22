---
{
    "title": "ARRAY_MAX",
    "language": "en",
    
}
---

## array_max

<version since="2.0.0">

</version>

## Description

Calculates the maximum value in an array. The function iterates through all elements in the array, finds the maximum value and returns it.

## Syntax

```sql
array_max(ARRAY<T> arr)
```

### Parameters

- `arr`：ARRAY<T> type, the array for which to calculate the maximum value.

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6

### Return Value

Return type: T

Return value meaning:
- Returns the maximum value in the array
- NULL: if the array is empty, or if all elements are null

Usage notes:
- Determines the element to return by comparing elements in the array, supports comparing elements of the same data type
- If the array is NULL, it will return a type conversion error
- For null values in array elements: null elements are not included in comparison

**Query Examples:**

Calculate the maximum value of a floating-point array:
```sql
SELECT array_max([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]);
+-------------------------------------------+
| array_max([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]) |
+-------------------------------------------+
|                                       9.9 |
+-------------------------------------------+
```

Calculate the maximum value of a string array (lexicographically):
```sql
SELECT array_max(['zebra', 'appleeee', 'banana', 'cherry']);
+------------------------------------------------------+
| array_max(['zebra', 'appleeee', 'banana', 'cherry']) |
+------------------------------------------------------+
| zebra                                                |
+------------------------------------------------------+
```

Calculate the maximum value of an array containing null values:
```sql
SELECT array_max([5, null, 2, null, 8, 1]);
+-------------------------------------+
| array_max([5, null, 2, null, 8, 1]) |
+-------------------------------------+
|                                   8 |
+-------------------------------------+
```

Empty array returns NULL:
```sql
SELECT array_max([]);
+------------------+
| array_max([])    |
+------------------+
| NULL             |
+------------------+
```

Array with all null elements returns NULL:
```sql
SELECT array_max([null, null, null]);
+----------------------------------+
| array_max([null, null, null])    |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

Maximum value of a date array:
```sql
SELECT array_max(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>));
+--------------------------------------------------------------------------------+
| array_max(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>)) |
+--------------------------------------------------------------------------------+
| 2023-06-15 00:00:00                                                            |
+--------------------------------------------------------------------------------+
```

Maximum value of an IP address array:
```sql
SELECT array_max(CAST(['192.168.1.100', '192.168.1.1', '192.168.1.50'] AS ARRAY<IPV4>));
+----------------------------------------------------------------------------------+
| array_max(CAST(['192.168.1.100', '192.168.1.1', '192.168.1.50'] AS ARRAY<IPV4>)) |
+----------------------------------------------------------------------------------+
| 192.168.1.100                                                                    |
+----------------------------------------------------------------------------------+

SELECT array_max(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>));
+-------------------------------------------------------------------------------+
| array_max(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>)) |
+-------------------------------------------------------------------------------+
| 2001:db8::2                                                                   |
+-------------------------------------------------------------------------------+
```

Complex type examples:

Nested array types are not supported, will error:
```sql
SELECT array_max([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_max does not support complex types: array_max([[1, 2], [3, 4], [5, 6]])
```

Map types are not supported, will error:
```sql
SELECT array_max([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_max does not support complex types: array_max([map('k', 1), map('k', 2), map('k', 3)])
```

Error when parameter count is wrong:
```sql
SELECT array_max([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_max' which has 2 arity. Candidate functions are: [array_max(Expression)]
```

Error when passing non-array type:
```sql
SELECT array_max('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

Array is NULL, will return type conversion error:
```sql
mysql> SELECT array_max(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### Keywords

ARRAY, MAX, ARRAY_MAX
