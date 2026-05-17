---
{
    "title": "聚合多维分析",
    "language": "zh-CN",
    "description": "如何用 ROLLUP、CUBE、GROUPING SETS 在单条 SQL 中完成多维聚合分析？本文给出语法、示例与适用场景对比。",
    "keywords": [
        "ROLLUP",
        "CUBE",
        "GROUPING SETS",
        "GROUPING 函数",
        "GROUPING_ID",
        "多维聚合",
        "GROUP BY 扩展",
        "小计与总计",
        "层次汇总"
    ]
}
---

<!-- 知识类型: 功能说明 + SQL 语法 -->
<!-- 适用场景: 多维度报表、层次化汇总、交叉分析 -->

在做销售报表、运营分析、市场调查时，常常需要在一次查询中既看到「明细维度的小计」，又看到「不同维度组合的合计」与「全局总计」。如果用多条 `GROUP BY` 加 `UNION ALL` 拼接，不仅 SQL 冗长，还会多次扫描基表，效率较低。

Doris 提供了三种增强 `GROUP BY` 子句的多维聚合语法，可以在单条 SQL 中输出多种层次的汇总结果，语义上等价于使用 `UNION ALL` 连接多个聚合查询：

| 语法 | 适用场景 | 输出汇总组合 |
| --- | --- | --- |
| **ROLLUP** | 按时间、地理、类别等具有自然层次关系的维度逐级汇总 | 沿指定列顺序逐层汇总，从最细粒度到全局总计 |
| **CUBE** | 多个相互独立的维度需要全面交叉分析 | 所有维度子集的全部组合 |
| **GROUPING SETS** | 仅关心若干特定维度组合，避免全量 CUBE 的开销 | 用户显式指定的若干分组集 |

本文按「场景 → 语法 → 示例」的顺序，依次介绍这三种语法，并讲解配合使用的 `GROUPING`、`GROUPING_ID` 函数如何识别小计行、区分两种 NULL 值。

## ROLLUP：层次化逐级汇总

<!-- 知识类型: SQL 语法 -->
<!-- 适用场景: 时间、地理、类别等具有层次关系的维度 -->

### 适用场景

`ROLLUP` 适用于按层次维度逐级汇总的场景。它按照指定的列顺序进行汇总，从最细粒度的数据逐步汇总到最高层次。例如：

- 时间维度：`ROLLUP(year, month, day)`
- 地理维度：`ROLLUP(country, province, city)`

在销售数据中，可以使用 `ROLLUP` 按地区、时间进行汇总，得到每个地区每个月的销售额、每个地区的总销售额，以及整体总销售额。

### 语法

```sql
SELECT … GROUP BY ROLLUP(grouping_column_reference_list)
```

### 示例

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

该查询按时间逐层汇总，分别计算了每年每月的销售额小计、每年的销售额小计，以及总体的销售额总计。查询结果如下：

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

## CUBE：全维度交叉汇总

<!-- 知识类型: SQL 语法 -->
<!-- 适用场景: 多个独立维度的全面多维分析 -->

### 适用场景

`CUBE` 最适合用于查询涉及多个独立维度的列，而不是表示单个维度不同级别的列。常见的使用场景是对月份、地区和产品的所有组合进行汇总——这是三个相互独立的维度，分析所有可能的小计组合非常常见。

相比之下，对年、月、日做交叉制表会包含大量不必要的值，因为时间维度本身存在自然的层次结构。在大多数分析中，诸如「按月日计算的利润」这样的小计是不必要的，相对较少的用户会去问「全年每月 16 日的总销售额是多少」。这类层次型维度更适合使用 `ROLLUP`。

### 语法

```sql
SELECT … GROUP BY CUBE(grouping_column_reference_list)
```

### 示例

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

查询结果分别计算了：

- 总计的销售额；
- 各年度的销售额小计、各类别下商品的销售额小计、各州的销售额小计；
- 每年每类产品的销售额小计、每个州每个产品的销售额小计、每年每个州的销售额小计，以及每年每个州各类别产品的销售额小计。

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

## GROUPING 函数：识别小计行

<!-- 知识类型: SQL 函数 -->
<!-- 适用场景: 区分小计行与原始 NULL、按聚合层级过滤结果 -->

在使用 `ROLLUP` 和 `CUBE` 时，结果集中会同时存在两类问题需要解决：

1. **如何识别小计行**：以编程方式识别哪些结果集行代表小计，并准确找到给定小计对应的聚合层级。这在计算「占总计的百分比」等场景下非常常见。
2. **如何区分两种 NULL**：当查询结果同时包含表中实际存储的 NULL 值，以及 `ROLLUP` 或 `CUBE` 操作生成的 NULL 值时，需要一种方法将两者区分开。

通过 `GROUPING`、`GROUPING_ID` 函数（配合 `GROUPING SETS`）可以有效解决上述问题。

### GROUPING

#### 原理

`GROUPING` 接受单个列作为参数：

- 当遇到由 `ROLLUP` 或 `CUBE` 操作生成的 NULL 值（即该行是小计行）时，返回 `1`；
- 其他任何值（包括表数据中本身的 NULL 值）都返回 `0`。

示例：

```sql
SELECT
        year(d_date),
        month(d_date),
        sum(ss_net_paid) AS total_sum,
        grouping(year(d_date)),
        grouping(month(d_date))
FROM
        store_sales,
        date_dim d1
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND year(d_date) IN (2001, 2002)
        AND month(d_date) IN (1, 2, 3)
GROUP BY
        ROLLUP(year(d_date), month(d_date))
ORDER BY
        year(d_date), month(d_date);
```

不同聚合层级对应的 `GROUPING` 函数取值：

- `(year(d_date), month(d_date))` 组：结果为 `(0, 0)`，即按年月聚合的明细行；
- `(year(d_date))` 组：结果为 `(0, 1)`，即按年聚合的小计行；
- `()` 组：结果为 `(1, 1)`，即总计行。

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

#### 用法 1：在 HAVING 中过滤聚合层级

`GROUPING` 函数可用于过滤指定层级的结果。下面的示例只保留「总计销售额」「按年度汇总的销售额」和「按地区汇总的销售额」：

```sql
SELECT
        year(d_date),
        i_category,
        ca_state,
        sum(ss_net_paid) AS total_sum
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
        AND year(d_date) IN (1998, 1999)
        AND ca_state IN ("LA", "AK")
GROUP BY CUBE(year(d_date), i_category, ca_state)
HAVING grouping(year(d_date)) = 1 AND grouping(i_category) = 1 AND grouping(ca_state) = 1
    OR grouping(year(d_date)) = 0 AND grouping(i_category) = 1 AND grouping(ca_state) = 1
    OR grouping(year(d_date)) = 1 AND grouping(i_category) = 1 AND grouping(ca_state) = 0
ORDER BY year(d_date), i_category, ca_state;
```

查询结果如下：

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

#### 用法 2：配合 IF 提升结果可读性

将小计行的 NULL 替换为更直观的字符串，可以让结果更易阅读：

```sql
SELECT
        IF(grouping(year(d_date)) = 1, "Multi-year sum", year(d_date)) AS year,
        IF(grouping(i_category) = 1, "Multi-category sum", i_category) AS category,
        sum(ss_net_paid) AS total_sum
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
        AND year(d_date) IN (1998, 1999)
        AND ca_state IN ("LA", "AK")
GROUP BY CUBE(year(d_date), i_category)
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

#### 适用场景

`GROUPING_ID` 与 `GROUPING` 都用于辅助处理多维聚合查询（如 `ROLLUP` 和 `CUBE`），帮助用户区分不同层级的聚合结果。

如果想要确定某一行所属的聚合层级，使用 `GROUPING` 时需要对所有 `GROUP BY` 列分别计算（单列结果不足以区分层级），SQL 比较冗长。`GROUPING_ID` 比 `GROUPING` 更强大：它接受多个列作为参数，并返回一个整数，通过整数的二进制位同时表示多个列的聚合状态。

当使用表或物化视图保存计算结果时，使用 `GROUPING` 函数表示聚合的不同层级会占用较多存储空间，这种场景下使用 `GROUPING_ID` 更加合适。

以 `CUBE(a, b)` 为例，`GROUPING_ID` 与 `GROUPING` 的对应关系如下：

| 聚合层级    | Bit Vector | GROUPING_ID | GROUPING(a) | GROUPING(b) |
| ----------- | ---------- | ----------- | ----------- | ----------- |
| a, b        | 0 0        | 0           | 0           | 0           |
| a           | 0 1        | 1           | 0           | 1           |
| b           | 1 0        | 2           | 1           | 0           |
| Grand Total | 1 1        | 3           | 1           | 1           |

#### 语法和示例

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

## GROUPING SETS：精确指定分组组合

<!-- 知识类型: SQL 语法 -->
<!-- 适用场景: 仅关心若干特定维度组合，避免全量 CUBE 的开销 -->

### 适用场景

当只需要对若干指定的分组组合进行聚合，而不希望计算整个 `CUBE` 时，可以在 `GROUP BY` 子句中使用 `GROUPING SETS`。它允许跨多个维度精确指定要计算的组合，避免不必要的开销。

由于 `CUBE` 查询通常消耗较多资源，当仅对少数几个维度感兴趣时，使用 `GROUPING SETS` 可以提升查询的执行效率。

### 语法

```sql
SELECT … GROUP BY GROUPING SETS(grouping_column_reference_list)
```

### 示例

假设你需要：

- 每年度每类产品的销售额小计
- 每年度在每个州的销售额小计
- 每年度每个州每个产品的销售额小计

可以使用 `GROUPING SETS` 显式指定这些维度组合：

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

查询结果如下：

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

上面的写法等价于使用 `CUBE` 后通过 `grouping_id` 仅保留指定的聚合组合，从而减少不必要的计算：

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

### 语义等价关系

`GROUPING SETS` 是更底层的多维聚合表达方式，`ROLLUP` 与 `CUBE` 都可以展开为 `GROUPING SETS`。

#### GROUPING SETS 与 GROUP BY UNION ALL

下面的 `GROUPING SETS` 语句：

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

等价于使用 `UNION ALL` 连接的多个 `GROUP BY` 查询：

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

#### GROUPING SETS 与 ROLLUP

`ROLLUP` 是 `GROUPING SETS` 的一种扩展。例如：

```sql
SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
```

等价于下面的 `GROUPING SETS`：

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a),
    ()
);
```

#### GROUPING SETS 与 CUBE

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

## 附录

建表语句和数据文件见[分析函数（窗口函数）](./window-function.md)附录。
