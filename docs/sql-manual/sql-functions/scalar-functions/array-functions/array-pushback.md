---
{
    "title": "ARRAY_PUSHBACK",
    "language": "en-US"
}
---

## array_pushback

<version since="2.0.0">

</version>

## Description

Adds an element to the end of an array. The function returns a new array containing all elements from the original array plus the newly added element.

## Alias

- array_append

## Syntax

```sql
array_pushback(ARRAY<T> arr, T element)
```

### Parameters

- `arr`：ARRAY<T> type, the array to which to add an element
- `element`：T type, the element to add to the end of the array

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
- Returns a new array containing all elements from the original array plus the newly added element
- NULL: if the input array is NULL

Usage notes:
- The function adds the specified element to the end of the array
- Empty arrays can add elements normally, the new element type needs to be compatible with the array element type
- For null values in array elements: null elements are handled normally

**Query Examples:**

Add an element to the end of a string array:
```sql
SELECT array_pushback(['apple', 'banana', 'cherry'], 'date');
+----------------------------------------------------+
| array_pushback(['apple', 'banana', 'cherry'], 'date') |
+----------------------------------------------------+
| ["apple", "banana", "cherry", "date"]              |
+----------------------------------------------------+
```

Add a null element to the end of an array containing null values:
```sql
SELECT array_pushback([1, null, 3], null);
+------------------------------------+
| array_pushback([1, null, 3], null) |
+------------------------------------+
| [1, null, 3, null]                 |
+------------------------------------+
```

Add an element to the end of an empty array:
```sql
SELECT array_pushback([], 42);
+--------------------------+
| array_pushback([], 42)   |
+--------------------------+
| [42]                     |
+--------------------------+
```

Add an element to the end of a float array:
```sql
SELECT array_pushback([1.1, 2.2, 3.3], 4.4);
+------------------------------------------+
| array_pushback([1.1, 2.2, 3.3], 4.4)    |
+------------------------------------------+
| [1.1, 2.2, 3.3, 4.4]                    |
+------------------------------------------+
```

NULL arrays return NULL:
```sql
SELECT array_pushback(NULL, 1);
+--------------------------+
| array_pushback(NULL, 1)  |
+--------------------------+
| NULL                     |
+--------------------------+
```

Add an element to the end of an IP address array:
```sql
SELECT array_pushback(CAST(['192.168.1.1', '192.168.1.2'] AS ARRAY<IPV4>), CAST('192.168.1.3' AS IPV4));
+----------------------------------------------------------------------------------+
| array_pushback(CAST(['192.168.1.1', '192.168.1.2'] AS ARRAY<IPV4>), CAST('192.168.1.3' AS IPV4)) |
+----------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2", "192.168.1.3"]                                   |
+----------------------------------------------------------------------------------+
```

Add an element to the end of a nested array:
```sql
SELECT array_pushback([[1,2], [3,4]], [5,6]);
+------------------------------------------+
| array_pushback([[1,2], [3,4]], [5,6])   |
+------------------------------------------+
| [[1, 2], [3, 4], [5, 6]]                |
+------------------------------------------+
```

Add an element to the end of a MAP array:
```sql
SELECT array_pushback([{'a':1}, {'b':2}], {'c':3});
+----------------------------------------------+
| array_pushback([{'a':1}, {'b':2}], {'c':3}) |
+----------------------------------------------+
| [{"a":1}, {"b":2}, {"c":3}]                 |
+----------------------------------------------+
```

Add an element to the end of a STRUCT array:
```sql
SELECT array_pushback(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30)), named_struct('name','Charlie','age',40));
+-------------------------------------------------------------------------------------------------------------------------------------------+
| array_pushback(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30)), named_struct('name','Charlie','age',40)) |
+-------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}, {"name":"Charlie", "age":40}]                                                    |
+-------------------------------------------------------------------------------------------------------------------------------------------+
```

Error with wrong number of parameters:
```sql
SELECT array_pushback([1,2,3]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_pushback' which has 1 arity. Candidate functions are: [array_pushback(Expression, Expression)]
```

Error when passing non-array types:
```sql
SELECT array_pushback('not_an_array', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_pushback(VARCHAR(12), TINYINT)
```

### Keywords

ARRAY, PUSHBACK, ARRAY_PUSHBACK
