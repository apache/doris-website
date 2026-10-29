---
{
    "title": "COLLECT_SET",
    "language": "en",
    "description": "Aggregation function aggregates all unique values of the specified column, removes duplicate elements, and returns a set type result."
}
---

## Description

Aggregation function aggregates all unique values of the specified column, removes duplicate elements, and returns a set type result.

## Alias

- GROUP_UNIQ_ARRAY

## Syntax

```sql
COLLECT_SET(<expr> [,<max_size>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Column or expression to aggregate |
| `<max_size>` | Optional parameter that can be set to limit the size of the resulting array to max_size elements |

## Return Value

The return type is ARRAY. This array contains all values after deduplication. Special case:

- If the value is NULL, it will filter

The order of elements in the returned array is not guaranteed. Use `array_sort` to sort the result, but when `max_size` is specified, which elements are retained is still not guaranteed. The results below show one possible output; sorting the result does not fix which elements are selected.

## Example

```sql
-- setup
CREATE TABLE collect_set_test (
	k1 INT,
	k2 DATE,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_set_test VALUES
(1, '2023-01-01', 'hello'),
(2, '2023-01-01', NULL),
(2, '2023-01-02', 'hello'),
(3, NULL, 'world'),
(3, '2023-01-02', 'hello'),
(4, '2023-01-02', 'doris'),
(4, '2023-01-03', 'sql');
```

```sql
select k1,k2,k3 from collect_set_test order by k1;
```

```text
+------+------------+-------+
| k1   | k2         | k3    |
+------+------------+-------+
|    1 | 2023-01-01 | hello |
|    2 | 2023-01-01 | NULL  |
|    2 | 2023-01-02 | hello |
|    3 | NULL       | world |
|    3 | 2023-01-02 | hello |
|    4 | 2023-01-02 | doris |
|    4 | 2023-01-03 | sql   |
+------+------------+-------+
```

```sql
select array_sort(collect_set(k1)),array_sort(collect_set(k1,2)) from collect_set_test;
```

```text
+-------------------------------+---------------------------------+
| array_sort(collect_set(`k1`)) | array_sort(collect_set(`k1`,2)) |
+-------------------------------+---------------------------------+
| [1, 2, 3, 4]                  | [1, 2]                          |
+-------------------------------+---------------------------------+
```

```sql
select k1,array_sort(collect_set(k2)),collect_set(k3,1) from collect_set_test group by k1 order by k1;
```

```text
+----+-------------------------------+---------------------+
| k1 | array_sort(collect_set(`k2`)) | collect_set(`k3`,1) |
+----+-------------------------------+---------------------+
| 1  | ["2023-01-01"]                | ["hello"]           |
| 2  | ["2023-01-01", "2023-01-02"]  | ["hello"]           |
| 3  | ["2023-01-02"]                | ["world"]           |
| 4  | ["2023-01-02", "2023-01-03"]  | ["sql"]             |
+----+-------------------------------+---------------------+
```

An input containing only NULL returns an empty array:

```sql
SELECT COLLECT_SET(CAST(NULL AS INT)) AS result;
```

```text
+--------+
| result |
+--------+
| []     |
+--------+
```
