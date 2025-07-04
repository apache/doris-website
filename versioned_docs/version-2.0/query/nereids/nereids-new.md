---
{
    "title": "Nereids-the Brand New Planner",
    "language": "en"
}
---

## R&D background

Modern query optimizers face challenges such as more complex query statements and more diverse query scenarios. At the same time, users are more and more eager to obtain query results as soon as possible. The outdated architecture of the old optimizer is difficult to meet the needs of rapid iteration in the future. Based on this, we set out to develop a new query optimizer for modern architectures. While processing the query requests of the current Doris scene more efficiently, it provides better scalability and lays a good foundation for handling the more complex requirements that Doris will face in the future.

## Advantages of the new optimizer

### Smarter

The new optimizer presents the optimization points of each RBO and CBO in the form of rules. For each rule, the new optimizer provides a set of patterns used to describe the shape of the query plan, which can exactly match the query plan that can be optimized. Based on this, the new optimizer can better support more complex query statements such as multi-level subquery nesting.

At the same time, the CBO of the new optimizer is based on the advanced cascades framework, uses richer data statistics, and applies a cost model with more scientific dimensions. This makes the new optimizer more handy when faced with multi-table join queries.

TPC-H SF100 query speed comparison. The environment is 3BE, the new optimizer uses the original SQL, and the statistical information is collected before executing the SQL. Old optimizers use hand-tuned SQL. It can be seen that the new optimizer does not need to manually optimize the query, and the overall query time is similar to that of the old optimizer after manual optimization.

![execution time comparison](/images/nereids-tpch.jpeg)

### More robust

All optimization rules of the new optimizer are completed on the logical execution plan tree. After the query syntax and semantic analysis is completed, it will be transformed into a tree structure. Compared with the internal data structure of the old optimizer, it is more reasonable and unified. Taking subquery processing as an example, the new optimizer is based on a new data structure, which avoids separate processing of subqueries by many rules in the old optimizer. In turn, the possibility of logic errors in optimization rules is reduced.

### More flexible

The architectural design of the new optimizer is more reasonable and modern. Optimization rules and processing stages can be easily extended. Can more quickly respond to user needs.

## How to use

Turn on Nereids

```sql
SET enable_nereids_planner=true;
```

Turn on auto fall back to legacy planner

```sql
SET enable_fallback_to_original_planner=true;
```

Recommand execute analyze on table before query on it to get the benefits of cbo

## Known issues and temporarily unsupported features

### Temporarily unsupported features

:::info Note
If automatic fallback is enabled, it will automatically fall back to the old optimizer execution
:::

- Json, Array, Map and Struct types: The table in the query contains the above types, or the expressions in the query outputs the above types

- DML: Only support below DML statements: Insert Into Select, Update and Delete

- Matrialized view with predicates

- Function alias

- Java UDF and HDFS UDF

- High concurrent point query optimize

### Known issues

- Cannot use partition cache to accelarate query
