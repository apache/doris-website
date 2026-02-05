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
<FUNCTION> ( [ <ARGUMENTS> ] ) OVER ( [ <windowDefinition> ] )
```

And:
```sql
windowDefinition ::=

[ PARTITION BY <expr1> [, ...] ]
[ ORDER BY <expr2> [ ASC | DESC ] [ NULLS { FIRST | LAST } ] [, ...] ]
[ <windowFrameClause> ]
```

And:
```sql
windowFrameClause ::=
{
  | { ROWS } <n> PRECEDING
  | { ROWS } CURRENT ROW
  | { ROWS } BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
  | { ROWS | RANGE } UNBOUNDED PRECEDING
  | { ROWS | RANGE } BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  | { ROWS | RANGE } BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  | { ROWS } BETWEEN <n> { PRECEDING | FOLLOWING } AND <n> { PRECEDING | FOLLOWING }
  | { ROWS } BETWEEN UNBOUNDED PRECEDING AND <n> { PRECEDING | FOLLOWING }
  | { ROWS } BETWEEN <n> { PRECEDING | FOLLOWING } AND UNBOUNDED FOLLOWING
}
```

## Parameters

`<FUNCTION>`
> The name of the window function. Includes all aggregate functions plus special window functions: DENSE_RANK(), FIRST_VALUE(), LAG(), LAST_VALUE(), LEAD(), RANK(), ROW_NUMBER(), NTH_VALUE(), PERCENT_RANK(), CUME_DIST(), NTILE().

`<ARGUMENTS>`
> Optional. The input arguments for the window function. The argument types and quantity depend on the specific function being used.

`<PARTITION_BY>`
> Optional. Similar to GROUP BY, it groups data by specified columns, then performs calculations within each partition.

`<ORDER_BY>`
> Optional. Used to sort data within each partition. If no partition is specified, it will sort the entire dataset. However, this `ORDER BY` is different from the common `ORDER BY` that appears at the end of an SQL statement. The sorting specified in the `OVER` clause only applies to the data within that partition, whereas the `ORDER BY` at the end of an SQL statement controls the order of all rows in the final query results. These two can coexist.
> Additionally, if `ORDER BY` is not explicitly specified in the `OVER` clause, the data within the partition may be random, potentially leading to unpredictable final results. If sorting columns are explicitly provided but contain duplicate values, the results may still be unstable. For specific examples, refer to the [case study](#section1) below.

`<windowFrameClause>`
> Optional. Used to define the window frame. Currently, two types are supported: `RANGE` and `ROWS`.
> For `N PRECEDING/FOLLOWING`, where `N` is a positive integer, it represents the sliding window range relative to the current row. Currently, this is only supported in `ROWS` windows, so it indicates a physical offset relative to the current row. The `RANGE` type currently has some limitations: it must be either `BOTH UNBOUNDED BOUNDARY` or `ONE UNBOUNDED BOUNDARY AND ONE CURRENT ROW`. If no frame is specified, the default implicit frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.

## Return Value

Returns the same data type as the input expression.

<a id="section1"></a>
## Unique Ordering for Analytic Function Data

**1. Issue of Inconsistent Return Results**

When the `ORDER BY` clause of a window function fails to produce a unique ordering of the data, such as when the `ORDER BY` expression results in duplicate values, the order of the rows becomes indeterminate. This means that the return order of these rows may vary across multiple query executions, leading to inconsistent results from the window function.

The following example illustrates how the query returns different results on successive runs. The inconsistency arises primarily because `ORDER BY dateid` does not provide a unique ordering for the `SUM` window function.

```sql
CREATE TABLE test_window_order 
    (item_id int,
    date_time date,
    sales double)
distributed BY hash(item_id)
properties("replication_num" = 1);

INSERT INTO test_window_order VALUES
(1, '2024-07-01', 100),
(2, '2024-07-01', 100),
(3, '2024-07-01', 140);

SELECT
    item_id, date_time, sales,
    sum(sales) OVER (ORDER BY date_time ROWS BETWEEN 
        UNBOUNDED PRECEDING AND CURRENT ROW) sum
FROM
    test_window_order;
```

Due to duplicate values in the sorting column `date_time`, the following two query results may be observed:

```sql
+---------+------------+-------+------+
| item_id | date_time  | sales | sum  |
+---------+------------+-------+------+
|       1 | 2024-07-01 |   100 |  100 |
|       3 | 2024-07-01 |   140 |  240 |
|       2 | 2024-07-01 |   100 |  340 |
+---------+------------+-------+------+
3 rows in set (0.03 sec)
```

**2. Solution**

To address this issue, you can add a unique value column, such as `item_id`, to the `ORDER BY` clause to ensure the uniqueness of the ordering.

```sql
SELECT
        item_id,
        date_time,
        sales,
        sum(sales) OVER (
        ORDER BY item_id,
        date_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) sum
FROM
        test_window_order;
```

This results in a consistent query output:

```sql
+---------+------------+-------+------+
| item_id | date_time  | sales | sum  |
+---------+------------+-------+------+
|       1 | 2024-07-01 |   100 |  100 |
|       2 | 2024-07-01 |   100 |  200 |
|       3 | 2024-07-01 |   140 |  340 |
+---------+------------+-------+------+
3 rows in set (0.03 sec)
```
