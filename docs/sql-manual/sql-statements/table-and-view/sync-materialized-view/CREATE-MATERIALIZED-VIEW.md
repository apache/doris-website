---
{
    "title": "CREATE SYNC MATERIALIZED VIEW",
    "language": "en"
}
---

## Description

Statement for creating a synchronized materialized view.

## Syntax

```sql
CREATE MATERIALIZED VIEW <materialized_view_name> AS <query>            
```

Where

```sql
query
    :
    SELECT <select_expr> select_expr[, select_expr ...]
    FROM <base_table>
    GROUP BY <column_name>[, <column_name> ...]
    ORDER BY <column_name>[, <column_name> ...]
```

## Required Parameters

**1. `<materialized_view_name>`**

> Specifies the identifier (i.e., name) of the materialized view. Since a synchronized materialized view is created based on a table, the name must be unique within the same table.
>
> The identifier must start with a letter character (if Unicode name support is enabled, it can be any character from any language) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Object`).
>
> The identifier cannot be a reserved keyword.
>
> For more details, refer to the requirements for identifiers and reserved keywords.

**2. `<query>`**

> The query statement used to construct the materialized view, the result of which constitutes the data of the materialized view. The currently supported query format is:
>
> The syntax is consistent with the query statement syntax.
>
> - `select_expr`: All columns in the schema of the materialized view.
>   - Must include at least one single column.
> - `base_table`: The name of the base table for the materialized view, a required item.
>   - Must be a single table, not a subquery.
> - `group by`: The grouping columns of the materialized view, an optional item.
>   - If not specified, the data will not be grouped.
> - `order by`: The sorting columns of the materialized view, an optional item.
>   - The declaration order of the sorting columns must be consistent with the order of columns declared in `select_expr`.
>   - If `order by` is not declared, sorting columns will be automatically supplemented according to the rules. If the materialized view is of the aggregate type, all grouping columns will be automatically added as sorting columns. If the materialized view is of the non-aggregate type, the first 36 bytes will be automatically added as sorting columns.
>   - If the number of automatically supplemented sorting columns is less than 3, the first three will be used as sorting columns. If the query contains grouping columns, the sorting columns must be consistent with the grouping columns.

## Access Control Requirements

| Privilege  | Object | Notes                                                        |
| ---------- | ------ | ------------------------------------------------------------ |
| ALTER_PRIV | Table  | Requires ALTER_PRIV permission on the base table of the current materialized view |

## Notes

- Synchronized materialized views only support SELECT statements for a single table, supporting WHERE, GROUP BY, ORDER BY clauses, but not JOIN, HAVING, LIMIT clauses, or LATERAL VIEW.
- The SELECT list cannot contain auto-increment columns, constants, duplicate expressions, or window functions.
- If the SELECT list contains aggregate functions, the aggregate functions must be root expressions (e.g., `sum(a + 1)` is supported, but `sum(a) + 1` is not), and no other non-aggregate function expressions can follow the aggregate functions (for example, `SELECT x, sum(a)` is acceptable, but `SELECT sum(a), x` is not).
- Too many materialized views on a single table can affect the efficiency of data import: when importing data, the data of the materialized views and the Base table are updated synchronously. If there are too many materialized views on a table, it may slow down the import speed, similar to importing data into multiple tables simultaneously in a single import operation.
- When a materialized view targets the Unique Key data model, it can only change the order of columns and cannot perform aggregation. Therefore, on the Unique Key model, data cannot be coarsely aggregated by creating materialized views.

## Example

```sql
desc lineitem;
```

```text
+-----------------+---------------+------+-------+---------+-------+
| Field           | Type          | Null | Key   | Default | Extra |
+-----------------+---------------+------+-------+---------+-------+
| l_orderkey      | int           | No   | true  | NULL    |       |
| l_partkey       | int           | No   | true  | NULL    |       |
| l_suppkey       | int           | No   | true  | NULL    |       |
| l_linenumber    | int           | No   | true  | NULL    |       |
| l_quantity      | decimal(15,2) | No   | false | NULL    | NONE  |
| l_extendedprice | decimal(15,2) | No   | false | NULL    | NONE  |
| l_discount      | decimal(15,2) | No   | false | NULL    | NONE  |
| l_tax           | decimal(15,2) | No   | false | NULL    | NONE  |
| l_returnflag    | char(1)       | No   | false | NULL    | NONE  |
| l_linestatus    | char(1)       | No   | false | NULL    | NONE  |
| l_shipdate      | date          | No   | false | NULL    | NONE  |
| l_commitdate    | date          | No   | false | NULL    | NONE  |
| l_receiptdate   | date          | No   | false | NULL    | NONE  |
| l_shipinstruct  | char(25)      | No   | false | NULL    | NONE  |
| l_shipmode      | char(10)      | No   | false | NULL    | NONE  |
| l_comment       | varchar(44)   | No   | false | NULL    | NONE  |
+-----------------+---------------+------+-------+---------+-------+
```

```sql
CREATE MATERIALIZED VIEW sync_agg_mv AS
SELECT 
  l_shipdate,
  l_partkey,
  count(*),
  sum(l_discount)
FROM
  lineitem
GROUP BY
  l_shipdate,
  l_partkey;
```
