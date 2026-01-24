---
{
    "title": "ARRAY_PUSHFRONT",
    "language": "en-US",
    
}
---

## array_pushfront

<version since="2.0.0">

</version>

## Description

Adds an element to the beginning of an array. The function returns a new array containing the newly added element plus all elements from the original array.

## Syntax

```sql
array_pushfront(ARRAY<T> arr, T element)
```

### Parameters

- `arr`：ARRAY<T> type, the array to which to add an element
- `element`：T type, the element to add to the beginning of the array

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6
- Complex types: ARRAY, MAP, STRUCT

### Return Value

Return type: ARRAY<T>

Return value meaning:
- Returns a new array containing the newly added element plus all elements from the original array
- NULL: if the input array is NULL

Usage notes:
- The function adds the specified element to the beginning of the array
- Empty arrays can add elements normally, the new element type needs to be compatible with the array element type
- For null values in array elements: null elements are handled normally

**Query Examples:**

Add an element to the beginning of a string array:
```sql
SELECT array_pushfront(['banana', 'cherry', 'date'], 'apple');
+--------------------------------------------------------+
| array_pushfront(['banana', 'cherry', 'date'], 'apple') |
+--------------------------------------------------------+
| ["apple", "banana", "cherry", "date"]                  |
+--------------------------------------------------------+
```

Add a null element to the beginning of an array containing null values:
```sql
SELECT array_pushfront([1, null, 3], null);
+-------------------------------------+
| array_pushfront([1, null, 3], null) |
+-------------------------------------+
| [null, 1, null, 3]                  |
+-------------------------------------+
```

Add an element to the beginning of an empty array:
```sql
SELECT array_pushfront([], 42);
+--------------------------+
| array_pushfront([], 42)  |
+--------------------------+
| [42]                     |
+--------------------------+
```

NULL arrays return NULL:
```sql
SELECT array_pushfront(NULL, 1);
+---------------------------+
| array_pushfront(NULL, 1)  |
+---------------------------+
| NULL                      |
+---------------------------+
```

Add an element to the beginning of a float array:
```sql
SELECT array_pushfront([2.2, 3.3, 4.4], 1.1);
+------------------------------------------+
| array_pushfront([2.2, 3.3, 4.4], 1.1)   |
+------------------------------------------+
| [1.1, 2.2, 3.3, 4.4]                    |
+------------------------------------------+
```

Add an element to the beginning of an IP address array:
```sql
SELECT array_pushfront(CAST(['192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), CAST('192.168.1.1' AS IPV4));
+----------------------------------------------------------------------------------+
| array_pushfront(CAST(['192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), CAST('192.168.1.1' AS IPV4)) |
+----------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2", "192.168.1.3"]                                   |
+----------------------------------------------------------------------------------+
```

Add an element to the beginning of a nested array:
```sql
SELECT array_pushfront([[3,4], [5,6]], [1,2]);
+------------------------------------------+
| array_pushfront([[3,4], [5,6]], [1,2])  |
+------------------------------------------+
| [[1, 2], [3, 4], [5, 6]]                |
+------------------------------------------+
```

Add an element to the beginning of a MAP array:
```sql
SELECT array_pushfront([{'b':2}, {'c':3}], {'a':1});
+----------------------------------------------+
| array_pushfront([{'b':2}, {'c':3}], {'a':1}) |
+----------------------------------------------+
| [{"a":1}, {"b":2}, {"c":3}]                 |
+----------------------------------------------+
```

Add an element to the beginning of a STRUCT array:
```sql
SELECT array_pushfront(array(named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40)), named_struct('name','Alice','age',20));
+-------------------------------------------------------------------------------------------------------------------------------------------+
| array_pushfront(array(named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40)), named_struct('name','Alice','age',20)) |
+-------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}, {"name":"Charlie", "age":40}]                                                    |
+-------------------------------------------------------------------------------------------------------------------------------------------+
```

Error with wrong number of parameters:
```sql
SELECT array_pushfront([1,2,3]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_pushfront' which has 1 arity. Candidate functions are: [array_pushfront(Expression, Expression)]
```

Error when passing non-array types:
```sql
SELECT array_pushfront('not_an_array', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_pushfront(VARCHAR(12), TINYINT)
```

### Keywords

ARRAY, PUSHFRONT, ARRAY_PUSHFRONT
