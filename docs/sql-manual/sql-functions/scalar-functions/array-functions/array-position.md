---
{
    "title": "ARRAY_POSITION",
    "language": "en"
}
---

## array_position

<version since="2.0.0">

</version>

## Description

Finds the position index (starting from 1) of the first occurrence of a specified element in the array. The function traverses the array from left to right, finds the first matching element and returns its position index.

## Syntax

```sql
array_position(ARRAY<T> arr, T element)
```

### Parameters

- `arr`：ARRAY<T> type, the array to search
- `element`：T type, the element to find

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6

### Return Value

Return type: BIGINT

Return value meaning:
- Returns the position index of the first occurrence of the specified element in the array. The return value starts from 1, not 0. If the element to find is the first element in the array, this function returns 1, not 0
- 0: if no matching element is found, or if the input array is NULL
- NULL: if the input array is NULL

Usage notes:
- The function traverses the array from left to right, finds the first matching element. If no matching element is found, returns 0
- Empty arrays return 0
- For null values in array elements: null elements can be matched normally

**Query Examples:**

Find the position of a string in an array:
```sql
SELECT array_position(['apple', 'banana', 'cherry', 'apple'], 'apple');
+-----------------------------------------------------------------+
| array_position(['apple', 'banana', 'cherry', 'apple'], 'apple') |
+-----------------------------------------------------------------+
|                                                               1 |
+-----------------------------------------------------------------+
```

Find the position of a floating-point number in an array:
```sql
SELECT array_position([1.1, 2.2, 3.3, 4.4, 5.5], 3.3);
+------------------------------------------------+
| array_position([1.1, 2.2, 3.3, 4.4, 5.5], 3.3) |
+------------------------------------------------+
|                                              3 |
+------------------------------------------------+
```

Find a non-existent element:
```sql
SELECT array_position([1, 2, 3, 4, 5], 10);
+-------------------------------------+
| array_position([1, 2, 3, 4, 5], 10) |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

Find a null element:
```sql
SELECT array_position([1, null, 3, null, 5], null);
+---------------------------------------------+
| array_position([1, null, 3, null, 5], null) |
+---------------------------------------------+
|                                           2 |
+---------------------------------------------+
```

Empty array returns 0:
```sql
SELECT array_position([], 1);
+-----------------------+
| array_position([], 1) |
+-----------------------+
|                     0 |
+-----------------------+
```

Input array is NULL, returns NULL:
```sql
SELECT array_position(NULL, 1);
+-------------------------+
| array_position(NULL, 1) |
+-------------------------+
|                    NULL |
+-------------------------+
```

Date type search:
```sql
SELECT array_position(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>), '2023-01-01');
+---------------------------------------------------------------------------------------------------+
| array_position(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>), '2023-01-01') |
+---------------------------------------------------------------------------------------------------+
|                                                                                                 1 |
+---------------------------------------------------------------------------------------------------+
```

IP address search:
```sql
SELECT array_position(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), '192.168.1.2');
+---------------------------------------------------------------------------------------------------+
| array_position(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), '192.168.1.2') |
+---------------------------------------------------------------------------------------------------+
|                                                                                                 2 |
+---------------------------------------------------------------------------------------------------+

SELECT array_position(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>), '2001:db8::0');
+---------------------------------------------------------------------------------------------------+
| array_position(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>), '2001:db8::0') |
+---------------------------------------------------------------------------------------------------+
|                                                                                                 3 |
+---------------------------------------------------------------------------------------------------+
```

Complex type examples:

Nested array types are not supported, will error:
```sql
SELECT array_position([[1,2], [3,4], [5,6]], [3,4]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_position does not support type ARRAY<ARRAY<TINYINT>>, expression is array_position([[1, 2], [3, 4], [5, 6]])
```

Map type search:
```sql
SELECT array_position([{'k':1}, {'k':2}, {'k':3}], {'k':2});
ERROR 1105 (HY000): errCode = 2, detailMessage = array_position does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_position([map('k', 1), map('k', 2), map('k', 3)])
```

Error when parameter count is wrong:
```sql
SELECT array_position([1,2,3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_position' which has 1 arity. Candidate functions are: [array_position(Expression, Expression)]
```

Error when passing non-array type:
```sql
SELECT array_position('not_an_array', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_position(VARCHAR(12), TINYINT)
```

### Keywords

ARRAY, POSITION, ARRAY_POSITION
