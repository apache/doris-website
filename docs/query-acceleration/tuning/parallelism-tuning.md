---
{
    "title": "Parallelism Tuning: How to Set parallel_pipeline_task_num?",
    "language": "en",
    "description": "How to tune Doris query parallelism (parallel_pipeline_task_num)? When to set it to 1, 16, or keep the default? Three adjustment methods at the SQL, session, and global levels with best practices.",
    "keywords": ["Doris parallelism tuning", "parallel_pipeline_task_num", "Pipeline execution engine", "MPP parallel execution", "query performance tuning", "BE CPU utilization"],
    "sidebar_label": "Parallelism Tuning"
}
---

<!-- Knowledge type: Performance tuning guide -->
<!-- Applicable scenarios: High query latency, insufficient CPU utilization, stress testing, slow JOIN/aggregation -->

# Parallelism Tuning

Parallelism (`parallel_pipeline_task_num`) controls the number of worker tasks used by a single Fragment when it runs inside a BE. It is a key parameter for fully utilizing multi-core CPUs and reducing query latency.

## Pre-Tuning Self-Check Checklist

<!-- Knowledge type: Pre-check -->
<!-- Applicable scenarios: Before adjusting parameters -->

- [ ] You have confirmed the number of CPU cores on the BE (which determines the upper bound of parallelism).
- [ ] You have used the Profile or monitoring metrics to determine the bottleneck type (CPU-intensive, scan-intensive, or scheduling overhead).
- [ ] You understand the current query scenario (point query, JOIN/aggregation, stress test, or complex query).
- [ ] Performance is genuinely below expectations under the default value (`0`, which means half the number of CPU cores).

## Core Concepts

<!-- Knowledge type: Term definition -->
<!-- Applicable scenarios: Understanding the parallelism model -->

- **MPP parallelism**: Each query runs in parallel across multiple BEs.
- **Intra-BE parallelism**: Within a single BE, multi-threading accelerates Fragment execution.
- **`parallel_pipeline_task_num`**: The number of worker tasks used by a single Fragment during execution. The default `0` means half the number of CPU cores on the BE.
- **Applicable statements**: All Query, DML, and DDL statements support parallel execution.

## Tuning Principles

<!-- Knowledge type: Decision principle -->
<!-- Applicable scenarios: Deciding whether to adjust the parameter -->

A higher parallelism is not always better:

1. Increasing parallelism makes full use of multi-core resources and reduces single-query latency.
2. However, it introduces additional data Shuffle operators and multi-thread synchronization logic, which wastes resources.
3. The default value already balances single-query and concurrent scenarios, so **manual intervention is usually unnecessary**.
4. Doris continues to refine its adaptive strategies. **Prefer adjustments at the SQL or scenario level** rather than globally.

## Scenario-Based Tuning Recommendations

<!-- Knowledge type: Scenario recipe -->
<!-- Applicable scenarios: Choosing parallelism based on query type -->

The following examples assume that the BE has 16 CPU cores.

### Scenario Reference Table

| Query scenario | Recommended parallelism | Reason |
|---|---|---|
| Single-table point query / `WHERE` on a small amount of data / `LIMIT` / hitting a materialized view | **1** | Only one Fragment exists. The bottleneck is the scan thread (which is independent from the query thread and parallelizes adaptively), so the query thread does not need extra concurrency. |
| Two-table `JOIN` over a large dataset / aggregation query (CPU-intensive) | **16** | Compute-intensive. When the CPU is not saturated, increasing parallelism can fully utilize the cores. However, do not increase it without limit (for example, setting it to 48 only adds scheduling overhead). |
| Stress testing scenario | **1** | Concurrent queries already saturate the CPU on their own, and excessive parallelism only adds thread and framework scheduling overhead. |
| Complex query | **Default value** | Adjust flexibly based on the Profile and machine load. Try a stepwise decrease of **4 -> 2 -> 1** to observe the effect. |

### Scenario 1: Simple Single-Table Operations

<!-- Applicable scenarios: Point queries, light filtering, materialized views -->

- **Characteristics**: A single Fragment, with the bottleneck on the scan thread (which already parallelizes adaptively).
- **Recommendation**: `parallel_pipeline_task_num = 1`.
- **Reason**: The scan thread and the query execution thread are independent. Adding more concurrent query threads cannot accelerate a scan-bound bottleneck.

### Scenario 2: JOIN/Aggregation Over Large Datasets

<!-- Applicable scenarios: CPU-intensive analytical queries -->

- **Characteristics**: Compute-intensive workload where the CPU is observed to be unsaturated.
- **Recommendation**: Increase the parallelism above the default value, for example `parallel_pipeline_task_num = 16`.
- **Reason**: This leverages the parallel capability of the Pipeline execution engine to fully utilize the CPU. However, do not increase it without limit, or the thread and framework scheduling overhead will outweigh the gains.

### Scenario 3: Stress Testing

<!-- Applicable scenarios: High-concurrency stress testing -->

- **Characteristics**: There are enough concurrent queries that the CPU is already saturated by multiple queries.
- **Recommendation**: `parallel_pipeline_task_num = 1`.
- **Reason**: This avoids the scheduling overhead introduced by stacking single-query parallelism on top of high concurrency.

### Scenario 4: Complex Queries

<!-- Applicable scenarios: Multi-table JOINs, complex subqueries -->

- **Characteristics**: The execution plan is complex, and the bottleneck is hard to identify at a glance.
- **Recommendation**: Start with the default value, then adjust stepwise as **4 -> 2 -> 1** based on the Profile and machine load to observe the effect.

## Tuning Methods

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Issuing the actual tuning command -->

Doris supports parallelism settings at three granularities: SQL level, session level, and global level. The priority decreases in this order.

### Method Comparison

| Method | Scope | Applicable scenarios | Risk |
|---|---|---|---|
| SQL HINT | A single SQL statement | Tuning a specific slow SQL | No side effects, most recommended |
| Session variable | The current session | A group of queries within the same session | Single-row queries also follow this setting, which may degrade performance |
| Global variable | All new connections across the cluster | Cluster-wide CPU utilization adjustment | The largest scope of impact, use with caution |

### SQL-Level Adjustment

<!-- Applicable scenarios: Targeting individual slow SQL statements -->

- **Purpose**: Use a HINT to precisely control the parallelism of a single SQL statement, providing the best flexibility.
- **Command**:

    ```sql
    SELECT /*+SET_VAR(parallel_pipeline_task_num=8)*/ *
    FROM nation, lineitem
    WHERE lineitem.l_suppkey = nation.n_nationkey;

    SELECT /*+SET_VAR(parallel_pipeline_task_num=8,runtime_filter_mode=global)*/ *
    FROM nation, lineitem
    WHERE lineitem.l_suppkey = nation.n_nationkey;
    ```

- **Notes**: You can stack other session variables (such as `runtime_filter_mode`) within the same HINT.

### Session-Level Adjustment

<!-- Applicable scenarios: Running a batch of similar queries in the same session -->

- **Purpose**: Make all SQL statements in the current session follow the same parallelism setting.
- **Command**:

    ```sql
    SET parallel_pipeline_task_num = 8;
    ```

- **Notes**: Within the session, even single-row point queries run with this parallelism, which may slow down lightweight queries.

### Global Adjustment

<!-- Applicable scenarios: Cluster-wide CPU utilization adjustment -->

- **Purpose**: Take effect on all new connections, affecting the cluster-wide default behavior.
- **Command**:

    ```sql
    SET GLOBAL parallel_pipeline_task_num = 8;
    ```

- **Notes**: Use this only when you genuinely need to adjust cluster-wide CPU utilization. Otherwise, keep the default value.

## FAQ / Troubleshooting

<!-- Knowledge type: Frequently asked questions -->
<!-- Applicable scenarios: When tuning does not meet expectations -->

### Q1: Why is the query slower after I increased the parallelism?

An overly large parallelism introduces more Shuffle and thread synchronization overhead, and the scheduling framework itself has its own overhead. For example, setting it to 48 on a 16-core machine produces almost no benefit and only adds scheduling cost. Start from the default value and adjust stepwise as **4 -> 2 -> 1**.

### Q2: Why is the recommended parallelism for a single-table point query 1?

A single-table point query has only one Fragment, and the bottleneck is the data scan. The scan thread and the query execution thread are separate, and the scan thread parallelizes adaptively. Therefore, increasing `parallel_pipeline_task_num` does not accelerate a scan-bound bottleneck.

### Q3: Why is parallelism 1 also recommended for stress testing?

Stress testing itself involves a large number of concurrent queries that already saturate the CPU. Stacking single-query parallelism on top of that only adds thread scheduling and framework scheduling overhead.

### Q4: What does the default value `0` mean?

`parallel_pipeline_task_num = 0` means the BE automatically uses **half the number of CPU cores**. This default value balances single-query performance and concurrent throughput, and most scenarios do not need to change it.

### Q5: Should I set the global parallelism or use a SQL HINT?

Prefer using a SQL HINT to tune individual slow SQL statements. Use `SET GLOBAL` only when you have confirmed that the cluster-wide CPU utilization needs an overall adjustment.

## Related Parameters

<!-- Knowledge type: Parameter index -->

| Parameter | Purpose | Default value |
|---|---|---|
| `parallel_pipeline_task_num` | The number of worker tasks for a single Fragment inside a BE | `0` (BE CPU cores / 2) |
| `runtime_filter_mode` | The working mode of Runtime Filter, often tuned together with parallelism | See the Runtime Filter documentation |
