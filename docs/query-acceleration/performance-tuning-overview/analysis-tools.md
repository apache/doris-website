---
{
    "title": "Slow SQL Analysis Tools: Explain and Profile",
    "language": "en",
    "description": "How do you analyze the performance bottlenecks of slow SQL in Doris? This article introduces how to use Explain, Profile, and system-level tools to quickly locate issues at the plan and execution layers.",
    "keywords": ["Doris performance analysis", "Doris Explain", "Doris Profile", "slow SQL analysis", "Merged Profile", "Execution Profile", "PipelineTask"]
}
---

<!-- Knowledge type: concept + tool usage guide -->
<!-- Applicable scenario: After a slow SQL has been located, further analysis is needed to determine whether the bottleneck lies in the plan layer, execution layer, or system layer -->

Performance analysis tools are used to further determine where the performance bottleneck lies after a slow SQL has been located. The previous section, [Diagnostic Tools](diagnostic-tools.md), helps business and operations personnel locate specific slow SQL. This chapter introduces how to analyze the performance bottlenecks of these slow SQL.

**Opening Checklist**: Before starting the analysis, confirm that you have the following:

- A specific slow SQL has been located through diagnostic tools.
- You can access Doris FE and have permission to execute `EXPLAIN`.
- You can obtain the Profile of this SQL (Profile collection has been enabled).
- You can access BE nodes to view system-level performance metrics (CPU/memory/IO/network).

### Two Stages of SQL Execution and Three Types of Bottlenecks

The execution of a SQL statement is divided into two stages:

1. **Plan generation stage**: responsible for generating the execution plan.
2. **Plan execution stage**: responsible for executing the specific plan.

Problems in either stage can lead to performance bottlenecks:

- **Poor plan**: No matter how excellent the executor is, good performance cannot be achieved.
- **Inappropriate execution method**: Even if the plan is correct, bottlenecks can easily occur.
- **Infrastructure defects or configuration errors**: Executor performance is closely tied to hardware and system architecture.

### Mapping Between Tools and Bottleneck Types

| Bottleneck Type     | Recommended Analysis Tool | Main Purpose                                            |
| ------------------- | ------------------------- | ------------------------------------------------------- |
| Plan-layer bottleneck | Doris Explain           | View the SQL execution plan and locate plan-generation issues |
| Execution-layer bottleneck | Doris Profile      | View detailed runtime execution information for each operator |
| System-level bottleneck | top/free/perf/sar, etc. | Observe the runtime status of system CPU/memory/IO/network |

The following sections introduce these three types of tools.

## Doris Explain: Analyzing Plan-Layer Bottlenecks

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: When a slow SQL is suspected to be caused by a suboptimal plan, and the execution plan details need to be examined -->

### One-Sentence Definition

An execution plan is a description of the specific way and process by which a SQL statement is executed. For example, for a SQL statement that joins two tables, the execution plan shows the access methods of the two tables, the join method, and the join order.

### Purpose

The Doris Explain tool conveniently displays detailed information about a SQL execution plan. By analyzing the Explain output, you can quickly locate plan-layer bottlenecks and perform plan-layer tuning for different situations.

### Comparison of Explain Types

Doris provides Explain at multiple granularities for different analysis scenarios:

| Explain Type         | Output Content                       | Applicable Scenario                  |
| -------------------- | ------------------------------------ | ------------------------------------ |
| Explain Verbose      | Final physical plan                  | View the actual physical plan delivered to BE |
| Explain All Plan     | Logical plans at each stage          | Track the evolution of logical plans |
| Explain Memo Plan    | Cost-based optimization process plan | Analyze decisions made by the CBO optimizer |
| Explain Shape Plan   | Plan shape                           | Quickly view the skeleton and structure of a plan |

For the specific usage and output explanation of each type of Explain, refer to the execution plan Explain documentation.

### Typical Plan-Layer Bottlenecks

By analyzing the Explain output, you can quickly locate the following common plan-layer bottlenecks:

- **Filter not pushed down to the base table**: Data is not filtered in advance, resulting in too much data participating in the computation.
- **Join condition not derived to the other side**: In an inner equi-join between two tables, the filter condition on one side is not derived to the other side, so the data on the other table is not filtered in advance.

For cases of plan-layer tuning using Doris Explain, see the [Plan Tuning](../tuning/tuning-plan/optimizing-table-schema.md) chapter.

## Doris Profile: Analyzing Execution-Layer Bottlenecks

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: The plan has no obvious issues, but the SQL executes slowly, and the runtime time consumption of each operator needs to be examined -->

### One-Sentence Definition

A Profile is a record of the detailed time consumption and runtime metrics of each operator during the actual execution of a SQL, used to locate execution-layer performance bottlenecks.

### Difference from Explain

Explain describes the **planning** of SQL execution (for example, the join between t1 and t2 is planned as a Hash Join, with t1 on the build side and t2 on the probe side). Profile describes the **actual process** of SQL execution (for example, how long the build takes and how long the probe takes).

### Profile File Structure

A Profile file contains the following main parts:

1. **Basic query information**: including ID, time, database, etc.
2. **SQL statement and execution plan**.
3. **FE time consumption**: including Plan Time, Schedule Time, etc.
4. **Execution time consumption of each BE operator**: including Merged Profile and Execution Profile.

The detailed information on the execution side is mainly in the last part. The following sections focus on the execution information provided by the Profile.

### Merged Profile

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Quickly view the aggregated performance metrics of an operator across all concurrent instances -->

The Merged Profile provides the core metrics of each operator aggregated across all concurrent instances, making it easy to quickly locate bottlenecks. In Doris, each operator executes concurrently according to the concurrency level set by the user, and the Merged Profile calculates the Max, Avg, and Min values for each metric.

**Example** (using EXCHANGE_OPERATOR):

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

**Description of core metrics**:

| Metric Name           | Metric Meaning                                              |
| --------------------- | ----------------------------------------------------------- |
| BlocksProduced        | Number of Data Blocks produced                              |
| CloseTime             | Time spent by the operator in the close phase               |
| ExecTime              | Total execution time of the operator across all phases      |
| InitTime              | Time spent by the operator in the Init phase                |
| MemoryUsage           | Memory usage of the operator during the execution phase     |
| OpenTime              | Time spent by the operator in the Open phase                |
| ProjectionTime        | Time spent by the operator on projection                    |
| RowsProduced          | Number of rows returned by the operator                     |
| WaitForDependencyTime | Time the operator waits on its own execution dependencies   |

`WaitForDependencyTime` varies by operator. For example, in the EXCHANGE_OPERATOR above, the dependency is the upstream operator sending data via RPC, so this metric actually measures the time spent waiting for the upstream operator to send data.

### Execution Profile

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Locate fine-grained performance issues in a specific concurrent instance, or view operator-specialized metrics -->

The Execution Profile shows the detailed metrics of a specific concurrent instance. Compared with the Merged Profile, it is more fine-grained and includes operator-specialized metrics.

**Example** (using EXCHANGE_OPERATOR with id=4):

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

For example, `LocalBytesReceived` is an EXCHANGE_OPERATOR-specialized metric that other operators do not have, so it is not included in the Merged Profile.

### PipelineTask Execution Time

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Analyze the time distribution of a single PipelineTask, distinguishing actual execution, waiting for a Worker, and waiting for dependencies -->

In Doris, a PipelineTask is composed of multiple operators. To analyze the execution time of a PipelineTask, focus on the following three aspects:

| Focus Area              | Description                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| ExecuteTime             | The actual execution time of the PipelineTask, approximately equal to the sum of ExecTime of all operators in the task |
| WaitWorkerTime          | The time the task waits for an execution Worker, mainly determined by the cluster load       |
| Time waiting on execution dependencies | The sum of all operator dependency wait times (a task can be executed only when all dependencies are satisfied) |

**Simplified example**:

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

This task contains two operators (DATA_STREAM_SINK_OPERATOR and AGGREGATION_OPERATOR). DATA_STREAM_SINK_OPERATOR has two dependencies (WaitForBroadcastBuffer and WaitForRpcBufferQueue), and AGGREGATION_OPERATOR has one dependency (AGGREGATION_OPERATOR_DEPENDENCY). The time distribution of this task is as follows:

| Time Type              | Value      | Description                                                       |
| ---------------------- | ---------- | ----------------------------------------------------------------- |
| Total execution time   | 1.656 ms   | Approximately equal to the sum of ExecTime of the two operators   |
| Time waiting for Worker | 63.868 us | The current cluster load is not high, and a Worker executes the task immediately after it is ready |
| Time waiting on execution dependencies | 10.495 ms | Equal to the sum of all dependency wait times          |

For cases of execution-layer tuning using Profile, see the [Execution Tuning](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md) chapter.

## System-Level Performance Tools

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: When the performance bottleneck is suspected to be at the system layer (CPU/memory/IO/network), to assist in locating issues during execution -->

System-level tools assist in locating performance bottlenecks during SQL execution by observing the runtime status of system resources.

| System Resource | Common Linux Tools  | Main Purpose                                  |
| --------------- | ------------------- | --------------------------------------------- |
| CPU             | top, perf, sar      | Observe CPU usage and hot functions           |
| Memory          | top, free, sar      | Observe memory usage and swap activity        |
| Disk IO         | iostat, sar         | Observe disk read/write rate and wait time    |
| Network         | sar, netstat        | Observe network traffic and connection status |

## Frequently Asked Questions

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Common questions encountered when using analysis tools -->

### Q1: Among Explain, Profile, and system tools, which should you use first?

Investigate in order from highest to lowest priority: first look at **Explain** to rule out plan issues; once the plan is reasonable, look at **Profile** to locate the slow operator; if the operator's own time consumption is reasonable but the overall execution is still slow, then look at the **system tools**.

### Q2: Should you choose Merged Profile or Execution Profile?

First look at **Merged Profile** to quickly identify time consumption differences among operators. When you suspect that a particular concurrent instance is abnormal or need to view operator-specialized metrics, then look at **Execution Profile**.

### Q3: The PipelineTask is slow overall, but ExecuteTime is not high. What is the reason?

Usually it is **high WaitWorkerTime** (high cluster load) or **high time waiting on dependencies** (the upstream operator does not produce data in time). You need to use the dependency name to locate the upstream bottleneck.

### Q4: WaitForDependencyTime is 0, but WaitForData0 is very high?

`WaitForData0` is the specific dependency for EXCHANGE_OPERATOR waiting for upstream RPC data. A high value of this metric usually means that the upstream operator produces data slowly, and you should further investigate the upstream operator.

## Summary

<!-- Knowledge type: summary -->

Performance analysis tools are an important prerequisite for quickly locating performance bottlenecks.

- **Doris Explain**: locates plan-layer bottlenecks.
- **Doris Profile**: locates execution-layer bottlenecks (Merged Profile + Execution Profile + PipelineTask time).
- **System-level tools**: assist in locating bottlenecks at the hardware and operating system layers.

Skillfully combining these three types of tools enables end-to-end localization and resolution of performance bottlenecks in Doris slow SQL.
