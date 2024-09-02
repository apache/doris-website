---
{
   "title": "Workload Analysis",
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

Doris supports analyzing workloads in the cluster through the Workload system tables, addressing the following issues:
1. It helps users understand the resource utilization of each Workload Group, allowing for reasonable setting of resource limits to avoid waste.
2. When cluster availability decreases due to insufficient resources, the system tables can be used to quickly identify the current resource usage distribution, enabling the formulation of appropriate resource management decisions to restore cluster availability.

## Workload Table
All tables are in the database```information_schema```.
### active_queries
```active_queries``` records quereis in FE:
* query_id, query's id
* query_start_time, the time when the query starts executing; if the query was queued, it represents the time when execution begins after the queuing ends.
* query_time_ms, the duration of the query, measured in milliseconds.
* workload_group_id, the ID of the workload group used by the query.
* database, the database used by the SQL query.
* frontend_instance, the node name of the FE where the query is located.
* queue_start_time, if the query enters the queuing logic upon arrival, it represents the time point when the query started queuing.
* queue_end_time, if the query enters the queuing logic upon arrival, it represents the time point when the query finishes queuing.
* query_status, the current status of the query, which mainly has two values: RUNNING and QUEUED. RUNNING indicates that the query is currently running, while QUEUED means that the query is currently in the queue.
* sql, sql content.

### backend_active_tasks
A query is typically divided into multiple fragments and executed on multiple BEs. The backend_active_tasks represents the total amount of CPU and memory resources used by a query on a single BE. If the query has multiple concurrent fragments on a single BE, the data will be aggregated into a single row.
Detailed information about the fields is as follows:
* be_id, backend id.
* fe_host, Represents which FE the query was submitted from.
* query_id, query's id.
* task_time_ms, query running time in BE, measured in milliseconds.
* task_cpu_time_ms, CPU time of the query while executing on the BE, measured in milliseconds.
* scan_rows, the number of rows scanned by the query on the current BE. If multiple tables are scanned, this value is the sum of rows scanned across all those tables.
* scan_bytes, the number of bytes scanned by the query on the current BE. If multiple tables are scanned, this value is the sum of bytes scanned across all those tables.
* be_peak_memory_bytes, the peak memory usage of the query on the current BE, measured in bytes.
* current_used_memory_bytes, the amount of memory currently used by the query on the current BE, measured in bytes.
* shuffle_send_bytes, the number of bytes sent by the query as a shuffle client on the current node.
* shuffle_send_rows, the number of rows sent by the query as a shuffle client on the current node.

### workload_group_resource_usage
```workload_group_resource_usage```table provides real-time information on the current resource usage of Workload Groups. 
The field descriptions are as follows: 
* be_id, backend's i.
* workload_group_id, workload group's id.
* memory_usage_bytes, workload group's memory usage.
* cpu_usage_percent, the percentage of CPU usage by the Workload Group, calculated as the total CPU active time of the Workload Group in 1 second divided by the total available CPU time in 1 second. This value is the average over the last 10 seconds.
* local_scan_bytes_per_second, the number of bytes read per second by the Workload Group from local files. Note that due to Doris's Page Cache and operating system cache, this value is typically higher than what is monitored using system tools like pidstat. If multiple directories are configured, this value is the sum of I/O reads from all directories. For per-directory read I/O throughput, detailed data can be found in BE's bvar monitoring.
* remote_scan_bytes_per_second, the number of bytes read per second by the Workload Group from remote data.

## Workload Analysis and Handling Methods

When monitoring indicates a decrease in cluster availability, you can follow these steps to address the issue:

1. Identify the Bottleneck: First, use monitoring to roughly determine the current bottleneck in the cluster, such as high memory usage, high CPU usage, or high I/O. If all are high, prioritize resolving memory issues.
2. Examine Resource Usage: After identifying the cluster bottleneck, use the workload_group_resource_usage table to identify the Workload Groups with the highest resource usage. For example, if memory is the bottleneck, find the top N groups with the highest memory usage.
3. Reduce Query Concurrency: Once you have identified the groups with the highest resource usage, try reducing the query concurrency for these groups. Since cluster resources are already tight, avoid allowing new queries to exhaust the cluster's resources.
4. Degrade Queries: Apply degradation to the queries in the current group based on the type of bottleneck:
* For CPU Bottleneck: Set the group's CPU to a hard limit and adjust cpu_hard_limit to a lower value to proactively release CPU resources.
* For I/O Bottleneck: Limit the group's maximum I/O using the read_bytes_per_second parameter.
* For Memory Bottleneck: Set the group's memory to a hard limit and reduce the memory_limit value to free up some memory. Be aware that this may cause many queries in the group to fail.
5. Further Analysis: After completing the above steps, the cluster’s availability should improve. Conduct further analysis to determine whether the increase in resource usage is due to higher overall query concurrency in the group or specific large queries. If specific large queries are causing the issue, quickly killing these large queries can help recover the system.
6. Kill Abnormal Queries: Use backend_active_tasks in conjunction with active_queries to identify SQL queries with abnormal resource usage in the cluster. Then, use the KILL statement to terminate these queries and free up resources.

## Commonly Used SQL
:::tip
Note that the active_queries table records queries running on the FE, while the backend_active_tasks table records queries running on the BE. Not all queries are registered with the FE during execution; for example, stream loads are not registered with the FE. Therefore, it is normal to get no matching results when performing a LEFT JOIN between backend_active_tasks and active_queries.

When a query is a SELECT query, the queryId recorded in both active_queries and backend_active_tasks is the same. When a query is a stream load, the queryId in the active_queries table is empty, while the queryId in backend_active_tasks is the ID of the stream load.
:::

1. View all current Workload Groups and display them in descending order of memory/CPU/I/O usage.
```
select be_id,workload_group_id,memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second 
   from workload_group_resource_usage
order by  memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second desc
```

2. Cpu usage TopN Sql.
    ```
    select 
            t1.query_id as be_query_id,
            t1.query_type,
            t2.query_id,
            t2.workload_group_id,
            t2.`database`,
            t1.cpu_time,
            t2.`sql`
    from
    (select query_id, query_type,sum(task_cpu_time_ms) as cpu_time from backend_active_tasks group by query_id, query_type) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id
    order by cpu_time desc limit 10;
    ```

3. Memory usage TopN Sql.
    ```
    select 
            t1.query_id as be_query_id,
            t1.query_type,
            t2.query_id,
            t2.workload_group_id,
            t1.mem_used
    from
    (select query_id, query_type, sum(current_used_memory_bytes) as mem_used from backend_active_tasks group by query_id, query_type) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    order by mem_used desc limit 10;
    ```

4. Scan bytes/rows TopN Sql.
    ```
    select 
            t1.query_id as be_query_id,
            t1.query_type,
            t2.query_id,
            t2.workload_group_id,
            t1.scan_rows,
            t1.scan_bytes
    from
    (select query_id, query_type, sum(scan_rows) as scan_rows,sum(scan_bytes) as scan_bytes from backend_active_tasks group by query_id,query_type) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    order by scan_rows desc,scan_bytes desc limit 10;
    ```

5. Show workload group's scan rows/bytes.
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

6. Show workload group's query queue details.
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