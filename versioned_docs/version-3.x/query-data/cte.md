---
{
    "title": "Common Table Expression",
    "language": "en",
    "description": "Common Table Expression (CTE) define a temporary result set that can be referenced multiple times within the scope of an SQL statement."
}
---

## Description

Common Table Expression (CTE) define a temporary result set that can be referenced multiple times within the scope of an SQL statement. CTEs are primarily used in SELECT statements.

To specify a CTE, use the `WITH` clause with one or more comma-separated clauses. Each clause provides a subquery that generates a result set and associates a name with the subquery. 

Doris supports nested CTE. Within the statement that contains the `WITH` clause, you can reference each CTE name to access the corresponding CTE result set. CTE names can be referenced in other CTE, allowing you to define CTE based on other CTE.

Doris **DOES NOT** support recursive CTE. For more information, please read MySQL manual about [recursive CTE](https://dev.mysql.com/doc/refman/8.4/en/with.html#common-table-expressions-recursive)

## Example

### Simple CTE

The following example defines CTE named cte1 and cte2 within the WITH clause and refers to them in the top-level SELECT below the WITH clause:

```sql
WITH
  cte1 AS (SELECT a, b FROM table1),
  cte2 AS (SELECT c, d FROM table2)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

### Nested CTE

```sql
WITH
  cte1 AS (SELECT a, b FROM table1),
  cte2 AS (SELECT c, d FROM cte1)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

### Recursive CTE (NOT Support)

```sql
WITH r_cte AS (
  SELECT 1 AS user_id, 2 as manager_id
  UNION ALL
  SELECT user_id, manager_id FROM r_cte INNER JOIN (SELECT 1 AS user_id, 2 as manager_id) t ON r_cte.manager_id = t.user_id
)
SELECT * FROM r_cte
