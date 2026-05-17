---
{
    "title": "ARRAY_PRODUCT",
    "language": "en-US",
    "description": "Calculates the product of all elements in an array. The function iterates through all elements in the array, multiplies them together,"
}
---

## array_product

<version since="2.0.0">

</version>

## Description

Calculates the product of all elements in an array. The function iterates through all elements in the array, multiplies them together, and returns the result.

## Syntax

```sql
array_product(ARRAY<T> arr)
```

### Parameters

- `arr`：ARRAY<T> type, the array for which to calculate the product

**Supported types for T:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- Boolean type: BOOLEAN (true converts to 1, false converts to 0)

### Return Value

Return type: DOUBLE or DECIMAL

Return value meaning:
- Returns the product of all elements in the array
- NULL: if the array is empty, the array is NULL, or all elements are NULL

Usage notes:
- The function skips NULL values in the array and only calculates the product of non-NULL elements
- If all elements in the array are NULL, returns NULL
- Empty arrays return NULL
- Complex types (MAP, STRUCT, ARRAY) do not support product calculation and will cause errors
- For null values in array elements: null elements do not participate in the product calculation

**Query Examples:**

Calculate the product of an integer array:
```sql
SELECT array_product([1, 2, 3, 4, 5]);
+--------------------------------+
| array_product([1, 2, 3, 4, 5]) |
+--------------------------------+
|                            120 |
+--------------------------------+
```

Calculate the product of a float array:
```sql
SELECT array_product([1.1, 2.2, 3.3, 4.4, 5.5]);
+------------------------------------------+
| array_product([1.1, 2.2, 3.3, 4.4, 5.5]) |
+------------------------------------------+
|                                    190.8 |
+------------------------------------------+
```

Calculate the product of an array containing null values:
```sql
SELECT array_product([1, null, 3, null, 5]);
+----------------------------------------+
| array_product([1, null, 3, null, 5])  |
+----------------------------------------+
| 15.0                                   |
+----------------------------------------+
```

Calculate the product of a boolean array (true=1, false=0):
```sql
SELECT array_product([true, false, true, true]);
+------------------------------------------+
| array_product([true, false, true, true]) |
+------------------------------------------+
|                                        0 |
+------------------------------------------+
```

Empty arrays return NULL:
```sql
SELECT array_product([]);
+----------------------+
| array_product([])    |
+----------------------+
| NULL                 |
+----------------------+
```

Arrays with all null elements return NULL:
```sql
SELECT array_product([null, null, null]);
+----------------------------------+
| array_product([null, null, null]) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

Complex type examples:

Nested array types are not supported, causing an error:
```sql
SELECT array_product([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage: array_product does not support type: ARRAY<ARRAY<TINYINT>>
```

Map types are not supported, causing an error:
```sql
SELECT array_product([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage: array_product does not support type: ARRAY<MAP<VARCHAR(1),TINYINT>>
```

Error with wrong number of parameters:
```sql
SELECT array_product([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_product' which has 2 arity. Candidate functions are: [array_product(Expression)]
```

Error when passing non-array types:
```sql
SELECT array_product('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_product(VARCHAR(12))
```

### Keywords

ARRAY, PRODUCT, ARRAY_PRODUCT
