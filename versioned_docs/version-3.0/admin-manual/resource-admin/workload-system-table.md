---
{
"title": "Workload System Table",
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

## Backgroup
Doris supports analyzing the resource usage of running workloads through the Workload system table, commonly used in the following scenarios:
1. View the resource usage of Workload Group in the cluster, including CPU and memory.
2. View the TopN SQL with the highest resource usage in the current cluster.
3. View the queue status of Workload Groups in the cluster

Users can query this information by submitting SQL, identify the Workload Group or SQL with high resource usage in the system, and perform corresponding processing.

## Workload System Table Introduction
At present, the system tables are in database ```information_schema```.
### active_queries
The ```active_queries``` table records the execution information of the current query on FE, and the detailed information of the fields is as follows：
* query_id, query's id
* query_start_time, the start time of the query execution; If query queues, it represents the time when execution starts after the queue ends
* query_time_ms, the query time, in milliseconds
* workload_group_id, workload group's id
* database, sql's database
* frontend_instance, the FE which query is submitted
* queue_start_time, if query queues, it means the time that query begins to queue
* queue_end_time, if query queues, it means the time that query ends to queue
* query_status, query status, it has two value RUNNING and QUEUED, RUNNIG means query is running; QUEUED means query is queued.
* sql, sql content

### backend_active_tasks
A query is usually divided into multiple fragments to be executed on multiple BEs, and ```backend_active_tasks``` table represent the total amount of CPU and memory resources used by a query on a single BE. If this query has multiple concurrency and fragments on a single BE, it will also be summarized into one row of data.
The detailed information of the fields is as follows:
* be_id, BE's id
* fe_host, it represents which FE this query was submitted from
* query_id, query's id
* task_time_ms, query execution time on the current BE, in milliseconds
* task_cpu_time_ms，query cpu time on the current BE, in milliseconds
* scan_rows, the number of rows scanned on the current BE. If multiple tables are scanned, it is the cumulative value of multiple tables
* scan_bytes, the number of bytes scanned on the current BE. If multiple tables are scanned, it is the cumulative value of multiple tables
* be_peak_memory_bytes, the peak memory usage on the current BE, in bytes
* current_used_memory_bytes, the amount of memory currently in use on the BE, in bytes
* shuffle_send_bytes, the number of bytes sent as shuffle clients at the BE
* shuffle_send_rows, the number of rows sent as shuffle clients at the BE

## Basic Usage
1. TopN resource usage sql
    ```
    select 
            t2.query_id,
            t2.workload_group_id,
            t2.`database`,
            t1.cpu_time,
            t1.mem_used,
            t2.`sql`
    from
    (select query_id, sum(task_cpu_time_ms) as cpu_time,sum(current_used_memory_bytes) as mem_used from backend_active_tasks group by query_id) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    order by cpu_time desc, mem_used desc limit 10;
    ```

2. TopN resource usage sql on BE
    ```
    select 
            t2.query_id,
            t2.workload_group_id,
            t2.`database`,
            t1.cpu_time,
            t1.mem_used,
            t2.`sql`
    from
    (select query_id, sum(task_cpu_time_ms) as cpu_time,sum(current_used_memory_bytes) as mem_used 
        from backend_active_tasks where be_id=12345 group by query_id) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    order by cpu_time desc, mem_used desc limit 10;
    ```


3. WorkloadGroup queue details
    ```
    select 
        workload_group_id, 
        sum(case when query_status='QUEUED' then 1 else 0 end) as queue_num, 
        sum(case when query_status='RUNNING' then 1 else 0 end) as running_query_num
    from 
        active_queries
    group by workload_group_id
    ```

4. Query queue time
    ```
    select 
             workload_group_id,
             query_id,
             query_status,
             now() - queue_start_time as queued_time
    from 
         active_queries
    where query_status='queued'
    order by workload_group_id
    ```

## Application scenarios
When the query latency of the cluster increases and the availability decreases, bottleneck points can be identified through the overall monitoring of the cluster:
1. When the CPU resources of BE are fully utilized and the memory usage is not high, it indicates that the main bottleneck should be on the CPU.
2. When the CPU and memory resources of BE are both high, it indicates that the main bottleneck is in memory.
3. When the CPU and memory resource usage of BE is not high, but the IO usage is high, it indicates that the main bottleneck is in IO.
4. The CPU/memory/IO is not high, but there are many queued queries, indicating that the queue parameter configuration is unreasonable. You can try increasing the queue concurrency.

After identifying the bottleneck points of the cluster, the SQL that is currently using more resources can be further analyzed through the workload system table, and then the query can be downgraded.

### Find SQL with the highest CPU usage
1. TopN CPU usage sql
    ```
    select 
            t2.query_id,
            t2.workload_group_id,
            t2.`database`,
            t1.cpu_time,
            t2.`sql`
    from
    (select query_id, sum(task_cpu_time_ms) as cpu_time from backend_active_tasks group by query_id) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id
    order by cpu_time desc limit 10;
    ```

2. Workload group cpu time
    ```
    select 
            t2.workload_group_id,
            sum(t1.cpu_time) cpu_time
    from
    (select query_id, sum(task_cpu_time_ms) as cpu_time from backend_active_tasks group by query_id) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    group by workload_group_id order by cpu_time desc
    ```

If the CPU usage of a single SQL is too high, it can be alleviated by canceling the query.

If SQL with longer CPU time comes from the same workload group, CPU usage can be reduced by lowering the CPU priority of this workload group or lowering the number of scan threads.

### Find SQL with the highest memory usage
1. TopN memory usage sql
    ```
    select 
            t2.query_id,
            t2.workload_group_id,
            t1.mem_used
    from
    (select query_id, sum(current_used_memory_bytes) as mem_used from backend_active_tasks group by query_id) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    order by mem_used desc limit 10;
    ```

2. Workload group memory usage
    ```
    select 
            t2.workload_group_id,
            sum(t1.mem_used) wg_mem_used
    from
    (select query_id, sum(current_used_memory_bytes) as mem_used from backend_active_tasks group by query_id) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    group by t2.workload_group_id order by wg_mem_used desc
    ```

If a single query occupies most of the memory, then killing this query can be used to quickly free up memory.

If a lower priority workload group is using more memory, memory can be released by downgrading this workload group:
1. If the memory configuration is soft limit, it can be modified to hard limit and the memory limit of the workload group can be reduced
2. Reduce the query concurrency of the workload group through its queuing function

### Find queries which scan too much data
At present, Doris does not directly collect indicators of disk IO for queries, but it can indirectly find SQL with heavier scans through the number of scan rows and scan bytes.

1. TopN scan data query
    ```
    select 
            t2.query_id,
            t2.workload_group_id,
            t1.scan_rows,
            t1.scan_bytes
    from
    (select query_id, sum(scan_rows) as scan_rows,sum(scan_bytes) as scan_bytes from backend_active_tasks group by query_id) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    order by scan_rows desc,scan_bytes desc limit 10;
    ```

2. Workload group scan data
    ```
    select 
            t2.workload_group_id,
            sum(t1.scan_rows) as wg_scan_rows,
            sum(t1.scan_bytes) as wg_scan_bytes
    from
    (select query_id, sum(scan_rows) as scan_rows,sum(scan_bytes) as scan_bytes from backend_active_tasks group by query_id) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    group by t2.workload_group_id
    order by wg_scan_rows desc,wg_scan_bytes desc
    ```

If the scan data volume of a single SQL statement is large, then a kill query can be used to check if there will be any relief.

If the scanning data volume of a certain workload group is large, IO can be reduced by lowering the number of scanning threads of the workload group.