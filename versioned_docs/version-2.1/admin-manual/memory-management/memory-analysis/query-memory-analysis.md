---
{
    "title": "Query Memory Analysis",
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

Usually, we first use Query Profile to analyze query memory usage. If the sum of the memory of each operator counted in Query Profile is much smaller than the memory counted by Query Memory Tracker, it means that the operator memory counted by Query Profile is much different from the actual memory used. Then, we often need to use Heap Profile for further analysis. If Query is Canceled due to memory limit overrun and cannot be completed, Query Profile is incomplete and may not be analyzed accurately. Usually, we directly use Heap Profile to analyze query memory usage.

## Query Memory View

If you see a large value of `Label=query, Type=overview` Memory Tracker anywhere, it means that the query memory usage is high.

```
MemTrackerLimiter Label=query, Type=overview, Limit=-1.00 B(-1 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
```

If you already know the query to be analyzed, skip this section and continue with the analysis below. Otherwise, refer to the following method to locate the large memory query.

First locate the QueryID of the large memory query. In the BE web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=query`, you can see the real-time large memory query by sorting by `Current Consumption`. You can find the QueryID in `label`.

When the error process memory exceeds the limit or the available memory is insufficient, the lower part of the `Memory Tracker Summary` in the `be.INFO` log contains the Memory Tracker of the top 10 tasks (query/load/compaction, etc.) with the highest memory usage. The format is `MemTrackerLimiter Label=Query#Id=xxx, Type=query`. Usually, the QueryID of the large memory query can be located in the top 10 tasks.

The memory statistics of historical queries can be viewed in `peakMemoryBytes` of each query in `fe/log/fe.audit.log`, or search `Deregister query/load memory tracker, queryId` in `be/log/be.INFO` to view the peak memory of each query on a single BE.

## Use Query Profile to analyze query memory usage

Find query information including SQL in `fe/log/fe.audit.log` based on QueryID, get the query plan by `explain SQL`, and get the query profile by executing SQL after `set enable_profile=true`. For a detailed introduction to Query Profile, refer to the document [Query Profile](../../../query/query-analysis/query-profile.md). Here we only introduce the memory-related content in Query Profile, and locate the Operator and data structure that use a lot of memory based on it.

1. Locate Operators or memory data structures that use a lot of memory

Query Profile is divided into two parts:

- `MergedProfile`

MergedProfile is the aggregated result of all Instance Profiles of Query, which shows the sum, avg, max, and min of memory usage of each Operator in each Pipeline of each Fragment on all Instances, including the Operator's peak memory `PeakMemoryUsage` and the peak memory of major memory data structures such as `HashTable` and `Arena`. Based on this, Operators and data structures that use a lot of memory can be located.

```
MergedProfile  
          Fragments:
              Fragment  0:
                  Pipeline  :  0(instance_num=1):
                      RESULT_SINK_OPERATOR  (id=0):
                            -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                          EXCHANGE_OPERATOR  (id=20):
                                -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                    -  PeakMemoryUsage:  sum  1.16  KB,  avg  1.16  KB,  max  1.16  KB,  min  1.16  KB
              Fragment  1:
                  Pipeline  :  1(instance_num=12):
                      AGGREGATION_SINK_OPERATOR  (id=18  ,  nereids_id=1532):
                            -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                -  HashTable:  sum  96.00  B,  avg  8.00  B,  max  24.00  B,  min  0.00  
                                -  PeakMemoryUsage:  sum  1.58  MB,  avg  134.67  KB,  max  404.02  KB,  min  0.00  
                                -  SerializeKeyArena:  sum  1.58  MB,  avg  134.67  KB,  max  404.00  KB,  min  0.00  
                          EXCHANGE_OPERATOR  (id=17):
                                -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                    -  PeakMemoryUsage:  sum  2.25  KB,  avg  192.00  B,  max  768.00  B,  min  0.00
```

- `Execution  Profile`

`Execution Profile` is the result of each specific Instance Profile of Query. Usually, after locating the Operator and data structure that use a lot of memory based on `MergedProfile`, you can analyze the reasons for their memory usage based on the query plan after `explain SQL`. If you need to analyze the memory value of Query in a certain BE node or a certain Instance in some scenarios, you can further locate it based on `Execution Profile`.

```
Execution  Profile  36ca4f8b97834449-acae910fbee8c670:(ExecTime:  48sec201ms)
    Fragments:
        Fragment  0:
            Fragment  Level  Profile:    (host=TNetworkAddress(hostname:10.16.10.8,  port:9013)):(ExecTime:  48sec111ms)
            Pipeline  :1    (host=TNetworkAddress(hostname:10.16.10.8,  port:9013)):
                PipelineTask  (index=80):(ExecTime:  6sec267ms)
                DATA_STREAM_SINK_OPERATOR  (id=17,dst_id=17):(ExecTime:  1.634ms)
                -  MemoryUsage:  
                    -  PeakMemoryUsage:  1.50  KB
                STREAMING_AGGREGATION_OPERATOR  (id=16  ,  nereids_id=1526):(ExecTime:  41.269ms)
                    -  MemoryUsage:  
                        -  HashTable:  168.00  B
                        -  PeakMemoryUsage:  404.16  KB
                        -  SerializeKeyArena:  404.00  KB
                HASH_JOIN_OPERATOR  (id=15  ,  nereids_id=1520):(ExecTime:  6sec150ms)
                        -  MemoryUsage:  
                            -  PeakMemoryUsage:  3.22  KB
                            -  ProbeKeyArena:  3.22  KB
                    LOCAL_EXCHANGE_OPERATOR  (PASSTHROUGH)  (id=-12):(ExecTime:  67.950ms)
                            -  MemoryUsage:  
                                -  PeakMemoryUsage:  1.41  MB
```

2. `HASH_JOIN_SINK_OPERATOR` takes up too much memory

```
HASH_JOIN_SINK_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  1min14sec)
    -  JoinType:  INNER_JOIN
    -  BroadcastJoin:  true
    -  BuildRows:  600.030257M  (600030257)
    -  InputRows:  600.030256M  (600030256)
    -  MemoryUsage:  
        -  BuildBlocks:  15.65  GB
        -  BuildKeyArena:  0.00  
        -  HashTable:  6.24  GB
        -  PeakMemoryUsage:  21.89 GB
```

It can be seen that the `BuildBlocks` and `HashTable` in the Hash Join Build phase mainly use memory. Usually, the Hash Join Build phase uses too much memory. First, confirm whether the Join Reorder order is reasonable. Usually, the correct order is to use small tables for Hash Join Build and large tables for Hash Join Probe. This can minimize the overall memory usage of Hash Join and usually has better performance.

In order to confirm whether the Join Reorder order is reasonable, we find the profile of `HASH_JOIN_OPERATOR` with id=12. We can see that `ProbeRows` has only 196240 rows. Therefore, the correct order of this Hash Join Reorder should be to swap the positions of the left and right tables. You can `set disable_join_reorder=true` to turn off Join Reorder and manually specify the order of the left and right tables and then perform Query verification. For further information, please refer to the relevant documents on Join Reorder in the query optimizer.

```
HASH_JOIN_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  8sec223ms)
    -  BlocksProduced:  227
    -  MemoryUsage:  
        -  PeakMemoryUsage:  0.00  
        -  ProbeKeyArena:  0.00  
    -  ProbeRows:  196.24K  (196240)
    -  RowsProduced:  786.22K  (786220)
```

## Use Heap Profile to analyze query memory usage

If the query profile above cannot accurately locate the memory usage location, if the cluster can be easily restarted and the phenomenon can be reproduced, refer to [Heap Profile Memory Analysis](./heap-profile-memory-analysis.md) to analyze the query memory.

Dump the Heap Profile once before the query is executed, and dump the Heap Profile again during the query execution. By using `jeprof --dot lib/doris_be --base=heap_dump_file_1 heap_dump_file_2` to compare the memory changes between the two Heap Profiles, you can get the memory usage ratio of each function in the code during the query execution. Compare the code to locate the memory usage location. Because the memory changes in real time during the query execution, you may need to dump the Heap Profile multiple times during the query execution and compare and analyze.
