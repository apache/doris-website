---
{
    "title": "Multi-Dimensional Analytics",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

In a database, ROLLUP, CUBE, and GROUPING SETS are advanced SQL statements used for multidimensional data aggregation. These features significantly enhance the capabilities of the GROUP BY clause, enabling users to obtain multiple levels of summary results in a single query, which is semantically equivalent to using UNION ALL to connect multiple aggregation statements.

- **ROLLUP**: ROLLUP is an operation used to generate hierarchical summaries. It aggregates data according to the specified column order, gradually summarizing from the finest granularity to the highest level. For example, in sales data, ROLLUP can be used to summarize by region and time, providing sales for each region per month, total sales for each region, and overall total sales. ROLLUP is suitable for scenarios requiring step-by-step summaries.

- **CUBE**: CUBE is a more powerful aggregation operation that generates all possible summary combinations. Unlike ROLLUP, CUBE calculates subsets for all dimensions. For instance, for sales data aggregated by product and region, CUBE will compute sales for each product in each region, total sales for each product, total sales for each region, and overall total sales. CUBE is applicable to scenarios requiring comprehensive multidimensional analysis, such as business analysis and market research.

- **GROUPING SETS**: GROUPING SETS offer flexibility in aggregating specific grouping sets. It allows users to specify a set of column combinations for independent aggregation, rather than generating all possible combinations as in ROLLUP and CUBE. For example, one can define summaries for specific combinations of region and time without needing all combinations of each dimension. GROUPING SETS are suitable for scenarios requiring customized summaries, providing flexible aggregation control.

ROLLUP, CUBE, and GROUPING SETS provide powerful multidimensional data summary functions, catering to various data analysis and reporting needs, and making complex aggregation calculations simpler and more efficient. The following sections will detail the usage scenarios, syntax, and examples of these features.

## ROLLUP

### Use Case

ROLLUP is particularly useful for summarizing data along hierarchical dimensions such as time, geography, and category. For instance, queries can specify `ROLLUP(year, month, day)` or `(country, Province, city)`.

### Syntax and Example

The syntax for ROLLUP is as follows:

```sql
SELECT … GROUP BY ROLLUP(grouping_column_reference_list)
```

Here's an example query that analyzes sales sums by year and month:

```sql
SELECT  
        YEAR(d_date),  
        MONTH(d_date),  
        SUM(ss_net_paid) AS total_sum  
FROM  
        store_sales,  
        date_dim d1  
WHERE  
        d1.d_date_sk = ss_sold_date_sk  
        AND YEAR(d_date) IN (2001, 2002)  
        AND MONTH(d_date) IN (1, 2, 3)  
GROUP BY  
        ROLLUP(YEAR(d_date), MONTH(d_date))  
ORDER BY  
        YEAR(d_date), MONTH(d_date);
```

This query summarizes data by time, calculating subtotals for sales by year, sales by month within each year, and the grand total of sales. The query result is as follows:

```sql
+--------------+---------------+-------------+  
| YEAR(d_date) | MONTH(d_date) | total_sum   |  
+--------------+---------------+-------------+  
|         NULL |          NULL | 54262669.17 |  
|         2001 |          NULL | 26640320.46 |  
|         2001 |             1 |  9982165.83 |  
|         2001 |             2 |  8454915.34 |  
|         2001 |             3 |  8203239.29 |  
|         2002 |          NULL | 27622348.71 |  
|         2002 |             1 | 11260654.35 |  
|         2002 |             2 |  7722750.61 |  
|         2002 |             3 |  8638943.75 |  
+--------------+---------------+-------------+  
9 rows in set (0.08 sec)
```

## CUBE

### Use Case

CUBE is best suited for queries involving columns from multiple independent dimensions, rather than columns representing different levels of a single dimension. For example, a common usage scenario is summarizing all combinations of month, region, and product. These are three independent dimensions, and it is common to analyze all possible subtotal combinations. By contrast, cross-tabulating all possible combinations of year, month, and day would include several unnecessary values due to the natural hierarchy in the time dimension. In most analyses, subtotals like profits calculated by month and day are unnecessary. Relatively few users need to ask, "What is the total sales for the 16th of each month throughout the year?"

### Syntax and Example

The syntax for CUBE is as follows:

```sql
SELECT … GROUP BY CUBE(grouping_column_reference_list)
```

Example usage:

```sql
SELECT  
        YEAR(d_date),  
        i_category,  
        ca_state,  
        SUM(ss_net_paid) AS total_sum  
FROM  
        store_sales,  
        date_dim d1,  
        item,  
        customer_address ca   
WHERE  
        d1.d_date_sk = ss_sold_date_sk  
        AND i_item_sk = ss_item_sk  
        AND ss_addr_sk = ca_address_sk  
        AND i_category IN ("Books", "Electronics")  
        AND YEAR(d_date) IN (1998, 1999)  
        AND ca_state IN ("LA", "AK")  
GROUP BY CUBE(YEAR(d_date), i_category, ca_state)  
ORDER BY YEAR(d_date), i_category, ca_state;
```

The query result is as follows, calculating:

- The total sales sum;

- Subtotals for sales by year, by product category, and by state;

- Subtotals for sales by product category within each year, by state for each product, by state within each year, and by product category within each state and year.

```sql
+--------------+-------------+----------+------------+  
| YEAR(d_date) | i_category  | ca_state | total_sum  |  
+--------------+-------------+----------+------------+  
|         NULL | NULL        | NULL     | 8690374.60 |  
|         NULL | NULL        | AK       | 2675198.33 |  
|         NULL | NULL        | LA       | 6015176.27 |  
|         NULL | Books       | NULL     | 4238177.69 |  
|         NULL | Books       | AK       | 1310791.36 |  
|         NULL | Books       | LA       | 2927386.33 |  
|         NULL | Electronics | NULL     | 4452196.91 |  
|         NULL | Electronics | AK       | 1364406.97 |  
|         NULL | Electronics | LA       | 3087789.94 |  
|         1998 | NULL        | NULL     | 4369656.14 |  
|         1998 | NULL        | AK       | 1402539.19 |  
|         1998 | NULL        | LA       | 2967116.95 |  
|         1998 | Books       | NULL     | 2213703.82 |  
|         1998 | Books       | AK       |  719911.29 |  
|         1998 | Books       | LA       | 1493792.53 |  
|         1998 | Electronics | NULL     | 2155952.32 |  
|         1998 | Electronics | AK       |  682627.90 |  
|         1998 | Electronics | LA       | 1473324.42 |  
|         1999 | NULL        | NULL     | 4320718.46 |  
|         1999 | NULL        | AK       | 1272659.14 |  
|         1999 | NULL        | LA       | 3048059.32 |  
|         1999 | Books       | NULL     | 2024473.87 |  
|         1999 | Books       | AK       |  590880.07 |  
|         1999 | Books       | LA       | 1433593.80 |  
|         1999 | Electronics | NULL     | 2296244.59 |  
|         1999 | Electronics | AK       |  681779.07 |  
|         1999 | Electronics | LA       | 1614465.52 |  
+--------------+-------------+----------+------------+  
27 rows in set (0.21 sec)
```

## GROUPING FUNCTION

This section introduces how to address two challenges when using ROLLUP and CUBE:

1. How to programmatically identify which rows in the result set represent subtotals and accurately determine the aggregation level corresponding to a given subtotal. Since subtotals are often needed for calculations such as percentage of totals, we require a convenient method to identify these subtotal rows.

2. When the query results contain both actual stored NULL values and "NULL" values generated by ROLLUP or CUBE operations, another problem arises: how to distinguish between these two types of NULL values?

GROUPING, GROUPING_ID, and GROUPING SETS can effectively solve the aforementioned challenges.

### GROUPING

**1. Principles**

GROUPING uses a single column as a parameter and returns 1 when encountering a NULL value created by ROLLUP or CUBE operations, indicating that the row is a subtotal. Any other type of value (including NULLs inherently present in the table data) returns 0.

Example:

```sql
select  
        year(d_date),  
        month(d_date),  
        sum(ss_net_paid) as total_sum,  
        grouping(year(d_date)),  
        grouping(month(d_date))  
from  
        store_sales,  
        date_dim d1  
where  
        d1.d_date_sk = ss_sold_date_sk  
        and year(d_date) in (2001, 2002)  
        and month(d_date) in (1, 2, 3)  
group by  
        rollup(year(d_date), month(d_date))  
order by  
        year(d_date), month(d_date);
```

- The GROUPING function result for the (YEAR(d_date), MONTH(d_date)) group is (0,0) for aggregation by year and month.

- The GROUPING function result for the (YEAR(d_date)) group is (0,1) for aggregation by year.

- The GROUPING function result for the () group is (1,1) for the total aggregation.

Query result:

```Plain
+--------------+---------------+-------------+------------------------+-------------------------+  
| year(d_date) | month(d_date) | total_sum   | Grouping(year(d_date)) | Grouping(month(d_date)) |  
+--------------+---------------+-------------+------------------------+-------------------------+  
|         NULL |          NULL | 54262669.17 |                      1 |                       1 |  
|         2001 |          NULL | 26640320.46 |                      0 |                       1 |  
|         2001 |             1 |  9982165.83 |                      0 |                       0 |  
|         2001 |             2 |  8454915.34 |                      0 |                       0 |  
|         2001 |             3 |  8203239.29 |                      0 |                       0 |  
|         2002 |          NULL | 27622348.71 |                      0 |                       1 |  
|         2002 |             1 | 11260654.35 |                      0 |                       0 |  
|         2002 |             2 |  7722750.61 |                      0 |                       0 |  
|         2002 |             3 |  8638943.75 |                      0 |                       0 |  
+--------------+---------------+-------------+------------------------+-------------------------+  
9 rows in set (0.06 sec)
```

**2. Usage Scenarios, Syntax, and Examples**

The GROUPING function can be used to filter results. Example:

```sql
select
        year(d_date),
        i_category,
        ca_state,
        sum(ss_net_paid) as total_sum
from
        store_sales,
        date_dim d1,
        item,
        customer_address ca 
where
        d1.d_date_sk = ss_sold_date_sk
        and i_item_sk = ss_item_sk
        and ss_addr_sk=ca_address_sk
        and i_category in ("Books", "Electronics")
        and year(d_date) in(1998, 1999)
        and ca_state in ("LA", "AK")
group by cube(year(d_date), i_category, ca_state)
having grouping(year(d_date))=1 and grouping(i_category)=1 and grouping(ca_state)=1
or grouping(year(d_date))=0 and grouping(i_category)=1 and grouping(ca_state)=1
or grouping(year(d_date))=1 and grouping(i_category)=1 and grouping(ca_state)=0
order by year(d_date), i_category, ca_state;   
```

Using the GROUPING function in the HAVING clause retains only the total sales, sales summarized by year, and sales summarized by region. Query result:

```Plain
+---------------------+------------+----------+------------+  
| year(`d1`.`d_date`) | i_category | ca_state | total_sum  |  
+---------------------+------------+----------+------------+  
|                NULL | NULL       | NULL     | 8690374.60 |  
|                NULL | NULL       | AK       | 2675198.33 |  
|                NULL | NULL       | LA       | 6015176.27 |  
|                1998 | NULL       | NULL     | 4369656.14 |  
|                1999 | NULL       | NULL     | 4320718.46 |  
+---------------------+------------+----------+------------+  
5 rows in set (0.13 sec)
```

You can also use the GROUPING function with the IF function to enhance query readability. Example:

```sql
select  
        if(grouping(year(d_date)) = 1, "Multi-year sum", year(d_date)) as year,  
        if(grouping(i_category) = 1, "Multi-category sum", i_category) as category,  
        sum(ss_net_paid) as total_sum  
from  
        store_sales,  
        date_dim d1,  
        item,  
        customer_address ca  
where  
        d1.d_date_sk = ss_sold_date_sk  
        and i_item_sk = ss_item_sk  
        and ss_addr_sk = ca_address_sk  
        and i_category in ("Books", "Electronics")  
        and year(d_date) in (1998, 1999)  
        and ca_state in ("LA", "AK")  
group by cube(year(d_date), i_category)
```

Query result:

```sql
+----------------+--------------------+------------+  
| year           | category           | total_sum  |  
+----------------+--------------------+------------+  
| 1998           | Books              | 2213703.82 |  
| 1998           | Electronics        | 2155952.32 |  
| 1999           | Electronics        | 2296244.59 |  
| 1999           | Books              | 2024473.87 |  
| 1998           | Multi-category sum | 4369656.14 |  
| 1999           | Multi-category sum | 4320718.46 |  
| Multi-year sum | Books              | 4238177.69 |  
| Multi-year sum | Electronics        | 4452196.91 |  
| Multi-year sum | Multi-category sum | 8690374.60 |  
+----------------+--------------------+------------+  
9 rows in set (0.09 sec)
```

### GROUPING_ID

**1. Usage Scenarios**

In a database, both GROUPING_ID and GROUPING functions serve as auxiliary functions for handling multidimensional data aggregation queries, such as ROLLUP and CUBE, aiding users in distinguishing between different levels of aggregation results. If you wish to determine the aggregation level of a particular row, you need to use the GROUPING function to compute all GROUP BY columns, as the computation result of a single column alone is insufficient.

The GROUPING_ID function is more powerful than GROUPING because it can detect multiple columns simultaneously. The GROUPING_ID function accepts multiple columns as parameters and returns an integer that represents the aggregation status of these columns through binary bits. When using tables or materialized views to store computation results, using GROUPING to represent different levels of aggregation can consume considerable storage space. In such scenarios, GROUPING_ID is more appropriate.

Taking CUBE(a, b) as an example, its GROUPING_ID can be represented as follows:

| Aggregation Level | Bit Vector | GROUPING_ID | GROUPING(a) | GROUPING(b) |
| ----------------- | ---------- | ----------- | ----------- | ----------- |
| a,b               | 0 0        | 0           | 0           | 0           |
| a                 | 0 1        | 1           | 0           | 1           |
| b                 | 1 0        | 2           | 1           | 0           |
| Grand Total       | 1 1        | 3           | 1           | 1           |

**2. Syntax and Example**

Here is an example SQL query:

```sql
SELECT    
    year(d_date),    
    i_category,    
    SUM(ss_net_paid) AS total_sum,    
    GROUPING(year(d_date)),    
    GROUPING(i_category),    
    GROUPING_ID(year(d_date), i_category)    
FROM    
    store_sales,    
    date_dim d1,    
    item,    
    customer_address ca     
WHERE    
    d1.d_date_sk = ss_sold_date_sk    
    AND i_item_sk = ss_item_sk    
    AND ss_addr_sk = ca_address_sk    
    AND i_category IN ('Books', 'Electronics')    
    AND year(d_date) IN (1998, 1999)    
    AND ca_state IN ('LA', 'AK')    
GROUP BY CUBE(year(d_date), i_category);
```

The query results are as follows:

```sql
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+    
| year(d_date) | i_category  | total_sum  | GROUPING(year(d_date)) | GROUPING(i_category) | GROUPING_ID(year(d_date), i_category) |    
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+    
| 1998         | Electronics | 2155952.32 | 0                      | 0                    | 0                                     |    
| 1998         | Books       | 2213703.82 | 0                      | 0                    | 0                                     |    
| 1999         | Electronics | 2296244.59 | 0                      | 0                    | 0                                     |    
| 1999         | Books       | 2024473.87 | 0                      | 0                    | 0                                     |    
| 1998         | NULL        | 4369656.14 | 0                      | 1                    | 1                                     |    
| 1999         | NULL        | 4320718.46 | 0                      | 1                    | 1                                     |    
| NULL         | Electronics | 4452196.91 | 1                      | 0                    | 2                                     |    
| NULL         | Books       | 4238177.69 | 1                      | 0                    | 2                                     |    
| NULL         | NULL        | 8690374.60 | 1                      | 1                    | 3                                     |    
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+    
9 rows in set (0.12 sec)
```

### GROUPING SETS

**1. Usage Scenarios**

When there is a need to selectively specify the group sets to create, the `GROUPING SETS` expression can be used in the `GROUP BY` clause. This method allows users to precisely specify across multiple dimensions without computing the entire CUBE.

Since CUBE queries typically consume significant resources, using `GROUPING SETS` can enhance query execution efficiency when only a few dimensions are of interest.

**2. Syntax and Examples**

The syntax for `GROUPING SETS` is as follows:

```sql
SELECT … GROUP BY GROUPING SETS(grouping_column_reference_list)
```

If you need:

- Subtotals of sales for each product category per year

- Subtotals of sales for each state per year

- Subtotals of sales for each product in each state per year

You can use `GROUPING SETS` to specify these dimensions and perform the aggregation. Here is an example:

```sql
SELECT  
    YEAR(d_date),  
    i_category,  
    ca_state,  
    SUM(ss_net_paid) AS total_sum  
FROM  
    store_sales,  
    date_dim d1,  
    item,  
    customer_address ca   
WHERE  
    d1.d_date_sk = ss_sold_date_sk  
    AND i_item_sk = ss_item_sk  
    AND ss_addr_sk = ca_address_sk  
    AND i_category IN ('Books', 'Electronics')  
    AND YEAR(d_date) IN (1998, 1999)  
    AND ca_state IN ('LA', 'AK')  
GROUP BY GROUPING SETS(  
    (YEAR(d_date), i_category),   
    (YEAR(d_date), ca_state),   
    (YEAR(d_date), ca_state, i_category)  
)  
ORDER BY YEAR(d_date), i_category, ca_state;
```

Query Result:

```sql
+--------------+-------------+----------+------------+  
| YEAR(d_date) | i_category  | ca_state | total_sum  |  
+--------------+-------------+----------+------------+  
| 1998         | NULL        | AK       | 1402539.19 |  
| 1998         | NULL        | LA       | 2967116.95 |  
| 1998         | Books       | NULL     | 2213703.82 |  
| 1998         | Books       | AK       |  719911.29 |  
| 1998         | Books       | LA       | 1493792.53 |  
| 1998         | Electronics | NULL     | 2155952.32 |  
| 1998         | Electronics | AK       |  682627.90 |  
| 1998         | Electronics | LA       | 1473324.42 |  
| 1999         | NULL        | AK       | 1272659.14 |  
| 1999         | NULL        | LA       | 3048059.32 |  
| 1999         | Books       | NULL     | 2024473.87 |  
| 1999         | Books       | AK       |  590880.07 |  
| 1999         | Books       | LA       | 1433593.80 |  
| 1999         | Electronics | NULL     | 2296244.59 |  
| 1999         | Electronics | AK       |  681779.07 |  
| 1999         | Electronics | LA       | 1614465.52 |  
+--------------+-------------+----------+------------+  
16 rows in set (0.11 sec)
```

The above approach is equivalent to using CUBE but specifies concrete `grouping_id`, thereby reducing unnecessary calculations:

```sql
SELECT  
    SUM(ss_net_paid) AS total_sum,  
    YEAR(d_date),  
    i_category,  
    ca_state  
FROM  
    store_sales,  
    date_dim d1,  
    item,  
    customer_address ca   
WHERE  
    d1.d_date_sk = ss_sold_date_sk  
    AND i_item_sk = ss_item_sk  
    AND ss_addr_sk = ca_address_sk  
    AND i_category IN ('Books', 'Electronics')  
    AND YEAR(d_date) IN (1998, 1999)  
    AND ca_state IN ('LA', 'AK')  
GROUP BY CUBE(YEAR(d_date), ca_state, i_category)  
HAVING grouping_id(YEAR(d_date), ca_state, i_category) = 0  
    OR grouping_id(YEAR(d_date), ca_state, i_category) = 2   
    OR grouping_id(YEAR(d_date), ca_state, i_category) = 1;
```

:::info Note

Using `CUBE` computes all possible aggregation levels (eight in this case), but in practice, you may only be interested in a few of them.

:::

**3. Semantic Equivalents**

- GROUPING SETS vs. GROUP BY UNION ALL

  The `GROUPING SETS` statement:

  ```sql
  SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
  ```

  Is equivalent in query results to multiple `GROUP BY` queries connected with `UNION ALL`:

  ```sql
  SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2  
  UNION ALL  
  SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1  
  UNION ALL  
  SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2  
  UNION ALL  
  SELECT NULL, NULL, SUM(k3) FROM t;
  ```

  Using `UNION ALL` results in a longer query and requires multiple scans of the base table, making it less efficient in both writing and execution.

- GROUPING SETS vs. ROLLUP

  `ROLLUP` is an extension of `GROUPING SETS`. For example:

  ```sql
  SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
  ```

  This `ROLLUP` is equivalent to the following `GROUPING SETS`:

  ```sql
  GROUPING SETS (  
      (a, b, c),  
      (a, b),  
      (a),  
      ()  
  );
  ```

- GROUPING SETS vs. CUBE

  `CUBE(a, b, c)` is equivalent to the following `GROUPING SETS`:

  ```sql
  GROUPING SETS (  
      (a, b, c),  
      (a, b),  
      (a, c),  
      (a),  
      (b, c),  
      (b),  
      (c),  
      ()  
  );
  ```

## Design Document

For detailed information, please refer to [SQL for Aggregation in Data Warehouses](https://www.oracle.com/path-to-reference-documentation) on the Oracle official website.