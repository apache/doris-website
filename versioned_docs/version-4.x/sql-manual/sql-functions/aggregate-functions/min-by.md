---
{
    "title": "MIN_BY",
    "language": "en",
    "description": "The MINBY function returns the associated value based on the minimum value of the specified column."
}
---

## Description

The MIN_BY function returns the associated value based on the minimum value of the specified column.

## Syntax

```sql
MIN_BY(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | The expression for the associated value, supports types: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, Array, Map, struct. |
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

```sql
select min_by(k1, k2) from tbl;
```

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
