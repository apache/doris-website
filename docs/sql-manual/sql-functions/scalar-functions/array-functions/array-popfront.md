---
{
    "title": "ARRAY_POPFRONT",
    "language": "en-US",
    "description": "Removes the first element from an array. The function returns a new array containing all elements from the original array except the first one."
}
---

## array_popfront

<version since="2.0.0">

</version>

## Description

Removes the first element from an array. The function returns a new array containing all elements from the original array except the first one.

## Syntax

```sql
array_popfront(ARRAY<T> arr)
```

### Parameters

- `arr`：ARRAY<T> type, the array from which to remove the first element

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
- Returns a new array containing all elements from the original array except the first one
- NULL: if the input array is NULL

Usage notes:
- The function removes the first element from the array and returns the remaining elements
- Empty arrays return empty arrays, arrays with only one element return empty arrays
- For null values in array elements: null elements are handled normally

**Query Examples:**

Remove the first element from a string array:
```sql
SELECT array_popfront(['apple', 'banana', 'cherry', 'date']);
+----------------------------------------------------+
| array_popfront(['apple', 'banana', 'cherry', 'date']) |
+----------------------------------------------------+
| ["banana", "cherry", "date"]                       |
+----------------------------------------------------+
```

Remove the first element from an array containing null values:
```sql
SELECT array_popfront([1, null, 3, null, 5]);
+------------------------------------------+
| array_popfront([1, null, 3, null, 5])   |
+------------------------------------------+
| [null, 3, null, 5]                      |
+------------------------------------------+
```

Arrays with only one element return empty arrays:
```sql
SELECT array_popfront([42]);
+------------------------+
| array_popfront([42])   |
+------------------------+
| []                     |
+------------------------+
```

Empty arrays return empty arrays:
```sql
SELECT array_popfront([]);
+------------------------+
| array_popfront([])     |
+------------------------+
| []                     |
+------------------------+
```

NULL arrays return NULL:
```sql
SELECT array_popfront(NULL);
+------------------------+
| array_popfront(NULL)   |
+------------------------+
| NULL                   |
+------------------------+
```

Remove the first element from an IP address array:
```sql
SELECT array_popfront(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>));
+----------------------------------------------------------------------------------+
| array_popfront(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>)) |
+----------------------------------------------------------------------------------+
| ["192.168.1.2", "192.168.1.3"]                                                   |
+----------------------------------------------------------------------------------+
```

Remove the first element from a nested array:
```sql
SELECT array_popfront([[1, 2], [3, 4], [5, 6]]);
+------------------------------------------+
| array_popfront([[1, 2], [3, 4], [5, 6]]) |
+------------------------------------------+
| [[3, 4], [5, 6]]                         |
+------------------------------------------+
```

Remove the first element from a MAP array:
```sql
SELECT array_popfront([{'name':'Alice','age':20}, {'name':'Bob','age':30}, {'name':'Charlie','age':40}]);
+------------------------------------------------------------------------------------------+
| array_popfront([{'name':'Alice','age':20}, {'name':'Bob','age':30}, {'name':'Charlie','age':40}]) |
+------------------------------------------------------------------------------------------+
| [{"name":"Bob","age":30}, {"name":"Charlie","age":40}]                                   |
+------------------------------------------------------------------------------------------+
```

Remove the first element from a STRUCT array:
```sql
SELECT array_popfront(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40)));
+-------------------------------------------------------------------------------------------------------------------------------------------+
| array_popfront(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40))) |
+-------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Bob", "age":30}, {"name":"Charlie", "age":40}]                                                                                  |
+-------------------------------------------------------------------------------------------------------------------------------------------+
```

### Keywords

ARRAY, POPFRONT, ARRAY_POPFRONT
