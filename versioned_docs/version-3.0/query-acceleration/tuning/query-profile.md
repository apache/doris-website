---
{
    "title": "Query Profile",
    "language": "en"
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

When executing queries in Doris and encountering performance issues, it is recommended to conduct a further analysis. This document provides a comprehensive guide on how to analyze query performance in Doris.

In Doris, since profile collection introduces overhead, it is disabled by default. To perform query performance analysis, you first need to enable it by executing the following command in the MySQL Client:

```sql
set enable_profile = true;
```

## Identifying Slow Queries with QueryID

The first step in analyzing query performance is to obtain the QueryID of the query in question. You can find the QueryID in the `fe/log/fe.audit.log` log file.

For example, let's consider a specific query from TPC-H. By examining the log information, we can identify the QueryID as `QueryId=704185c15570441b-98ad0634c88584f0`.

```json
2024-08-20 14:37:23,729 [query] IClient=127.0.0.1:33570|User=root|Ctl=internal Db=regression_test_tpch_sf0_1_p1I|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=153|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=1191|QueryId=704185c15570441b-98ad0634c88584f0|IsQuery=true|isNereids=true|feIp=168.45.0.1|StmtType=SELECT|Stmt=SELECT sum(l_extendedprice) / 7.0 AS avg_yearly FROM lineitem, part WHERE p_partkey = l_partkey AND p_brand_ "Brand#23" AND p_container = "MED BOX" AND l_quantity < ( SELECT 0.2*avg(l_quantity) FROM lineitem WHERE l_partkey= p_partkey) |CpuTimeMS=401ShuffleSendBytes=0|ShuffleSendRows=0|SqlHash=ес2e14fac69b9711dc305e218f1e94b8|peakMemoryBytes=33792|SqlDigest=|cloudClusterName=UNKNOWN|TraceId=|WcorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
```

## Analyzing Query Performance using Profile

After obtaining the QueryID, you can retrieve the Profile details by accessing the corresponding FE's WebUI. For example, by visiting the link `http://{fe_ip}:{http_port}/QueryProfile/704185c15570441b-98ad0634c88584f0`, you can view the Profile information. For more detailed information, you can download the `profile_704185c15570441b-98ad0634c88584f0.txt` file.

### Profile File Structure

The Profile file consists of several main sections:

1. Basic Query Information: Includes ID, timestamp, database, etc.

2. SQL Statement and Execution Plan.

3. FE Time Breakdown (Plan Time, Schedule Time, etc.).

4. BE Operator Execution Times: Breakdown of each Operator's execution time (Merged Profile, Execution Profile, and each PipelineTask within Execution Profile).

In slow queries, the bottlenecks usually lie in the BE execution process. The following sections will focus on analyzing this part.

### Analyzing BE Execution with Merged Profile

Doris provides an aggregated view of Operator performance in the Merged Profile to help users identify performance bottlenecks more accurately.

Taking `EXCHANGE_OPERATOR` (id=4) as an example:

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

The Merged Profile consolidates core metrics for each Operator:

| Metric Name           | Description                             |
| --------------------- | --------------------------------------- |
| BlocksProduced        | Number of Data Blocks produced          |
| CloseTime             | Time taken by the Operator during Close |
| ExecTime              | Total execution time of the Operator    |
| InitTime              | Time taken by the Operator during Init  |
| MemoryUsage           | Memory usage during Operator execution  |
| OpenTime              | Time taken by the Operator during Open  |
| ProjectionTime        | Time taken during Projection            |
| RowsProduced          | Number of rows returned by the Operator |
| WaitForDependencyTime | Time spent waiting for dependencies     |

In Doris, each Operator executes concurrently based on user-defined concurrency levels. Therefore, the Merged Profile calculates Max, Avg, and Min values for each metric across all concurrent executions.

The `WaitForDependencyTime` metric varies for different Operators depending on their execution dependencies. For example, in the case of EXCHANGE_OPERATOR, it represents the time spent waiting for data from upstream Operators via RPC.

### Analyzing BE Execution with Execution Profile

Unlike the Merged Profile, the Execution Profile provides detailed metrics for a specific concurrent execution.

Again, taking `EXCHANGE_OPERATOR` (id=4) as an example:

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

:::info Note

In this Profile, `LocalBytesReceived` is unique to the Exchange Operator and not present in other Operators, hence it's not included in the Merged Profile.

:::

### Analyzing PipelineTask Execution Times

In Doris, a PipelineTask consists of multiple Operators. When analyzing the execution time of a PipelineTask, focus on the following aspects:

1. ExecuteTime: Represents the actual execution time of the entire PipelineTask, roughly equal to the sum of ExecTime for all Operators within the Task.

2. WaitWorkerTime: Represents the time the Task waits for an available Worker to execute. When a task is in the `runnable` state, it waits for an idle worker to execute, which depends on cluster load.

3. Wait Time for Dependencies: A Task can execute when all its Operators' dependencies are met. The wait time for dependencies is the sum of these wait times.

Taking one of the tasks from the previous example:

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

This task includes `DATA_STREAM_SINK_OPERATOR` and `AGGREGATION_OPERATOR`. Among them:

- `DATA_STREAM_SINK_OPERATOR` has two dependencies: `WaitForBroadcastBuffer` and `WaitForRpcBufferQueue`.

- `AGGREGATION_OPERATOR` has one dependency: `AGGREGATION_OPERATOR_DEPENDENCY`.

The time distribution for this task is:

1. ExecuteTime: 1.656ms (approximately the sum of ExecTime for both Operators)

2. WaitWorkerTime: 63.868us (indicating low cluster load as the Task executed immediately after becoming runnable)

3. Wait Time for Dependencies: 10.495ms (sum of wait times for all dependencies, including `WaitForBroadcastBuffer`, `WaitForRpcBufferQueue`, and `WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]`)

## Troubleshooting Steps for Performance Issues

When troubleshooting performance issues in Doris, follow these four steps:

### 1 Identify Operator Execution Issues

Slow Operator execution is a common issue in production environments. To locate these issues, analyze the `ExecTime` and `WaitForDependencyTime` for each Operator in the Merged Profile's Plan Tree.

- If `ExecTime` is high, it indicates an Operator performance issue, which could stem from the Operator's inherent performance or an unoptimized execution plan.

- If `ExecTime` is low but `WaitForDependencyTime` is high, the bottleneck likely lies upstream and requires further investigation along the Plan Tree.

### 2 Identify Data Skew Issues

When troubleshooting Operator performance, observe significant differences between minimum and maximum `ExecTime` values for an Operator. If present, check if there are also significant differences in the amount of data processed (`RowsProduced`). If so, this indicates data skew.

### 3 Identify High RPC Latency Issues

If no slow Operators are identified after traversing the entire Plan Tree, investigate RPC latency issues. Examine each `DATA_STREAM_SINK_OPERATOR` in the Execution Profile and check for abnormal `RpcMaxTime` values. High RPC latency may indicate network issues.

### 4 Identify High Cluster Load Issues

Doris's execution engine has a fixed number of execution threads. High cluster load can lead to tasks waiting for available workers. Analyze `WaitWorkerTime` for each PipelineTask in the Execution Profile to assess cluster load.