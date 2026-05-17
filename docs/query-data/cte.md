---
{
    "title": "Common Table Expressions (CTE)",
    "language": "en",
    "description": "Apache Doris CTE (Common Table Expression) guide: define temporary result sets with the WITH clause, with support for nested and recursive CTEs, suitable for hierarchical traversal, graph traversal, and similar scenarios.",
    "keywords": [
        "Doris CTE",
        "common table expression",
        "WITH clause",
        "recursive CTE",
        "RECURSIVE",
        "nested CTE",
        "hierarchical query",
        "tree-structured query",
        "graph traversal",
        "cte_max_recursion_depth"
    ]
}
---

<!-- Knowledge type: Capability definition + Syntax reference -->
<!-- Applicable scenarios: Writing complex queries / Hierarchical and graph-structure traversal -->

A Common Table Expression (CTE) is the capability in Apache Doris to define a temporary result set within a `SELECT` statement. After being declared once with a `WITH` clause, the CTE can be referenced multiple times in the same SQL. CTEs are commonly used to simplify complex queries, eliminate duplicated subqueries, and express self-referential logic such as hierarchical and graph traversal.

## Applicable Scenarios

<!-- Knowledge type: Applicable scenarios -->

CTEs typically make SQL clearer and easier to maintain in the following situations:

- **The same subquery is referenced multiple times**: Name the subquery as a CTE to avoid writing it repeatedly in the main query.
- **Deeply nested subqueries are hard to read**: Break the logic into multiple CTEs and name each step to improve readability.
- **A computation builds on the result of a previous step**: With nested CTEs, a later CTE can directly reference the result of an earlier CTE.
- **Hierarchical or tree-structured traversal**: For example, organizational hierarchies, category catalogs, or nested comment threads. Use a recursive CTE to expand all levels in one query.
- **Graph reachability traversal**: For example, starting from a given node and following edges to find all reachable nodes.

## Basic Usage

### Syntax Overview

Use the `WITH` clause to define one or more CTEs, separated by commas. Each CTE has a name and a subquery:

```sql
WITH
    cte_name1 AS (subquery1),
    cte_name2 AS (subquery2)
SELECT ... FROM cte_name1 JOIN cte_name2 ON ...;
```

In a statement that contains a `WITH` clause, you can reference each CTE name to access its corresponding temporary result set.

### Simple CTE Example

The following example defines `cte1` and `cte2` in the `WITH` clause and references both in the outer `SELECT`:

```sql
WITH
    cte1 AS (SELECT a, b FROM table1),
    cte2 AS (SELECT c, d FROM table2)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

### Nested CTE

A CTE name can be referenced inside other CTEs, so you can define new CTEs based on previously defined ones:

```sql
WITH
    cte1 AS (SELECT a, b FROM table1),
    cte2 AS (SELECT c, d FROM cte1)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

## Recursive CTE

<!-- Knowledge type: Capability definition + Syntax reference -->
<!-- Applicable scenarios: Tree/hierarchical traversal, graph traversal, hierarchical aggregation -->

A recursive CTE (a CTE with the `RECURSIVE` keyword) expresses self-referential queries within a single SQL statement. It is commonly used for tree and hierarchy traversal, graph traversal, and hierarchical aggregation.

### Syntax

```sql
WITH [RECURSIVE] cte_name [(col1, col2, ...)] AS (
    <anchor_query>     -- Non-recursive part (executed once)
    UNION [ALL]
    <recursive_query>  -- Recursive part that can reference cte_name
)
SELECT ... FROM cte_name;
```

Key points:

- The `RECURSIVE` keyword allows the CTE definition to reference itself.
- The anchor and recursive members must produce exactly the same number of columns and the same column types.
- The `recursive_query` can reference `cte_name`, typically through a `JOIN`.

### Composition

A recursive CTE consists of two parts, usually connected by `UNION` or `UNION ALL`:

| Component | Description |
|---|---|
| Anchor query | The non-recursive part, executed once to produce the initial set of rows (the seed). |
| Recursive query | Can reference the CTE itself and produce new rows based on the rows generated in the previous round. |

The recursion continues until no new rows are produced or a system limit is reached.

### Execution Semantics (Iterative Model)

<!-- Knowledge type: Execution principle -->

A typical execution flow for a recursive CTE is as follows:

1. Execute `anchor_query`, write the result into the output set (Output), and use it as the working set (WorkSet) for the first round.
2. While WorkSet is not empty, repeat:
    - Use WorkSet as input to `recursive_query`, execute `recursive_query`, and obtain `newRows`.
    - With `UNION ALL`: append `newRows` directly to Output, and use `newRows` as the WorkSet for the next round.
    - With `UNION` (deduplicated): compute the difference between `newRows` and the existing Output (deduplication), and add only previously unseen rows to Output and to the WorkSet for the next round.
3. Repeat step 2 until `newRows` is empty or the system-defined recursion depth limit is reached.

The session variable `cte_max_recursion_depth` controls the maximum recursion depth. The default value is 100, and exceeding it raises an error.

### UNION vs UNION ALL

<!-- Knowledge type: Selection comparison -->

| Form | Semantics | Performance | Applicable scenarios |
|---|---|---|---|
| `UNION ALL` | Keeps duplicate rows | Low overhead (no deduplication) | When duplicates are allowed, or when duplicates are handled by the application layer |
| `UNION` | Implicit deduplication | Adds sort or hash deduplication overhead in each round or globally, with significant cost on large data | When deduplication must be performed inside the database |

Recommendation: If the semantics allow it and duplicates can be handled at the application layer, prefer `UNION ALL`.

### Examples

#### Simple Hierarchy Traversal

Starting from the root node, recursively traverse the entire tree:

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

#### Graph Traversal

Following the direction of edges, traverse all reachable paths in a graph:

```sql
CREATE TABLE graph
(
    c_from int,
    c_to int,
    label varchar(100)
) DUPLICATE KEY (c_from) DISTRIBUTED BY HASH(c_from) BUCKETS 1 PROPERTIES ('replication_num' = '1');

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

Note: The example above uses `SELECT DISTINCT` at the end to deduplicate. Using `UNION` for deduplication inside the recursion would deduplicate in every round, which is more expensive.

## Recursive CTE Limitations

<!-- Knowledge type: Restrictions and constraints -->

The following constraints apply when using a recursive CTE:

- The top-level operator inside the CTE must be `UNION` or `UNION ALL`.
- The non-recursive subquery cannot reference the recursive CTE itself.
- The recursive subquery can reference the recursive CTE only once.
- If the recursive subquery contains an inner subquery, that inner subquery cannot reference the recursive CTE.
- The output column types of the recursive CTE are determined by the non-recursive side. If the recursive side and the non-recursive side have inconsistent types, an error is raised, and you must add an explicit `CAST` to align the data types on both sides.
- The session variable `cte_max_recursion_depth` limits the maximum number of recursions to prevent infinite loops. The default value is 100.

## Common Errors and Troubleshooting

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Debugging when writing recursive CTEs -->

| Symptom | Possible cause | Resolution |
|---|---|---|
| The number or types of columns in the anchor and recursive members do not match | The two `SELECT` lists differ in column count or column types | Make sure both sides have the same column count, order, and types. Use `CAST` or explicit column names if needed. |
| The anchor references itself (illegal) | The anchor is not allowed to reference the CTE itself | Reference the CTE only in the recursive member. Check the syntax or parse tree. |
| Infinite recursion / maximum recursion depth exceeded | The recursion has no termination condition, or the termination condition is incorrect | Add a `WHERE` filter, or adjust the system-wide maximum recursion depth. If the logic really is infinite, fix the query logic. |

## References

- [MySQL Recursive CTE Manual](https://dev.mysql.com/doc/refman/8.4/en/with.html#common-table-expressions-recursive): Standard definition and examples of recursive CTEs.
