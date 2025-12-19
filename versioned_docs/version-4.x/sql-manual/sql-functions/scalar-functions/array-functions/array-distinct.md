---
{
    "title": "ARRAY_DISTINCT",
    "language": "en",
    "description": "<version since=\"2.0.0\">"
}
---

## array_distinct

<version since="2.0.0">

</version>

## Description

Removes duplicate elements from an array and returns a new array containing unique elements. The function maintains the original order of elements, keeping only the first occurrence of each element.

## Syntax

```sql
array_distinct(ARRAY<T> arr)
```

### Parameters

- `arr`：ARRAY\<T> type, the array to deduplicate. Supports column names or constant values.

**T supported types:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6

### Return Value

Return type: ARRAY\<T>

Return value meaning:
- The deduplicated array containing all unique elements from the original array
- Maintains the original order of elements
- NULL: if the input array is NULL

Usage notes:
- The function traverses the array from left to right, keeping the first occurrence of each element and removing subsequent duplicate elements
- Empty array returns empty array, NULL array returns NULL
- Deduplication maintains the relative order of elements in the original array, does not reorder
- For null values in array elements: null elements will be deduplicated, multiple nulls only keep one

### Examples

**Query examples:**

Integer array deduplication, the original array [1, 2, 3, 4, 5] has no duplicate elements, so the result after deduplication is the same as the original array.
```sql
SELECT array_distinct([1, 2, 3, 4, 5]);
+---------------------------------+
| array_distinct([1, 2, 3, 4, 5]) |
+---------------------------------+
| [1, 2, 3, 4, 5]                 |
+---------------------------------+
```

String array deduplication: removes duplicate string elements. In the original array ['a', 'b', 'a', 'c', 'b', 'd'], 'a' appears twice (keeping the first occurrence), 'b' appears twice (keeping the first occurrence), after deduplication it becomes ["a", "b", "c", "d"].
```sql
SELECT array_distinct(['a', 'b', 'a', 'c', 'b', 'd']);
+------------------------------------------------+
| array_distinct(['a', 'b', 'a', 'c', 'b', 'd']) |
+------------------------------------------------+
| ["a", "b", "c", "d"]                           |
+------------------------------------------------+
```

Array containing null values: null elements will also be deduplicated, multiple nulls only keep one. In the original array [1, null, 2, null, 3, null], null appears three times, after deduplication only the first null is kept, resulting in [1, null, 2, 3].
```sql
SELECT array_distinct([1, null, 2, null, 3, null]);
+---------------------------------------------+
| array_distinct([1, null, 2, null, 3, null]) |
+---------------------------------------------+
| [1, null, 2, 3]                             |
+---------------------------------------------+
```

IP type array deduplication: deduplication of IPv4 address array. In the original array ['192.168.1.1', '192.168.1.2', '192.168.1.1'], '192.168.1.1' appears twice, after deduplication only the first occurrence of the address is kept, resulting in [192.168.1.1, 192.168.1.2].
```sql
SELECT array_distinct(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>));
+------------------------------------------------------------------------------------+
| array_distinct(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>)) |
+------------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2"]                                                     |
+------------------------------------------------------------------------------------+
```

IPv6 type array deduplication: deduplication of IPv6 address array. In the original array ['2001:db8::1', '2001:db8::2', '2001:db8::1'], '2001:db8::1' appears twice, after deduplication only the first occurrence of the address is kept, resulting in [2001:db8::1, 2001:db8::2].
```sql
SELECT array_distinct(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>));
+------------------------------------------------------------------------------------+
| array_distinct(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>)) |
+------------------------------------------------------------------------------------+
| ["2001:db8::1", "2001:db8::2"]                                                     |
+------------------------------------------------------------------------------------+
```

Empty array returns empty array: empty array has no elements to deduplicate, directly returns empty array.
```sql
+--------------------+
| array_distinct([]) |
+--------------------+
| []                 |
+--------------------+
```

NULL array returns NULL: returning NULL when the input array is NULL without throwing an error.
```sql
+----------------------+
| array_distinct(NULL) |
+----------------------+
| NULL                 |
+----------------------+
```

Single element array returns the original array: array with only one element has no duplicate elements, the result after deduplication is the same as the original array.
```sql
SELECT array_distinct([42]);
+----------------------+
| array_distinct([42]) |
+----------------------+
| [42]                 |
+----------------------+
```

Complex types not supported:

Nested array type not supported, throws error.
```sql
SELECT array_distinct([[1,2,3], [4,5,6], [1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Array(Nullable(TINYINT)))))
```

Map type not supported, throws error.
```sql
SELECT array_distinct([{'a':1}, {'b':2}, {'a':1}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Map(Nullable(String), Nullable(TINYINT)))))
```

Struct type not supported, throws error.
```sql
SELECT array_distinct(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30), named_struct('name','Alice','age',20)));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Struct(name:Nullable(String), age:Nullable(TINYINT)))))
```

Incorrect number of parameters will cause an error: the array_distinct function only accepts one array parameter, passing multiple parameters will cause an error.
```sql
SELECT array_distinct([1, 2, 3], [4, 5, 6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_distinct' which has 2 arity. Candidate functions are: [array_distinct(Expression)]
```

Passing non-array type will cause an error: the array_distinct function only accepts array type parameters, passing non-array types like strings will cause an error.
```sql
SELECT array_distinct('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_distinct(VARCHAR(12))
```

### Keywords

ARRAY, DISTINCT, ARRAY_DISTINCT 