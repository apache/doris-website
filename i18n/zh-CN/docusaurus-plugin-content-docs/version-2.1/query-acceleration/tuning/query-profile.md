---
{
    "title": "查询性能分析",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

在 Doris 执行查询时，当碰到查询性能未达预期时，建议做进一步分析情况。本文将全面阐述如何在 Doris 中对查询进行性能分析。

在 Doris 中，由于 Profile 收集会产生一定的开销，因此默认情况下它是关闭的。若要进行查询性能分析，我们首先需要将其开启，具体操作为在 MySQL Client 中执行以下命令：

```sql
set enable_profile = true;
```

## QueryID 排查慢查询

查询性能问题分析的首要步骤是获取待分析查询的 QueryID。这个 QueryID 可以从`fe/log/fe.audit.log`日志文件中找到。

以 TPC-H 中的某条特定查询为例，通过查看日志信息，我们可以发现该查询的 QueryID 为`QueryId=704185c15570441b-98ad0634c88584f0`。

```json
2024-08-20 14:37:23,729 [query] IClient=127.0.0.1:33570|User=root|Ctl=internal Db=regression_test_tpch_sf0_1_p1I|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=153|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=1191|QueryId=704185c15570441b-98ad0634c88584f0|IsQuery=true|isNereids=true|feIp=168.45.0.1|StmtType=SELECT|Stmt=SELECT sum(l_extendedprice) / 7.0 AS avg_yearly FROM lineitem, part WHERE p_partkey = l_partkey AND p_brand_ "Brand#23" AND p_container = "MED BOX" AND l_quantity < ( SELECT 0.2*avg(l_quantity) FROM lineitem WHERE l_partkey= p_partkey) |CpuTimeMS=401ShuffleSendBytes=0|ShuffleSendRows=0|SqlHash=ес2e14fac69b9711dc305e218f1e94b8|peakMemoryBytes=33792|SqlDigest=|cloudClusterName=UNKNOWN|TraceId=|WcorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
```

## Profile 分析查询性能

在获取 QueryID 后，可以通过访问对应 FE 的 WebUI 来检索 Profile 文本。例如，通过访问链接`http://{fe_ip}:{http_port}/QueryProfile/704185c15570441b-98ad0634c88584f0`，即可获取到相应的 Profile 信息，查看更多详细信息，可以下载 profile_704185c15570441b-98ad0634c88584f0.txt  文件。

### Profile 文件结构

Profile 文件中包含以下几个主要的部分：

1. 查询基本信息：包括 ID，时间，数据库等

2. SQL 语句以及执行计划。

3. FE 的耗时（Plan Time, Schedule Time 等）。

4. BE 在执行过程中各个 Operator 的执行耗时（包括 Merged Profile、Execution Profile、以及 Execution Profile 中的每个 PipelineTask）。

在慢查询中，通常耗时主要集中在 BE 的执行过程，接下来将主要介绍这部分的分析过程。

### 通过 Merged Profile 进行 BE 执行分析

为了帮助用户更准确地分析性能瓶颈，Doris 提供了各个 Operator 聚合后的 Profile 结果。

以 EXCHANGE_OPERATOR（id=4）为例：

```Python
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

Merged Profile 对每个 Operator 的核心指标进行了合并。核心指标及其含义如下：

| 指标名称              | 指标含义                            |
| --------------------- | ----------------------------------- |
| BlocksProduced        | 产生的 Data Block 数量              |
| CloseTime             | Operator 在 Close 阶段的耗时        |
| ExecTime              | Operator 在各个阶段执行的总耗时     |
| InitTime              | Operator 在 Init 阶段的耗时         |
| MemoryUsage           | Operator 在执行阶段的内存用量       |
| OpenTime              | Operator 在 Open 阶段的耗时         |
| ProjectionTime        | Operator 在进行 Projection 的耗时   |
| RowsProduced          | Operator 返回的行数                 |
| WaitForDependencyTime | Operator 等待自身执行条件依赖的时间 |

在 Doris 中，每个 Operator 根据用户设置的并发数并发执行。因此，Merged Profile 对每个执行并发的每个指标都计算出了 Max、Avg 和 Min 的值。

其中，WaitForDependencyTime 指标在不同 Operator 对应有不同的值，因为每个 Operator 执行的条件依赖不同。例如，在这个 EXCHANGE_OPERATOR 的例子中，条件依赖是有数据被上游的算子通过 RPC 发送过来。因此，这里的 WaitForDependencyTime 实际上就是在等待上游算子发送数据的时间。

### 通过 Execution Profile 进行 BE 执行分析

区别于 Merged Profile，Execution Profile 展示的是具体的某个并发中的详细指标。

还是以 EXCHANGE_OPERATOR（id=4）为例：

```Python
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

:::info 备注

在该 Profile 中，LocalBytesReceived 是 Exchange Operator 特有的一个指标，其他 Operator 中并不存在，因此它也没有被包含在 Merged Profile 中。

:::

### PipelineTask 执行时间分析

在 Doris 中，一个 PipelineTask 由多个 Operator 组成。当分析一个 PipelineTask 的执行耗时时，需要重点关注以下几个方面：

1. ExecuteTime：表示整个 PipelineTask 的实际执行时间，它大约等于该 Task 中所有 Operator 的 ExecTime 之和。

2. WaitWorkerTime：表示 Task 等待执行 Worker 的时间。当 Task 处于 `runnable` 状态时，它需要等待一个空闲的 Worker 来执行，该耗时主要取决于集群的负载情况。

3. 等待执行依赖的时间：一个 Task 可以执行的依赖条件是每个 Operator 的 Dependency 全部满足执行条件，而 Task 等待执行依赖的时间就是将这些依赖的等待时间相加。

以上述例子中的其中一个 Task 为例：

```Python
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

该 task 包含了 `DATA_STREAM_SINK_OPERATOR` 和 `AGGREGATION_OPERATOR` 两个 Operator。其中：

- `DATA_STREAM_SINK_OPERATOR` 有两个依赖，分别是 `WaitForBroadcastBuffer` 和 `WaitForRpcBufferQueue`

- `AGGREGATION_OPERATOR `有一个依赖，为 `AGGREGATION_OPERATOR_DEPENDENCY`。

因此，当前 Task 的耗时分布如下：

1. ExecuteTime（执行总时间）：1.656ms（约等于两个 Operator 的 ExecTime 总和）

2. WaitWorkerTime（等待 Worker 的时间）：63.868us（说明当前集群负载不高，Task 就绪以后立即就有 Worker 来执行）

3. 等待执行依赖的时间：10.495ms（`WaitForBroadcastBuffer` + `WaitForRpcBufferQueue` + `WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time`）即当前 task 的所有 Dependency 相加得到的总的等待时间。

## 性能问题通用排查思路

在 Doris 执行查询的过程中，通常可以依据以下四个步骤来排查性能问题：

### 1 定位算子执行性能问题

算子执行缓慢是日常生产环境中较为常见的一类问题。在定位过程中，可以根据 Merged Profile 中的 Plan Tree，梳理出每个 Operator 的 `ExecTime` 和 `WaitForDependencyTime`。

- 若 `ExecTime` 较慢，则表明当前算子存在性能问题，这可能是算子本身执行性能不佳，也可能是执行规划的 Plan 不够优化所导致的。

- 若 `ExecTime` 很快，但 `WaitForDependencyTime` 很长，则说明性能瓶颈不在当前算子，需沿着 Plan Tree 继续查找其子节点。

### 2 定位数据倾斜问题

在定位算子性能问题的过程中，若发现某个算子的 `ExecTime` 的最小值（Min）和最大值（Max）相差悬殊，则需观察该算子的数据量（`RowsProduced`）是否同样存在显著差异。若是，则说明发生了数据倾斜。

### 3 定位 RPC 延迟过大的问题

当遍历完整个 Plan Tree 之后，若未能找到任何执行缓慢的算子，接下来需排查是否因 RPC 延迟过大而导致的性能问题。

在此过程中，需找到 Execution Profile 中的每个 `DATA_STREAM_SINK_OPERATOR`，并检查其中的 `RpcMaxTime` 是否存在异常值。该指标指明了 RPC 过程中耗时最长的一次调用，若其值过大，则代表 RPC 延迟较高，可能是网络问题所致。

### 4 定位集群负载过高导致的性能问题

在 Doris 的执行引擎中，执行线程数量是固定的。因此，当集群负载很高时，每个 Task 需等待空闲的执行 Worker 来执行。可以通过 Execution Profile 中的每个 PipelineTask 下，查看`WaitWorkerTime` 指标来获取等待时间的信息，以进一步判断。