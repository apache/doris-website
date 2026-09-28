---
{
    "title": "MAP_AGG",
    "language": "zh-CN",
    "description": "MAPAGG 函数用于根据多行数据中的键值对形成一个映射结构。"
}
---

## 描述

MAP_AGG 函数用于根据多行数据中的键值对形成一个映射结构。

对于相同的 key，`MAP_AGG` 保留聚合过程中先遇到的 value；如果 key 已存在，则忽略后来遇到的 value。合并局部聚合结果时，同样保留目标聚合状态中已有 key 的 value。

这里的“先遇到”指执行时的处理顺序，不代表数据写入顺序。扫描、并行执行和局部聚合结果的合并顺序都可能影响最终保留的 value，因此重复 key 对应的 value 不保证在多次查询之间保持一致。查询外层的 `ORDER BY` 只对结果行排序，不能决定重复 key 保留哪个 value。

## 语法

```sql
MAP_AGG(<expr1>, <expr2>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr1>` | 用于指定作为键的表达式, 支持类型为Bool，TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal，Date，Datetime，String。|
| `<expr2>` | 用于指定作为对应的值的表达式, 支持类型为Bool，TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal，Date，Datetime，String。 |

## 返回值

返回映射后的 Map 类型的值。
如果组内不存在合法数据，则返回一个空 Map 。

## 举例

```sql
-- setup
CREATE TABLE nation (
    n_nationkey INT,
    n_name STRING,
    n_regionkey INT
) DISTRIBUTED BY HASH(n_nationkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO nation VALUES
    (0, 'ALGERIA', 0),
    (1, 'ARGENTINA', 1),
    (2, 'BRAZIL', 1),
    (3, 'CANADA', 1);
```

```sql
select `n_regionkey`, map_agg(`n_nationkey`, `n_name`) from `nation` group by `n_regionkey`;
```

```text
+-------------+-----------------------------------------+
| n_regionkey | map_agg(`n_nationkey`, `n_name`)        |
+-------------+-----------------------------------------+
|           0 | {0:"ALGERIA"}                           |
|           1 | {1:"ARGENTINA", 2:"BRAZIL", 3:"CANADA"} |
+-------------+-----------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation`;
```

```text
+------------------------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5)                 |
+------------------------------------------------------+
| {"ALGERIA":0, "ARGENTINA":1, "BRAZIL":2, "CANADA":3} |
+------------------------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation` where n_nationkey is null;
```

```text
+--------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5) |
+--------------------------------------+
| {}                                   |
+--------------------------------------+
```


下面的查询包含两个相同的 key，结果只包含一个键值对。输出可能为 `{1:"a"}` 或 `{1:"b"}`，取决于执行时先处理哪个 value。以下是一种可能的输出：

```sql
SELECT MAP_AGG(k, v) AS result
FROM (
    SELECT 1 AS k, 'a' AS v
    UNION ALL
    SELECT 1 AS k, 'b' AS v
) AS input;
```

```text
+---------+
| result  |
+---------+
| {1:"a"} |
+---------+
```
