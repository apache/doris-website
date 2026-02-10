---
{
    "title": "OVERVIEW",
    "language": "en",
    "description": "Window functions (also known as analytic functions) are special built-in functions that perform calculations while preserving the original rows."
}
---

## Description

[Window functions](../../../query-data/window-function) (also known as analytic functions) are special built-in functions that perform calculations while preserving the original rows. Unlike aggregate functions, window functions:

- Process data within a specific window range rather than by GROUP BY grouping
- Calculate a value for each row in the result set
- Can add additional columns in the SELECT list
- Execute last in query processing (after JOIN, WHERE, GROUP BY)

Window functions are commonly used in financial and scientific computing for trend analysis, outlier calculation, and data bucketing.

## Syntax

```sql
function(<args>) OVER(
    [PARTITION BY <expr> [, <expr> ...]]
    [ORDER BY <expr> [ASC | DESC] [, <expr> [ASC | DESC] ...]]
    [<window_clause>]
)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<args>` | Input parameters for the window function, specific to the function being used |
| `<function>` | Supported functions include: AVG(), COUNT(), DENSE_RANK(), FIRST_VALUE(), LAG(), LAST_VALUE(), LEAD(), MAX(), MIN(), RANK(), ROW_NUMBER(), SUM() and all aggregate functions |
| `<partition_by>` | Similar to GROUP BY, groups data by specified columns |
| `<order_by>` | Defines the ordering of data within the window |
| `<window_clause>` | Defines the window range, syntax: ROWS BETWEEN [ { m \| UNBOUNDED } PRECEDING \| CURRENT ROW] [ AND [CURRENT ROW \| { UNBOUNDED \| n } FOLLOWING] ] |

## Return Value

Returns the same data type as the input expression.

## Examples

1. Assume we have the following stock data, with stock symbol JDR and daily closing prices:

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

2. This query uses an analytic function to generate a moving_average column, which calculates the 3-day average stock price (previous day, current day, and next day). The first day has no previous day value, and the last day has no next day value, so these rows only calculate a two-day average. The Partition By clause has no effect here since all data is for JDR, but if there were other stock information, Partition By would ensure the analytic function only operates within its own partition.

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
