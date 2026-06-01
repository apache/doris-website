---
{
    "title": "Controlling Join Order with Leading Hint: Manually Specify Join Order to Optimize Queries",
    "sidebar_label": "Controlling Join Order with Leading Hint",
    "language": "en",
    "description": "How to manually specify Join order in Doris with Leading Hint? This article provides hands-on examples for swapping left and right tables, left-deep trees, right-deep trees, Bushy trees, and combining with Distribute Hint.",
    "keywords": ["Doris Leading Hint", "Join order", "left-deep tree", "right-deep tree", "Bushy tree", "Distribute Hint", "Nereids Planner", "query tuning"]
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenarios: complex multi-table Join tuning, manual intervention when CBO selection is suboptimal -->

**Leading Hint** is a hint syntax for manually specifying the Join order of multiple tables in SQL, used to optimize execution plans for complex queries in specific scenarios. For detailed syntax, refer to the [leading hint](../../../query-acceleration/hints/leading-hint.md) documentation.

### Reading Notes

- You are familiar with the Doris Nereids optimizer and `EXPLAIN SHAPE PLAN` output
- The current query is a multi-table Join, and the order automatically chosen by the optimizer does not meet expectations
- You need to control the Join shape as a left-deep tree, right-deep tree, or Bushy tree
- You need to control both the Join order and the distribution method (Shuffle / Broadcast) at the same time

:::caution Note
Doris already provides strong out-of-the-box capabilities. In the vast majority of scenarios, the optimizer adaptively optimizes performance for various scenarios, and **users do not need to manually tune with Hints**. The content of this chapter is mainly intended for professional tuning personnel; business users only need to be aware of it.
:::

## Quick Reference for Applicable Scenarios

<!-- Knowledge type: reference -->
<!-- Applicable scenarios: quickly determine which Hint form to use -->

| Scenario | Recommended Hint Syntax | Resulting Join Shape |
| --- | --- | --- |
| Swap the left and right Join order of two tables | `leading(t2 t1)` | Left and right swapped |
| Force a left-deep tree for multiple tables | `leading(t1 t2 t3)` | Left-deep tree |
| Force a right-deep tree for multiple tables | `leading(t1 {t2 t3})` | Right-deep tree |
| Force a Bushy tree for multiple tables | `leading({t1 t2} {t3 t4})` | Bushy tree |
| Subquery / view participates in the Join as a whole | `leading(alias t1)` | Alias acts as a single Join node |
| Control both order and distribution method | `leading(a shuffle b broadcast c)` | Order plus specified Shuffle / Broadcast |

> One-sentence definition: Leading Hint = manually telling the optimizer "which tables to Join first, which to Join next, and in what shape."

## Case 1: Adjusting the Order of Left and Right Tables

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: swap the left and right tables in a two-table Join -->

**Goal**: Adjust the default `t1 join t2` order to `t2 join t1`.

**Original plan**:

```sql
mysql> explain shape plan select * from t1 join t2 on t1.c1 = t2.c2;
+------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                            |
+------------------------------------------------------------------------------+
| PhysicalResultSink                                                           |
| --PhysicalDistribute[DistributionSpecGather]                                 |
| ----PhysicalProject                                                          |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| --------PhysicalOlapScan[t1]                                                 |
| --------PhysicalDistribute[DistributionSpecHash]                             |
| ----------PhysicalOlapScan[t2]                                               |
+------------------------------------------------------------------------------+
```

**Apply Leading Hint**:

```sql
mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on t1.c1 = t2.c2;
+------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                            |
+------------------------------------------------------------------------------+
| PhysicalResultSink                                                           |
| --PhysicalDistribute[DistributionSpecGather]                                 |
| ----PhysicalProject                                                          |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| --------PhysicalOlapScan[t2]                                                 |
| --------PhysicalDistribute[DistributionSpecHash]                             |
| ----------PhysicalOlapScan[t1]                                               |
|                                                                              |
| Hint log:                                                                    |
| Used: leading(t2 t1)                                                         |
| UnUsed:                                                                      |
| SyntaxError:                                                                 |
+------------------------------------------------------------------------------+
```

**Explanation**: `Used: leading(t2 t1)` in the Hint log indicates that the Hint has taken effect, and the order of the left and right tables has been swapped.

## Case 2: Forcing a Left-Deep Tree

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: join multiple tables in a linear, sequential manner -->

**Goal**: Make `t1`, `t2`, and `t3` execute as a left-deep tree in the form `((t1 ⨝ t2) ⨝ t3)`.

```sql
mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3;
+--------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                              |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalOlapScan[t1]                                                 |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalOlapScan[t2]                                               |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalOlapScan[t3]                                                 |
|                                                                                |
| Hint log:                                                                      |
| Used: leading(t1 t2 t3)                                                        |
| UnUsed:                                                                        |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
```

**Explanation**: `Used: leading(t1 t2 t3)` in the Hint log indicates that the Hint has taken effect, and the plan is a left-deep tree.

## Case 3: Forcing a Right-Deep Tree

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: have the right subtree carry the main Join chain -->

**Goal**: Use curly braces `{}` to wrap the right-side sub-Join and construct a right-deep tree of the form `(t1 ⨝ (t2 ⨝ t3))`.

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3;
+----------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --PhysicalDistribute[DistributionSpecGather]                                     |
| ----PhysicalProject                                                              |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()     |
| --------PhysicalOlapScan[t1]                                                     |
| --------PhysicalDistribute[DistributionSpecHash]                                 |
| ----------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ------------PhysicalOlapScan[t2]                                                 |
| ------------PhysicalDistribute[DistributionSpecHash]                             |
| --------------PhysicalOlapScan[t3]                                               |
|                                                                                  |
| Hint log:                                                                        |
| Used: leading(t1 { t2 t3 })                                                      |
| UnUsed:                                                                          |
| SyntaxError:                                                                     |
+----------------------------------------------------------------------------------+
```

**Explanation**: `Used: leading(t1 { t2 t3 })` in the Hint log indicates that the Hint has taken effect, and the plan is a right-deep tree.

## Case 4: Forcing a Bushy Tree

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: four or more tables, where the left and right subtrees should each Join first before being combined -->

**Goal**: Use two sets of `{}` to wrap the left and right subtrees respectively, constructing a Bushy tree of the form `((t1 ⨝ t2) ⨝ (t3 ⨝ t4))`.

```sql
mysql> explain shape plan select /*+ leading({t1 t2} {t3 t4}) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3 join t4 on t3.c3 = t4.c4;
+-----------------------------------------------+
| _Explain_ String                              |
+-----------------------------------------------+
| PhysicalResultSink                            |
| --PhysicalDistribute                          |
| ----PhysicalProject                           |
| ------hashJoin[INNER_JOIN](t2.c2 = t3.c3)     |
| --------hashJoin[INNER_JOIN](t1.c1 = t2.c2)   |
| ----------PhysicalOlapScan[t1]                |
| ----------PhysicalDistribute                  |
| ------------PhysicalOlapScan[t2]              |
| --------PhysicalDistribute                    |
| ----------hashJoin[INNER_JOIN](t3.c3 = t4.c4) |
| ------------PhysicalOlapScan[t3]              |
| ------------PhysicalDistribute                |
| --------------PhysicalOlapScan[t4]            |
|                                               |
| Used: leading({ t1 t2 } { t3 t4 })            |
| UnUsed:                                       |
| SyntaxError:                                  |
+-----------------------------------------------+
```

**Explanation**: `Used: leading({ t1 t2 } { t3 t4 })` in the Hint log indicates that the Hint has taken effect, and the plan is a Bushy tree.

## Case 5: View / Subquery Participating in the Join as a Whole

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: a subquery or view has an alias and needs to participate in ordering as a single Join node -->

**Goal**: Make the subquery alias `alias` join with the outer table `t1` in a specified order.

```sql
mysql>  explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
+--------------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                    |
+--------------------------------------------------------------------------------------+
| PhysicalResultSink                                                                   |
| --hashAgg[GLOBAL]                                                                    |
| ----PhysicalDistribute[DistributionSpecGather]                                       |
| ------hashAgg[LOCAL]                                                                 |
| --------PhysicalProject                                                              |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = alias.c2)) otherCondition=()  |
| ------------PhysicalProject                                                          |
| --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ----------------PhysicalProject                                                      |
| ------------------PhysicalOlapScan[t2]                                               |
| ----------------PhysicalDistribute[DistributionSpecHash]                             |
| ------------------PhysicalProject                                                    |
| --------------------PhysicalOlapScan[t3]                                             |
| ------------PhysicalDistribute[DistributionSpecHash]                                 |
| --------------PhysicalProject                                                        |
| ----------------PhysicalOlapScan[t1]                                                 |
|                                                                                      |
| Hint log:                                                                            |
| Used: leading(alias t1)                                                              |
| UnUsed:                                                                              |
| SyntaxError:                                                                         |
+--------------------------------------------------------------------------------------+
```

**Explanation**: `Used: leading(alias t1)` in the Hint log indicates that the Hint has taken effect, and the subquery `alias` is treated as a single whole node.

## Case 6: Mixing Distribute Hint with Leading Hint

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: complex multi-table queries that need to control both Join order and distribution method -->

**Goal**: While specifying the Join order, specify the `shuffle` or `broadcast` distribution method for each pair of joins.

```sql
explain shape plan
    select 
        nation,
        o_year,
        sum(amount) as sum_profit
    from
        (
            select
                /*+ leading(orders shuffle {lineitem shuffle part} shuffle {supplier broadcast nation} shuffle partsupp) */
                n_name as nation,
                extract(year from o_orderdate) as o_year,
                l_extendedprice * (1 - l_discount) - ps_supplycost * l_quantity as amount
            from
                part,
                supplier,
                lineitem,
                partsupp,
                orders,
                nation
            where
                s_suppkey = l_suppkey
                and ps_suppkey = l_suppkey
                and ps_partkey = l_partkey
                and p_partkey = l_partkey
                and o_orderkey = l_orderkey
                and s_nationkey = n_nationkey
                and p_name like '%green%'
        ) as profit
    group by
        nation,
        o_year
    order by
        nation,
        o_year desc;
```

**Meaning of keywords**:

| Keyword | Purpose |
| --- | --- |
| `leading(...)` | Controls the overall relative Join order and shape between tables |
| `shuffle` | Specifies that this Join uses Shuffle distribution |
| `broadcast` | Specifies that this Join uses Broadcast distribution |
| `{ ... }` | Bundles multiple tables into a subtree, determining the Join shape |

**Explanation**: By combining the two types of Hints, you can flexibly control both the Join order and the Join method at the same time, making it easier to manually specify the desired execution plan.

:::caution Usage Recommendations
- Use `EXPLAIN` to carefully analyze the execution plan and confirm that the Leading Hint achieves the expected effect.
- After Doris version upgrades or changes in business data, re-evaluate the effect of the Leading Hint, and record and adjust it in a timely manner.
:::

## Frequently Asked Questions

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenarios: the Hint does not take effect or behavior does not meet expectations -->

### Q1: The Hint did not take effect, and the Hint log shows content under `UnUsed` or `SyntaxError`?

- **Common causes**: misspelled table names / aliases in the Hint, mismatched number of tables between the Hint and the SQL, or unmatched brackets.
- **Troubleshooting**: Check the `Hint log` section at the end of the `EXPLAIN SHAPE PLAN` output, and locate the specific message on the `UnUsed` or `SyntaxError` line.

### Q2: What is the relationship between Leading Hint and Distribute Hint?

- `leading` determines **which tables to Join first and the resulting shape**; `shuffle` / `broadcast` determines **the data distribution method for each pair of joins**.
- They can be used independently or mixed together as in [Case 6](#case-6-mixing-distribute-hint-with-leading-hint).

### Q3: Why can a subquery not be split into a Leading Hint?

- A subquery / view participates in `leading` ordering as a **single whole node** through its alias. See [Case 5](#case-5-view--subquery-participating-in-the-join-as-a-whole).
- If you also need to specify the order of tables inside the subquery, write another `leading` Hint inside the subquery.

### Q4: When should Leading Hint not be used?

- The plan automatically chosen by the optimizer is already optimal.
- When business data changes frequently and statistics are unstable, fixing a Hint may instead degrade performance.

## Summary

<!-- Knowledge type: concept -->
<!-- Applicable scenarios: deciding whether to adopt Leading Hint -->

- **Leading Hint** is used to manually control the Join order and shape (left-deep tree / right-deep tree / Bushy tree).
- **It can be combined with Shuffle / Broadcast Hints** to control both order and distribution method at the same time.
- **Use with caution**: apply it only after fully understanding the query characteristics and data distribution, and review it periodically as versions and data change.
