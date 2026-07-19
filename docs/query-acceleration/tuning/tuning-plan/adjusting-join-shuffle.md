---
{
    "title": "Adjusting Join Shuffle Mode with Hints",
    "language": "en",
    "description": "How do you adjust the Join shuffle mode in Doris using Distribute Hint? This article describes the syntax of the [shuffle] and [broadcast] hints, execution plan comparisons, and tuning practices.",
    "keywords": ["Doris Join Shuffle", "Distribute Hint", "broadcast hint", "shuffle hint", "Join tuning", "Nereids execution plan"]
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenario: manually adjust the Join data distribution mode to optimize query performance -->

Distribute Hint is the hint syntax that Doris provides for manually specifying the data distribution mode of the right table in a Join. It allows you to override the optimizer's default choice in specific scenarios to optimize Join performance.

**Pre-tuning checklist**:

- You have used `EXPLAIN SHAPE PLAN` to inspect the current Join distribution mode.
- You have confirmed that the default plan has a performance bottleneck (for example, a small table being shuffled or a large table being broadcast).
- You understand the data sizes of both tables and can judge whether Broadcast or Shuffle is suitable.
- Hints are used only in professional tuning scenarios; manual intervention is not required on the business side.

:::caution Note
Doris already provides strong out-of-the-box capabilities, which means that in the vast majority of scenarios Doris adaptively optimizes performance without requiring users to manually control hints for business tuning. The content in this chapter is mainly aimed at professional tuning specialists; business users only need a basic understanding.
:::

## Distribute Hint Syntax

<!-- Knowledge type: reference -->
<!-- Applicable scenario: specify the distribution mode of the Join right table when writing SQL -->

Doris supports two independent [Distribute Hints](../../../query-acceleration/hints/distribute-hint.md). They must be placed before the Join right table and wrapped in square brackets `[]`.

### Hint Type Comparison

| Hint Type      | Distribution Mode (DistributionSpec) | Typical Applicable Scenario                                  | Data Transfer Cost                  |
| :------------- | :----------------------------------- | :----------------------------------------------------------- | :---------------------------------- |
| `[shuffle]`    | `DistributionSpecHash`               | Both tables are large; redistributed by Join Key hash        | Both tables are redistributed by key |
| `[broadcast]`  | `DistributionSpecReplicated`         | The right table is small and is replicated to every BE node  | The right table is fully replicated to every BE node |

> Tip: You can also combine a Leading Hint with a Distribute Hint to specify the shuffle mode together. For details, see [Controlling Join Order with Leading Hint](reordering-join-with-leading-hint.md).

### Minimal Example

```sql
-- Force the right table to use Broadcast distribution
SELECT COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;

-- Force the right table to use Shuffle distribution
SELECT COUNT(*) FROM t2 JOIN [shuffle] t1 ON t1.c1 = t2.c2;
```

## Case: Verify the Hint Effect with EXPLAIN

<!-- Knowledge type: operational example -->
<!-- Applicable scenario: verify whether a hint takes effect during tuning -->

The following example uses the same query to show the difference in execution plans before and after a hint takes effect.

### Step 1: View the Default Execution Plan

**Goal**: Confirm the distribution mode chosen by the optimizer by default.

**Command**:

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

**Description**: In the default plan, `t2` uses `DistributionSpecHash`, that is, Shuffle distribution by hash.

```sql
+----------------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                                 |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg [GLOBAL]                                                               |
| ----PhysicalDistribute [DistributionSpecGather]                                  |
| ------hashAgg [LOCAL]                                                            |
| --------PhysicalProject                                                          |
| ----------hashJoin [INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()|
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan [t1]                                              |
| ------------PhysicalDistribute [DistributionSpecHash]                            |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan [t2]                                            |
+----------------------------------------------------------------------------------+
```

### Step 2: Add the [broadcast] Hint

**Goal**: Change the distribution mode of the right table `t2` to Broadcast.

**Command**:

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN [broadcast] t2 ON t1.c1 = t2.c2;
```

**Description**: In the execution plan, the distribution mode of `t2` changes from `DistributionSpecHash` to `DistributionSpecReplicated`, indicating that the hint has taken effect.

```sql
+----------------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                                 |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg [GLOBAL]                                                               |
| ----PhysicalDistribute [DistributionSpecGather]                                  |
| ------hashAgg [LOCAL]                                                            |
| --------PhysicalProject                                                          |
| ----------hashJoin [INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()|
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan [t1]                                              |
| ------------PhysicalDistribute [DistributionSpecReplicated]                      |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan [t2]                                            |
+----------------------------------------------------------------------------------+
```

## FAQ

<!-- Knowledge type: FAQ / Troubleshooting -->
<!-- Applicable scenario: the hint does not take effect as expected, or it is hard to choose between hints -->

### Q1: Why does the hint not take effect after I add it?

-   Make sure the hint is placed before the **Join right table**, for example `JOIN [broadcast] t1`, not before the left table.
-   Use `EXPLAIN SHAPE PLAN` to check whether the `DistributionSpec` of the `PhysicalDistribute` node matches your expectation.
-   Syntax errors (such as missing brackets or typos) are silently ignored. Check your SQL syntax.

### Q2: When should I use [broadcast] versus [shuffle]?

| Scenario                              | Recommended Hint | Reason                                       |
| :------------------------------------ | :--------------- | :------------------------------------------- |
| The right table is small (such as a dimension table) | `[broadcast]`    | Avoid the network overhead of shuffling the large table |
| Both tables are large with balanced data | `[shuffle]`      | Broadcast amplifies the transfer cost of the right table |
| The Join Key has severe data skew     | `[broadcast]`    | Avoid hot-spot nodes after Shuffle           |

### Q3: Do I need to manually specify a hint?

In most scenarios, no. The Doris optimizer adaptively chooses an appropriate distribution mode. Use a hint only when performance does not meet expectations and you have clearly determined that the optimizer's choice is suboptimal.

## Summary

By using Distribute Hint appropriately, you can optimize the shuffle mode of Join operations and improve query performance. In practice, it is recommended to first analyze the execution plan with `EXPLAIN SHAPE PLAN`, and then choose `[shuffle]` or `[broadcast]` based on the data size and distribution characteristics.
