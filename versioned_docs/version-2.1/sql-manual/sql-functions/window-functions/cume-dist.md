---
{
    "title": "CUME_DIST",
    "language": "en"
}
---

## Description

CUME_DIST (Cumulative Distribution) is a window function that calculates the relative ranking of the current row value in the sorted result set. It returns the cumulative distribution value of the current row in the result set, ranging from 0 to 1. For a given row, its cumulative distribution value equals: (number of rows less than or equal to the current row value) / (total number of rows in the window partition).

## Syntax

```sql
CUME_DIST()
```

## Return Value

Returns a DOUBLE value ranging from 0 to 1.

## Examples
Suppose we have a table called sales containing sales data, including salesperson name (sales_person), sales amount (sales_amount), and sales date (sales_date). We want to calculate the cumulative percentage of each salesperson's sales amount for each sales date.

```sql
SELECT 
    sales_person,
    sales_date,
    sales_amount,
    CUME_DIST() OVER (PARTITION BY sales_date ORDER BY sales_amount ASC) AS cumulative_sales_percentage
FROM 
    sales;
```

Assume the sales table contains the following data:
```sql
+------+--------------+------------+--------------+
| id   | sales_person | sales_date | sales_amount |
+------+--------------+------------+--------------+
|    1 | Alice        | 2024-02-01 |         2000 |
|    2 | Bob          | 2024-02-01 |         1500 |
|    3 | Alice        | 2024-02-02 |         1800 |
|    4 | Bob          | 2024-02-02 |         1200 |
|    5 | Alice        | 2024-02-03 |         2200 |
|    6 | Bob          | 2024-02-03 |         1900 |
|    7 | Tom          | 2024-02-03 |         2000 |
|    8 | Jerry        | 2024-02-03 |         2000 |
+------+--------------+------------+--------------+
```

After executing the above SQL query, the result will show each salesperson's sales amount and their cumulative percentage ranking for each sales date:

```text
+--------------+------------+--------------+-----------------------------+
| sales_person | sales_date | sales_amount | cumulative_sales_percentage |
+--------------+------------+--------------+-----------------------------+
| Bob          | 2024-02-01 |         1500 |                         0.5 |
| Alice        | 2024-02-01 |         2000 |                           1 |
| Bob          | 2024-02-02 |         1200 |                         0.5 |
| Alice        | 2024-02-02 |         1800 |                           1 |
| Bob          | 2024-02-03 |         1900 |                        0.25 |
| Tom          | 2024-02-03 |         2000 |                        0.75 |
| Jerry        | 2024-02-03 |         2000 |                        0.75 |
| Alice        | 2024-02-03 |         2200 |                           1 |
+--------------+------------+--------------+-----------------------------+
```
In this example, the CUME_DIST() function sorts sales amounts within each sales date and then calculates the cumulative percentage of each salesperson's sales amount for that date. Since we used PARTITION BY sales_date, the calculations are performed separately for each sales date, with salesperson sales amounts being calculated independently for different dates.