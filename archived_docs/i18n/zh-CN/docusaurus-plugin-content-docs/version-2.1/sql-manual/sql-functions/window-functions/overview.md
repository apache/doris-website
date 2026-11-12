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
function(<args>) OVER(
    [PARTITION BY <expr> [, <expr> ...]]
    [ORDER BY <expr> [ASC | DESC] [, <expr> [ASC | DESC] ...]]
    [<window_clause>]
)
```

## 参数

| 参数 | 说明 |
|------|------|
| `<args>` | 窗口函数的输入参数，具体参数根据所使用的函数而定 |
| `<function>` | 支持的函数包括：AVG(), COUNT(), DENSE_RANK(), FIRST_VALUE(), LAG(), LAST_VALUE(), LEAD(), MAX(), MIN(), RANK(), ROW_NUMBER(), SUM() 和所有聚合函数 |
| `<partition_by>` | 类似于 GROUP BY，按指定列对数据进行分组 |
| `<order_by>` | 定义窗口内数据的排序方式 |
| `<window_clause>` | 定义窗口范围，语法为：ROWS BETWEEN [ { m \| UNBOUNDED } PRECEDING \| CURRENT ROW] [ AND [CURRENT ROW \| { UNBOUNDED \| n } FOLLOWING] ] |

## 返回值

返回与输入表达式相同的数据类型。

## 举例

1. 假设我们有如下的股票数据，股票代码是 JDR，closing price 是每天的收盘价。

```sql
create table stock_ticker (stock_symbol string, closing_price decimal(8,2), closing_date datetime);    
...load some data...    
select * from stock_ticker order by stock_symbol, closing_date
```

```text
| stock_symbol | closing_price | closing_date        |
|--------------|---------------|---------------------|
| JDR          | 12.86         | 2014-10-02 00:00:00 |
| JDR          | 12.89         | 2014-10-03 00:00:00 |
| JDR          | 12.94         | 2014-10-04 00:00:00 |
| JDR          | 12.55         | 2014-10-05 00:00:00 |
| JDR          | 14.03         | 2014-10-06 00:00:00 |
| JDR          | 14.75         | 2014-10-07 00:00:00 |
| JDR          | 13.98         | 2014-10-08 00:00:00 |
```

2. 这个查询使用分析函数产生 moving_average 这一列，它的值是 3 天的股票均价，即前一天、当前以及后一天三天的均价。第一天没有前一天的值，最后一天没有后一天的值，所以这两行只计算了两天的均值。这里 Partition By 没有起到作用，因为所有的数据都是 JDR 的数据，但如果还有其他股票信息，Partition By 会保证分析函数值作用在本 Partition 之内。

```sql
select stock_symbol, closing_date, closing_price,    
avg(closing_price) over (partition by stock_symbol order by closing_date    
rows between 1 preceding and 1 following) as moving_average    
from stock_ticker;
```

```text
| stock_symbol | closing_date        | closing_price | moving_average |
|--------------|---------------------|---------------|----------------|
| JDR          | 2014-10-02 00:00:00 | 12.86         | 12.87          |
| JDR          | 2014-10-03 00:00:00 | 12.89         | 12.89          |
| JDR          | 2014-10-04 00:00:00 | 12.94         | 12.79          |
| JDR          | 2014-10-05 00:00:00 | 12.55         | 13.17          |
| JDR          | 2014-10-06 00:00:00 | 14.03         | 13.77          |
| JDR          | 2014-10-07 00:00:00 | 14.75         | 14.25          |
| JDR          | 2014-10-08 00:00:00 | 13.98         | 14.36          |
```
