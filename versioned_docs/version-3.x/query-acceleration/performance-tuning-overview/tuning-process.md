---
{
    "title": "Tuning Process",
    "language": "en",
    "description": "Performance tuning is a systematic process that requires a comprehensive methodology and implementation framework for systematic diagnosis and "
}
---

## Overview

Performance tuning is a systematic process that requires a comprehensive methodology and implementation framework for systematic diagnosis and optimization. With the strong support of [diagnostic tools](diagnostic-tools.md) and [analysis tools](analysis-tools.md), the Doris system can efficiently diagnose, analyze, locate, and resolve performance issues. The complete four-step process for tuning is as follows:

![Tuning process](/images/query-tuning-steps.jpg)

## Step 1: Use Performance Diagnostic Tools to Identify Slow Queries

For business systems running on Doris, use the aforementioned [performance diagnostic tools](diagnostic-tools.md) to identify slow SQL queries.

- If Doris Manager is installed, it is recommended to use the Manager's log page for convenient visual identification of slow queries.
- If Manager is not installed, you can directly check the `fe.audit.log` file on the FE node or the audit_log system table to obtain a list of slow SQL queries and prioritize them for tuning.

## Step 2: Schema Design and Tuning

After identifying specific slow SQL queries, the first priority is to inspect and tune the business schema design to eliminate performance issues caused by unreasonable schema design.

Schema design tuning can be divided into three aspects:

- [Table-level Schema Design Tuning](../tuning/tuning-plan/optimizing-table-schema.md), such as adjusting the number of partitions and buckets, and field optimization;
- [Index Design and Tuning](../tuning/tuning-plan/optimizing-table-index.md)
- The use of specific optimization techniques, such as [Optimizing Join with Colocate Group](../tuning/tuning-plan/optimizing-join-with-colocate-group.md). The main goal is to eliminate performance issues caused by unreasonable schema design or failure to fully leverage Doris's existing optimization capabilities.

For detailed tuning examples, please refer to the documentation on [Plan Tuning](../tuning/tuning-plan/optimizing-table-schema.md).

## Step 3: Plan Tuning

After inspecting and tuning the business schema, the main task of tuning begins: plan tuning and execution tuning. As mentioned above, at this stage, the primary task is to make full use of the various levels of Explain tools provided by Doris to systematically analyze the execution plans of slow SQL queries and identify key optimization points for targeted optimization.

- For single-table query and analysis scenarios, you can analyze the execution plan to check if [partition pruning](../tuning/tuning-plan/optimizing-table-scanning.md) is working properly and [use single-table materialized views for query acceleration](../tuning/tuning-plan/transparent-rewriting-with-sync-mv.md).
- For complex multi-table analysis scenarios, you can analyze the Join Order to determine if it is reasonable and identify specific performance bottlenecks. You can also [use multi-table materialized views for transparent rewriting to accelerate queries](../tuning/tuning-plan/transparent-rewriting-with-async-mv.md). If unexpected situations occur, such as unreasonable Join Order, you can manually specify the Join Hint to bind the execution plan, such as [using the Leading hint to control Join Order](../tuning/tuning-plan/reordering-join-with-leading-hint.md), [using the Shuffle Hint to adjust the Join shuffle method](../tuning/tuning-plan/adjusting-join-shuffle.md), and [using Hints to control cost-based optimization rules](../tuning/tuning-plan/controlling-hints-with-cbo-rule.md), to achieve the goal of tuning the execution plan.
- For specific scenarios, you can also leverage advanced features provided by Doris, such as [using SQL Cache to accelerate queries](../tuning/tuning-plan/accelerating-queries-with-sql-cache.md).

For detailed tuning examples, please refer to the documentation on [Plan Tuning](../tuning/tuning-plan/optimizing-table-schema.md).

## Step 4: Execution Tuning

In the execution tuning stage, you need to validate the effectiveness of plan tuning based on the actual execution of SQL queries. Additionally, within the framework of the existing plan, continue to analyze bottlenecks on the execution side, identify which execution stages are slow, or other common issues such as suboptimal parallelism.

Taking multi-table analysis queries as an example, you can analyze the Profile to check if the planned Join order is reasonable, if Runtime Filters are effective, and if the parallelism meets expectations. Furthermore, the Profile can provide feedback on machine load, such as slow I/O or unexpected network transmission performance. When confirming and diagnosing such issues, system-level tools are needed to assist in diagnosis and tuning.

For detailed tuning examples, please refer to the documentation on [Execution Tuning](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md).

:::tip
When analyzing specific performance issues, it is recommended to first check the plan and then tune the execution. Start by using the Explain tool to confirm the execution plan, and then use the Profile tool to locate and tune execution performance. Reversing the order may lead to inefficiencies and hinder the rapid identification of performance issues.
:::

## Summary

Query tuning is a systematic process, and Doris provides users with tools across various dimensions to facilitate the diagnosis, identification, analysis, and resolution of performance issues at different levels. By familiarizing themselves with these diagnostic and analysis tools and adopting reasonable tuning methods, business personnel and DBAs can quickly and effectively address performance bottlenecks, better unleash Doris's powerful performance advantages, and better adapt to business scenarios for business enablement.
