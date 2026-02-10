---
{
    "title": "ARRAY_COMPACT",
    "language": "en",
    
}
---

## array_compact

<version since="2.0.0">


</version>

## Description

Removes consecutive duplicate elements from an array, keeping only the first occurrence of each different value. The function traverses the array from left to right, skipping elements that are the same as the previous element, and only retains the first occurrence of each value.

## Syntax

```sql
array_compact(ARRAY<T> arr)
```

### Parameters

- `arr`：ARRAY<T> type, the array to deduplicate. Supports column names or constant values.

**T supported types:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6
- Complex data types: ARRAY

### Return Value

Return type: ARRAY\<T>

Return value meaning:
- The deduplicated array, keeping only the first occurrence of consecutive duplicate elements
- NULL: if the input array is NULL

Return value behavior description:

1. Normal deduplication behavior:
   - Traverses the array from left to right, keeping the first occurrence of each element, skipping consecutive elements that are the same as the previous element
   - Only removes consecutive duplicate elements, non-consecutive duplicate elements will be retained
   - Retains null values (null and null are considered the same)

2. Boundary condition behavior:
   - When the input array is empty, returns an empty array
   - When the input array is NULL, returns NULL
   - When the array has only one element, returns the original array

Usage notes:

- The function maintains the original order of array elements
- Only removes consecutive duplicate elements, does not perform global deduplication
- map, struct do not support deduplication logic
- For null values in array elements: null elements will be processed normally, multiple consecutive null elements will be merged into one

### Examples

```sql
CREATE TABLE array_compact_test (
    id INT,
    int_array ARRAY<INT>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_compact_test VALUES
(1, [1, 1, 2, 2, 2, 3, 1, 4], ['a', 'a', 'b', 'b', 'c']),
(2, [1, 2, 3, 1, 2, 3], ['a', 'b', 'a', 'b']),
(3, [1, null, null, 2, null, null, 3], ['a', null, null, 'b']),
(4, [], []),
(5, NULL, NULL);
```

**Query examples:**

Consecutive duplicate removal in string_array: Only adjacent 'a' or 'b' will be removed, 'c' is retained.
```sql
SELECT array_compact(string_array) FROM array_compact_test WHERE id = 1;
+-----------------------------+
| array_compact(string_array) |
+-----------------------------+
| ["a", "b", "c"]             |
+-----------------------------+
```

Non-consecutive duplicate elements will not be removed, original order and content are preserved.
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 2;
+-------------------------------+
| array_compact(int_array)      |
+-------------------------------+
| [1, 2, 3, 1, 2, 3]            |
+-------------------------------+
```

Array containing null values, consecutive nulls only keep one: null is treated as a normal value, consecutive nulls only keep one, non-consecutive nulls will not be merged.
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 3;
+------------------------------------------+
| array_compact(int_array)                 |
+------------------------------------------+
| [1, null, 2, null, 3]                    |
+------------------------------------------+
```

Complex type examples:

Consecutive duplicate removal for nested array types. Only adjacent completely identical sub-arrays will be removed, non-consecutive ones will not.
```sql
SELECT array_compact([[1,2],[1,2],[3,4],[3,4]]);
+------------------------------------------+
| array_compact([[1,2],[1,2],[3,4],[3,4]]) |
+------------------------------------------+
| [[1,2],[3,4]]                            |
+------------------------------------------+
```

Empty array returns empty array:
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 4;
+----------------------+
| array_compact(int_array) |
+----------------------+
| []                   |
+----------------------+
```

NULL array returns NULL:
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 5;
+----------------------+
| array_compact(int_array) |
+----------------------+
| NULL                 |
+----------------------+
```

Array with only one element returns the original array:
```sql
SELECT array_compact([42]);
+----------------------+
| array_compact([42])  |
+----------------------+
| [42]                 |
+----------------------+
```

Passing multiple parameters will cause an error.
```sql
SELECT array_compact([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_compact' which has 2 arity. Candidate functions are: [array_compact(Expression)]
```

Passing non-array type will cause an error.
```sql
SELECT array_compact('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_compact(VARCHAR(12))
```

### Keywords

ARRAY, COMPACT, ARRAY_COMPACT 