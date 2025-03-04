# Parallelism Tuning

## Overview

Doris queries are executed in an MPP (Massively Parallel Processing) framework, where each query is executed in parallel across multiple BEs (Backend Executors). Meanwhile, within a single BE, a multi-threaded parallel approach is adopted to enhance query execution efficiency. Currently, all types of statements, including queries, DML (Data Manipulation Language), and DDL (Data Definition Language), support parallel execution.

The control parameter for parallelism within a single BE is `parallel_pipeline_task_num`, which refers to the number of working tasks used by a single Fragment during execution. In actual production scenarios, performance issues may arise due to improper parallelism settings. The following examples illustrate cases of optimizing parallelism.

## Principles of Parallelism Tuning

The purpose of setting `parallel_pipeline_task_num` is to fully utilize multi-core resources and reduce query latency. However, to enable multi-core parallel execution, some data shuffle operators and synchronization logic between multiple threads are usually introduced, which may also lead to unnecessary resource wastage.

The default value in Doris is 0, which is half the number of CPU cores of the BE. This value takes into account the resource utilization of both single queries and concurrent operations, and usually does not require user intervention for adjustment. When there is a performance bottleneck, refer to the following examples for necessary adjustments. Doris is continuously improving its adaptive strategy, and it is usually recommended to make necessary adjustments in specific scenarios or at the SQL level.

### Examples

Suppose the BE has 16 CPU cores:

1. For simple operations on a single table (such as single-table point queries, `WHERE` clause scans to retrieve a small amount of data, `LIMIT` a small amount of data, or hitting a materialized view), **the parallelism can be set to 1**.
   Explanation: Simple operations on a single table involve only one Fragment. The bottleneck of such queries usually lies in data scanning and processing. The data scanning thread and the query execution thread are separated, and the data scanning thread will perform parallel scanning adaptively. Here, the bottleneck is not the query thread, so the parallelism can be directly set to 1.
2. For queries involving two-table `JOIN` or aggregation queries, if the data volume is large and it is confirmed to be a CPU-bound query, **the parallelism can be set to 16**.
   Explanation: For two-table `JOIN` or aggregation queries, which are data computation-intensive queries, if the CPU is not fully utilized, consider increasing the parallelism on the basis of the default value to take advantage of the parallel capabilities of the Pipeline execution engine and fully utilize CPU resources for computation. It cannot be guaranteed that each PipelineTask can utilize the allocated CPU resources to the fullest. Therefore, the parallelism can be adjusted appropriately, for example, set to 16, to make better use of the CPU. However, the parallelism should not be increased indefinitely. Setting it to 48 will not bring substantial benefits and will instead increase thread scheduling overhead and framework scheduling overhead.
3. In a stress testing scenario, where the multiple queries in the stress test can fully utilize the CPU, **the parallelism can be set to 1**.
   Explanation: In a stress testing scenario, there are sufficient query tasks. Excessive parallelism also brings thread scheduling overhead and framework scheduling overhead. Setting it to 1 is more reasonable in this case.
4. For complex queries, the parallelism should be adjusted flexibly based on the Profile and machine load. Here, it is recommended to use the default value. If it is not suitable, a stepwise adjustment of 4-2-1 can be tried, and the query performance and machine load should be observed.

## Methods of Parallelism Tuning

Doris allows users to manually specify the parallelism of a query to adjust the parallel execution efficiency during query execution.

### SQL Level Adjustment:

Use SQL HINT to specify the parallelism of a single SQL statement. This allows for flexible control of the parallelism of different SQL statements to achieve the best execution results.

```sql
select /*SET_VAR("parallel_pipeline_task_num=8")*/ * from nation, lineitem where lineitem.l_suppkey = nation.n_nationkey
```

### Session Level Adjustment:

Adjust the parallelism at the session level through session variables. All query statements in the session will be executed with the specified parallelism. Please note that even single-line SQL queries will use this parallelism, which may lead to performance degradation.

```SQL
set parallel_pipeline_task_num = 8;
```

### Global Adjustment:

If global adjustment is required, usually involving CPU utilization adjustment, the parallelism can be set globally.

```SQL
set global parallel_pipeline_task_num = 8;
```

## Case 1: High Parallelism Leading to High CPU Usage in a High-Concurrency Pressure Scenario

When observing high CPU usage online, which affects the performance of some low-latency queries, consider adjusting the query parallelism to reduce CPU usage. Since Doris's design philosophy is to prioritize using more resources to obtain query results as quickly as possible, in some scenarios with tight online resources, this may lead to poor performance. Therefore, appropriate adjustment of parallelism can improve the overall stability and efficiency of queries under limited resources.

Set the parallelism from the default value of 0 (half the number of CPU cores) to 4:

```SQL
set global parallel_pipeline_task_num = 4;
```

After the global setting, it takes effect for the current connection and new connections. Existing other connections are not affected. If immediate global effect is required, the FE (Frontend) can be restarted. After the adjustment, the CPU usage is reduced to 60% of the previous peak value, reducing the impact on some low-latency queries.

## Case 2: Increasing Parallelism to Further Utilize the CPU for Query Acceleration

The current default parallelism in Doris is half the number of CPU cores, and some computation-intensive scenarios cannot fully utilize the CPU for query acceleration.

```SQL
select sum(if(t2.value is null, 0, 1)) exist_value, sum(if(t2.value is null, 1, 0)) no_exist_value
from  t1 left join  t2 on t1.key = t2.key;
```

In a scenario with 2 billion rows in the left table and 5 million rows in the right table, the above SQL takes 28 seconds to execute. Observe the Profile:

```SQL
HASH_JOIN_OPERATOR (id=3, nereids_id=448):
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
                - MemoryUsage: sum, avg, max, min 
                  - PeakMemoryUsage: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
                  - ProbeKeyArena: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
                - OpenTime: avg 2.967us, max 4.120us, min 1.562us
                - ProbeRows: sum 1.4662330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
                - ProjectionTime: avg 165.392ms, max 169.762ms, min 161.727ms
                - RowsProduced: sum 1.462330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
```

The main time-consuming part here: `ExecTime: avg 26sec153ms, max 26sec261ms, min 26sec33ms` all occurs in the Join operator, and the total amount of data processed: `ProbeRows: sum 1.4662330332B` is 1.4 billion, which is a typical CPU-intensive computation scenario. Observing the machine monitoring, it is found that the CPU resources are not fully utilized, with a CPU utilization rate of 60%. At this time, consider increasing the parallelism to further utilize the idle CPU resources for acceleration.

Set the parallelism as follows:

```SQL
set parallel_pipeline_task_num = 16;
```

The query execution time is reduced from 28 seconds to 19 seconds, and the CPU utilization rate is increased from 60% to 90%.

## Summary

Usually, users do not need to adjust the query parallelism. If adjustment is required, the following points should be noted:

1. It is recommended to start from the CPU utilization. Observe whether it is a CPU bottleneck through the PROFILE tool output and try to make reasonable modifications to the parallelism.
2. Adjusting a single SQL is relatively safe. Try not to make overly aggressive global modifications.