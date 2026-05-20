---
{
    "title": "Controlling CBO Rules with Hints for Cost-Based Rewriting",
    "sidebar_label": "CBO Rule Control",
    "language": "en",
    "description": "How do you explicitly enable CBO cost-based rewriting rules in Doris with the USE_CBO_RULE hint? This article covers the syntax, available rules, and typical scenarios such as aggregate pushdown.",
    "keywords": ["Doris CBO Hint", "USE_CBO_RULE", "cost-based rewriting", "aggregate pushdown", "query optimizer", "RBO and CBO"]
}
---

<!-- Knowledge type: Concept + How-to guide -->
<!-- Applicable scenarios: Explicitly controlling CBO rules with hints for query tuning -->

## Pre-reading Checklist

- You understand the basic workflow of the Doris optimizer
- You need to enable a specific CBO rule (such as aggregate pushdown) for a particular query
- Your role is a DBA or professional tuning engineer, not a general business developer

:::caution Note
Doris already provides strong out-of-the-box capabilities and adaptively optimizes performance in most scenarios, so manual hint-based tuning is rarely needed. This article is intended primarily for **professional tuning engineers**. Business users only need to understand the concepts.
:::

## Overview

<!-- Knowledge type: Concept -->

`USE_CBO_RULE` is a query hint that explicitly enables specified CBO cost-based rewriting rules within a single SQL statement.

When generating an execution plan, the Doris optimizer applies two categories of rules:

| Optimization Type | Full Name | Decision Basis | Typical Strategies |
|----------|------|----------|----------|
| RBO | Rule-Based Optimizer | Predefined heuristic rules, independent of statistics | Predicate pushdown, projection pushdown |
| CBO | Cost-Based Optimizer | Data statistics, estimating and choosing the plan with the lowest cost | Access path selection, join algorithm selection |

In some fine-grained tuning scenarios, DBAs or developers need to manually control whether a CBO rule is enabled. In such cases, you can use a query hint to do so.

## Syntax

<!-- Knowledge type: Reference -->
<!-- Applicable scenarios: Writing SQL with hints -->

**Purpose**: Explicitly enable one or more CBO rules within a single SELECT statement.

**Command**:

```sql
SELECT /*+ USE_CBO_RULE(rule1, rule2, ...) */ ...
```

**Notes**:

- The hint immediately follows the `SELECT` keyword.
- Inside the parentheses, list the rule names to enable, separated by commas if there are multiple.
- Rule names are **case-insensitive**.

## Supported CBO Rules

<!-- Knowledge type: Reference -->

The Doris optimizer currently supports the following cost-based rewriting rules that can be explicitly enabled via `USE_CBO_RULE`:

| Rule Name | Effect |
|----------|------|
| `PUSH_DOWN_AGG_THROUGH_JOIN` | Pushes the aggregate operation down to both sides of the join |
| `PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE` | Pushes the aggregate operation down to one side of the join |
| `PUSH_DOWN_DISTINCT_THROUGH_JOIN` | Pushes the Distinct operation down through the join |

## Case Study: Aggregate Pushdown to Speed Up Join Queries

<!-- Knowledge type: Example -->
<!-- Applicable scenarios: Queries that join and then aggregate, where you want to aggregate earlier to reduce the data volume processed by the join -->

**Scenario**: Table `a` is joined with table `b` on `device_id`, and the result is aggregated by `event_id` and `group_id`. You want to aggregate table `a` before the join to reduce the volume of data the join must process.

**SQL example**:

```sql
explain shape plan
    select /*+ USE_CBO_RULE(push_down_agg_through_join_one_side) */
            a.event_id,
            b.group_id,
            COUNT(a.event_id)
    from a
    join b on
            a.device_id = b.device_id
    group by
            a.event_id,
            b.group_id
    ;
```

**Rewritten execution plan**:

```sql
PhysicalResultSink
--hashAgg[GLOBAL]
----hashAgg[LOCAL]
------hashJoin[INNER_JOIN] hashCondition=((a.device_id = b.device_id)) otherCondition=()
--------hashAgg[LOCAL]
----------PhysicalOlapScan[a]
--------filter((cast(experiment_id as DOUBLE) = 73.0))
----------PhysicalOlapScan[b]
```

You can see that an additional `hashAgg[LOCAL]` is placed above the scan of table `a`, performing aggregation before the join. This reduces the input size of the join and accelerates the query.

## FAQ

<!-- Knowledge type: FAQ / Troubleshooting -->

**Q1: When do you need to use `USE_CBO_RULE`?**

You only need to enable a rule manually when Doris does not apply a particular CBO rule by default but you have determined that the rule would be beneficial given the current data distribution. In most cases, you should trust the optimizer's automatic decisions.

**Q2: Are the rule names in the hint case-sensitive?**

No, they are case-insensitive. `PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE` and `push_down_agg_through_join_one_side` are equivalent.

**Q3: Can multiple rules be enabled at the same time?**

Yes. Separate the rules with commas, for example: `/*+ USE_CBO_RULE(rule1, rule2) */`.

**Q4: What happens if the hint is placed in the wrong location or the rule name is misspelled?**

The hint must immediately follow the `SELECT` keyword. If a rule name is misspelled, the hint takes no effect, but the SQL still executes using the default plan.

## RBO vs. CBO Comparison

<!-- Knowledge type: Comparison -->

| Dimension | RBO | CBO |
|------|-----|-----|
| Decision basis | Heuristic rules | Data statistics (cost estimation) |
| Depends on statistics | No | Yes |
| Applicable scenarios | General, deterministic optimization | Optimization tightly coupled with data distribution |
| Controllable by `USE_CBO_RULE` | No | Yes |

## Summary

Used appropriately, the `USE_CBO_RULE` hint lets you manually enable advanced CBO optimization rules in specific scenarios to improve query performance. Using it well requires a deep understanding of query optimization and data characteristics. **In most cases, relying on the Doris optimizer's automatic decisions is still the best choice**.
