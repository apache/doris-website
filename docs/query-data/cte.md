---
{
    "title": "Common Table Expression",
    "language": "en"
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

### Recursive CTE

A recursive CTE (Common Table Expression with the `RECURSIVE` keyword) is used to express self-referential queries within a single SQL statement, and is commonly applied in scenarios such as tree/hierarchy traversal, graph traversal, and hierarchical aggregation. A recursive CTE consists of two parts:

- **Anchor query**: The non-recursive part, executed once to generate the initial row set (seed).
- **Recursive query**: Can reference the CTE itself and continue generating new rows based on the new rows produced in the previous iteration.

The anchor and recursive parts are typically connected by `UNION` or `UNION ALL`. Recursive execution continues until no new rows are generated or a system limit is reached.

## Syntax

```sql
WITH [RECURSIVE] cte_name [(col1, col2, ...)] AS (
  <anchor_query>     -- Non-recursive part (executed once)
  UNION [ALL]
  <recursive_query>  -- Recursive part that can reference cte_name
)
SELECT ... FROM cte_name;
```

Key Points:
- The `RECURSIVE` keyword allows the CTE definition to reference itself.
- The number of columns and their data types output by the anchor and recursive members must be strictly consistent.
- The `cte_name` can be referenced in the `recursive_query`, usually used in the form of a `JOIN`.

## Execution Semantics (Iterative Model)

Typical iterative execution flow:
1. Execute the `anchor_query`, write the results to the output set (Output), and use them as the work set (WorkSet) for the first iteration.
2. While the WorkSet is not empty:
   - Use the WorkSet as input for the `recursive_query`, execute the `recursive_query`, and obtain `newRows`.
   - If `UNION ALL` is used: Directly append `newRows` to the Output and set `newRows` as the WorkSet for the next iteration.
   - If `UNION` (deduplication) is used: Compute the difference set between `newRows` and the existing Output (to remove duplicates), and only add the non-duplicate rows to the Output and the next iteration's WorkSet.
3. Repeat step 2 until `newRows` is empty or a preset system upper limit is triggered (the Doris session variable `cte_max_recursion_depth` limits the recursion depth, with a default value of 100; exceeding this will throw an error).

Termination occurs when no new rows are generated in the current iteration (or the system's maximum recursion depth limit is reached).

## UNION vs UNION ALL

- `UNION ALL`: Retains duplicates and has low execution overhead (no deduplication required). Suitable for scenarios where duplicates are allowed or controlled by business logic in the backend.
- `UNION`: Implicitly performs deduplication, which adds sorting/hash-based deduplication overhead per iteration or globally—this cost is significant, especially with large data volumes.

Recommendation: Prefer `UNION ALL` if the semantics allow it and duplicates can be post-processed at the application layer.

## Common Use Cases and SQL Examples

### 1) Simple Hierarchy Traversal
```sql
CREATE TABLE tree
(
    id int,
    parent_id int,
    data varchar(100)
) DUPLICATE KEY (id)
DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES ('replication_num' = '1');

INSERT INTO tree VALUES (0, NULL, 'ROOT'), (1, 0, 'Child_1'), (2, 0, 'Child_2'), (3, 1, 'Child_1_1');

WITH RECURSIVE search_tree AS (
    SELECT id, parent_id, data
    FROM tree t
    WHERE t.id = 0
UNION ALL
    SELECT t.id, t.parent_id, t.data
    FROM tree t, search_tree st
    WHERE t.parent_id = st.id
)
SELECT * FROM search_tree ORDER BY id;
```

### 2) Graph Traversal
```sql
CREATE TABLE graph
(
    c_from int,
    c_to int,
    label varchar(100)
) DUPLICATE KEY (c_from) DISTRIBUTED BY HASH(c_from) BUCKETS 1 PROPERTIES 'replication_num' = '1';

INSERT INTO graph VALUES (1, 2, '1 -> 2'), (1, 3, '1 -> 3'), (2, 3, '2 -> 3'), (1, 4, '1 -> 4'), (4, 5, '4 -> 5');

WITH RECURSIVE search_graph AS (
    SELECT c_from, c_to, label FROM graph g
UNION ALL
    SELECT g.c_from, g.c_to, g.label
    FROM graph g, search_graph sg
    WHERE g.c_from = sg.c_to
)
SELECT DISTINCT * FROM search_graph ORDER BY c_from, c_to;
```

Note: Using `UNION` performs deduplication in each iteration, resulting in high overhead.

## Limitations of Recursive CTEs

- The top-level operator of the internal query must be UNION(ALL).
- Subqueries in the non-recursive part cannot reference the recursive CTE itself.
- Subqueries in the recursive part can only reference the recursive CTE once.
- If a subquery within the recursive part contains another nested subquery, the nested subquery cannot reference the recursive CTE.
- The data types of the output columns of a recursive CTE are determined by the output of the non-recursive subquery. An error will be thrown if the data types of the recursive and non-recursive sides do not match—manual casting is required to ensure consistency between the two sides.
- The session variable `cte_max_recursion_depth` limits the maximum number of recursions to prevent infinite loops (default value: 100).

## Common Errors, Causes, and Solutions

### 1. Error: Mismatched number of columns or data types between anchor and recursive members
- **Cause**: The number of columns or their data types in the `SELECT` clauses of the two parts are inconsistent.
- **Solution**: Ensure the number, order, and data types of columns on both sides are consistent. Use `CAST` or explicit column names if necessary.

### 2. Error: Illegal self-reference in the anchor query
- **Cause**: The anchor query is not allowed to reference the CTE itself.
- **Solution**: Reference the CTE only in the recursive member; check the syntax/parse tree.

### 3. Error: Infinite recursion / Exceeded maximum recursion depth
- **Cause**: The recursion lacks a convergence condition or the convergence condition is incorrectly configured.
- **Solution**: Add a `WHERE` filter, adjust the system's maximum recursion depth, or correct the query logic if infinite recursion is inherent to the logic.