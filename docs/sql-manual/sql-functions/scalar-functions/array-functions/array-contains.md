---
{
      "title": "ARRAY_CONTAINS",
      "language": "en"
}
---

## array_contains

<version since="1.2.0">


</version>

## Description

Checks whether an array contains a specified value. Returns true if found, false otherwise. If the array is NULL, returns NULL.

## Syntax

```sql
array_contains(ARRAY<T> arr, T value)
```

### Parameters

- `arr`：ARRAY<T> type, the array to check. Supports column names or constant values.
- `value`：T type, the value to search for. Type must be compatible with array element type.

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
   - Returns false when the input array is empty
   - Returns NULL when the input array is NULL
   - Returns false when array element type does not match the search value type
   - For null values in array elements: null elements are processed normally, can search for null elements in arrays

2. Exception value behavior:
   - Returns unsupported error when array elements are of unsupported types

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

Check if an array contains null
In this example, the value_expr parameter is null, and there are no null elements in the array, so it returns false.
```sql
SELECT array_contains([1, 2, 3], null);
+---------------------------------+
| array_contains([1, 2, 3], null) |
+---------------------------------+
|                               0 |
+---------------------------------+
```

Check if an array contains null
In this example, the value_expr parameter is null, and the array contains SQL null values, so it returns true.
```sql
SELECT array_contains([null, 1, 2], null);
+------------------------------------+
| array_contains([null, 1, 2], null) |
+------------------------------------+
|                                  1 |
+------------------------------------+
```

When the search value type is incompatible with array element type, returns false.
```sql
SELECT array_contains([1, 2, 3], 'string');
+-------------------------------------+
| array_contains([1, 2, 3], 'string') |
+-------------------------------------+
| 0                                   |
+-------------------------------------+
```

When the search value type cannot be type-converted with array elements, an error is returned
```sql
SELECT array_contains([1, 2, 3], [4, 5, 6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<TINYINT> to target type=TINYINT
```

Unsupported complex types will throw an error. In this example, the array is a nested array type, returning an unsupported error.
```sql
SELECT array_contains([[1,2],[2,3]], [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_contains(Array(Nullable(Array(Nullable(TINYINT)))), Array(Nullable(TINYINT)))
```

### Notes

Performance considerations: When dealing with large arrays, if performance is a major concern, you can use inverted indexes for accelerated queries, but there are some usage restrictions to note:

1. The property for creating an array inverted index can only be a non-tokenized index
2. The element type T of the array must be a data type that supports creating inverted indexes
3. If the query condition parameter T is NULL, the index cannot be used for acceleration
4. Index acceleration only occurs when the function is used as a predicate filter condition

```sql
-- Table creation example
CREATE TABLE `test_array_index` (
    `apply_date` date NULL COMMENT '',
    `id` varchar(60) NOT NULL COMMENT '',
    `inventors` array<text> NULL COMMENT '' -- Add non-tokenized inverted index to array column when creating table
  ) ENGINE=OLAP
  DUPLICATE KEY(`apply_date`, `id`)
  COMMENT 'OLAP'
  DISTRIBUTED BY HASH(`id`) BUCKETS 1
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1",
  "is_being_synced" = "false",
  "storage_format" = "V2",
  "light_schema_change" = "true",
  "disable_auto_compaction" = "false",
  "enable_single_replica_compaction" = "false"
  );
-- Query example
SELECT id, inventors FROM test_array_index WHERE array_contains(inventors, 'x') ORDER BY id;
```

### Keywords

ARRAY, CONTAIN, CONTAINS, ARRAY_CONTAINS 