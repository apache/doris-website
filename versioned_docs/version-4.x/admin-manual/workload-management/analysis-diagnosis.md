---
{
    "title": "Workload Analysis Diagnosis",
    "language": "en",
    "description": "Guide to workload analysis and diagnosis in Doris, covering runtime analysis for resource bottlenecks and historical data analysis through audit logs to optimize cluster performance."
}
---

The workload analysis for clusters is primarily divided into two stages:
- The first stage is runtime workload analysis, when the cluster's availability declines, queries with significant resource consumption can be identified through monitoring and downgraded accordingly.
- The second stage involves analyzing historical data, such as audit logs, to identify unreasonable workloads and optimize them.

## Runtime Workload Analysis
When the cluster's availability decreases, as detected through monitoring, the following process can be followed:
1. Initially, use monitoring to roughly determine the current cluster's bottleneck, such as excessive memory usage, high CPU usage, or high IO. If all are high, it may be advisable to prioritize addressing the memory issue.
2. Once the cluster's bottleneck is identified, the workload_group_resource_usage table can be consulted to find the Group with the highest current resource usage. For example, if there is a memory bottleneck, the top N Groups with the highest memory usage can be identified.
3. After determining the Group with the highest resource usage, the first step can be to reduce the query concurrency for this Group, as cluster resources are already tight at this point, and new queries should be avoided to prevent exhausting cluster resources.
4. Downgrade the queries for the current Group. Depending on the bottleneck, different approaches can be taken:
- If it's a CPU bottleneck, consider setting the Group's CPU to a hard limit and adjusting the cpu_hard_limit to a lower value to voluntarily yield CPU resources.
- For an IO bottleneck, limit the Group's maximum IO through the read_bytes_per_second parameter.
- In case of a memory bottleneck, set the Group's memory to a hard limit and decrease the memory_limit value to release some memory. Note that this may result in numerous query failures within the current Group.
5. After completing the above steps, the cluster's availability usually recovers to some extent. At this point, further analysis can be conducted to determine the primary cause of the increased resource usage in this Group, whether it's due to an overall increase in query concurrency in this Group or specific large queries. If it's caused by specific large queries, these queries can be quickly killed to restore cluster functionality.
6. The backend_active_tasks table can be used in conjunction with active_queries to identify SQL queries with abnormal resource usage in the cluster and then kill these queries using the kill statement to free up resources.

## Workload Analysis Through Historical Data
Currently, Doris's audit logs retain brief information about SQL execution, which can be used to identify unreasonable queries executed in the past and make adjustments. The specific process is as follows:
1. Review monitoring to confirm the cluster's historical resource usage and identify the cluster's bottleneck, whether it's CPU, memory, or IO.
2. Once the cluster's bottleneck is identified, the audit logs can be consulted to find SQL queries with abnormal resource usage during the corresponding period. There are two ways to define abnormal SQL:
   1. If users have certain expectations regarding the resource usage of SQL in the cluster, such as most delays being in seconds and scan row counts in the tens of millions, then SQL queries with scan row counts in the hundreds of millions or billions are considered abnormal and require manual intervention.
   2. If users do not have expectations regarding SQL resource usage in the cluster, percentile functions can be used to calculate resource usage and identify SQL queries with abnormal resource usage. Taking a CPU bottleneck as an example, first calculate the tp50/tp75/tp99/tp999 for query CPU time over a historical period and use these values as normal. Compare these with the percentile functions for query CPU time during the same period in the current cluster. For instance, if the tp999 for the historical period is 1 minute but the tp50 for the current cluster during the same period is already 1 minute, it indicates that there are numerous SQL queries with CPU times exceeding 1 minute compared to historical data. Therefore, SQL queries with CPU times greater than 1 minute can be defined as abnormal. The same logic applies to other metrics.
3. Optimize SQL queries with abnormal resource usage, such as rewriting SQL, optimizing table structures, adjusting parallelism to reduce the resource usage per SQL query.
4. If the audit logs reveal that SQL resource usage is normal, monitoring and auditing can be used to check if the number of SQL queries executed during that time has increased compared to historical periods. If so, confirm with upstream businesses whether there has been an increase in upstream access traffic during the corresponding time periods, and decide whether to scale the cluster or implement queuing and rate limiting.


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