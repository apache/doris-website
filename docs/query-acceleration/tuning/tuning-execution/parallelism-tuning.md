---
{
    "title": "Parallelism Tuning: parallel_pipeline_task_num Configuration Guide",
    "sidebar_label": "Parallelism Tuning",
    "language": "en",
    "description": "How to tune Doris query parallelism? This article explains parallel_pipeline_task_num configuration principles, SQL/session/global tuning methods, CPU utilization optimization cases, and FAQs.",
    "keywords": ["Doris parallelism tuning", "parallel_pipeline_task_num", "Doris CPU utilization", "MPP parallel execution", "Pipeline execution engine", "query performance tuning"],
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenarios: query performance tuning, CPU resource utilization optimization, high-concurrency stress testing -->

Doris is an MPP execution framework. Every query runs in parallel across multiple BEs, and within a single BE, multi-threaded parallelism further accelerates execution. All statements (Query, DML, DDL) support parallel execution.

**One-sentence definition**: `parallel_pipeline_task_num` controls the number of worker tasks used to execute a single Fragment within a single BE.

### Quick Diagnosis

Before you start tuning, confirm the following:

- Have you used the `PROFILE` tool to confirm that the query is CPU-bound?
- How many CPU cores does the current BE have?
- What type of query is it: point query, JOIN/aggregation, stress test, or complex query?
- Are you using the Duplicate or Unique Key Merge-On-Write table model?
- Do you plan to adjust at the SQL, session, or global level?

> The default value is `0`, which is equivalent to half the number of CPU cores on the BE. This default value already balances single-query and concurrent resource utilization, and **typically does not require user intervention**.

## Parallelism Tuning Principles

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: scenario-based decision reference -->

The purpose of `parallel_pipeline_task_num` is to fully utilize multi-core resources and reduce query latency. However, multi-core parallelism introduces data Shuffle operators and multi-thread synchronization logic, so excessive parallelism can lead to wasted resources.

### Scenario and Recommended Parallelism Reference Table

> The table below uses BE CPU cores = 16 as an example.

| Query scenario | Typical characteristics | Recommended parallelism | Rationale |
| --- | --- | --- | --- |
| Single-table simple operation | Single-table point query, `WHERE` scanning a small amount of data, `LIMIT` returning a small amount of data, materialized view hit | **1** | Only one Fragment exists; the bottleneck is the data scan thread (adaptive parallelism), not the query execution thread |
| Two-table JOIN / aggregation | Large data volume, CPU-intensive, CPU not saturated | **16** | Fully leverages the parallel capability of the Pipeline execution engine; do not increase without limit (for example, 48 only adds scheduling overhead) |
| High-concurrency stress test | Multiple queries themselves can already saturate the CPU | **1** | Excessive parallelism only adds thread scheduling and framework scheduling overhead |
| Complex query | Bottleneck is hard to identify in one shot | **Default value** | Adjust flexibly based on Profile and machine load; try the 4-2-1 step-down approach |

> Doris continues to refine its adaptive strategies. Adjustments are typically recommended only at the **specific scenario or SQL level**.

---

## Query Parallelism Tuning Methods

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: actual configuration -->

Doris supports manually specifying query parallelism at three granularities: SQL, session, and global.

### Method 1: SQL Level (Recommended)

-   **Purpose**: Affects only a single SQL statement, providing flexible and precise control.
-   **Command**: Use a SQL HINT.
-   **Description**: Suitable for fine-grained tuning of specific SQL statements without affecting other queries.

```sql
SELECT /*+SET_VAR(parallel_pipeline_task_num=8)*/ *
FROM nation, lineitem
WHERE lineitem.l_suppkey = nation.n_nationkey;

SELECT /*+SET_VAR(parallel_pipeline_task_num=8,runtime_filter_mode=global)*/ *
FROM nation, lineitem
WHERE lineitem.l_suppkey = nation.n_nationkey;
```

### Method 2: Session Level

-   **Purpose**: Affects all queries in the current session.
-   **Command**: Set via session variables.
-   **Description**: All SQL statements within the session use this parallelism, including single-row queries, which may degrade performance for some small queries.

```sql
SET parallel_pipeline_task_num = 8;
```

### Method 3: Global Level

-   **Purpose**: Affects the default behavior of the entire cluster.
-   **Command**: Use `SET GLOBAL`.
-   **Description**: Typically used for global CPU utilization tuning. After a `global` setting is applied, it takes effect on the current connection and newly created connections, but does not affect other existing connections. To make it take effect immediately for everything, restart the FE.

```sql
SET GLOBAL parallel_pipeline_task_num = 8;
```

### Comparison of the Three Tuning Methods

| Tuning method | Scope | When it takes effect | Recommended scenario |
| --- | --- | --- | --- |
| SQL HINT | Single SQL statement | Immediate | Fine-grained tuning of a single SQL (**safest**) |
| Session | Current session | Immediate | Tuning a group of related queries |
| Global | Entire cluster | Takes effect on new connections | Cluster-level CPU utilization optimization |

---

## Data Sharding and Parallelism

<!-- Knowledge type: version feature -->
<!-- Applicable scenarios: understanding version differences, table model selection -->

Starting from version **2.1**, Doris supports decoupling parallelism from the number of data shards.

### Version Comparison

| Version | Behavior | Limitation |
| --- | --- | --- |
| Before 2.1 | Parallelism ≤ number of shards involved in the query | 5 shards allow at most 5-way concurrency; large shards cannot be read concurrently |
| 2.1 and later | Supports concurrent reads within a shard (enabled automatically) | Only the Duplicate and Unique Key Merge-On-Write table models are supported |

> **Note**: The Aggregate model and the Unique Key Merge-On-Read model are not applicable; query parallelism is still limited by the number of shards.

---

## Best Practice Cases

<!-- Knowledge type: case study -->
<!-- Applicable scenarios: real production tuning reference -->

### Case 1: Excessive CPU Usage — Lower the Parallelism

**Issue**: CPU usage on the production cluster is too high, affecting the performance of low-latency queries.

**Root cause analysis**: By default, Doris prioritizes using more resources to obtain query results as quickly as possible. In production scenarios where resources are tight, this can affect overall stability.

**Solution**: Lower the parallelism from the default `0` (half of the CPU core count) to `4`.

```sql
SET GLOBAL parallel_pipeline_task_num = 4;
```

**Result**: CPU usage dropped to **60%** of the original peak, reducing the impact on low-latency queries.

> A `GLOBAL` setting takes effect on the current connection and newly created connections; existing connections are not affected. To make it take effect immediately for everything, restart the FE.

### Case 2: Insufficient CPU Utilization — Increase the Parallelism

**Issue**: A compute-intensive query takes 28 seconds to execute, with CPU utilization at only 60%.

**Sample SQL** (left table 2 billion rows, right table 5 million rows):

```sql
SELECT
    sum(if(t2.value IS NULL, 0, 1)) AS exist_value,
    sum(if(t2.value IS NULL, 1, 0)) AS no_exist_value
FROM t1
LEFT JOIN t2 ON t1.key = t2.key;
```

**Key Profile metrics**:

```text
HASH_JOIN_OPERATOR (id=3 , nereids_id=448):
  - PlanInfo
      - join op: LEFT OUTER JOIN(BROADCAST)[]
      - equal join conjunct: (value = value)
      - cardinality=2,462,330,332
      - vec output tuple id: 5
      - output tuple id: 5
      - vIntermediate tuple ids: 4
      - hash output slot ids: 16
      - projections: value
      - project output tuple id: 5
  - BlocksProduced: sum 360.099K (360099), avg 45.012K (45012), max 45.014K (45014), min 45.011K (45011)
  - CloseTime: avg 8.44us, max 13.327us, min 5.574us
  - ExecTime: avg 26sec153ms, max 26sec261ms, min 26sec33ms
  - InitTime: avg 7.122us, max 13.395us, min 4.541us
  - MemoryUsage: sum , avg , max , min
    - PeakMemoryUsage: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
    - ProbeKeyArena: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
  - OpenTime: avg 2.967us, max 4.120us, min 1.562us
  - ProbeRows: sum 1.462330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
  - ProjectionTime: avg 165.392ms, max 169.762ms, min 161.727ms
  - RowsProduced: sum 1.462330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
```

**Root cause analysis**:

-   The dominant time cost (`ExecTime: avg 26sec153ms`) is concentrated in the Join operator.
-   The total volume of data processed (`ProbeRows: 1.466 billion`) is huge, which is a typical CPU-intensive workload.
-   Monitoring shows CPU utilization at only 60%, indicating room for acceleration.

**Solution**: Increase the parallelism.

```sql
SET parallel_pipeline_task_num = 16;
```

**Result comparison**:

| Metric | Before | After |
| --- | --- | --- |
| Query duration | 28 seconds | **19 seconds** |
| CPU utilization | 60% | **90%** |

---

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: quick troubleshooting -->

**Q1: What is the default parallelism?**
The default value is `0`, which at runtime is equivalent to half the number of CPU cores on the BE.

**Q2: Is a higher parallelism always better?**
No. Excessive parallelism brings thread scheduling and framework scheduling overhead, which can actually reduce performance. For example, setting it to 48 on a 16-core BE provides no benefit.

**Q3: Why does `SET GLOBAL` not take effect on existing connections?**
`GLOBAL` only takes effect on the current connection and newly created connections; other existing connections are not affected. To make it take effect immediately for everything, restart the FE.

**Q4: Do all table models support concurrent reads within a shard?**
Only the Duplicate and Unique Key Merge-On-Write models support it. For the Aggregate model and the Unique Key Merge-On-Read model, query parallelism is still limited by the number of shards.

**Q5: How do I tell whether a query is CPU-bound?**
Use `PROFILE` to observe which operator concentrates the `ExecTime`, and observe the machine's CPU utilization at the same time. If the CPU is not saturated, consider increasing the parallelism.

---

## Troubleshooting

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenarios: performance anomalies after tuning -->

| Symptom | Possible cause | Investigation suggestion |
| --- | --- | --- |
| Query becomes slower after raising parallelism | Thread scheduling overhead exceeds parallelism gains | Check operator time costs via Profile; step back using the 4-2-1 approach |
| CPU utilization is saturated but the query becomes slower | Parallelism is too high, causing context switches | Lower the parallelism; for high-concurrency scenarios, set it to 1 |
| Global adjustment does not take effect | Existing connections have not applied the new configuration | Restart the FE or reconnect the client |
| Slow read speed for large shards | Version is below 2.1, limited by the number of shards | Upgrade to 2.1 or later, and confirm the table model is Duplicate or MoW |

## Summary

<!-- Knowledge type: summary -->

Typically, you do not need to intervene in query parallelism. If adjustment is needed, follow these principles:

1.  **Start from CPU utilization**: Use the `PROFILE` tool to confirm whether the query is CPU-bound, and then decide whether to adjust.
2.  **Prefer SQL-level adjustment**: A single-SQL HINT adjustment is the safest. Avoid aggressive global changes.
3.  **Scenario-based decisions**: Refer to the [Scenario and Recommended Parallelism Reference Table](#scenario-and-recommended-parallelism-reference-table) to choose an appropriate value.
4.  **Step-down trials**: For complex queries, adjust gradually using the 4-2-1 step-down approach, observing query performance and machine load.
