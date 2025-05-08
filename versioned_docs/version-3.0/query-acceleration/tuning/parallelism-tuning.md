---
{
"title": "Parallelism Tuning",
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

# Parallelism Tuning

Doris's query is an MPP execution framework, and each query will be executed in parallel on multiple BEs. At the same time, within a single BE, a multi-threaded parallel approach is also adopted to accelerate the query execution efficiency. Currently, all statements (including Query, DML, DDL) support parallel execution.

The control parameter for the parallelism within a single BE is: parallel_pipeline_task_num, which refers to the number of working tasks used when a single Fragment is executed.

## Principles of Parallelism Tuning

The purpose of setting `parallel_pipeline_task_num` is to fully utilize multi-core resources and reduce query latency. However, in order to achieve multi-core parallel execution, some data Shuffle operators and multi-thread synchronization logic are usually introduced, which also brings some unnecessary resource waste.

The default value in Doris is 0, which is half of the number of CPU cores of the BE. This value takes into account the resource utilization of single queries and concurrent situations, and usually does not require user intervention for adjustment. When there is a performance bottleneck, the following examples can be referred to for necessary adjustments. Doris is continuously improving the adaptive strategy, and it is usually recommended to make necessary adjustments in specific scenarios or at the SQL level.

### Examples

Suppose the number of CPU cores of the BE is 16:

1. For simple operations on a single table (such as single-table point query, where scan to obtain a small amount of data, limit a small amount of data, hit a materialized view), **the parallelism can be set to 1**.
   Explanation: For simple operations on a single table, there is only one Fragment. The bottleneck of the query is usually in the data scanning and processing. The data scanning thread and the query execution thread are separated. The data scanning thread will adaptively perform parallel scanning. The bottleneck here is not the query thread, so the parallelism can be directly set to 1.
2. For queries with two-table JOIN/aggregate queries, if the data volume is very large and it is confirmed to be a CPU bottleneck query, **the parallelism can be set to 16**.
   Explanation: For two-table JOIN/aggregate queries, which are data computation-intensive queries, if it is observed that the CPU is not fully utilized, consider further increasing the parallelism on the basis of the default value, using the parallel ability of the Pipeline execution engine to fully utilize CPU resources for computation. It cannot be guaranteed that each PipelineTask can use the CPU resources allocated to it to the limit. Therefore, the parallelism can be appropriately adjusted, for example, set to 16, to make more full use of the CPU. However, the parallelism should not be increased indefinitely. Setting it to 48 will not bring substantial benefits, but will increase thread scheduling overhead and framework scheduling overhead.
3. For the stress testing scenario, if the multiple query tasks in the stress test can fully utilize the CPU, consider **setting the parallelism to 1**.
   Explanation: For the stress testing scenario, there are enough query tasks in the stress test. Excessive parallelism also brings thread scheduling overhead and framework scheduling overhead. It is more reasonable to set it to 1 here.
4. For complex queries, it is necessary to flexibly adjust according to the Profile and machine load. Here, it is recommended to use the default value. If it is not appropriate, you can try to adjust it in a stepwise manner of 4-2-1 and observe the query performance and machine load.

## Methods of Parallelism Tuning

Doris can manually specify the parallelism of a query to adjust the parallel execution efficiency when the query is executed.

### SQL Level Adjustment:

Use SQL HINT to specify the parallelism of a single SQL, so that the parallelism of different SQLs can be flexibly controlled to achieve the best execution effect.

```SQL
select /*+SET_VAR("parallel_pipeline_task_num=8")*/ * from nation, lineitem where lineitem.l_suppkey = nation.n_nationkey
select /*+SET_VAR("parallel_pipeline_task_num=8,runtime_filter_mode=global")*/ * from nation, lineitem where lineitem.l_suppkey = nation.n_nationkey
```

### Session Level Adjustment:

Adjust the parallelism at the session level through session variables. All query statements in the session will be executed with the specified parallelism. Please note that even a single-line query SQL will use this parallelism, which may lead to performance degradation.

```SQL
set parallel_pipeline_task_num = 8;
```

### Global Adjustment:

If global adjustment is required, usually involving the adjustment of CPU utilization, the parallelism can be set globally.

```SQL
set global parallel_pipeline_task_num = 8;
```
