---
{
    "title": "Performance Tuning Process Guide",
    "language": "en",
    "description": "How do you systematically tune slow queries in Doris? This article presents a four-step tuning process: slow SQL identification, schema tuning, plan tuning, and execution tuning, covering both tools and scenarios.",
    "keywords": ["Doris performance tuning", "slow query identification", "schema tuning", "execution plan tuning", "Profile analysis", "tuning process"]
}
---

<!-- Knowledge type: process methodology -->
<!-- Applicable scenarios: slow query tuning, performance bottleneck identification, systematic performance optimization -->

Performance tuning in Doris is a systematic effort that requires methodological guidance. Doris provides [diagnostic tools](diagnostic-tools.md) and [analysis tools](analysis-tools.md) to support systematic diagnosis, enabling efficient identification, analysis, and resolution of performance issues.

**Pre-tuning self-check checklist:**

- You have confirmed the presence of slow SQL or performance degradation.
- You have access to FE node logs or Doris Manager.
- You are familiar with the schema design and query patterns of the business tables.
- You understand basic analysis tools such as `EXPLAIN` and `Profile`.

The complete four-step tuning process is as follows:

![Performance tuning process](/images/query-tuning-steps.jpg)

| Step | Phase | Core Goal | Main Tools |
| --- | --- | --- | --- |
| Step 1 | Slow query identification | Identify the SQL statements that need tuning | Doris Manager, `fe.audit.log`, `audit_log` table |
| Step 2 | Schema tuning | Eliminate design-level bottlenecks | Partitioning and bucketing, indexes, Colocate Group |
| Step 3 | Plan tuning | Optimize the execution plan | `EXPLAIN`, materialized views, Hint |
| Step 4 | Execution tuning | Optimize runtime performance | `Profile`, Runtime Filter, parallelism parameters |

## Step 1: Slow query identification

<!-- Knowledge type: operational guide -->
<!-- Applicable scenarios: identifying slow SQL that needs tuning -->

**Goal**: Filter out the slow SQL statements in the business system that need tuning.

**Approach**:

| Scenario | Recommended Approach | Description |
| --- | --- | --- |
| Doris Manager is deployed | Use the Manager log page | Visual interface that makes filtering and sorting easier |
| Doris Manager is not deployed | Query the `fe.audit.log` on the FE nodes or the `audit_log` system table | After obtaining the slow SQL list, prioritize and tune the statements in order |

For more information on tool usage, see [Diagnostic tools](diagnostic-tools.md).

## Step 2: Schema design and tuning

<!-- Knowledge type: tuning method -->
<!-- Applicable scenarios: performance issues caused by unreasonable table structure or index design -->

After identifying the slow SQL, first check the business schema design to rule out performance issues caused at the design level. Schema tuning covers three areas:

| Tuning Direction | Main Content | Reference Documentation |
| --- | --- | --- |
| Table-level schema tuning | Number of partitions and buckets, field types | [Optimize table schema](../tuning/tuning-plan/optimizing-table-schema.md) |
| Index design tuning | Prefix index, Bloom filter, inverted index, and so on | [Optimize table index](../tuning/tuning-plan/optimizing-table-index.md) |
| Specific optimization techniques | Colocate Group, and so on | [Use Colocate Group to optimize Join](../colocation-join.md) |

For detailed cases, see [Plan tuning](../tuning/tuning-plan/optimizing-table-schema.md).

## Step 3: Plan tuning

<!-- Knowledge type: tuning method -->
<!-- Applicable scenarios: performance bottlenecks caused by unreasonable execution plans -->

After completing the schema check, you enter the main tuning phase. This phase makes full use of the `EXPLAIN` tool at each level of Doris to systematically analyze the execution plan of the slow SQL and locate the key optimization points.

**Tuning techniques by scenario:**

-   **Single-table query/analysis scenarios**
    -   Analyze the execution plan and confirm whether [partition pruning](../tuning/tuning-plan/optimizing-table-scanning.md) takes effect.
    -   [Use single-table materialized views to accelerate queries](../tuning/tuning-plan/transparent-rewriting-with-sync-mv.md).

-   **Complex multi-table analysis scenarios**
    -   Analyze whether the Join Order is reasonable and locate performance bottlenecks.
    -   [Use multi-table materialized views for transparent rewriting](../tuning/tuning-plan/transparent-rewriting-with-async-mv.md) to accelerate queries.
    -   Manually bind the execution plan via Hint:
        -   [Use Leading Hint to control the Join Order](../tuning/tuning-plan/reordering-join-with-leading-hint.md)
        -   [Use Shuffle Hint to adjust the Join shuffle method](../tuning/tuning-plan/adjusting-join-shuffle.md)
        -   [Use Hint to control cost-based rewriting behavior](../tuning/tuning-plan/controlling-hints-with-cbo-rule.md)

-   **Specific acceleration scenarios**
    -   [Use SQL Cache to accelerate queries](../sql-cache-manual.md)

For detailed cases, see [Plan tuning](../tuning/tuning-plan/optimizing-table-schema.md).

## Step 4: Execution tuning

<!-- Knowledge type: tuning method -->
<!-- Applicable scenarios: the execution plan is reasonable but runtime performance does not meet expectations -->

In the execution tuning phase, you need to verify the effect of plan tuning based on the actual runtime behavior of the SQL, and continue to analyze execution-side bottlenecks, such as time distribution across execution stages or insufficient parallelism.

**Taking a multi-table analytical query as an example, you can check the following with Profile:**

-   Whether the Join order chosen by the planner is reasonable.
-   Whether Runtime Filter takes effect.
-   Whether the parallelism meets expectations.
-   Machine load (such as slow IO or network transmission performance not meeting expectations).

For machine-load issues, you need to use system-level tools to assist with diagnosis. For detailed cases, see [Execution tuning](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md).

:::tip Tip
When analyzing a specific performance issue, **the recommended order is to check the plan first and tune the execution second**. First use `EXPLAIN` to confirm the execution plan, and then use `Profile` to locate execution performance issues. Reversing the order may lead to inefficiency and make it harder to quickly identify the problem.
:::

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: common questions during the tuning process -->

**Q1: Should you do schema tuning or plan tuning first?**

Schema tuning should be done first. Unreasonable schema design (such as incorrect partitioning/bucketing fields or missing necessary indexes) prevents the execution plan itself from being optimized. Resolving schema issues first avoids repeatedly tuning on top of a flawed foundation.

**Q2: What is the difference between `EXPLAIN` and `Profile`?**

| Tool | Output | Phase of Use |
| --- | --- | --- |
| `EXPLAIN` | Static execution plan (does not actually run) | Plan tuning |
| `Profile` | Runtime time and resource metrics from actual execution | Execution tuning |

**Q3: What should you do when the Join Order is not reasonable?**

Examine the `EXPLAIN` output and use [Leading Hint](../tuning/tuning-plan/reordering-join-with-leading-hint.md) to manually specify the Join order.

**Q4: How do you handle issues such as slow IO or slow network?**

`Profile` can reflect machine load, but root-cause identification requires combining operating-system-level tools (such as `iostat`, `sar`, and `netstat`) to investigate hardware or network bottlenecks.

## Summary

Doris provides multi-dimensional tuning tools that support full-chain diagnosis from slow query identification, schema design, and execution plans to runtime performance. Business users and DBAs are encouraged to follow the four-step process of "identification -> schema -> plan -> execution" for systematic tuning, so as to fully unleash the performance advantages of Doris.
