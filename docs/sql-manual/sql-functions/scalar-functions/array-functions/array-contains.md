---
{
      "title": "ARRAY_CONTAINS",
      "language": "en"
}
---

## array_contains

<version since="1.2.0">


</version>

### Description

Checks whether an array contains a specified value. Returns true if found, false otherwise. If the array is NULL, returns NULL.

### Syntax

```sql
array_contains(ARRAY<T> arr, T value)
```

### Parameters

- `arr`：ARRAY\<T> type, the array to check. Supports column names or constant values.
- `value`：T type, the value to search for. The type must be compatible with the array element type.

**T supported types:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6

### Return Value

Return type: BOOLEAN

Return value meaning:
- true: if the array contains the specified value
- false: if the array does not contain the specified value
- NULL: if the input array is NULL

Return value behavior description:

1. Boundary condition behavior:
   - When the input array is empty, returns false
   - When the input array is NULL, returns NULL
   - When the array element type does not match the search value type, returns false
   - For null values in array elements: null elements will be processed normally, and null elements in the array can be searched for

2. Exception value behavior:
   - When array elements are of unsupported types, returns unsupported error

3. Cases that return NULL:
   - When the input array is NULL

**Type compatibility rules:**
1. **Numeric type compatibility**:
   - Integer types can be compared with each other (TINYINT, SMALLINT, INT, BIGINT, LARGEINT)
   - Floating-point types can be compared with each other (FLOAT, DOUBLE)
   - Decimal types can be compared with each other (DECIMAL32, DECIMAL64, DECIMAL128I, DECIMALV2, DECIMAL256)
   - Integers and floating-point numbers can be compared with each other
2. **String type compatibility**:
   - CHAR, VARCHAR, STRING types can be compared with each other
3. **Date and time type compatibility**:
   - DATE and DATEV2 can be compared with each other
   - DATETIME and DATETIMEV2 can be compared with each other

### Examples

**Table creation example**
```sql
CREATE TABLE array_contains_test (
    id INT,
    int_array ARRAY<INT>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO array_contains_test VALUES
(1, [1000, 2000, 3000], ['apple', 'banana', 'cherry']),
(2, [], []),
(3, NULL, NULL),
(4, [1000, null, 3000], ['apple', null, 'cherry']);
```

**Query examples:**

Check if an array contains a specific integer value: This example returns false because 5 is not in int_array.
```sql
SELECT array_contains(int_array, 5) FROM array_contains_test WHERE id = 1;
+-------------------------------+
| array_contains(int_array, 5)  |
+-------------------------------+
| 0                             |
+-------------------------------+
```

Check if a string array contains a specific string: This example returns true because 'banana' is in string_array.
```sql
SELECT array_contains(string_array, 'banana') FROM array_contains_test WHERE id = 1;
+------------------------------------------+
| array_contains(string_array, 'banana')   |
+------------------------------------------+
| 1                                        |
+------------------------------------------+
```

Currently it is an empty array. This example returns false because there are no values in the empty array.
```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 2;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| 0                                |
+----------------------------------+
```

Currently it is a NULL array, this example returns NULL.
```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 3;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

Check for null values in an array containing null elements: This example returns true because the array contains null values.
```sql
SELECT array_contains(int_array, null) FROM array_contains_test WHERE id = 4;
+----------------------------------+
| array_contains(int_array, null)  |
+----------------------------------+
| 1                                |
+----------------------------------+
```

Type compatibility example: searching for a string in an integer array returns false.
```sql
SELECT array_contains(int_array, '1000') FROM array_contains_test WHERE id = 1;
+----------------------------------+
| array_contains(int_array, '1000') |
+----------------------------------+
| 0                                |
+----------------------------------+
```

Literal array example: check if a literal array contains a specific value.
```sql
SELECT array_contains([1, 2, 3, 4, 5], 3);
+----------------------------------+
| array_contains([1, 2, 3, 4, 5], 3) |
+----------------------------------+
| 1                                |
+----------------------------------+
```

Check if a literal array contains null values.
```sql
SELECT array_contains([1, null, 3], null);
+----------------------------------+
| array_contains([1, null, 3], null) |
+----------------------------------+
| 1                                |
+----------------------------------+
```

### Keywords

ARRAY, CONTAINS, ARRAY_CONTAINS 