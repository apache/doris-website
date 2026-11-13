---
{
    "title": "MIN_BY",
    "language": "zh-CN",
    "description": "MINBY 函数用于根据指定列的最小值，返回对应的的关联值。"
}
---

## 描述

MIN_BY 函数用于根据指定列的最小值，返回对应的的关联值。

当 `<expr2>` 为 Array 时，数组按字典序逐元素比较；数组元素中的 NULL 大于任何非 NULL 元素。整个数组为 NULL 时会被忽略。

版本差异：Doris 4.1 系列自 4.1.5 起，以及 Doris 4.2 及后续版本中，数组内的 `NULL` 元素大于非 `NULL` 元素；Doris 4.0 和 4.1.5 之前的 4.1 版本中数组内的 `NULL` 元素小于非 `NULL` 元素。整个数组值为 `NULL` 的输入在这些版本中均被忽略。

当多行的 `<expr2>` 同为最小值时，`MIN_BY` 返回其中一行的 `<expr1>`，不保证选择哪一行，也不保证返回这些关联值中的最小值。若需要确定的结果，请显式指定并列值的处理规则，例如先筛选出 `<expr2>` 最小的行，再对 `<expr1>` 使用 `MIN`。

## 语法

```sql
MIN_BY(<expr1>, <expr2>)
```

## 参数 {#参数说明}

| 参数 | 描述 |
| --- | --- |
| `<expr1>` | 用于指定对应关联的表达式，支持类型为 Bool, TinyInt，SmallInt，Int，BigtInt，LargeInt，Float，Double，Decimal, String, Date, Datetime, Array, Map, Struct。 |
| `<expr2>` | 用于指定最小值统计的表达式，支持类型为 Bool, TinyInt，SmallInt，Int，BigtInt，LargeInt，Float，Double，Decimal, String, Date, Datetime, Array。 |

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
select min_by(k1, k2) from tbl;
```

一种可能的结果如下；此示例中返回 `3` 或 `4` 都符合 `MIN_BY` 的定义。

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

以下数组比较示例适用于 Doris 4.1 系列自 4.1.5 起，以及 Doris 4.2 及后续版本。

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

### 并列最小值的确定性处理

下面的自包含示例返回最小 `k4` 所对应的最小 `k1`。即使最小的 `k4 = 1` 有两行，结果也固定为 `3`：

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
