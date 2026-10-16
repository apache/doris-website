---
{
    "title": "MAX_BY",
    "language": "zh-CN",
    "description": "MAXBY 函数用于根据指定列的最大值，返回对应的的关联值。"
}
---

## 描述

MAX_BY 函数用于根据指定列的最大值，返回对应的的关联值。

当 `<expr2>` 为 Array 时，数组按字典序逐元素比较；数组元素中的 NULL 大于任何非 NULL 元素。整个数组为 NULL 时会被忽略。

版本差异：Doris 4.1 系列自 4.1.5 起，以及 Doris 4.2 及后续版本中，数组内的 `NULL` 元素大于非 `NULL` 元素；Doris 4.0 和 4.1.5 之前的 4.1 版本中数组内的 `NULL` 元素小于非 `NULL` 元素。整个数组值为 `NULL` 的输入在这些版本中均被忽略。

## 语法

```sql
MAX_BY(<expr1>, <expr2>)
```

## 参数 {#参数说明}

| 参数 | 描述 |
| --- | --- |
| `<expr1>` | 用于指定对应关联的表达式，支持类型为 Bool, TinyInt，SmallInt，Int，BigtInt，LargeInt，Float，Double，Decimal, String, Date, Datetime, Array, Map, Struct。 |
| `<expr2>` | 用于指定最大值统计的表达式，支持类型为 Bool, TinyInt，SmallInt，Int，BigtInt，LargeInt，Float，Double，Decimal, String, Date, Datetime, Array。 |

## 返回值

返回与输入表达式 <expr1> 相同的数据类型。
如果组内没有合法数据，则返回 NULL 。

## 示例 {#举例}

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
建表成功，数据已插入。
```

```sql
select max_by(k1, k2) from tbl;
```

```text
+----------------+
| max_by(k1, k2) |
+----------------+
|              0 |
+----------------+
```

```sql
select max_by(arr, k1), max_by(mp, k1), max_by(st, k1) from tbl;
```

```text
+-----------------+----------------+------------------+
| max_by(arr, k1) | max_by(mp, k1) | max_by(st, k1)   |
+-----------------+----------------+------------------+
| [7]             | {"x":3, "y":2} | {"a":3, "b":"z"} |
+-----------------+----------------+------------------+
```

```sql
select max_by(k1, arr), max_by(mp, arr), max_by(st, arr), max_by(arr, arr) from tbl;
```

```text
+-----------------+-----------------+------------------+------------------+
| max_by(k1, arr) | max_by(mp, arr) | max_by(st, arr)  | max_by(arr, arr) |
+-----------------+-----------------+------------------+------------------+
|               3 | {"x":4, "y":1}  | {"a":4, "b":"r"} | [8]              |
+-----------------+-----------------+------------------+------------------+
```

```sql
select max_by(k1, k2) from tbl where k1 is null;
```

```text
+----------------+
| max_by(k1, k2) |
+----------------+
|           NULL |
+----------------+
```

以下数组比较示例适用于 Doris 4.1 系列自 4.1.5 起，以及 Doris 4.2 及后续版本。

```sql
SELECT max_by(label, sort_key) AS result
FROM (
    SELECT 'null element' AS label, [1, NULL] AS sort_key
    UNION ALL SELECT 'non-null element', [1, 2]
    UNION ALL SELECT 'null array', CAST(NULL AS ARRAY<INT>)
) t;
```

```text
null element
```

```sql
SELECT max_by(1, CAST(NULL AS ARRAY<INT>)) AS result;
```

```text
NULL
```
