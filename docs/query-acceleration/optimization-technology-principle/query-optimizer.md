---
{
    "title": "Query Optimizer Introduction",
    "language": "en",
    "description": "Learn about the development background, core advantages, and working principles of the Doris query optimizer (Nereids), and master the RBO and CBO optimization process along with common tuning session variables.",
    "keywords": ["Doris query optimizer", "Nereids", "CBO", "RBO", "Cascades", "query optimization", "execution plan"]
}
---

<!-- Knowledge type: Concept introduction + Principle explanation -->
<!-- Applicable scenario: Understand the design goals, architecture, and workflow of the new-generation Doris query optimizer -->

## One-sentence definition

The Doris query optimizer (Nereids) is a modern query optimizer built on the Cascades framework. It combines RBO (rule-based optimization) and CBO (cost-based optimization) to generate efficient execution plans for complex queries.

## Reading overview

Before reading this article, you are recommended to first understand the following:

- The basic role of a query optimizer in a database system
- The basic concepts of a SQL execution plan
- The difference between rule-based optimization (RBO) and cost-based optimization (CBO)

This article covers the following topics in order:

- The development background of the query optimizer
- The core advantages of the Doris query optimizer
- The overall working principle of the optimizer
- Common tuning session variables

## Development background

<!-- Knowledge type: Background explanation -->

The current query optimizer faces three categories of challenges:

| Challenge | Specific manifestation |
| :--- | :--- |
| High query complexity | User queries are becoming increasingly complex, and query scenarios are becoming increasingly diverse |
| Strict real-time requirements | Users expect to obtain query results immediately |
| Fast iteration speed | The optimizer needs to quickly adapt to constantly emerging new requirements |

Based on this background, Doris launched the development of a brand-new query optimizer. Built on a modern optimizer architecture, this optimizer aims to handle query requests in Doris scenarios more efficiently and to provide a solid foundation for extending to more complex requirements in the future.

## Advantages of the Doris query optimizer

<!-- Knowledge type: Feature introduction -->
<!-- Applicable scenario: Evaluate whether to enable Nereids, compare differences between the new and old optimizers -->

The Doris query optimizer has significant advantages over the legacy optimizer in three dimensions: smarter, more stable, and more flexible.

### Smarter

- The optimizer presents each RBO and CBO optimization point clearly in the form of a "rule".
- Each rule provides a set of patterns that describe the shape of a query plan, allowing the optimizer to precisely match query plans that can be optimized.
- As a result, the optimizer can better support complex query statements such as multi-level subquery nesting.

The CBO part is based on the advanced Cascades framework and fully uses the following three categories of information:

1. Rich data statistics
2. Data feature information
3. A carefully tuned cost model

With this information, the optimizer can handle complex queries such as multi-table joins with ease.

### More stable

- All optimization rules are completed on the logical execution plan tree.
- After the query syntax and semantics are parsed, the query is converted into a tree structure.
- Compared with the legacy optimizer, the internal data structures of the new optimizer are more reasonable and unified.

Take subquery handling as an example: the new optimizer is based on the new data structure and avoids the situation in the legacy optimizer where many rules handle subqueries individually. This reduces the possibility of logical errors in optimization rules.

### More flexible

The optimizer architecture is well-designed and modern, making it convenient to extend optimization rules and processing stages. New features can be quickly added to meet ever-changing requirements.

## Working principle of the optimizer

<!-- Knowledge type: Process explanation -->

### Overall workflow

![Optimizer working principle](/images/cost-based-optimizer.jpg)

The execution flow of the optimizer can be roughly divided into the following four steps:

| Step | Stage | Description |
| :--- | :--- | :--- |
| 1 | Syntax analysis | Convert the SQL text into an abstract syntax tree (AST). If the SQL is valid, continue; otherwise, report an error and terminate |
| 2 | Semantic analysis | Check the existence of tables, columns, and functions in the AST and whether their usage complies with syntax and semantic rules. If valid, continue; otherwise, report an error and terminate |
| 3 | Rewrite query plan (RBO) | Rewrite the query plan through predefined rules. Common techniques include column pruning, predicate pushdown, and partition pruning |
| 4 | Optimize query plan (CBO) | Enumerate the set of equivalent plans within the search space, evaluate the execution cost of each plan, and choose the plan with the lowest cost as the final execution plan |

The goals of each step are as follows:

- **Syntax analysis**: Ensure that the SQL text can be parsed into a valid AST.
- **Semantic analysis**: Ensure that the objects referenced in the AST exist and are used legally.
- **RBO rewriting**: Optimize execution speed through deterministic rules.
- **CBO optimization**: Choose the optimal execution plan based on the cost model to ensure that the query executes in the most efficient way.

## Common session variables

<!-- Knowledge type: Parameter configuration -->
<!-- Applicable scenario: Tune the timeout for the query planning stage, resolve planning timeout errors -->

### nereids_timeout_second

| Item | Content |
| :--- | :--- |
| Purpose | Sets the maximum allowed time for query planning. When the planning time exceeds this value, planning is terminated and an error message is returned |
| Default value | 30s |
| Applicable scenario | When a query involves a large number of external tables, or when the query statement is particularly complex, increase this value appropriately to ensure that the query can proceed normally |

**Design purpose**: During the planning of a query statement, the system acquires read locks on all tables involved in the SQL. The main purposes of setting a timeout mechanism are:

- To maintain cluster stability
- To prevent excessive resource consumption caused by overly long planning times
- To avoid lock conflicts

**Tuning suggestions**:

- When a planning timeout error occurs, first check whether the SQL is too complex or whether too many tables are involved.
- If the scenario is confirmed to be reasonable, increase this value with `SET nereids_timeout_second = <seconds>;`.
