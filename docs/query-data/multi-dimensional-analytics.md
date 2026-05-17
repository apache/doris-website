---
{
    "title": "Multi-Dimensional Aggregation Analysis",
    "language": "en",
    "description": "How can you use ROLLUP, CUBE, and GROUPING SETS to perform multi-dimensional aggregation analysis in a single SQL statement? This article presents the syntax, examples, and a comparison of suitable scenarios.",
    "keywords": [
        "ROLLUP",
        "CUBE",
        "GROUPING SETS",
        "GROUPING function",
        "GROUPING_ID",
        "multi-dimensional aggregation",
        "GROUP BY extension",
        "subtotals and grand total",
        "hierarchical summary"
    ]
}
---

<!-- Knowledge type: Feature description + SQL syntax -->
<!-- Applicable scenario: Multi-dimensional reports, hierarchical summarization, cross-dimensional analysis -->

When producing sales reports, operational analyses, or market surveys, you often need a single query that returns both the "subtotals at the detail dimension" and the "totals across different dimension combinations" along with the "grand total." Stitching together multiple `GROUP BY` queries with `UNION ALL` not only makes the SQL verbose but also scans the base table multiple times, which is inefficient.

Doris provides three syntactic extensions to the `GROUP BY` clause for multi-dimensional aggregation. They produce summary results at multiple levels in a single SQL statement, and are semantically equivalent to using `UNION ALL` to join multiple aggregate queries:

| Syntax | Applicable scenario | Output summary combinations |
| --- | --- | --- |
| **ROLLUP** | Aggregate level by level along dimensions with a natural hierarchy, such as time, geography, or category | Aggregate progressively along the specified column order, from the finest granularity up to the grand total |
| **CUBE** | Multiple independent dimensions that need full cross-dimensional analysis | All combinations of all dimension subsets |
| **GROUPING SETS** | Only a few specific dimension combinations are of interest, avoiding the cost of a full CUBE | The grouping sets that the user explicitly specifies |

This article introduces these three syntaxes in the order of "scenario -> syntax -> example," and explains how the companion `GROUPING` and `GROUPING_ID` functions identify subtotal rows and distinguish between two kinds of NULL values.

## ROLLUP: Hierarchical Level-By-Level Summary

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Dimensions with hierarchical relationships, such as time, geography, or category -->

### Applicable Scenario

`ROLLUP` is suitable for scenarios that aggregate hierarchical dimensions level by level. It aggregates along the specified column order, summarizing data progressively from the finest granularity up to the highest level. For example:

- Time dimension: `ROLLUP(year, month, day)`
- Geographic dimension: `ROLLUP(country, province, city)`

For sales data, you can use `ROLLUP` to aggregate by region and time, producing the monthly sales for each region, the total sales for each region, and the overall total sales.

### Syntax

```sql
SELECT … GROUP BY ROLLUP(grouping_column_reference_list)
```

### Example

The following query analyzes sales by year and month:

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

The query aggregates by time level by level, computing the monthly sales subtotal for each year, the annual sales subtotal for each year, and the overall sales grand total. The query result is as follows:

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

## CUBE: Full Cross-Dimensional Summary

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Comprehensive multi-dimensional analysis across multiple independent dimensions -->

### Applicable Scenario

`CUBE` is best suited for queries that involve multiple independent dimension columns rather than columns that represent different levels of a single dimension. A common use case is summarizing all combinations of month, region, and product. These are three mutually independent dimensions, and analyzing every possible subtotal combination is very common.

By contrast, cross-tabulating year, month, and day produces many unnecessary values, because the time dimension itself has a natural hierarchy. In most analyses, subtotals such as "profit by month-day" are not needed, and relatively few users ask "what is the total sales on the 16th of every month across the year." Hierarchical dimensions like this are better handled with `ROLLUP`.

### Syntax

```sql
SELECT … GROUP BY CUBE(grouping_column_reference_list)
```

### Example

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

The query result computes:

- The grand total of sales.
- The sales subtotal for each year, the sales subtotal of items per category, and the sales subtotal per state.
- The sales subtotal per category for each year, the sales subtotal per product for each state, the sales subtotal per state for each year, and the sales subtotal of products per category in each state for each year.

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

## GROUPING Function: Identifying Subtotal Rows

<!-- Knowledge type: SQL function -->
<!-- Applicable scenario: Distinguish subtotal rows from real NULLs and filter results by aggregation level -->

When using `ROLLUP` and `CUBE`, the result set raises two issues that need to be addressed:

1. **How to identify subtotal rows**: programmatically detect which result rows represent subtotals and pinpoint the aggregation level a given subtotal corresponds to. This is very common in scenarios such as computing "percentage of grand total."
2. **How to distinguish two kinds of NULL**: when the query result contains both NULL values actually stored in the table and NULL values produced by `ROLLUP` or `CUBE` operations, you need a way to tell them apart.

The `GROUPING` and `GROUPING_ID` functions (paired with `GROUPING SETS`) solve these problems effectively.

### GROUPING

#### Principle

`GROUPING` takes a single column as its argument:

- Returns `1` when the value is a NULL produced by a `ROLLUP` or `CUBE` operation (that is, the row is a subtotal row).
- Returns `0` for any other value, including NULL values that already exist in the table.

Example:

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

The values of the `GROUPING` function at different aggregation levels:

- `(year(d_date), month(d_date))` group: result is `(0, 0)`, the detail rows aggregated by year and month.
- `(year(d_date))` group: result is `(0, 1)`, the subtotal rows aggregated by year.
- `()` group: result is `(1, 1)`, the grand total row.

The query result is as follows:

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

#### Usage 1: Filtering Aggregation Levels in HAVING

The `GROUPING` function can filter results to a specific aggregation level. The following example keeps only "the grand total of sales," "sales aggregated by year," and "sales aggregated by state":

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

The query result is as follows:

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

#### Usage 2: Combining With IF to Improve Readability

Replacing the NULL values in subtotal rows with more intuitive strings makes the result easier to read:

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

The query result is as follows:

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

#### Applicable Scenario

`GROUPING_ID` and `GROUPING` are both used to assist with multi-dimensional aggregation queries (such as `ROLLUP` and `CUBE`), helping you distinguish between aggregation results at different levels.

To identify the aggregation level a row belongs to with `GROUPING`, you must compute the function on every `GROUP BY` column individually (a single-column result is not enough to distinguish levels), which makes the SQL verbose. `GROUPING_ID` is more powerful than `GROUPING`: it accepts multiple columns as arguments and returns an integer whose binary bits represent the aggregation states of all those columns at once.

When the computed results are stored in a table or materialized view, using the `GROUPING` function to represent different aggregation levels takes up more storage. `GROUPING_ID` is more appropriate in this scenario.

Taking `CUBE(a, b)` as an example, the correspondence between `GROUPING_ID` and `GROUPING` is:

| Aggregation level | Bit Vector | GROUPING_ID | GROUPING(a) | GROUPING(b) |
| ----------- | ---------- | ----------- | ----------- | ----------- |
| a, b        | 0 0        | 0           | 0           | 0           |
| a           | 0 1        | 1           | 0           | 1           |
| b           | 1 0        | 2           | 1           | 0           |
| Grand Total | 1 1        | 3           | 1           | 1           |

#### Syntax and Example

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

The query result is as follows:

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

## GROUPING SETS: Specifying Grouping Combinations Precisely

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Only a few specific dimension combinations are of interest, avoiding the cost of a full CUBE -->

### Applicable Scenario

When you need to aggregate only over a few specified grouping combinations rather than compute a full `CUBE`, use `GROUPING SETS` in the `GROUP BY` clause. It lets you specify exactly which combinations across multiple dimensions to compute, avoiding unnecessary overhead.

Because `CUBE` queries usually consume more resources, `GROUPING SETS` improves execution efficiency when only a few dimensions are of interest.

### Syntax

```sql
SELECT … GROUP BY GROUPING SETS(grouping_column_reference_list)
```

### Example

Suppose you need:

- The sales subtotal of each product category for each year
- The sales subtotal in each state for each year
- The sales subtotal of each product in each state for each year

You can use `GROUPING SETS` to specify these dimension combinations explicitly:

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

The query result is as follows:

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

The query above is equivalent to running `CUBE` and then using `grouping_id` to keep only the specified aggregation combinations, which avoids unnecessary computation:

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
`CUBE` computes every possible aggregation level (eight in this example), but in practice you may only be interested in a few of them.
:::

### Semantic Equivalences

`GROUPING SETS` is the more fundamental form of multi-dimensional aggregation. Both `ROLLUP` and `CUBE` can be expanded into `GROUPING SETS`.

#### GROUPING SETS and GROUP BY UNION ALL

The following `GROUPING SETS` statement:

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

Is equivalent to multiple `GROUP BY` queries joined by `UNION ALL`:

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2
UNION ALL
SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1
UNION ALL
SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2
UNION ALL
SELECT NULL, NULL, SUM(k3) FROM t;
```

The query joined by `UNION ALL` is longer and scans the base table multiple times, so it is less efficient both to write and to execute.

#### GROUPING SETS and ROLLUP

`ROLLUP` is an extension of `GROUPING SETS`. For example:

```sql
SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
```

Is equivalent to the following `GROUPING SETS`:

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a),
    ()
);
```

#### GROUPING SETS and CUBE

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

## Appendix

For the table creation statements and data files, see the appendix of [Analytic Functions (Window Functions)](./window-function.md).
