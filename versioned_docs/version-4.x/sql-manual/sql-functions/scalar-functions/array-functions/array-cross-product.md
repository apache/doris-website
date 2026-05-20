---
{
    "title": "CROSS_PRODUCT",
    "language": "en"
}
---

## Description

Computes the cross product of two arrays of size 3.

## Syntax

```sql
CROSS_PRODUCT(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
| -- |--|
| `<array1>` | The first vector, the subtype of the input array supports: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, the number of elements must be consistent with array2. Neither the array itself nor any of its elements can be NULL.|
| `<array1>` | The second vector, the subtype of the input array supports: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, the number of elements must be consistent with array1. Neither the array itself nor any of its elements can be NULL.|

## Return Value

Returns the cross product of two arrays of size 3.

## Examples

### normal cases
simple queries:
```sql
SELECT CROSS_PRODUCT([1, 2, 3], [2, 3, 4]);
+-------------------------------------+
| CROSS_PRODUCT([1, 2, 3], [2, 3, 4]) |
+-------------------------------------+
| [-1, 2, -1]                         |
+-------------------------------------+
SELECT CROSS_PRODUCT([1, 2, 3], [0, 0, 0]);
+-------------------------------------+
| CROSS_PRODUCT([1, 2, 3], [0, 0, 0]) |
+-------------------------------------+
| [0, 0, 0]                           |
+-------------------------------------+
SELECT CROSS_PRODUCT([1, 0, 0], [0, 1, 0]);
+-------------------------------------+
| CROSS_PRODUCT([1, 0, 0], [0, 1, 0]) |
+-------------------------------------+
| [0, 0, 1]                           |
+-------------------------------------+
SELECT CROSS_PRODUCT([0, 1, 0], [1, 0, 0]);
+-------------------------------------+
| CROSS_PRODUCT([0, 1, 0], [1, 0, 0]) |
+-------------------------------------+
| [0, 0, -1]                          |
+-------------------------------------+
SELECT CROSS_PRODUCT(NULL, [1, 2, 3]);
+--------------------------------+
| CROSS_PRODUCT(NULL, [1, 2, 3]) |
+--------------------------------+
| NULL                           |
+--------------------------------+
SELECT CROSS_PRODUCT([1, 2, 3], NULL);
+--------------------------------+
| CROSS_PRODUCT([1, 2, 3], NULL) |
+--------------------------------+
| NULL                           |
+--------------------------------+
```
query with table:
```sql
CREATE TABLE array_cross_product_test (
    id INT,
    vec1 ARRAY<DOUBLE>,
    vec2 ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);
INSERT INTO array_cross_product_test VALUES
(1, [1, 2, 3], [2, 3, 4]),
(2, [1, 2, 3], [0, 0, 0]),
(3, [1, 0, 0], [0, 1, 0]),
(4, [0, 1, 0], [1, 0, 0]),
(5, NULL, [1, 0, 0]);

SELECT id, CROSS_PRODUCT(vec1, vec2) from array_cross_product_test order by id;
+------+---------------------------+
| id   | CROSS_PRODUCT(vec1, vec2) |
+------+---------------------------+
|    1 | [-1, 2, -1]               |
|    2 | [0, 0, 0]                 |
|    3 | [0, 0, 1]                 |
|    4 | [0, 0, -1]                |
|    5 | NULL                      |
+------+---------------------------+
```

### abnormal cases
One of the elements in the argument array is NULL.
```sql
SELECT CROSS_PRODUCT([1, NULL, 3], [1, 2, 3])
First argument for function cross_product cannot have null elements
```
```sql
SELECT CROSS_PRODUCT([1, 2, 3], [NULL, 2, 3]);
Second argument for function cross_product cannot have null elements
```
The two argument arrays have different lengths.
```sql
SELECT CROSS_PRODUCT([1, 2, 3], [1, 2]);
function cross_product have different input element sizes of array: 3 and 2
```
The argument arrays have the same length, but the length is not 3.
```sql
SELECT CROSS_PRODUCT([1, 2, 3, 4], [1, 2, 3, 4]);
function cross_product requires arrays of size 3
```
```sql
SELECT CROSS_PRODUCT([1, 2], [3, 4]);
function cross_product requires arrays of size 3
```
