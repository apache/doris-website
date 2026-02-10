---
{
    "title": "ARRAY_JOIN",
    "language": "en-US",
    "description": "Joins the elements of an array into a string. The function converts all elements in the array to strings and then concatenates them with the "
}
---

## array_join

<version since="2.0.0">

</version>

## Description

Joins the elements of an array into a string. The function converts all elements in the array to strings and then concatenates them with the specified separator.

## Syntax

```sql
array_join(ARRAY<T> arr, STRING separator [, STRING null_replacement])
```

### Parameters

- `arr`：ARRAY<T> type, the array to be joined
- `separator`：STRING type, required parameter, the separator used to separate array elements
- `null_replacement`：STRING type, optional parameter, the string used to replace null values in the array. If this parameter is not provided, null values will be skipped

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6

### Return Value

Return type: STRING

Return value meaning:
- Returns a string containing all elements of the array, joined with the separator
- NULL: if the input array is NULL

Usage notes:
- The function converts each element in the array to a string and joins them with the specified separator
- For null values in array elements:
  - If the `null_replacement` parameter is provided, null elements will be replaced with that string
  - If the `null_replacement` parameter is not provided, null elements will be skipped
- Empty arrays return empty strings

**Query Examples:**

Join arrays with a separator:
```sql
SELECT array_join([1, 2, 3, 4, 5], ',');
+--------------------------------------+
| array_join([1, 2, 3, 4, 5], ',')    |
+--------------------------------------+
| 1,2,3,4,5                           |
+--------------------------------------+
```

Join string arrays with a space separator:
```sql
SELECT array_join(['hello', 'world', 'doris'], ' ');
+--------------------------------------------------+
| array_join(['hello', 'world', 'doris'], ' ')    |
+--------------------------------------------------+
| hello world doris                                |
+--------------------------------------------------+
```

Join arrays containing null values (null values are skipped):
```sql
SELECT array_join([1, null, 3, null, 5], '-');
+--------------------------------------------+
| array_join([1, null, 3, null, 5], '-')    |
+--------------------------------------------+
| 1-3-5                                      |
+--------------------------------------------+
```

Replace null values using the null_replacement parameter:
```sql
SELECT array_join([1, null, 3, null, 5], '-', 'NULL');
+--------------------------------------------------+
| array_join([1, null, 3, null, 5], '-', 'NULL')  |
+--------------------------------------------------+
| 1-NULL-3-NULL-5                                 |
+--------------------------------------------------+
```

Join float arrays:
```sql
SELECT array_join([1.1, 2.2, 3.3], ' | ');
+------------------------------------------+
| array_join([1.1, 2.2, 3.3], ' | ')      |
+------------------------------------------+
| 1.1 | 2.2 | 3.3                         |
+------------------------------------------+
```

Join date arrays:
```sql
SELECT array_join(CAST(['2023-01-01', '2023-06-15', '2023-12-31'] AS ARRAY<DATETIME>), ' to ');
+-----------------------------------------------------------------------------------------+
| array_join(CAST(['2023-01-01', '2023-06-15', '2023-12-31'] AS ARRAY<DATETIME>), ' to ') |
+-----------------------------------------------------------------------------------------+
| 2023-01-01 00:00:00 to 2023-06-15 00:00:00 to 2023-12-31 00:00:00                       |
+-----------------------------------------------------------------------------------------+
```

Join IP address arrays:
```sql
SELECT array_join(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), ' -> ');
+----------------------------------------------------------------------------------+
| array_join(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), ' -> ') |
+----------------------------------------------------------------------------------+
| 192.168.1.1 -> 192.168.1.2 -> 192.168.1.3                                       |
+----------------------------------------------------------------------------------+
```

Empty arrays return empty strings:
```sql
SELECT array_join([], ',');
+----------------------+
| array_join([], ',')  |
+----------------------+
|                      |
+----------------------+
```

NULL arrays return NULL:
```sql
SELECT array_join(NULL, ',');
+----------------------+
| array_join(NULL, ',') |
+----------------------+
| NULL                 |
+----------------------+
```

Error when passing complex types:
```sql
SELECT array_join([{'name':'Alice','age':20}, {'name':'Bob','age':30}], '; ');
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<MAP<TEXT,TEXT>> to target type=ARRAY<VARCHAR(65533)>
```

Error with wrong number of parameters:
```sql
SELECT array_join([1,2,3], ',', 'extra', 'too_many');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_join' which has 4 arity. Candidate functions are: [array_join(Expression, Expression, Expression), array_join(Expression, Expression)]
```

Error when passing non-array types:
```sql
SELECT array_join('not_an_array', ',');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_join(VARCHAR(12), VARCHAR(1))
```

### Keywords

ARRAY, JOIN, ARRAY_JOIN
