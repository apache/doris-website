---
{
    "title": "分析工具",
    "language": "zh-CN",
    "description": "上节诊断工具已经帮助业务和运维人员定位到具体的慢 SQL，本章节开始介绍如何对慢 SQL 的性能瓶颈进行分析，以确定具体慢在 SQL 执行的哪个环节。"
}
---

## 概述

上节[诊断工具](diagnostic-tools.md)已经帮助业务和运维人员定位到具体的慢 SQL，本章节开始介绍如何对慢 SQL 的性能瓶颈进行分析，以确定具体慢在 SQL 执行的哪个环节。

一条 SQL 的执行过程大致可以分为计划生成和计划执行两个阶段，前一部分负责生成执行计划，后一部分负责具体计划的执行。这两个部分出现问题都可能导致性能瓶颈的发生。比如生成了差计划，那么即使再优秀的执行器也不可能获得很好的性能。同样一个正确的计划，如果相应的执行手段不合适，也容易产生性能瓶颈。此外，执行器的性能和当前运行的硬件和系统架构有紧密的关系，一些基础设施的缺陷或者配置不正确也会导致性能问题。

上述三类问题都需要良好的分析工具的支持。基于此，Doris 系统提供了两个性能分析工具来分别分析计划以及执行的性能瓶颈。另外系统级别也提供了相应的性能检测工具，辅助定位性能瓶颈。下面分别就这三个方面进行介绍：

## Doris Explain

执行计划是对一条 SQL 具体的执行方式和执行过程的描述。例如，对于一个两表连接的 SQL，执行计划会展示这两张表的访问方式信息、连接方式信息，以及连接的顺序等。

Doris 提供了 Explain 工具，可以方便的展示一个 SQL 的执行计划的详细信息。通过对 Explain 输出的计划进行分析，可以帮助使用者快速定位计划层面的瓶颈，从而针对不同的情况进行计划层面的调优。

Doris 提供了多种不同粒度的 Explain 工具，如 Explain Verbose、Explain All Plan、Explain Memo Plan、Explain Shape Plan，分别用于展示最终物理计划、各阶段逻辑计划、基于成本优化过程的计划、计划形态等。详细信息请参考执行计划 Explain，了解各种 Explain 的使用方法和输出信息的解释。

通过分析 Explain 的输出，业务人员和 DBA 就可以快速定位当前计划的性能瓶颈。例如，通过分析执行计划发现 Filter 没有下推到基表，导致没有提前过滤数据，使得参与计算的数据量过多，从而导致性能问题。又如，两表的 Inner 等值连接中，连接条件一侧的过滤条件没有推导到另外一侧，导致没有对另一侧的表数据进行提前过滤，也可能导致性能不优。此类性能瓶颈都可以通过分析 Explain 的输出来定位和解决。

使用 Doris Explain 输出进行计划层调优的案例详见[计划调优](../tuning/tuning-plan/optimizing-table-schema.md)章节。

## Doris Profile

上述 Explain 工具描述了一条 SQL 的执行的规划，比如一个 t1 和 t2 表的连接操作被规划成了 Hash Join 的执行方式，并且 t1 表被规划在 build 侧，t2 表被规划在 probe 侧。当 SQL 具体执行时，如何了解每个具体的执行分别耗费多少时间，比如 build 耗费多少时间，probe 耗费多少时间，profile 工具提供了详细的执行信息供性能分析和调优使用。下面部分先整体介绍 Profile 的文件结构，然后分别介绍 Merged Profile，Execution Profile 以及 PipelineTask 的执行时间含义：

### Profile 文件结构

Profile 文件中包含几个主要的部分：

1. 查询基本信息：包括 ID，时间，数据库等。
2. SQL 语句以及执行计划。
3. FE 的耗时（Plan Time，Schedule Time 等）。
4. BE 在执行过程中各个 operator 的执行耗时（包括 Merged Profile 和 Execution  Profile）。

执行侧的详细信息主要包含在最后一部分，接下来主要介绍 Profile 能够提供哪些信息供性能分析使用。

### Merged Profile

为了帮助用户更准确的分析性能瓶颈，Doris 提供了各个 operator 聚合后的 profile 结果。以 EXCHANGE_OPERATOR 为例：

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

Merged Profile 对每个 operator 的核心指标做了合并，核心指标和含义包括：

| 指标名称              | 指标含义                              |
| --------------------- | ------------------------------------- |
| BlocksProduced        | 产生的 Data Block 数量                |
| CloseTime             | Operator 在 close 阶段的耗时          |
| ExecTime              | Operator 在各个阶段执行的总耗时       |
| InitTime              | Operator 在 Init 阶段的耗时           |
| MemoryUsage           | Operator 在执行阶段的内存用量         |
| OpenTime              | Operator 在 Open 阶段的耗时           |
| ProjectionTime        | Operator 在做 projection 的耗时       |
| RowsProduced          | Operator 返回的行数                   |
| WaitForDependencyTime | Operator 等待自身执行的条件依赖的时间 |

Doris 中，每个 operator 根据用户设置的并发数并发执行，所以 Merged Profile 对每个执行并发又计算出了每个指标的 Max，Avg 和 Min 的值。

其中 WaitForDependencyTime 是每个 Operator 不同的，因为每个 operator 执行的条件依赖不同，例如在这个例子的 EXCHANGE_OPERATOR 中，条件依赖是有数据被上游的算子通过 rpc 发送过来，所以这里的 WaitForDependencyTime 其实就是在等待上游算子发数据。

### Execution Profile

区别于 Merged Profile，Execution Profile 展示的是具体的某个并发中的详细指标，以 id=4 的这个 exchange operator 为例：

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

在这个 profile 中，例如 LocalBytesReceived 是 exchange operator 特化的一个指标，其他的 operator 中没有，所以没在 Merged Profile 中包含。

### PipelineTask 执行时间

在 Doris 中，一个 PipelineTask 由多个 operator 组成。分析一个 PipelineTask 的执行耗时的时候，需要重点关注几个方面。

1. ExecuteTime：整个 PipelineTask 的实际执行时间，约等于这个 task 中所有 operator 的 ExecTime 相加
2. WaitWorkerTime：task 等待执行 worker 的时间。当 task 处于 runnable 状态时，他要等待一个空闲 worker 来执行，这个耗时主要取决于集群负载。
3. 等待执行依赖的时间：一个 task 可以执行的依赖条件是每个 operator 的 dependency 全部满足执行条件，而 task 等待执行依赖的时间就是将这些依赖的等待时间相加。例如简化这个例子中的其中一个 task：

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

   这个 task 包含了（DATA_STREAM_SINK_OPERATOR - AGGREGATION_OPERATOR）两个 operator，其中 DATA_STREAM_SINK_OPERATOR 有两个依赖（WaitForBroadcastBuffer 和 WaitForRpcBufferQueue），AGGREGATION_OPERATOR 有一个依赖（AGGREGATION_OPERATOR_DEPENDENCY），所以当前 task 的耗时分布如下：

    1. 执行总时间：1.656ms（约等于两个 operator 的 ExecTime 总和）
    2. 等待 Worker 的时间：63.868us（说明当前集群负载不高，task 就绪以后立即就有 worker 来执行）
    3. 等待执行依赖的时间（WaitForBroadcastBuffer + WaitForRpcBufferQueue + WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time）：10.495ms。当前 task 的所有 dependency 相加得到总的等待时间。

使用 Profile 进行执行层调优的案例详见[执行调优](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md)章节。

## 系统级性能工具

常用的系统工具，可以用来辅助定位执行期的性能瓶颈，比如常用的 Linux 下 top / free/ perf/ sar/ iostats 等，都可以用来观察 SQL 运行时系统 CPU/ MEM / IO / NETWORK 状态，以辅助定位性能瓶颈。

## 总结

好用的性能分析工具是快速定位性能瓶颈的重要前提。Doris 提供了 Explain 和 Profile，为分析执行计划问题和执行期哪个操作耗时高的问题，提供了强大的工具支撑。同时，熟练使用系统级别的分析工具也会对性能瓶颈的定位起到很好的辅助作用。
