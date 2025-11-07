---
{
    "title": "Analysis Tools",
    "language": "en"
}
---

## Overview

The previous section on [diagnostic tools](diagnostic-tools.md) helped business and operations personnel pinpoint specific slow SQL queries. This section will introduce how to analyze the performance bottlenecks of slow SQL to determine which part of the SQL execution process is causing the slowdown. 

The execution process of an SQL query can be roughly divided into two stages: plan generation and plan execution. The former is responsible for generating the execution plan, while the latter executes the specific plan. Issues in either part can lead to performance bottlenecks. For example, if a poor plan is generated, no matter how excellent the executor is, good performance cannot be achieved. Similarly, even with a correct plan, inappropriate execution methods can also lead to performance bottlenecks. Furthermore, the performance of the executor is closely related to the current hardware and system architecture. Deficiencies in infrastructure or incorrect configurations can also cause performance issues.

All three types of problems require the support of good analysis tools. Based on this, the Doris system provides two performance analysis tools to analyze bottlenecks in planning and execution respectively. Additionally, the system level also offers corresponding performance monitoring tools to assist in locating performance bottlenecks. The following sections will introduce these three aspects:

## Doris Explain

An execution plan describes the specific execution method and process of an SQL query. For example, for an SQL query that joins two tables, the execution plan will show information such as how the tables are accessed, the join method, and the join order.

Doris provides the Explain tool, which conveniently displays detailed information about an SQL query's execution plan. By analyzing the plan output by Explain, users can quickly locate bottlenecks at the planning level and perform plan-level tuning based on different situations.

Doris offers multiple Explain tools with different levels of granularity, such as Explain Verbose, Explain All Plan, Explain Memo Plan, and Explain Shape Plan, which are used to display the final physical plan, logical plans at various stages, plans based on cost optimization processes, and plan shapes, respectively. For detailed information, please refer to the Execution Plan Explain section to learn about the usage of various Explain tools and the interpretation of their output information.

By analyzing the output of Explain, business personnel and DBAs can quickly locate performance bottlenecks in the current plan. For example, by analyzing the execution plan, it may be discovered that filters are not pushed down to the base tables, resulting in data not being filtered early and an excessive amount of data being involved in calculations, leading to performance issues. Another example is that in an Inner equi-join of two tables, the filter conditions on one side of the join condition are not derived to the other side, resulting in the data of the other table not being filtered early, which may also lead to suboptimal performance. Such performance bottlenecks can be located and resolved by analyzing the output of Explain.

For cases of using Doris Explain output to perform plan-level tuning, please refer to the [Plan Tuning](../tuning/tuning-plan/optimizing-table-schema.md) section.

## Doris Profile

The Explain tool described above outlines the execution plan for an SQL query, such as planning a join operation between tables t1 and t2 as a Hash Join, with t1 designated as the build side and t2 as the probe side. When the SQL query is actually executed, understanding how much time each specific execution step takes—for instance, how long the build phase lasts and how long the probe phase lasts—is crucial for performance analysis and tuning. The Profile tool provides detailed execution information for this purpose. The following section first gives an overview of the Profile file structure and then introduces the meanings of execution times in Merged Profile, Execution Profile, and PipelineTask.

### Profile File Structure

A Profile file contains several main sections:

1. Basic query information: including ID, time, database, etc.
2. The SQL statement and its execution plan.
3. Time spent by the Frontend (FE) on tasks like Plan Time, Schedule Time, etc.
4. Execution time spent by each operator during the Backend (BE) processing (including Merged Profile and Execution Profile).

5. The detailed information about the execution side is mainly contained in the last part. Next, we will mainly introduce what information the Profile can provide for performance analysis.

### Merged Profile

To help users more accurately analyze performance bottlenecks, Doris provides aggregated profile results for each operator. Taking the EXCHANGE_OPERATOR as an example:

```sql
EXCHANGE_OPERATOR  (id=4):
    -  BlocksProduced:  sum  0,  avg  0,  max  0,  min  0
    -  CloseTime:  avg  34.133us,  max  38.287us,  min  29.979us
    -  ExecTime:  avg  700.357us,  max  706.351us,  min  694.364us
    -  InitTime:  avg  648.104us,  max  648.604us,  min  647.605us
    -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
    -  PeakMemoryUsage:  sum  0.00  ,  avg  0.00  ,  max  0.00  ,  min  0.00  
    -  OpenTime:  avg  4.541us,  max  5.943us,  min  3.139us
    -  ProjectionTime:  avg  0ns,  max  0ns,  min  0ns
    -  RowsProduced:  sum  0,  avg  0,  max  0,  min  0
    -  WaitForDependencyTime:  avg  0ns,  max  0ns,  min  0ns
    -  WaitForData0:  avg  9.434ms,  max  9.476ms,  min  9.391ms
```

The Merged Profile consolidates key metrics for each operator, with the core metrics and their meanings outlined below:

| Metric Name           | Metric Definition                                          |
| --------------------- |------------------------------------------------------------|
| BlocksProduced        | Number of Data Blocks produced                             |
| CloseTime             | Time spent by the Operator during the close phase          |
| ExecTime              | Total execution time of the Operator across all phases     |
| InitTime              | Time spent by the Operator during the initialization phase |
| MemoryUsage           | Memory usage of the Operator during execution              |
| OpenTime              | Time spent by the Operator during the open phase           |
| ProjectionTime        | Time spent by the Operator on projections                  |
| RowsProduced          | Number of rows returned by the Operator                    |
| WaitForDependencyTime | Time the Operator waits for its execution dependencies     |

In Doris, each operator executes concurrently based on the concurrency level set by the user. Therefore, the Merged Profile calculates the Max, Avg, and Min values for each metric across all concurrent executions.

WaitForDependencyTime varies for each Operator, as the execution dependencies differ. For instance, in the case of an EXCHANGE_OPERATOR, the dependency is on data being sent by upstream operators via RPC. Thus, WaitForDependencyTime in this context specifically refers to the time spent waiting for upstream operators to send data.

### Execution Profile

Unlike the Merged Profile, the Execution Profile displays detailed metrics for a specific concurrent execution. Taking the exchange operator with id=4 as an example:

```sql
EXCHANGE_OPERATOR  (id=4):(ExecTime:  706.351us)
      -  BlocksProduced:  0
      -  CloseTime:  38.287us
      -  DataArrivalWaitTime:  0ns
      -  DecompressBytes:  0.00  
      -  DecompressTime:  0ns
      -  DeserializeRowBatchTimer:  0ns
      -  ExecTime:  706.351us
      -  FirstBatchArrivalWaitTime:  0ns
      -  InitTime:  647.605us
      -  LocalBytesReceived:  0.00  
      -  MemoryUsage:  
      -  PeakMemoryUsage:  0.00  
      -  OpenTime:  5.943us
      -  ProjectionTime:  0ns
      -  RemoteBytesReceived:  0.00  
      -  RowsProduced:  0
      -  SendersBlockedTotalTimer(*):  0ns
      -  WaitForDependencyTime:  0ns
      -  WaitForData0:  9.476ms
```

In this profile, for instance, LocalBytesReceived is a metric specific to the exchange operator and not found in other operators, hence it is not included in the Merged Profile.

### PipelineTask Execution Time

In Doris, a PipelineTask consists of multiple operators. When analyzing the execution time of a PipelineTask, several key aspects need to be focused on:
1. ExecuteTime: The actual execution time of the entire PipelineTask, which is approximately equal to the sum of the ExecTime of all operators in this task
2. WaitWorkerTime: The time that a task waits for a worker to execute. When a task is in the runnable state, it has to wait for an idle worker to execute it. The time it takes depends mainly on the cluster load.
3. Waiting time for executing dependencies: A task can be executed only when all the dependencies of each operator meet the execution conditions, and the time a task waits for executing dependencies is the sum of the waiting times of these dependencies. For example, simplifying one of the tasks in this example:

    ```sql
    PipelineTask  (index=1):(ExecTime:  4.773ms)
      -  ExecuteTime:  1.656ms
          -  CloseTime:  90.402us
          -  GetBlockTime:  11.235us
          -  OpenTime:  1.448ms
          -  PrepareTime:  1.555ms
          -  SinkTime:  14.228us
      -  WaitWorkerTime:  63.868us
        DATA_STREAM_SINK_OPERATOR  (id=8,dst_id=8):(ExecTime:  1.688ms)
          -  WaitForDependencyTime:  0ns
              -  WaitForBroadcastBuffer:  0ns
              -  WaitForRpcBufferQueue:  0ns
        AGGREGATION_OPERATOR  (id=7  ,  nereids_id=648):(ExecTime:  398.12us)
          -  WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time:  10.495ms
    ```
   This task includes two operators (DATA_STREAM_SINK_OPERATOR - AGGREGATION_OPERATOR), of which DATA_STREAM_SINK_OPERATOR has two dependencies (WaitForBroadcastBuffer and WaitForRpcBufferQueue), and AGGREGATION_OPERATOR has one dependency (AGGREGATION_OPERATOR_DEPENDENCY), so the time consumption of the current task is distributed as follows:

   1. ExecuteTime: 1.656ms (The actual execution time of the entire PipelineTask, which is approximately the sum of the ExecTime of all operators within the task).
   2. WaitWorkerTime: 63.868us (The time the task waits for an execution worker. When the task is in a runnable state, it waits for an available worker to execute it, and this duration primarily depends on the cluster load).
   3. Time Waiting for Execution Dependencies: 10.495ms (WaitForBroadcastBuffer + WaitForRpcBufferQueue + WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time). The time a task waits for execution dependencies is the sum of the waiting times for these dependencies.

For cases of using Profile for execution-level tuning, please refer to the [Tuning Execution](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md) section.

## System-Level Performance Tools

Commonly used system tools can assist in identifying performance bottlenecks during execution. For instance, widely used Linux tools such as top, free, perf, sar, and iostat can be utilized to observe the CPU, memory, I/O, and network status of the system while SQL is running, thereby aiding in the identification of performance bottlenecks.

## Summary

Effective performance analysis tools are crucial for quickly identifying performance bottlenecks. Doris provides Explain and Profile, offering powerful support for analyzing issues with execution plans and identifying which operations consume the most time during execution. Additionally, proficient use of system-level analysis tools can greatly assist in locating performance bottlenecks.



