---
{
    "title": "聚合多维分析",
    "language": "zh-CN"
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

在数据库中，ROLLUP、CUBE 和 GROUPING SETS 是用于多维数据聚合的高级 SQL 语句。这些功能显著增强了 GROUP BY 子句的能力，使得用户可以在单一查询中获得多种层次的汇总结果，这在语义上等价于使用 UNION ALL 连接多个聚合语句。

- **ROLLUP**：ROLLUP 是一种用于生成层次化汇总的操作。它按照指定的列顺序进行汇总，从最细粒度的数据逐步汇总到最高层次。例如，在销售数据中，可以使用 ROLLUP 按地区、时间进行汇总，得到每个地区每个月的销售额、每个地区的总销售额以及整体总销售额。ROLLUP 适用于需要逐级汇总的场景。

- **CUBE**：CUBE 是一种更为强大的聚合操作，它生成所有可能的汇总组合。与 ROLLUP 不同，CUBE 会计算所有维度的子集。例如，对于按产品和地区进行统计的销售数据，CUBE 会计算每个产品在每个地区的销售额、每个产品的总销售额、每个地区的总销售额以及整体总销售额。CUBE 适用于需要全面多维分析的场景，如业务分析和市场调查。

- **GROUPING SETS**：GROUPING SETS 提供了对特定分组集进行聚合的灵活性。它允许用户指定一组列的组合进行独立聚合，而不是像 ROLLUP 和 CUBE 那样生成所有可能的组合。例如，可以定义按地区和时间的特定组合进行汇总，而不需要每个维度的所有组合。GROUPING SETS 适用于需要定制化汇总的场景，提供了灵活的聚合控制。

ROLLUP、CUBE 和 GROUPING SETS 提供了强大的多维数据汇总功能，适用于各种数据分析和报告需求，使得复杂的聚合计算变得更加简便和高效。接下来将详细介绍以上功能使用场景、语法与示例。

## ROLLUP

### 使用场景

ROLLUP 对于按照时间、地理、类别等层次维度进行汇总时非常有用。例如，查询可以指定 `ROLLUP(year, month, day)` 或者 `(country, Province, city)`。

### 语法和示例

ROLLUP 的语法如下：

```sql
SELECT … GROUP BY ROLLUP(grouping_column_reference_list)
```

下面这个查询对销售额按照年月进行汇总分析：

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

这个查询按照时间进行汇总，分别计算了每年的销售额小计、每年中每月的销售额小计，以及总体的销售额总计。查询结果如下：

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

### 使用场景

CUBE 最适合用于查询涉及多个独立维度的列，而不是表示单个维度的不同级别的列。例如，常见的使用场景是对月份、地区和产品的所有组合进行汇总。这是三个独立的维度，分析所有可能的小计组合是很常见的。相比之下，显示年、月、日所有可能组合的交叉制表将包含几个不必要的值，因为时间维度中存在自然的层次结构。在大多数分析中，诸如按月日计算的利润之类的小计都是不必要的。相对较少的用户需要询问“全年每月 16 日的总销售额是多少”。

### 语法和示例

CUBE 的语法如下：

```sql
SELECT … GROUP BY CUBE(grouping_column_reference_list)
```

使用示例：

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

查询结果如下，它分别计算了：

- 总计的销售额；

- 各年度的销售额小计、各类别下商品的销售额小计、各州的销售额小计；

- 每年每类产品的销售额小计、每个州每个产品的销售额小计、每年每个州的销售额小计和每年每个州各类别的产品的销售额小计。

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

本节将对介绍通过如何解决使用 ROLLUP 和 CUBE 时出现的两个挑战：

1. 如何以编程方式识别出哪些结果集行代表小计，以及如何准确找到给定小计对应的聚合层级。由于在计算（如总计百分比）时经常需要使用小计，因此，我们需要一种简便的方法来识别这些小计行。

2. 当查询结果同时包含实际存储的 NULL 值和由 ROLLUP 或 CUBE 操作生成的“NULL”值时，会引发另一个问题：如何区分这两种 NULL 值？

通过 GROUPING、GROUPING_ID、GROUPING SETS 能够有效解决上述的两个挑战。

### GROUPING

**1. 原理介绍**

GROUPING 使用单个列作为参数，在遇到由 ROLLUP 或 CUBE 操作创建的 NULL 值时返回 1，即 NULL 表示该行是小计，则 GROUPING 返回 1。任何其他类型的值（包括表数据中本身的 NULL）都返回 0。

示例如下：

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

- (year(d_date), month(d_date)) 组的 GROUPING 函数结果为 (0,0) 为按照年月聚合的结果

- (year(d_date)) 组的 GROUPING 函数结果为 (0,1)，为按年聚合的结果；

- () 组的 GROUPING 函数结果为 (1,1)，为总计结果。

查询结果如下：

```sql
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

**2. 使用场景、语法与示例**

GROUPING 函数可以用来过滤结果。示例如下：

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

在 HAVING 过滤条件中使用 GROUPING 函数，仅保留总计销售额，按年度汇总的销售额和按地区汇总的销售额。查询结果如下：

```sql
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

你也可以使用 GROUPING 函数和 IF 函数提高查询的可读性，示例如下：

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

查询结果如下：

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

**1. 使用场景**

在数据库中，GROUPING_ID 和 GROUPING 函数都是用于处理多维数据聚合查询（如 ROLLUP 和 CUBE）时的辅助函数，它们帮助用户区分不同层级的聚合结果。如果你想确定某一行的聚合层级，你需要使用 GROUPING 函数对所有的 GROUP BY 列进行计算，因为单列的计算结果无法满足需求。

GROUPING_ID 函数比 GROUPING 更强大，因为它可以同时对多列进行检测。GROUPING_ID 函数接受多个列作为参数，并返回一个整数，该整数通过二进制位表示多个列的聚合状态。当使用表或物化视图保存计算结果时，使用 GROUPING 表示聚合的不同层级会占用较多的存储空间，在这种场景下，使用 GROUPING_ID 更加合适。

以 CUBE(a, b) 为例，其 GROUPING_ID 可以表示为：

| 聚合层级    | Bit Vector | GROUPING_ID | GROUPING(a) | GROUPING(b) |
| ----------- | ---------- | ----------- | ----------- | ----------- |
| a,b         | 0 0        | 0           | 0           | 0           |
| a           | 0 1        | 1           | 0           | 1           |
| b           | 1 0        | 2           | 1           | 0           |
| Grand Total | 1 1        | 3           | 1           | 1           |

**2. 语法和示例**

示例 SQL 查询如下：

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

查询结果如下：

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

**1. 使用场景**

当需要有选择地指定要创建的组集，可以在 `GROUP BY` 子句中使用 `GROUPING SETS` 表达式。通过这种方法，允许用户跨多个维度进行精确指定，而无需计算整个 CUBE。

由于 CUBE 查询通常消耗较多资源，当仅对少数几个维度感兴趣时，使用 `GROUPING SETS` 可以提升查询的执行效率。

**2. 语法和示例**

`GROUPING SETS` 的语法如下：

```sql
SELECT … GROUP BY GROUPING SETS(grouping_column_reference_list)
```

如果你需要：

- 每年度每类产品的销售额小计

- 每年度在每个州的销售额小计

- 每年度每个州每个产品的销售额小计

那么你可以使用 `GROUPING SETS` 来指定这些维度并进行汇总。以下是一个示例：

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

查询结果：

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

上面的写法等价于使用 CUBE，但指定了具体的 `grouping_id`，从而减少了不必要的计算：

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

:::info 备注
使用 `CUBE` 会计算所有可能的聚合层级（在这个例子中是八种），但实际上你可能只对其中的几种感兴趣。
:::

**3. 语义等价**

- **GROUPING SETS 与 GROUP BY UNION ALL**

    `GROUPING SETS` 语句：

    ```sql
    SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
    ```

    其查询结果等价于使用 `UNION ALL` 连接的多个 `GROUP BY` 查询：

    ```sql
    SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2  
    UNION ALL  
    SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1  
    UNION ALL  
    SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2  
    UNION ALL  
    SELECT NULL, NULL, SUM(k3) FROM t;
    ```

    使用 `UNION ALL` 连接的查询较长，同时需要多次扫描基表，因此在书写和执行上的效率都较低。

- **GROUPING SETS 与 ROLLUP**

    `ROLLUP` 是对 `GROUPING SETS` 的扩展。例如：

    ```sql
    SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
    ```

    这个 `ROLLUP` 等价于下面的 `GROUPING SETS`：

    ```sql
    GROUPING SETS (  
        (a, b, c),  
        (a, b),  
        (a),  
        ()  
    );
    ```

- **GROUPING SETS 与 CUBE**

    `CUBE(a, b, c)` 等价于下面的 `GROUPING SETS`：

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

