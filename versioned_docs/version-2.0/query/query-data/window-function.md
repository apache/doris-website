---
{
    "title": "Window Function",
    "language": "en"
}
---

## Window function

Window functions are a special type of built-in functions in databases. Similar to aggregate functions, window functions perform calculations on multiple input rows to obtain a single data value. However, the difference lies in the fact that window functions process the input data within a specific window, rather than grouping and calculating based on the `GROUP BY` clause. The data within each window can be sorted and grouped using the `OVER()` clause. Window functions calculate a separate value for each row of the result set, rather than a single value for each `GROUP BY`. This flexible approach allows users to add additional columns in the `SELECT` clause, providing more opportunities to reorganize and filter the result set. Window functions can only appear in the select list and the outermost `ORDER BY` clause. During the query process, window functions take effect at the end, meaning they are executed after operations such as `JOIN`, `WHERE`, and `GROUP BY`. Window functions are often used in finance and scientific computing to analyze trends, calculate outliers, and perform bucket analysis on large amounts of data.

The syntax of window functions as follows:

```sql
function(args) OVER(partition_by_clause order_by_clause [window_clause])    
partition_by_clause ::= PARTITION BY expr [, expr ...]    
order_by_clause ::= ORDER BY expr [ASC | DESC] [, expr [ASC | DESC] ...]
```

### Function

The currently supported functions include AVG(), COUNT(), DENSE_RANK(), FIRST_VALUE(), LAG(), LAST_VALUE(), LEAD(), MAX(), MIN(), RANK(), ROW_NUMBER(), SUM() and all aggregate functions.

### PARTITION BY clause

The `Partition By` clause is similar to `Group By`. It groups input rows based on the specified one or more columns, where rows with the same values are placed in the same group.

### ORDER BY clause

The `Order By` clause within a window function behaves similarly to the outer-level `Order By`. It defines the arrangement of input rows, and when `Partition By` is specified, the `Order By` determines the order within each partition. The only difference from the outer `Order By` is that within the `OVER` clause, using `Order By n` (where n is a positive integer) effectively does nothing, whereas in the outer context, `Order By n` signifies sorting based on the nth column.

This example demonstrates adding an `id` column to the select list, where its values are 1, 2, 3, and so on, sorted according to the `date_and_time` column in the `events` table.

```sql
SELECT   
row_number() OVER (ORDER BY date_and_time) AS id,   
c1, c2, c3, c4   
FROM events;
```

#### Window clause

The Window clause is used to specify a computational range for window functions. It considers the current row and a specified number of rows before and after it as the target for the window function's operation. The methods supported by the Window clause include: AVG(), COUNT(), FIRST_VALUE(), LAST_VALUE(), and SUM(). For MAX() and MIN(), the Window clause can specify a starting range of UNBOUNDED PRECEDING.

```sql
ROWS BETWEEN [ { m | UNBOUNDED } PRECEDING | CURRENT ROW] [ AND [CURRENT ROW | { UNBOUNDED | n } FOLLOWING] ]
```

### Example

Taking the following stock data as an example, the stock code is JDR, and the "closing price" refers to the daily closing quotation.

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

This query utilizes a window function to generate the `moving_average` column, which calculates the average stock price over a three-day span, specifically the previous day, the current day, and the next day. Since there is no previous day's data for the first day and no next day's data for the last day, the average is only calculated based on two days for those rows. In this case, the `Partition By` clause is not relevant because all the data pertains to the stock JDR. However, if there was additional stock information, `Partition By` would ensure that the window function operates exclusively within each partition.

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

### See more

For more window functions, refer to [Window Functions](../../sql-manual/sql-functions/window-functions/WINDOW-FUNCTION)
