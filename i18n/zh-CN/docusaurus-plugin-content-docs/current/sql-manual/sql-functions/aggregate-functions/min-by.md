---
{
    "title": "MIN_BY",
    "language": "zh-CN",
    "description": "MINBY 函数用于根据指定列的最小值，返回对应的的关联值。"
}
---

## 描述

MIN_BY 函数用于根据指定列的最小值，返回对应的的关联值。

## 语法

```sql
MIN_BY(<expr1>, <expr2>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr1>` | 用于指定对应关联的表达式，支持类型为 Bool, TinyInt，SmallInt，Int，BigtInt，LargeInt，Float，Double，Decimal, String, Date, Datetime, Array, Map, Struct。 |
| `<expr2>` | 用于指定最小值统计的表达式，支持类型为 Bool, TinyInt，SmallInt，Int，BigtInt，LargeInt，Float，Double，Decimal, String, Date, Datetime, Array。 |

## 返回值

返回与输入表达式 <expr1> 相同的数据类型。
如果组内没有合法数据，则返回 NULL 。

## 举例

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
