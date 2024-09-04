---
{
    "title": "Query error Memory Tracker Limit Exceeded",
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

When `MEM_LIMIT_EXCEEDED` appears in the query or load error message and contains `memory tracker limit exceeded`, it means that the task exceeds the single execution memory limit.

## Error message analysis 

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED] failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label :Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB. backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN _NODE (id=4)>>, can `set exec_mem_limit=8G` to change limit, details see be.INFO.
```

The error message is divided into two parts:

1. `failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB`: Query `f78208b15e064527-a84c5c0b04c04fcf` is currently being executed. When trying to apply for 1.03 MB of memory, it was found that the query exceeded the memory limit for a single execution. The query memory limit is 100 MB (`exec_mem_limit` in Session Variables). Currently, 99.25 MB has been used, and the peak memory is 99.29. MB.

2. `backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can set exec_mem_limit=8G to change limit, details see be.INFO.`: The location of this memory application is `VHASH_JOIN_NODE (id=4)`, and it is prompted that the memory limit of a single query can be increased by `set exec_mem_limit`.

## Single execution memory limit and memory over-issuance

`show variables;` You can view Doris Session Veriable, where `exec_mem_limit` is the execution memory limit for a single query and load, but since Doris 1.2, query memory over-issuance (overcommit) is supported, aiming to allow queries to set more flexible memory limits. When there is sufficient memory, even if the query memory exceeds the upper limit, it will not be Cancel, so users usually do not need to pay attention to query memory usage. Until the memory is insufficient, the query will wait for a while while trying to allocate new memory. At this time, based on certain rules, the query with a larger ratio of `mem_used` to `exec_mem_limit` will be canceled first. If the amount of memory released during the waiting process meets the requirements, the query will continue to execute, otherwise an exception will be thrown and the query will be terminated.

If you want to turn off query memory over-issuance, refer to [BE Configuration Items](../../../admin-manual/config/be-config.md) and add `enable_query_memory_overcommit=false` in `conf/be.conf`. At this time, a single query and load memory exceeding `exec_mem_limit` will be canceled. If you want to avoid the negative impact of large queries on cluster stability, or want to accurately control the execution of tasks on the cluster to ensure sufficient stability, then you can consider turning off query memory over-issuance.

## Query Memory Analysis

If you need to analyze the memory usage of queries, refer to [Query Memory Analysis](./query-memory-analysis.md).

After `set enable_profile=true` is used to enable Query Profile, when a task exceeds the memory limit for a single execution, the call stack of the query requesting memory will be printed in `be/log/be.INFO`, and the current memory used and peak value of each operator in the query can be seen. Refer to [Memory Log Analysis](./memory-log-analysis.md) to analyze `Process Memory Summary` and `Memory Tracker Summary` to help confirm whether the current query memory usage meets expectations.

```sql
Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED]failed alloc size 32.00 MB, memory tracker limit exceeded, tracker label:Query#I
d=41363cb6ba734ad5-bc8720bdf9b3090d, type:query, limit 100.00 MB, peak used 75.32 MB, current used 72.62 MB. backend 10.16.10.8, process memory used 2.33 GB. exec node:<>, can `set exec_mem_limit=8G`
 to change limit, details see be.INFO.
Process Memory Summary:
    os physical memory 375.81 GB. process memory used 2.33 GB(= 2.60 GB[vm/rss] - 280.53 MB[tc/jemalloc_cache] + 0[reserved] + 0B[waiting_refresh]), limit 338.23 GB, soft limit 304.41 GB. sys availab
le memory 337.33 GB(= 337.33 GB[proc/available] - 0[reserved] - 0B[waiting_refresh]), low water mark 6.40 GB, warning water mark 12.80 GB.
Memory Tracker Summary:    MemTrackerLimiter Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Type=query, Limit=100.00 MB(104857600 B), Used=72.62 MB(76146688 B), Peak=75.32 MB(78981248 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=122.00 B(122 B), Peak=122.00 B(122 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=384.00 B(384 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=384.00 B(384 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=21.73 MB(22790276 B), Peak=21.73 MB(22790276 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=2.23 MB(2342912 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=2.23 MB(2342912 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=24.03 MB(25201284 B), Peak=24.03 MB(25201284 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=1.08 MB(1130496 B), Peak=7.17 MB(7520256 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=1.08 MB(1130496 B), Peak=7.17 MB(7520256 B)
```
