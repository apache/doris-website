---
{
    "title": "ARRAY | Array Functions",
    "language": "en-US"
}
---

## array

<version since="2.0.0">

</version>

## Description

Creates an array. The function accepts zero or more parameters and returns an array containing all input elements.

## Syntax

```sql
array([element1, element2, ...])
```

### Parameters

- `element1, element2, ...`：Any type, elements to be included in the array. Supports zero or more parameters.

**Supported element types:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6
- Complex types: ARRAY, MAP, STRUCT

### Return Value

Return type: ARRAY<T>

Return value meaning:
- Returns an array containing all input elements
- Empty array: if no input parameters

Usage notes:
- The function combines all input elements of the same data type into an array. If element types are incompatible, it will attempt type conversion
- Complex types and basic types cannot be compatibly combined into an array, and complex types cannot be compatibly combined with each other
- Supports zero or more parameters

**Query Examples:**

Create an array with multiple elements:
```sql
SELECT array(1, 2, 3, 4, 5);
+----------------------+
| array(1, 2, 3, 4, 5) |
+----------------------+
| [1, 2, 3, 4, 5]     |
+----------------------+
```

Create an array with elements of different types:
```sql
SELECT array(1, 'hello', 3.14, true);
+----------------------------------+
| array(1, 'hello', 3.14, true)    |
+----------------------------------+
| ["1", "hello", "3.14", "true"]   |
+----------------------------------+
```

Create an empty array:
```sql
SELECT array();
+----------+
| array()  |
+----------+
| []       |
+----------+
```

Create an array with null elements:
```sql
SELECT array(1, null, 3, null, 5);
+--------------------------------+
| array(1, null, 3, null, 5)    |
+--------------------------------+
| [1, null, 3, null, 5]         |
+--------------------------------+
```

### Complex Type Examples

Create an array containing arrays:
```sql
SELECT array([1,2], [3,4], [5,6]);
+----------------------------+
| array([1,2], [3,4], [5,6]) |
+----------------------------+
| [[1, 2], [3, 4], [5, 6]]   |
+----------------------------+
```

Create an array containing maps:
```sql
SELECT array({'a':1}, {'b':2}, {'c':3});
+----------------------------------+
| array({'a':1}, {'b':2}, {'c':3}) |
+----------------------------------+
| [{"a":1}, {"b":2}, {"c":3}]      |
+----------------------------------+
```

Create an array containing structs:
```sql
SELECT array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30));
+-----------------------------------------------------------------------------------+
| array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30)) |
+-----------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}]                            |
+-----------------------------------------------------------------------------------+
```

Mixing complex types with basic types will cause an error:
```sql
SELECT array([1,2], 'hello');
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<TINYINT> to target type=TEXT
```

Mixing different complex types will cause an error:
```sql
SELECT array([1,2], named_struct('name','Alice','age',20));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array(ARRAY<TINYINT>, STRUCT<name:VARCHAR(5),age:TINYINT>)
```

### Keywords

ARRAY

