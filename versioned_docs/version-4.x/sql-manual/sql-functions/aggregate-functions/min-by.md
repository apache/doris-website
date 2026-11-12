---
{
    "title": "MIN_BY",
    "language": "en",
    "description": "The MINBY function returns the associated value based on the minimum value of the specified column."
}
---

## Description

The MIN_BY function returns the associated value based on the minimum value of the specified column.

When `<expr2>` is an Array, arrays are compared lexicographically, element by element; a NULL element is greater than any non-NULL element. A NULL array value is ignored.

Version difference: In the Doris 4.1 series since 4.1.5, and in Doris 4.2 and later, a `NULL` element inside an array compares greater than a non-`NULL` element. In Doris 4.0 and Doris 4.1 before 4.1.5, a `NULL` array element compares smaller. A `NULL` array value is ignored in all these versions.

If multiple rows share the minimum `<expr2>`, `MIN_BY` returns `<expr1>` from one of those rows. Which row is selected is not guaranteed, and the result is not necessarily the smallest associated value. For a deterministic result, specify a tie-breaking rule, for example by filtering to the minimum `<expr2>` and applying `MIN` to `<expr1>`.

## Syntax

```sql
MIN_BY(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<expr1>` | The expression for the associated value, supports types: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, Array, Map, Struct. |
| `<expr2>` | The expression for the minimum value, supports types: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, Array. |

## Return Value

Returns the same data type as <expr1>.
Returns NULL if there is no valid data in the group.

## Example

```sql
-- setup
create table tbl(
    k1 int,
    k2 int,
    arr ARRAY<INT>,
    mp MAP<STRING, INT>,
    st STRUCT<a: INT, b: STRING>,
) distributed by hash(k1) buckets 1
properties ("replication_num"="1");
insert into tbl values
    (0, 100, [1,2,3], {"x": 1, "y": 4}, NAMED_STRUCT("a", 1, "b", "x")),
    (1, 4,   [5, 6],  {"x": 2, "y": 3}, NAMED_STRUCT("a", 2, "b", "y")),
    (4, 1,   [7],     {"x": 3, "y": 2}, NAMED_STRUCT("a", 3, "b", "z")),
    (3, 1,   [8],     {"x": 4, "y": 1}, NAMED_STRUCT("a", 4, "b", "r"));
```

```text
Table created and data inserted successfully.
```

```sql
select min_by(k1, k2) from tbl;
```

One possible result follows; returning either `3` or `4` is valid for this example.

```text
+----------------+
| min_by(k1, k2) |
+----------------+
|              3 |
+----------------+
```

```sql
select min_by(arr, k1), min_by(mp, k1), min_by(st, k1) from tbl;
```

```text
+-----------------+----------------+------------------+
| min_by(arr, k1) | min_by(mp, k1) | min_by(st, k1)   |
+-----------------+----------------+------------------+
| [1, 2, 3]       | {"x":1, "y":4} | {"a":1, "b":"x"} |
+-----------------+----------------+------------------+
```

```sql
select min_by(k1, arr), min_by(mp, arr), min_by(st, arr), min_by(arr, arr) from tbl;
```

```text
+-----------------+-----------------+------------------+------------------+
| min_by(k1, arr) | min_by(mp, arr) | min_by(st, arr)  | min_by(arr, arr) |
+-----------------+-----------------+------------------+------------------+
|               0 | {"x":1, "y":4}  | {"a":1, "b":"x"} | [1, 2, 3]        |
+-----------------+-----------------+------------------+------------------+
```

```sql
select min_by(k1, k2) from tbl where k1 is null;
```

```text
+----------------+
| min_by(k1, k2) |
+----------------+
|           NULL |
+----------------+
```

The following array comparison example applies to the Doris 4.1 series since 4.1.5, and to Doris 4.2 and later.

```sql
SELECT min_by(label, sort_key) AS result
FROM (
    SELECT 'null element' AS label, [1, NULL] AS sort_key
    UNION ALL SELECT 'non-null element', [1, 2]
    UNION ALL SELECT 'null array', CAST(NULL AS ARRAY<INT>)
) t;
```

```text
non-null element
```

```sql
SELECT min_by(1, CAST(NULL AS ARRAY<INT>)) AS result;
```

```text
NULL
```

### Deterministic handling of tied minimum values

This self-contained example returns the smallest `k1` among rows with the minimum `k4`. Even though two rows have the minimum `k4 = 1`, the result is always `3`:

```sql
WITH data AS (
    SELECT 0 AS k1, 100 AS k4
    UNION ALL SELECT 1, 4
    UNION ALL SELECT 4, 1
    UNION ALL SELECT 3, 1
)
SELECT MIN(k1) AS min_k1
FROM data
WHERE k4 = (SELECT MIN(k4) FROM data);
```

```text
+--------+
| min_k1 |
+--------+
|      3 |
+--------+
```
