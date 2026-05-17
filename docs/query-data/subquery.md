---
{
    "title": "Subquery",
    "language": "en",
    "description": "Doris Subquery guide: syntax, limitations, and Mark Join handling for scalar, non-scalar, correlated, and uncorrelated subqueries.",
    "keywords": [
        "Doris Subquery",
        "Subquery",
        "Scalar Subquery",
        "Correlated Subquery",
        "IN EXISTS Subquery",
        "Mark Join"
    ]
}
---

<!-- Knowledge type: Capability definition + Usage limitations -->
<!-- Applicable scenarios: Writing nested SQL queries / Troubleshooting subquery errors -->

A subquery is a SQL query nested inside another query (typically a SELECT statement). It can appear in the SELECT, FROM, WHERE, or HAVING clause to provide data or conditions for the outer query. With subqueries, you can implement more complex filtering, aggregation, and join logic in a single SQL statement.

This document describes the categories of subqueries in Doris, the supported scope, the limitations, and the Mark Join mechanism used in special scenarios.

## Applicable Scenarios

Subqueries are commonly used in the following scenarios:

- **Complex filtering**: Use a subquery in the `WHERE` or `HAVING` clause to dynamically compute filter conditions.
- **Derived column computation**: Use a scalar subquery in the `SELECT` list to add an extra field.
- **Derived table**: Use a subquery in the `FROM` clause as a temporary table that participates in a join.
- **Existence checks**: Use `EXISTS`/`NOT EXISTS` or `IN`/`NOT IN` to evaluate relationships between sets.

## Basic Characteristics of Subqueries

When using subqueries, keep the following basic characteristics in mind:

| Characteristic | Description |
| --- | --- |
| Position | Can appear in the `SELECT`, `FROM`, `WHERE`, or `HAVING` clause, and can be combined with `SELECT`, `UPDATE`, `INSERT`, `DELETE`, as well as expression operators such as `=`, `>`, `<`, `<=`, `IN`, and `EXISTS`. |
| Outer/Inner relationship | The outer query is called the main query, and the query nested inside it is called the subquery. |
| Execution order | An independent subquery is usually executed first; when correlation is involved, the parser determines the execution order as needed and feeds the subquery result back to the main query. |
| Syntax constraint | A subquery must be wrapped in parentheses to distinguish it from the main query. |

The examples below all use two tables, `t1` and `t2`. The DDL is as follows:

```sql
create table t1
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");

create table t2
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

## Categories of Subqueries

Subqueries can be classified along two dimensions: **the characteristics of the returned data** and **whether they reference columns from the outer query**.

### Classification by Returned Data Characteristics

By the characteristics of the data returned, subqueries can be divided into scalar subqueries and non-scalar subqueries.

| Type | Returned result | Return value when the table is empty | Allowed positions |
| --- | --- | --- | --- |
| Scalar subquery | A single value (a relation with one row and one column) | `NULL` | Anywhere a single-value expression is allowed |
| Non-scalar subquery | A relation (which can contain multiple rows and columns) | Empty set (0 rows) | Anywhere a relation (set) is allowed |

Example (when `t2` is empty, the two subqueries return different results):

```sql
-- Scalar subquery. When t2 is empty, the subquery returns the scalar value null.
select * from t1 where t1.c1 > (select sum(t2.c1) from t2);

-- Non-scalar subquery. When t2 is empty, the subquery returns an empty set (0 rows).
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

### Classification by Whether Outer Columns Are Referenced

By whether the subquery references columns from the outer query, subqueries can be divided into correlated subqueries and uncorrelated subqueries.

| Type | References outer columns | Execution method |
| --- | --- | --- |
| Uncorrelated subquery | No | Can usually be evaluated independently and returns its result once for use by the outer query. |
| Correlated subquery | Yes (commonly in the subquery's `WHERE` clause) | The subquery must be executed once for every row of the outer table, which is equivalent to a filter operation on the outer table. |

Examples:

```sql
-- Correlated subquery. The subquery uses the outer table column t1.c2.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t2.c2 = t1.c2);

-- Uncorrelated subquery. The subquery does not reference any column of the outer table t1.
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

## Subqueries Supported by Doris

<!-- Knowledge type: Capability support matrix -->

Doris supports all uncorrelated subqueries. The supported scope of correlated subqueries is as follows:

- Correlated scalar subqueries in the `WHERE` and `HAVING` clauses are supported.
- Correlated non-scalar subqueries with `IN`, `NOT IN`, `EXISTS`, or `NOT EXISTS` in the `WHERE` and `HAVING` clauses are supported.
- Correlated scalar subqueries in the `SELECT` list are supported.
- For nested subqueries, only correlation to the immediate parent query is supported. Cross-level correlation to a more outer query is not supported.

## Limitations of Correlated Subqueries

<!-- Knowledge type: Usage limitations -->
<!-- Applicable scenarios: SQL error troubleshooting / Rewriting correlated subqueries -->

Different forms of correlated subqueries have different limitations in Doris, described below.

### Limitations of Correlated Scalar Subqueries

The following two conditions must be met at the same time:

- The correlation condition must be an equality condition.
- The subquery output must be the result of a single aggregate function and must not contain a `group by` clause.

```sql
-- Single aggregate function and no group by: supported.
select * from t1 where t1.c1 < (select max(t2.c1) from t2 where t1.c2 = t2.c2);

-- The equivalent rewritten SQL:
select t1.* from t1 inner join (select t2.c2 as c2, max(t2.c1) as c1 from t2 group by t2.c2) tx on t1.c1 < tx.c1 and t1.c2 = tx.c2;

-- Non-equality correlation condition: not supported.
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 > t2.c2);

-- No aggregate function: not supported.
select * from t1 where t1.c1 = (select t2.c1 from t2 where t1.c2 = t2.c2);

-- Aggregate function present but with group by: not supported.
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 = t2.c2 group by t2.c2);
```

### Limitations of Correlated (NOT) EXISTS Subqueries

- The subquery cannot use both `offset` and `limit`.

```sql
-- With limit but without offset: supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2);

-- The equivalent rewritten SQL:
select * from t1 left semi join t2 on t1.c2 = t2.c2;

-- With both offset and limit: not supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2, 3);
```

### Limitations of Correlated (NOT) IN Subqueries

The following three conditions must be met at the same time:

- The subquery output must be a single column.
- The subquery cannot use `limit`.
- The subquery cannot use aggregate functions or a `group by` clause.

```sql
-- Supported subquery.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2);

-- The equivalent rewritten SQL:
select * from t1 left semi join t2 on t1.c1 = t2.c1 and t1.c2 = t2.c2;

-- Multi-column output in the subquery: not supported.
select * from t1 where (t1.a, t1.c) in (select t2.c1, t2.c from t2 where t1.c2 = t2.c2);

-- Subquery with limit: not supported.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 limit 3);

-- With a group by clause: not supported.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 group by t2.c1);

-- With an aggregate function: not supported.
select * from t1 where t1.c1 in (select sum(t2.c1) from t2 where t1.c2 = t2.c2);
```

### Limitations of Nested Subqueries

Currently, only correlation between a subquery and its immediate parent query is supported. Correlation to a more outer query is not supported.

Assume there is also a `t3` table, defined as follows:

```sql
create table t3
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

- Supported: the subquery references only columns from its immediate parent query.

    ```sql
    select
        t1.c1
    from
        t1
    where not exists (
        select
            t2.c1
        from
            t2
        where not exists (
            select
                t3.c1
            from
                t3
            where
                t3.c2 = t2.c2
        ) and t2.c2 = t1.c2
    );
    ```

- Not supported: the innermost subquery references both `t2.c2` from its immediate parent query and `t1.c1` from the outermost query.

    ```sql
    select
        t1.c1
    from
        t1
    where not exists (
        select
            t2.c1
        from
            t2
        where not exists (
            select
                t3.c1
            from
                t3
            where
                t3.c2 = t2.c2 and t3.c1 = t1.c1
        )
    );
    ```

## Mark Join

<!-- Knowledge type: Execution mechanism -->
<!-- Applicable scenarios: When a subquery has an OR relationship with other filter conditions -->

In a `WHERE` clause, when a `(NOT) IN` or `(NOT) EXISTS` subquery is combined with another filter condition through an `OR` relationship, special handling is required to produce a correct result. For example:

```sql
select
    t1.c1,
    t1.c2
from t1
where exists (
    select
        t2.c1
    from t2
    where
        t1.c2 = t2.c2
    ) or t1.c1 > 0;
```

If the `EXISTS` clause above is rewritten directly as a `LEFT SEMI JOIN`, by its semantics only the rows in `t1` satisfying `t1.c2 = t2.c2` would be returned, but rows satisfying `t1.c1 > 0` should also be returned. To handle this, Doris introduces the **Mark Join** mechanism.

:::info Note
`RIGHT SEMI JOIN` is similar; only the left and right tables are swapped. The example here uses `LEFT SEMI JOIN`.
:::

The example SQL is as follows:

```sql
-- This SQL cannot actually be executed. It is shown for illustration only.
select
    tx.c1,
    tx.c2
from
    (
        select
            t1.c1,
            t1.c2,
            mark_join_flag
        from
            t1 left (mark) semi join t2 on t1.c2 = t2.c2
    ) tx
where
    tx.mark_join_flag or tx.c1 > 0;
```

The difference between Mark Join and a regular `LEFT SEMI JOIN` is: a regular `LEFT SEMI JOIN` directly outputs the rows of the left table that satisfy the condition; Mark Join outputs the original left table together with an additional flag column whose value is `TRUE`, `FALSE`, or `NULL` (in the example, `mark_join_flag`). The value of this flag is determined by the `JOIN` condition expression `t1.c2 = t2.c2`. Each row produces a corresponding flag value, as shown below:

| t1.c2 | t2.c2 | mark_join_flag |
| ----- | ----- | -------------- |
| 1     | 1     | TRUE           |
| 1     | 2     | FALSE          |
| 1     | NULL  | NULL           |
| NULL  | 1     | NULL           |
| NULL  | NULL  | NULL           |

With this flag column, the original `WHERE` filter condition can be rewritten as `where mark_join_flag or t1.c1 > 0`, which produces the correct result.

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting runtime errors of scalar subqueries -->

Because the output of a scalar subquery must be a single value, a runtime error is reported if the subquery returns more than one record.

### Correlated Scalar Subquery Returns Multiple Rows

When using a correlated scalar subquery, if for some outer row the subquery returns more than one row that matches the correlation condition, a runtime error is triggered.

```sql
-- Correlated scalar subquery. If more than one row in t2 satisfies t1.c2 = t2.c2, a runtime error is reported.
select t1.*, (select t2.c1 from t2 where t1.c2 = t2.c2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT][E33] correlate scalar subquery must return only 1 row
```

### Uncorrelated Scalar Subquery Returns Multiple Rows

Doris adds an `assert num rows` operator at runtime. If the subquery returns more than one record, a runtime error is triggered.

```sql
-- Uncorrelated scalar subquery. If t2 contains more than one row, a runtime error may be reported.
select t1.*, (select t2.c1 from t2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]Expected EQ 1 to be returned by expression
```
