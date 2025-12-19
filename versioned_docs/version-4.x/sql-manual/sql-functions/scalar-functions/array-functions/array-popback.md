---
{
    "title": "ARRAY_POPBACK",
    "language": "en-US",
    "description": "<version since=\"2.0.0\">"
}
---

## array_popback

<version since="2.0.0">

</version>

## Description

Removes the last element from an array. The function returns a new array containing all elements from the original array except the last one.

## Syntax

```sql
array_popback(ARRAY<T> arr)
```

### Parameters

- `arr`：ARRAY<T> type, the array from which to remove the last element

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
- Returns a new array containing all elements from the original array except the last one
- NULL: if the input array is NULL

Usage notes:
- The function removes the last element from the array and returns the remaining elements
- Empty arrays return empty arrays, arrays with only one element return empty arrays
- For null values in array elements: null elements are handled normally

**Query Examples:**

Remove the last element from a string array:
```sql
SELECT array_popback(['apple', 'banana', 'cherry', 'date']);
+--------------------------------------------------+
| array_popback(['apple', 'banana', 'cherry', 'date']) |
+--------------------------------------------------+
| ["apple", "banana", "cherry"]                    |
+--------------------------------------------------+
```

Remove the last element from an array containing null values:
```sql
SELECT array_popback([1, null, 3, null, 5]);
+--------------------------------------------+
| array_popback([1, null, 3, null, 5])      |
+--------------------------------------------+
| [1, null, 3, null]                        |
+--------------------------------------------+
```

Arrays with only one element return empty arrays:
```sql
SELECT array_popback([42]);
+----------------------+
| array_popback([42])  |
+----------------------+
| []                   |
+----------------------+
```

Empty arrays return empty arrays:
```sql
SELECT array_popback([]);
+----------------------+
| array_popback([])    |
+----------------------+
| []                   |
+----------------------+
```

NULL arrays return NULL:
```sql
SELECT array_popback(NULL);
+----------------------+
| array_popback(NULL)  |
+----------------------+
| NULL                 |
+----------------------+
```

Remove the last element from an IP address array:
```sql
SELECT array_popback(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>));
+----------------------------------------------------------------------------------+
| array_popback(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>)) |
+----------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2"]                                                   |
+----------------------------------------------------------------------------------+
```

Remove the last element from a nested array:
```sql
SELECT array_popback([[1, 2], [3, 4], [5, 6]]);
+------------------------------------------+
| array_popback([[1, 2], [3, 4], [5, 6]]) |
+------------------------------------------+
| [[1, 2], [3, 4]]                         |
+------------------------------------------+
```

Remove the last element from a MAP array:
```sql
SELECT array_popback([{'name':'Alice','age':20}, {'name':'Bob','age':30}, {'name':'Charlie','age':40}]);
+------------------------------------------------------------------------------------------+
| array_popback([{'name':'Alice','age':20}, {'name':'Bob','age':30}, {'name':'Charlie','age':40}]) |
+------------------------------------------------------------------------------------------+
| [{"name":"Alice","age":20}, {"name":"Bob","age":30}]                                     |
+------------------------------------------------------------------------------------------+
```

Remove the last element from a STRUCT array:
```sql
SELECT array_popback(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40)));
+-------------------------------------------------------------------------------------------------------------------------------------------+
| array_popback(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40))) |
+-------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}]                                                                                    |
+-------------------------------------------------------------------------------------------------------------------------------------------+
```

### Keywords

ARRAY, POPBACK, ARRAY_POPBACK
