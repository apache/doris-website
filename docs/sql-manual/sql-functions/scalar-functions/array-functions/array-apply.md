---
{
    "title": "ARRAY_APPLY",
    "language": "en"
}
---

## array_apply

<version since="1.2.3">


</version>

## Description

Filters array elements using a specified binary operator and returns a new array containing elements that satisfy the condition. This is a simplified array filtering function that uses predefined operators instead of lambda expressions.

## Syntax

```sql
array_apply(arr, op, val)
```

### Parameters

- `arr`：ARRAY\<T> type, the array to filter
- `op`：STRING type, the filtering condition operator, must be a constant value. Supported operators: `=`, `!=`, `>`, `>=`, `<`, `<=`
- `val`：T type, the filtering condition value, must be a constant value

**T supported types:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN

### Return Value

Return type: ARRAY\<T>

Return value meaning:
- Returns a new array containing all elements that satisfy the filtering condition
- NULL: if the input array is NULL or the condition value is NULL
- Empty array: if no elements satisfy the condition

Usage notes:
- The operator and condition value must be constants, not column names or expressions
- Limited supported types, mainly numeric, date, and boolean types
- Empty array returns empty array, NULL array returns NULL
- For null values in array elements: null elements will be filtered out and not participate in comparison operations

### Examples

```sql
CREATE TABLE array_apply_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    date_array ARRAY<DATE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_apply_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['2023-02-01', '2023-02-02', '2023-02-03']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**Query examples:**

Filter elements in double_array that are greater than 2:
```sql
SELECT array_apply(double_array, ">", 2) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(double_array, '>', 2)        |
+------------------------------------------+
| [2.2, 3.3, 4.4, 5.5]                     |
+------------------------------------------+
```

Filter elements in int_array that are not equal to 3:
```sql
SELECT array_apply(int_array, "!=", 3) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(int_array, '!=', 3)          |
+------------------------------------------+
| [1, 2, 4, 5]                             |
+------------------------------------------+
```

Filter elements in date_array that are greater than or equal to the specified date:
```sql
SELECT array_apply(date_array, ">=", '2023-01-03') FROM array_apply_test WHERE id = 1;
+---------------------------------------------+
| array_apply(date_array, ">=", '2023-01-03') |
+---------------------------------------------+
| ["2023-01-03", "2023-01-04", "2023-01-05"]  |
+---------------------------------------------+
```

Empty array returns empty array:
```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 3;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| []                                        |
+------------------------------------------+
```

NULL array returns NULL: returning NULL when the input array is NULL without throwing an error.
```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 4;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| NULL                                      |
+------------------------------------------+
```

Array containing null values, null elements will be filtered:
```sql
SELECT array_apply([1, null, 3, null, 5], ">", 2);
+------------------------------------------+
| array_apply([1, null, 3, null, 5], '>', 2) |
+------------------------------------------+
| [3, 5]                                   |
+------------------------------------------+
```

### Exception Examples

Unsupported operator:
```sql
SELECT array_apply([1,2,3], "like", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], 'like', 2), array_apply(arr, op, val): op support =, >=, <=, >, <, !=, but we get like
```

Unsupported string type:
```sql
SELECT array_apply(['a','b','c'], "=", 'a');
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type VARCHAR(1), expression is array_apply(['a', 'b', 'c'], '=', 'a')
```

Unsupported complex type:
```sql
SELECT array_apply([[1,2],[3,4]], "=", [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type ARRAY<TINYINT>, expression is array_apply([[1, 2], [3, 4]], '=', [1, 2])
```

Operator is not a constant:
```sql
SELECT array_apply([1,2,3], concat('>', '='), 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], concat('>', '='), 2), array_apply(arr, op, val): op support const value only.
```

Condition value is not a constant:
```sql
SELECT array_apply([1,2,3], ">", id) FROM array_apply_test WHERE id = 1;
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], '>', id), array_apply(arr, op, val): val support const value only.
```

Incorrect number of parameters:
```sql
SELECT array_apply([1,2,3], ">");
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_apply' which has 2 arity. Candidate functions are: [array_apply(Expression, Expression, Expression)]
```

Passing non-array type:
```sql
SELECT array_apply('not_an_array', ">", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### Keywords

ARRAY, APPLY, ARRAY_APPLY 