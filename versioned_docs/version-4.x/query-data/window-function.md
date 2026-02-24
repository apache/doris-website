---
{
    "title": "Window Function",
    "language": "en",
    "description": "Analytic functions, also known as window functions, are functions in SQL queries that perform complex calculations on rows in a data set."
}
---

Analytic functions, also known as window functions, are functions in SQL queries that perform complex calculations on rows in a data set. The characteristic of window functions is that they do not reduce the number of rows in the query result, but instead add a new computed result for each row. Window functions are applicable to various analysis scenarios, such as calculating running totals, rankings, and moving averages.
The specific syntax can be [refer](../sql-manual/sql-functions/window-functions/overview.md)

Below is an example of using a window function to calculate the three-day moving average of sales for each store before and after a given date:

```sql
CREATE TABLE daily_sales (
    store_id INT,
    sales_date DATE,
    sales_amount DECIMAL(10, 2)
) PROPERTIES ("replication_num" = "1");

INSERT INTO daily_sales (store_id, sales_date, sales_amount) VALUES (1, '2023-01-01', 100.00), (1, '2023-01-02', 150.00), (1, '2023-01-03', 200.00), (1, '2023-01-04', 250.00), (1, '2023-01-05', 300.00), (1, '2023-01-06', 350.00), (1, '2023-01-07', 400.00), (1, '2023-01-08', 450.00), (1, '2023-01-09', 500.00), (2, '2023-01-01', 110.00), (2, '2023-01-02', 160.00), (2, '2023-01-03', 210.00), (2, '2023-01-04', 260.00), (2, '2023-01-05', 310.00), (2, '2023-01-06', 360.00), (2, '2023-01-07', 410.00), (2, '2023-01-08', 460.00), (2, '2023-01-09', 510.00);

SELECT
        store_id,
        sales_date,
        sales_amount,
        AVG(sales_amount) OVER ( PARTITION BY store_id ORDER BY sales_date 
        ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING ) AS moving_avg_sales
FROM
        daily_sales;
```

The query result is as follows:

```sql
+----------+------------+--------------+------------------+
| store_id | sales_date | sales_amount | moving_avg_sales |
+----------+------------+--------------+------------------+
|        1 | 2023-01-01 |       100.00 |         175.0000 |
|        1 | 2023-01-02 |       150.00 |         200.0000 |
|        1 | 2023-01-03 |       200.00 |         225.0000 |
|        1 | 2023-01-04 |       250.00 |         250.0000 |
|        1 | 2023-01-05 |       300.00 |         300.0000 |
|        1 | 2023-01-06 |       350.00 |         350.0000 |
|        1 | 2023-01-07 |       400.00 |         375.0000 |
|        1 | 2023-01-08 |       450.00 |         400.0000 |
|        1 | 2023-01-09 |       500.00 |         425.0000 |
|        2 | 2023-01-01 |       110.00 |         185.0000 |
|        2 | 2023-01-02 |       160.00 |         210.0000 |
|        2 | 2023-01-03 |       210.00 |         235.0000 |
|        2 | 2023-01-04 |       260.00 |         260.0000 |
|        2 | 2023-01-05 |       310.00 |         310.0000 |
|        2 | 2023-01-06 |       360.00 |         360.0000 |
|        2 | 2023-01-07 |       410.00 |         385.0000 |
|        2 | 2023-01-08 |       460.00 |         410.0000 |
|        2 | 2023-01-09 |       510.00 |         435.0000 |
+----------+------------+--------------+------------------+
18 rows in set (0.09 sec)
```

## Introduction to Basic Concepts

### Processing Order

The processing of queries using analytic functions can be divided into three stages.

1. Execute all JOIN, WHERE, GROUP BY, and HAVING clauses.

2. Provide the result set to the analytic functions and perform all necessary calculations.

3. If the query ends with an ORDER BY clause, process this clause to achieve precise output sorting.

The processing order of the query is illustrated as follows:

![processing order](/images/window-function-order.png)

### Result Set Partitioning

Partitions are created after defining groups using the PARTITION BY clause. Analytic functions allow users to divide the query result set into groups of rows called partitions.

:::caution Note

The term "partition" used in analytic functions is unrelated to the table partitioning feature. In this chapter, the term "partition" refers only to its meaning related to analytic functions.

:::

### Window

For each row in a partition, you can define a sliding data window. This window determines the range of rows involved in performing calculations for the current row. A window has a starting row and an ending row, and depending on its definition, the window can slide at one or both ends. For example ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, for a cumulative sum function, the starting row is fixed at the first row of its partition, while the ending row slides from the start to the last row of the partition. Conversely ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING, for a moving average, both the start and end points slide.

The size of the window can be set to be as large as all rows in the partition or as small as a sliding window that only includes one row within the partition. It should be noted that when the window is near the boundaries of the partition, due to boundary restrictions, the range of calculations may be reduced, and the function only returns the computed results of the available rows.

When using window functions, the current row is included in the calculation. Therefore, when processing n items, it should be specified as (n-1). For example, if you need to calculate a five-day average, the window should be specified as "ROWS BETWEEN 4 PRECEDING AND CURRENT ROW," which can also be abbreviated as "ROWS 4 PRECEDING."

### Current Row

Each calculation performed using analytic functions is based on the current row within the partition. The current row serves as the reference point for determining the start and end of the window, as illustrated below.

For example ROWS BETWEEN 6 PRECEDING AND 6 FOLLOWING, a window can be used to define a centered moving average calculation that includes the current row, the 6 rows before the current row, and the 6 rows after the current row. This creates a sliding window containing 13 rows.

![Current Row](/images/window-function-rows.jpg)

## Sorting Function

In a sorting function, query results are deterministic only when the specified sorting column is unique; if the sorting column contains duplicate values, the query results may vary each time. The more functions can be [refer](../sql-manual/sql-functions/window-functions/overview.md)

### NTILE Function

NTILE is a window function in SQL used to divide a query result set into a specified number of buckets (groups) and assign a bucket number to each row. This is particularly useful in data analysis and reporting, especially when data needs to be grouped and sorted.

**1. Function Syntax**

```sql
NTILE(num_buckets) OVER ([PARTITION BY partition_expression] ORDER BY order_expression)
```

- `num_buckets`: The number of buckets into which to divide the rows.

- `PARTITION BY partition_expression` (optional): Defines how to partition the data.

- `ORDER BY order_expression`: Defines how to sort the data.

**2. Using the NTILE Function**

Suppose there is a table `class_student_scores` containing students' exam scores, and you want to divide the students into 4 groups based on their scores, with the number of students in each group being as uniform as possible.

First, create the `class_student_scores` table and insert data:

```sql
CREATE TABLE class_student_scores (
    class_id INT,
    student_id INT,
    student_name VARCHAR(50),
    score INT
)distributed by hash(student_id) properties('replication_num'=1);

INSERT INTO class_student_scores VALUES
(1, 1, 'Alice', 85),
(1, 2, 'Bob', 92),
(1, 3, 'Charlie', 87),
(2, 4, 'David', 78),
(2, 5, 'Eve', 95),
(2, 6, 'Frank', 80),
(2, 7, 'Grace', 90),
(2, 8, 'Hannah', 84);
```

Then, use the NTILE function to divide the students into 4 groups based on their scores:

```sql
SELECT  
    student_id,  
    student_name,  
    score,  
    NTILE(4) OVER (ORDER BY score DESC) AS bucket  
FROM  
    class_student_scores;
```

The results are as follows:

```sql
+------------+--------------+-------+--------+
| student_id | student_name | score | bucket |
+------------+--------------+-------+--------+
|          5 | Eve          |    95 |      1 |
|          2 | Bob          |    92 |      1 |
|          7 | Grace        |    90 |      2 |
|          3 | Charlie      |    87 |      2 |
|          1 | Alice        |    85 |      3 |
|          8 | Hannah       |    84 |      3 |
|          6 | Frank        |    80 |      4 |
|          4 | David        |    78 |      4 |
+------------+--------------+-------+--------+
8 rows in set (0.12 sec)
```

In this example, the `NTILE(4)` function divides the students into 4 groups (buckets) based on their scores, with the number of students in each group being as uniform as possible.

:::caution Notes
- If rows cannot be evenly distributed into buckets, some buckets may have one extra row.

- The `NTILE` function works within each partition. If the `PARTITION BY` clause is used, data within each partition will be separately assigned to buckets.
:::

**3. Using NTILE with PARTITION BY**

Suppose you want to group students by class, and then divide them into 3 groups within each class based on their scores. You can use the `PARTITION BY` and `NTILE` functions:

```sql
SELECT  
    class_id,  
    student_id,  
    student_name,  
    score,  
    NTILE(3) OVER (PARTITION BY class_id ORDER BY score DESC) AS bucket  
FROM  
    class_student_scores;
```

The results are as follows:

```sql
+----------+------------+--------------+-------+--------+
| class_id | student_id | student_name | score | bucket |
+----------+------------+--------------+-------+--------+
|        1 |          2 | Bob          |    92 |      1 |
|        1 |          3 | Charlie      |    87 |      2 |
|        1 |          1 | Alice        |    85 |      3 |
|        2 |          5 | Eve          |    95 |      1 |
|        2 |          7 | Grace        |    90 |      1 |
|        2 |          8 | Hannah       |    84 |      2 |
|        2 |          6 | Frank        |    80 |      2 |
|        2 |          4 | David        |    78 |      3 |
+----------+------------+--------------+-------+--------+
8 rows in set (0.05 sec)
```

In this example, students are partitioned by class, and then within each class, they are divided into 3 groups based on their scores. The number of students in each group is as uniform as possible.

## Analytic Functions

### Using the Analytic Function SUM to Calculate Cumulative Values

Here is an example:

```sql
SELECT
        i_category,
        year(d_date),
        month(d_date),
        sum(ss_net_paid) as total_sales,
        sum(sum(ss_net_paid)) over(partition by i_category order by year(d_date),month(d_date) ROWS UNBOUNDED PRECEDING) cum_sales
FROM 
        store_sales,
        date_dim d1,
        item
WHERE 
        d1.d_date_sk = ss_sold_date_sk
        and i_item_sk = ss_item_sk
        and year(d_date) =2000
        and i_category in ('Books','Electronics')
GROUP BY         
        i_category,
        year(d_date),
        month(d_date)
```

The query result is as follows:

```sql
+-------------+--------------+---------------+-------------+-------------+
| i_category  | year(d_date) | month(d_date) | total_sales | cum_sales   |
+-------------+--------------+---------------+-------------+-------------+
| Books       |         2000 |             1 |  5348482.88 |  5348482.88 |
| Books       |         2000 |             2 |  4353162.03 |  9701644.91 |
| Books       |         2000 |             3 |  4466958.01 | 14168602.92 |
| Books       |         2000 |             4 |  4495802.19 | 18664405.11 |
| Books       |         2000 |             5 |  4589913.47 | 23254318.58 |
| Books       |         2000 |             6 |  4384384.00 | 27638702.58 |
| Books       |         2000 |             7 |  4488018.76 | 32126721.34 |
| Books       |         2000 |             8 |  9909227.94 | 42035949.28 |
| Books       |         2000 |             9 | 10366110.30 | 52402059.58 |
| Books       |         2000 |            10 | 10445320.76 | 62847380.34 |
| Books       |         2000 |            11 | 15246901.52 | 78094281.86 |
| Books       |         2000 |            12 | 15526630.11 | 93620911.97 |
| Electronics |         2000 |             1 |  5534568.17 |  5534568.17 |
| Electronics |         2000 |             2 |  4472655.10 | 10007223.27 |
| Electronics |         2000 |             3 |  4316942.60 | 14324165.87 |
| Electronics |         2000 |             4 |  4211523.06 | 18535688.93 |
| Electronics |         2000 |             5 |  4723661.00 | 23259349.93 |
| Electronics |         2000 |             6 |  4127773.06 | 27387122.99 |
| Electronics |         2000 |             7 |  4286523.05 | 31673646.04 |
| Electronics |         2000 |             8 | 10004890.96 | 41678537.00 |
| Electronics |         2000 |             9 | 10143665.77 | 51822202.77 |
| Electronics |         2000 |            10 | 10312020.35 | 62134223.12 |
| Electronics |         2000 |            11 | 14696000.54 | 76830223.66 |
| Electronics |         2000 |            12 | 15344441.52 | 92174665.18 |
+-------------+--------------+---------------+-------------+-------------+
24 rows in set (0.13 sec)
```

In this example, the analytic function SUM defines a window for each row, starting from the beginning of the partition (UNBOUNDED PRECEDING) and ending at the current row by default. In this case, nested use of SUM is required because we need to perform SUM on the result that is itself a SUM. Nested aggregation is frequently used in analytic aggregation functions.

### Using the Analytic Function AVG to Calculate Moving Averages

Here is an example:

```sql
SELECT
        i_category,
        year(d_date),
        month(d_date),
        sum(ss_net_paid) as total_sales,
        avg(sum(ss_net_paid)) over(order by year(d_date),month(d_date) ROWS 2 PRECEDING) avg
FROM 
        store_sales,
        date_dim d1,
        item
WHERE 
        d1.d_date_sk = ss_sold_date_sk
        and i_item_sk = ss_item_sk
        and year(d_date) =2000
        and i_category='Books'
GROUP BY         
        i_category,
        year(d_date),
        month(d_date)
```

The query result is as follows:

```sql
+------------+--------------+---------------+-------------+---------------+
| i_category | year(d_date) | month(d_date) | total_sales | avg           |
+------------+--------------+---------------+-------------+---------------+
| Books      |         2000 |             1 |  5348482.88 |  5348482.8800 |
| Books      |         2000 |             2 |  4353162.03 |  4850822.4550 |
| Books      |         2000 |             3 |  4466958.01 |  4722867.6400 |
| Books      |         2000 |             4 |  4495802.19 |  4438640.7433 |
| Books      |         2000 |             5 |  4589913.47 |  4517557.8900 |
| Books      |         2000 |             6 |  4384384.00 |  4490033.2200 |
| Books      |         2000 |             7 |  4488018.76 |  4487438.7433 |
| Books      |         2000 |             8 |  9909227.94 |  6260543.5666 |
| Books      |         2000 |             9 | 10366110.30 |  8254452.3333 |
| Books      |         2000 |            10 | 10445320.76 | 10240219.6666 |
| Books      |         2000 |            11 | 15246901.52 | 12019444.1933 |
| Books      |         2000 |            12 | 15526630.11 | 13739617.4633 |
+------------+--------------+---------------+-------------+---------------+
12 rows in set (0.13 sec)
```

:::caution Note

In the output data, the AVG column for the first two rows does not calculate a three-day moving average because there are not enough preceding rows for the boundary data (the number of rows specified in SQL is 3).

:::

Additionally, it is possible to calculate window aggregate functions centered on the current row. For instance, this example calculates the centered moving average of monthly sales for products in the "Books" category in the year 2000, specifically averaging the total sales of the month before the current row, the current row, and the month after the current row.

```sql
SELECT  
        i_category,  
        YEAR(d_date) AS year,  
        MONTH(d_date) AS month,  
        SUM(ss_net_paid) AS total_sales,  
        AVG(SUM(ss_net_paid)) OVER (ORDER BY YEAR(d_date), MONTH(d_date) ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS avg_sales  
FROM   
        store_sales,  
        date_dim d1,  
        item  
WHERE   
        d1.d_date_sk = ss_sold_date_sk  
        AND i_item_sk = ss_item_sk  
        AND YEAR(d_date) = 2000  
        AND i_category = 'Books'  
GROUP BY           
        i_category,  
        YEAR(d_date),  
        MONTH(d_date)
```

:::caution Note

The centered moving averages for the starting and ending rows in the output data are calculated based on only two days because there are not enough rows before and after the boundary data.

:::

## Reporting Function

A reporting function refers to a scenario where the window range for each row covers the entire Partition. The primary advantage of reporting functions is their ability to pass data multiple times within a single query block, thereby enhancing query performance. For example, queries such as "For each year, find the product category with the highest sales" do not require JOIN operations when using reporting functions. An example is provided below:

```sql
SELECT year, category, total_sum FROM (  
    SELECT  
        YEAR(d_date) AS year,  
        i_category AS category,  
        SUM(ss_net_paid) AS total_sum,  
        MAX(SUM(ss_net_paid)) OVER (PARTITION BY YEAR(d_date)) AS max_sales  
    FROM  
        store_sales,  
        date_dim d1,  
        item  
    WHERE  
        d1.d_date_sk = ss_sold_date_sk  
        AND i_item_sk = ss_item_sk  
        AND YEAR(d_date) IN (1998, 1999)  
    GROUP BY  
        YEAR(d_date), i_category   
) t  
WHERE total_sum = max_sales;
```

The inner query result for reporting `MAX(SUM(ss_net_paid))` is as follows:

```sql
SELECT year, category, total_sum FROM (  
    SELECT  
        YEAR(d_date) AS year,  
        i_category AS category,  
        SUM(ss_net_paid) AS total_sum,  
        MAX(SUM(ss_net_paid)) OVER (PARTITION BY YEAR(d_date)) AS max_sales  
    FROM  
        store_sales,  
        date_dim d1,  
        item  
    WHERE  
        d1.d_date_sk = ss_sold_date_sk  
        AND i_item_sk = ss_item_sk  
        AND YEAR(d_date) IN (1998, 1999)  
    GROUP BY  
        YEAR(d_date), i_category   
) t  
WHERE total_sum = max_sales;
```

The complete query result is as follows:

```sql
+------+-------------+-------------+  
| year | category    | total_sum   |  
+------+-------------+-------------+  
| 1998 | Electronics | 91723676.27 |  
| 1999 | Electronics | 90310850.54 |  
+------+-------------+-------------+  
2 rows in set (0.12 sec)
```

You can combine reporting aggregation with nested queries to solve some complex problems, such as finding the best-selling products within important product subcategories. For example, to "Find subcategories where product sales account for more than 20% of total sales in their product category, and select the top five products from these subcategories," the query statement is as follows:

```sql
SELECT i_category AS categ, i_class AS sub_categ, i_item_id   
FROM  
    (  
    SELECT   
        i_item_id, i_class, i_category, SUM(ss_net_paid) AS sales,  
        SUM(SUM(ss_net_paid)) OVER (PARTITION BY i_category) AS cat_sales,  
        SUM(SUM(ss_net_paid)) OVER (PARTITION BY i_class) AS sub_cat_sales,  
        RANK() OVER (PARTITION BY i_class ORDER BY SUM(ss_net_paid)) AS rank_in_line  
    FROM   
        store_sales,  
        item  
    WHERE  
        i_item_sk = ss_item_sk  
    GROUP BY i_class, i_category, i_item_id  
    ) t  
WHERE sub_cat_sales > 0.2 * cat_sales AND rank_in_line <= 5;
```

## LAG / LEAD 

The LAG and LEAD functions are suitable for comparisons between values. Both functions can access multiple rows in a table simultaneously without requiring self-joins, thereby enhancing the speed of query processing. Specifically, the LAG function provides access to a row at a given offset before the current row, while the LEAD function provides access to a row at a given offset after the current row.

Below is an example of an SQL query using the LAG function. This query aims to select the total sales for each product category in specific years (1999, 2000, 2001, 2002), the total sales of the previous year, and the difference between them:

```sql
select year, category, total_sales, before_year_sales, total_sales - before_year_sales from
(
select
        sum(ss_net_paid) as total_sales,
        year(d_date) year,
        i_category category,
        lag(sum(ss_net_paid), 1,0) over(PARTITION BY i_category ORDER BY YEAR(d_date)) AS before_year_sales
from
        store_sales,
        date_dim d1,
        item
where
        d1.d_date_sk = ss_sold_date_sk
        and i_item_sk = ss_item_sk
GROUP BY 
        YEAR(d_date), i_category
) t
where year in (1999, 2000, 2001, 2002)
```

The query results are as follows:

```sql
+------+-------------+-------------+-------------------+-----------------------------------+
| year | category    | total_sales | before_year_sales | (total_sales - before_year_sales) |
+------+-------------+-------------+-------------------+-----------------------------------+
| 1999 | Books       | 88993351.11 |       91307909.84 |                       -2314558.73 |
| 2000 | Books       | 93620911.97 |       88993351.11 |                        4627560.86 |
| 2001 | Books       | 90640097.99 |       93620911.97 |                       -2980813.98 |
| 2002 | Books       | 89585515.90 |       90640097.99 |                       -1054582.09 |
| 1999 | Electronics | 90310850.54 |       91723676.27 |                       -1412825.73 |
| 2000 | Electronics | 92174665.18 |       90310850.54 |                        1863814.64 |
| 2001 | Electronics | 92598527.85 |       92174665.18 |                         423862.67 |
| 2002 | Electronics | 94303831.84 |       92598527.85 |                        1705303.99 |
+------+-------------+-------------+-------------------+-----------------------------------+
8 rows in set (0.16 sec)
```


## Examples

1. Assume we have the following stock data, with stock symbol JDR and daily closing prices:

```sql
create table stock_ticker (stock_symbol string, closing_price decimal(8,2), closing_date datetime);  
  
INSERT INTO stock_ticker VALUES 
    ("JDR", 12.86, "2014-10-02 00:00:00"), 
    ("JDR", 12.89, "2014-10-03 00:00:00"), 
    ("JDR", 12.94, "2014-10-04 00:00:00"), 
    ("JDR", 12.55, "2014-10-05 00:00:00"), 
    ("JDR", 14.03, "2014-10-06 00:00:00"), 
    ("JDR", 14.75, "2014-10-07 00:00:00"), 
    ("JDR", 13.98, "2014-10-08 00:00:00")
;

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

## Reference

The table creation statement used in the example is as follows:

```sql
CREATE DATABASE IF NOT EXISTS doc_tpcds;
USE doc_tpcds;

CREATE TABLE IF NOT EXISTS item (
    i_item_sk bigint not null,
    i_item_id char(16) not null,
    i_rec_start_date date,
    i_rec_end_date date,
    i_item_desc varchar(200),
    i_current_price decimal(7,2),
    i_wholesale_cost decimal(7,2),
    i_brand_id integer,
    i_brand char(50),
    i_class_id integer,
    i_class char(50),
    i_category_id integer,
    i_category char(50),
    i_manufact_id integer,
    i_manufact char(50),
    i_size char(20),
    i_formulation char(20),
    i_color char(20),
    i_units char(10),
    i_container char(10),
    i_manager_id integer,
    i_product_name char(50)
)
DUPLICATE KEY(i_item_sk)
DISTRIBUTED BY HASH(i_item_sk) BUCKETS 12
PROPERTIES (
  "replication_num" = "1"
);

CREATE TABLE IF NOT EXISTS store_sales (
    ss_item_sk bigint not null,
    ss_ticket_number bigint not null,
    ss_sold_date_sk bigint,
    ss_sold_time_sk bigint,
    ss_customer_sk bigint,
    ss_cdemo_sk bigint,
    ss_hdemo_sk bigint,
    ss_addr_sk bigint,
    ss_store_sk bigint,
    ss_promo_sk bigint,
    ss_quantity integer,
    ss_wholesale_cost decimal(7,2),
    ss_list_price decimal(7,2),
    ss_sales_price decimal(7,2),
    ss_ext_discount_amt decimal(7,2),
    ss_ext_sales_price decimal(7,2),
    ss_ext_wholesale_cost decimal(7,2),
    ss_ext_list_price decimal(7,2),
    ss_ext_tax decimal(7,2),
    ss_coupon_amt decimal(7,2),
    ss_net_paid decimal(7,2),
    ss_net_paid_inc_tax decimal(7,2),
    ss_net_profit decimal(7,2)
)
DUPLICATE KEY(ss_item_sk, ss_ticket_number)
DISTRIBUTED BY HASH(ss_item_sk, ss_ticket_number) BUCKETS 32
PROPERTIES (
  "replication_num" = "1"
);

CREATE TABLE IF NOT EXISTS date_dim (
    d_date_sk bigint not null,
    d_date_id char(16) not null,
    d_date date,
    d_month_seq integer,
    d_week_seq integer,
    d_quarter_seq integer,
    d_year integer,
    d_dow integer,
    d_moy integer,
    d_dom integer,
    d_qoy integer,
    d_fy_year integer,
    d_fy_quarter_seq integer,
    d_fy_week_seq integer,
    d_day_name char(9),
    d_quarter_name char(6),
    d_holiday char(1),
    d_weekend char(1),
    d_following_holiday char(1),
    d_first_dom integer,
    d_last_dom integer,
    d_same_day_ly integer,
    d_same_day_lq integer,
    d_current_day char(1),
    d_current_week char(1),
    d_current_month char(1),
    d_current_quarter char(1),
    d_current_year char(1)
)
DUPLICATE KEY(d_date_sk)
DISTRIBUTED BY HASH(d_date_sk) BUCKETS 12
PROPERTIES (
  "replication_num" = "1"
);

CREATE TABLE IF NOT EXISTS customer_address (
    ca_address_sk bigint not null,
    ca_address_id char(16) not null,
    ca_street_number char(10),
    ca_street_name varchar(60),
    ca_street_type char(15),
    ca_suite_number char(10),
    ca_city varchar(60),
    ca_county varchar(30),
    ca_state char(2),
    ca_zip char(10),
    ca_country varchar(20),
    ca_gmt_offset decimal(5,2),
    ca_location_type char(20)
)
DUPLICATE KEY(ca_address_sk)
DISTRIBUTED BY HASH(ca_address_sk) BUCKETS 12
PROPERTIES (
  "replication_num" = "1"
);
```

Execute the following command on the terminal to download the data to the local computer and load the data into the table using the Stream Load method:

```shell
curl -L https://cdn.selectdb.com/static/doc_ddl_dir_d27a752a7b.tar -o - | tar -Jxf -

curl --location-trusted \
-u "root:" \
-H "column_separator:|" \
-H "columns: i_item_sk, i_item_id, i_rec_start_date, i_rec_end_date, i_item_desc, i_current_price, i_wholesale_cost, i_brand_id, i_brand, i_class_id, i_class, i_category_id, i_category, i_manufact_id, i_manufact, i_size, i_formulation, i_color, i_units, i_container, i_manager_id, i_product_name" \
-T "doc_ddl_dir/item_1_10.dat" \
http://127.0.0.1:8030/api/doc_tpcds/item/_stream_load

curl --location-trusted \
-u "root:" \
-H "column_separator:|" \
-H "columns: d_date_sk, d_date_id, d_date, d_month_seq, d_week_seq, d_quarter_seq, d_year, d_dow, d_moy, d_dom, d_qoy, d_fy_year, d_fy_quarter_seq, d_fy_week_seq, d_day_name, d_quarter_name, d_holiday, d_weekend, d_following_holiday, d_first_dom, d_last_dom, d_same_day_ly, d_same_day_lq, d_current_day, d_current_week, d_current_month, d_current_quarter, d_current_year" \
-T "doc_ddl_dir/date_dim_1_10.dat" \
http://127.0.0.1:8030/api/doc_tpcds/date_dim/_stream_load

curl --location-trusted \
-u "root:" \
-H "column_separator:|" \
-H "columns: ss_sold_date_sk, ss_sold_time_sk, ss_item_sk, ss_customer_sk, ss_cdemo_sk, ss_hdemo_sk, ss_addr_sk, ss_store_sk, ss_promo_sk, ss_ticket_number, ss_quantity, ss_wholesale_cost, ss_list_price, ss_sales_price, ss_ext_discount_amt, ss_ext_sales_price, ss_ext_wholesale_cost, ss_ext_list_price, ss_ext_tax, ss_coupon_amt, ss_net_paid, ss_net_paid_inc_tax, ss_net_profit" \
-T "doc_ddl_dir/store_sales.csv" \
http://127.0.0.1:8030/api/doc_tpcds/store_sales/_stream_load

curl --location-trusted \
-u "root:" \
-H "column_separator:|" \
-H "ca_address_sk, ca_address_id, ca_street_number, ca_street_name, ca_street_type, ca_suite_number, ca_city, ca_county, ca_state, ca_zip, ca_country, ca_gmt_offset, ca_location_type" \
-T "doc_ddl_dir/customer_address_1_10.dat" \
http://127.0.0.1:8030/api/doc_tpcds/customer_address/_stream_load
```

The data files ``item_1_10.dat``, ``date-dim_1_10.dat``, ``store_stales.csv``, and ``customer-address_1_10.dat`` can be downloaded by clicking on the [link](https://cdn.selectdb.com/static/doc_ddl_dir_d27a752a7b.tar).
