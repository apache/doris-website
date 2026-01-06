---
{
    "title": "分析函数（窗口函数）",
    "language": "zh-CN",
    "description": "分析函数，也称为窗口函数，是一种在 SQL 查询中对数据集中的行进行复杂计算的函数。窗口函数的特点在于，它们不会减少查询结果的行数，而是为每一行增加一个新的计算结果。窗口函数适用于多种分析场景，如计算滚动合计、排名以及移动平均等。 具体的语法介绍可以参阅"
}
---

分析函数，也称为窗口函数，是一种在 SQL 查询中对数据集中的行进行复杂计算的函数。窗口函数的特点在于，它们不会减少查询结果的行数，而是为每一行增加一个新的计算结果。窗口函数适用于多种分析场景，如计算滚动合计、排名以及移动平均等。
具体的语法介绍可以[参阅](../../current/sql-manual/sql-functions/window-functions/overview.md)

下面是一个使用窗口函数计算每个商店的前后三天的销售移动平均值的例子：

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

查询结果为如下：

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

## 基本概念介绍

### 处理顺序

使用分析函数的查询处理可以分为三个阶段。

1. 执行所有的JOIN、WHERE、GROUP BY 和 HAVING 子句。

2. 将结果集提供给分析函数，并进行所有必要的计算。

3. 如果查询的末尾包含 ORDER BY 子句，则处理该子句以实现精确的输出排序。

查询的处理顺序如图所示：

![基本概念介绍](/images/window-function-order.png)

### 结果集分区

分区是在使用 PARTITION BY 子句定义的组之后创建的。

:::caution 注意
分析函数中使用的术语“分区”与表分区功能无关。在本章中，术语“分区”仅指与分析函数相关的含义。
:::

### 窗口

对于分区中的每一行，你可以定义一个滑动数据窗口，此窗口确定了用于执行当前行计算所涉及的行范围。窗口具有一个起始行和一个结束行，根据其定义，窗口可以在一端或两端进行滑动。例如ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW，为累积和函数定义的窗口，其起始行固定在其分区的第一行，而其结束行则从起点一直滑动到分区的最后一行。相反ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING，为移动平均值定义的窗口，其起点和终点都会进行滑动。

窗口的大小可以设置为与分区中的所有行一样大，也可以设置为在分区内仅包含一行的滑动窗口。需要注意的是，当窗口靠近分区的边界时，由于边界的限制，计算的范围可能会缩减行数，此时函数仅返回可用行的计算结果。

在使用窗口函数时，当前行会被包含在计算之中。因此，在处理 n 个项目时，应指定为 (n-1)。例如，如果您需要计算五天的平均值，窗口应指定为“ROWS BETWEEN 4 PRECEDING AND CURRENT ROW”，这也可以简写为“ROWS 4 PRECEDING”。

### 当前行

使用分析函数执行的每个计算都是基于分区内的当前行。当前行作为确定窗口开始和结束的参考点，具体如图所示。

例如: ROWS BETWEEN 6 PRECEDING AND 6 FOLLOWING，可以使用一个窗口来定义中心移动平均值计算，该窗口包含当前行、当前行之前的 6 行以及当前行之后的 6 行。这样就创建了一个包含 13 行的滑动窗口。

![当前行](/images/window-function-rows.jpg)

## 排序函数

排序函数中，只有当指定的排序列是唯一值列时，查询结果才是确定的；如果排序列包含重复值，则每次的查询结果可能不同。更多相关函数可以[参阅](../../current/sql-manual/sql-functions/window-functions/overview.md)

### NTILE 函数

NTILE 是 SQL 中的一种窗口函数，用于将查询结果集分成指定数量的桶（组），并为每一行分配一个桶号。这在数据分析和报告中非常有用，特别是在需要对数据进行分组和排序时。

**1. 函数语法**

```sql
NTILE(num_buckets) OVER ([PARTITION BY partition_expression] ORDER BY order_expression)
```

- `num_buckets`：要将行划分成的桶的数量。

- `PARTITION BY partition_expression`（可选）：定义如何分区数据。

- `ORDER BY order_expression`：定义如何排序数据。

**2. 使用 NTILE 函数**

假设有一个包含学生考试成绩的表`class_student_scores`，希望将学生按成绩分成 4 个组，每组中的学生数量尽可能均匀。

首先，创建并插入数据到`class_student_scores`表中：

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

然后，使用 NTILE 函数将学生按成绩分成 4 个组：

```sql
SELECT  
    student_id,  
    student_name,  
    score,  
    NTILE(4) OVER (ORDER BY score DESC) AS bucket  
FROM  
    class_student_scores;
```

结果如下：

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

在这个例子中，`NTILE(4)`函数根据成绩将学生分成了 4 个组（桶），每个组的学生数量尽可能均匀。

:::caution 注意事项
- 如果不能均匀地将行分配到桶中，某些桶可能会多一行。

- `NTILE`函数在每个分区内工作，如果使用`PARTITION BY`子句，则每个分区内的数据将分别进行桶分配。
:::

**3. 使用 NTILE 和 PARTITION BY**

假设按班级对学生进行分组，然后在每个班级内将学生按成绩分成 3 个组，可以使用`PARTITION BY`和`NTILE`函数：

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

结果如下：

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

在这个例子中，学生按班级进行分区，然后在每个班级内按成绩分成 3 个组。每个组的学生数量尽可能均匀。

## 聚合函数

### 使用聚合函数 SUM 计算累计值

示例如下：

```sql
SELECT
        i_category,
        year(d_date),
        month(d_date),
        sum(ss_net_paid) as total_sales,
        sum(sum(ss_net_paid)) over (partition by i_category order by year(d_date),month(d_date) ROWS UNBOUNDED PRECEDING) as cum_sales
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

查询结果如下：

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

在此示例中，聚合函数 SUM 为每一行定义一个窗口，该窗口从分区的开头（UNBOUNDED PRECEDING）开始，默认在当前行结束。在此示例中，需要嵌套使用 SUM，因为需要对本身就是 SUM 的结果执行 SUM。嵌套聚合在分析聚合函数中高频使用。

### 使用聚合函数 AVG 计算移动平均值

示例如下：

```sql
SELECT
        i_category,
        year(d_date),
        month(d_date),
        sum(ss_net_paid) as total_sales,
        avg(sum(ss_net_paid)) over (order by year(d_date),month(d_date) ROWS 2 PRECEDING) as avg
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

查询结果如下：

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

:::caution 注意
输出数据中 AVG 列的前两行没有计算三天的移动平均值，因为边界数据前面没有足够的行数（在 SQL 中指定的行数为 3）。
:::

同时，还可以计算以当前行为中心的窗口聚合函数。例如，此示例计算了 Books 类别的产品 在 2000 年各月销售额的中心移动平均值，具体计算的是当前行前一个月、当前行、以及当前行后一个月的销售总额平均值。

```sql
SELECT
        i_category,
        year(d_date),
        month(d_date),
        sum(ss_net_paid) as total_sales,
        avg(sum(ss_net_paid)) over (order by year(d_date),month(d_date) ROWS between 1 PRECEDING and 1 following) as avg_sales
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

:::caution 注意
输出数据中起始行和结束行的中心移动平均值计算仅基于两天，因为边界数据前后没有足够的行数。
:::

## 报告函数

报告函数是指每一行的窗口范围都是整个 partition。报告函数的主要优点是能够在单个查询块中多次传递数据，从而提高查询性能。例如，“对于每一年，找出其销售额最高的商品类别”之类的查询，使用报告函数则不需要进行 JOIN 操作。示例如下：

```sql
select year,category,total_sum from (
select
        year(d_date) as year,
        i_category as category,
        sum(ss_net_paid) as total_sum,
        max(sum(ss_net_paid)) over (partition by year(d_date)) as max_sales
from
        store_sales,
        date_dim d1,
        item
where
        d1.d_date_sk = ss_sold_date_sk
        and i_item_sk = ss_item_sk
        and year(d_date) in(1998, 1999)
group by
        year(d_date), i_category 
) t
where total_sum=max_sales;
```

报告`MAX(SUM(ss_net_paid))`的内层查询结果如下：

```sql
+------+-------------+-------------+-------------+
| year | category    | total_sum   | max_sales   |
+------+-------------+-------------+-------------+
| 1998 | Electronics | 91723676.27 | 91723676.27 |
| 1998 | Books       | 91307909.84 | 91723676.27 |
| 1999 | Electronics | 90310850.54 | 90310850.54 |
| 1999 | Books       | 88993351.11 | 90310850.54 |
+------+-------------+-------------+-------------+
4 rows in set (0.11 sec)
```

完整的查询结果如下：

```sql
+------+-------------+-------------+
| year | category    | total_sum   |
+------+-------------+-------------+
| 1998 | Electronics | 91723676.27 |
| 1999 | Electronics | 90310850.54 |
+------+-------------+-------------+
2 rows in set (0.12 sec)
```

你可以将报告聚合与嵌套查询结合使用，以解决一些复杂的问题，比如查找重要商品子类别中销量最好的产品。以“查找产品销售额占其产品类别总销售额 20% 以上的子类别，并从中选出其中销量最高的五种商品”为例，查询语句如下：

```sql
select i_category as categ, i_class as sub_categ, i_item_id 
from
    (
    select 
        i_item_id,i_class, i_category, sum(ss_net_paid) as sales,
        sum(sum(ss_net_paid)) over(partition by i_category) as cat_sales,
        sum(sum(ss_net_paid)) over(partition by i_class) as sub_cat_sales,
        rank() over (partition by i_class order by sum(ss_net_paid) desc) rank_in_line
    from 
        store_sales,
        item
    where
        i_item_sk = ss_item_sk
    group by i_class, i_category, i_item_id) t
where sub_cat_sales>0.2*cat_sales and rank_in_line<=5;
```

## LAG / LEAD 函数

LAG 和 LEAD 函数适用于值之间的比较。两个函数无需进行自连接，均可以同时访问表中的多个行，从而可以提高查询处理的速度。具体来说，LAG 函数能够提供对当**前行之前**给定偏移处的行的访问，而 LEAD 函数则提供对当**前行之后**给定偏移处的行的访问。

以下是一个使用 LAG 函数的 SQL 查询示例，该查询希望选取特定年份（1999, 2000, 2001, 2002）中，每个商品类别的总销售额、前一年的总销售额以及两者之间的差异：

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

查询结果如下：

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

1. 假设我们有如下的股票数据，股票代码是 JDR，closing price 是每天的收盘价。

```sql
create table stock_ticker (stock_symbol string, closing_price decimal(8,2), closing_date timestamp);    

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

## 附录

示例中使用到的表的建表语句如下：

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

在终端执行如下命令，下载数据到本地，并使用 Stream Load 的方式加载数据：

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

数据文件``item_1_10.dat``，``date_dim_1_10.dat``，``store_sales.csv``，``customer_address_1_10.dat``可以[点击链接](https://cdn.selectdb.com/static/doc_ddl_dir_d27a752a7b.tar)下载。
