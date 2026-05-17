---
{
    "title": "OVERVIEW",
    "language": "zh-CN",
    "description": "窗口函数（也称为分析函数）是一类特殊的内置函数，它能在保留原始行的基础上进行计算。与聚合函数不同，窗口函数："
}
---

## 描述

[窗口函数](../../../query-data/window-function)（也称为分析函数）是一类特殊的内置函数，它能在保留原始行的基础上进行计算。与聚合函数不同，窗口函数：

- 在特定窗口范围内处理数据，而不是按 GROUP BY 分组
- 为结果集的每一行计算一个值
- 可以在 SELECT 列表中添加额外的列
- 在查询处理中最后执行（在 JOIN、WHERE、GROUP BY 之后）

窗口函数常用于金融和科学计算领域，用于分析趋势、计算离群值和数据分桶等场景。

## 语法

```sql
<FUNCTION> ( [ <ARGUMENTS> ] ) OVER ( [ <windowDefinition> ] )
```

其中:
```sql
windowDefinition ::=

[ PARTITION BY <expr1> [, ...] ]
[ ORDER BY <expr2> [ ASC | DESC ] [ NULLS { FIRST | LAST } ] [, ...] ]
[ <windowFrameClause> ]
```

其中:
```sql
windowFrameClause ::=
{
  | { ROWS } <n> PRECEDING
  | { ROWS } CURRENT ROW
  | { ROWS } BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
  | { ROWS | RANGE } UNBOUNDED PRECEDING
  | { ROWS | RANGE } BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  | { ROWS | RANGE } BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  | { ROWS } BETWEEN <n> { PRECEDING | FOLLOWING } AND <n> { PRECEDING | FOLLOWING }
  | { ROWS } BETWEEN UNBOUNDED PRECEDING AND <n> { PRECEDING | FOLLOWING }
  | { ROWS } BETWEEN <n> { PRECEDING | FOLLOWING } AND UNBOUNDED FOLLOWING
}
```

## 参数

`<FUNCTION>`
> 窗口函数的名字。所有聚合函数以及 DENSE_RANK(), FIRST_VALUE(), LAG(), LAST_VALUE(), LEAD(), RANK(), ROW_NUMBER(), NTH_VALUE(), PERCENT_RANK(), CUME_DIST(), NTILE() 特殊窗口函数。

`<ARGUMENTS>`
> 可选，窗口函数的输入参数，参数类型和个数需要根据所使用的具体函数而定。

`<PARTITION_BY>`
> 可选，类似于 GROUP BY，按指定列对数据进行分组，然后在每个分区中进行相关计算。

`<ORDER_BY>`
> 可选，用于对每个分区内的数据进行排序，如果未指定任何分区，则会对整体进行排序。但此ORDER BY 和常见的出现在SQL 末尾中的ORDER BY 不同。出现在OVER 子句的排序，仅对此分区中数据进行排序，而出现在SQL 末尾中的排序，是控制查询最终结果中所有行的顺序，这两者是可以共存的。
> 另外如果在OVER没有显示的写出ORDER BY，则会导致分区内的数据是随机的，进而可能使得最终结果是随机的。如果显示的给出了排序列，但是可能由于排序出现重复值，也会引起结果不稳定，具体可参阅下述的[案例](#section1)

`<windowFrameClause>`
> 可选，用于定义窗口范围, 目前支持`RANGE/ROWS` 两种类型。
其中，`N PRECEDING/FOLLOWING`，`N` 是一个正整数，表示的是滑动窗口相对当前行的范围，目前仅支持在ROWS 窗口中，所以表示的是相对当前行的物理偏移。当前RANGE 类型有些限制， 必须是 `BOTH UNBOUNDED BOUNDARY OR ONE UNBOUNDED BOUNDARY AND ONE CURRENT ROW`。如果未指定任何的Frame，默认会生成隐式的 `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`。


## 返回值

返回与输入表达式相同的数据类型。

<a id="section1"></a>
## 分析函数数据的唯一排序

**1. 存在返回结果不一致的问题**

当使用窗口函数的 `ORDER BY` 子句未能产生数据的唯一排序时，例如当 `ORDER BY` 表达式导致重复值时，行的顺序会变得不确定。这意味着在多次执行查询时，这些行的返回顺序可能会有所不同，进而导致窗口函数返回不一致的结果。

通过以下示例可以看出，该查询在多次运行时返回了不同的结果。出现不一致性的情况主要由于 `ORDER BY dateid` 没有为 `SUM` 窗口函数提供产生数据的唯一排序。

```sql
CREATE TABLE test_window_order (
  item_id int,
  date_time date,
  sales double)
distributed BY hash(item_id)
properties("replication_num" = 1);

INSERT INTO test_window_order VALUES
(1, '2024-07-01', 100),
(2, '2024-07-01', 100),
(3, '2024-07-01', 140);

SELECT
    item_id, date_time, sales,
    sum(sales) OVER (ORDER BY date_time ROWS BETWEEN 
        UNBOUNDED PRECEDING AND CURRENT ROW) sum
FROM
    test_window_order;
```

由于排序列 `date_time`存在重复值，可能呈现以下两种查询结果：

```sql
+---------+------------+-------+------+
| item_id | date_time  | sales | sum  |
+---------+------------+-------+------+
|       1 | 2024-07-01 |   100 |  100 |
|       3 | 2024-07-01 |   140 |  240 |
|       2 | 2024-07-01 |   100 |  340 |
+---------+------------+-------+------+
3 rows in set (0.03 sec)
+---------+------------+-------+------+
| item_id | date_time  | sales | sum  |
+---------+------------+-------+------+
|       2 | 2024-07-01 |   100 |  100 |
|       1 | 2024-07-01 |   100 |  200 |
|       3 | 2024-07-01 |   140 |  340 |
+---------+------------+-------+------+
3 rows in set (0.02 sec)
```

**2. 解决方法**

为了解决这个问题，可以在 `ORDER BY` 子句中添加一个唯一值列，如 `item_id`，以确保排序的唯一性。

```sql
SELECT
        item_id,
        date_time,
        sales,
        sum(sales) OVER (
        ORDER BY item_id,
        date_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) sum
FROM
        test_window_order;
```

则查询结果固定为：

```sql
+---------+------------+-------+------+
| item_id | date_time  | sales | sum  |
+---------+------------+-------+------+
|       1 | 2024-07-01 |   100 |  100 |
|       2 | 2024-07-01 |   100 |  200 |
|       3 | 2024-07-01 |   140 |  340 |
+---------+------------+-------+------+
3 rows in set (0.03 sec)
```
