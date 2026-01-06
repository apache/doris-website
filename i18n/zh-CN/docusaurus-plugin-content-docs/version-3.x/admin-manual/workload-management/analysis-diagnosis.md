---
{
    "title": "工作负载分析与诊断",
    "language": "zh-CN",
    "description": "集群的工作负载分析主要分成两个阶段："
}
---

集群的工作负载分析主要分成两个阶段：
- 第一个是运行时的工作负载分析，当集群可用性下降时，可以通过监控发现资源开销比较大的查询，并进行降级处理。
- 第二个是分析历史数据，比如审计日志表等，找出不合理的工作负载，并进行优化。

## 运行时的工作负载分析
当通过监控发现集群的可用性下降时，可以按照以下流程进行处理：
1. 先通过监控大致判断目前集群的瓶颈点，比如是内存用量过高，CPU 用量过高，还是 IO 过高，如果都很高，那么可以考虑优先解决内存的问题。

2. 确定了集群瓶颈点后，可以通过 workload_group_resource_usage 表来查看目前资源用量最高的 Group，比如是内存瓶颈，那么可以先找出内存用量最高的 N 个 Group。

3. 确定了资源用量最高的 Group 之后，首先可以尝试调低这个 Group 的查询并发，因为此时集群资源已经很紧张了，要避免持续有新的查询进来耗尽集群的资源。

4. 对当前 Group 的查询进行降级，根据瓶颈点的不同，可以有不同的处理方法：

    - 如果是 CPU 瓶颈，那么可以尝试把这个 Group 的 CPU 修改为硬限，并将 cpu_hard_limit 设置为一个较低的值，主动让出 CPU 资源。
    
    - 如果是 IO 瓶颈，可以通过 read_bytes_per_second 参数限制该 Group 的最大 IO。

    - 如果是内存瓶颈，可以通过设置该 Group 的内存为硬限，并调低 memory_limit 的值，来释放部分内存，需要注意的是这可能会导致当前 Group 大量查询失败。

5. 完成以上步骤后，通常集群的可用性会有所恢复。此时可以做更进一步的分析，也就是引起该 Group 资源用量升高的主要原因，
   如果是这个 Group 的整体查询并发升高导致的还是某些大查询导致的，如果是某些大查询导致的，那么可以通过快速杀死这些大查询的方式进行故障恢复。

6. 可以使用 backend_active_tasks 结合 active_queries 找出目前集群中资源用量比较异常的 SQL，然后通过 kill 语句杀死这些 SQL 释放资源。

## 通过历史数据分析工作负载
目前 Doris 的审计日志表中留存了 sql 执行时的简要信息，可以用于找出历史上执行过的不合理的查询，然后做出一些调整，具体流程如下：
1. 查看监控确认集群历史的资源用量情况，找出集群的瓶颈点，比如是 CPU，内存还是 IO。
2. 确定了集群的瓶颈点后，可以通过审计日志表找出对应时段资源用量比较异常的 SQL，异常 SQL 有两种定义方式
   
   1. 用户对于集群中 SQL 资源的使用量有一定的预期，比如大部分延迟都是秒级，扫描行数在千万，那么当有扫描行数在亿级别十亿级别的 SQL，就属于异常 SQL，需要人工进行处理
   
   2. 如果用户对于集群中 SQL 资源用量也没有预期，这个时候可以通过百分位函数计算资源用量的方式，找出资源用量比较异常的 SQL。以 CPU 瓶颈为例，可以先计算历史时间段内查询 CPU 时间的 tp50/tp75/tp99/tp999，以该值为正常值，对照当前集群相同时间段内查询 CPU 时间的百分位函数，比如历史时段的 tp999 为 1min，但是当前集群相同时段 CPU 时间的 tp50 就已经是 1min，说明当前时段内相比于历史出现了大量的 CPU 时间在 1min 以上的 sql，那么 CPU 时间大于 1min 的 SQL 就可以定义为异常 SQL。其他指标的异常值的查看也是同理。
3. 对资源用量异常的 SQL 进行优化，比如 SQL 改写，表结构优化，并行度调节等方式降低单 SQL 的资源用量。
4. 如果通过审计表发现 SQL 的资源用量都比较正常，那么可以通过监控和审计查看当时执行的 SQL 的数量相比于历史时期是否有增加，如果有的话，可以跟上游业务确认对应时间段上游的访问流量是否有增加，从而选择是进行集群扩容还是排队限流操作。

## 常用 SQL

:::tip 提示
需要注意的是，active_queries 表记录了在 FE 运行的 query，backend_active_tasks 记录了在 BE 运行的 query，并非所有 query 运行时在 FE 注册，比如 stream load 就并未在 FE 注册。
因此使用 backend_active_tasks 表 left join active_queries 如果没有匹配的结果属于正常情况。
当一个 Query 是 select 查询时，那么 active_queries 和 backend_active_tasks 中记录的 queryId 是一致的。当一个 Query 是 stream load 时，那么在 active_queries 表中的 queryId 为空，backend_active_tasks 的 queryId 是该 stream load 的 Id。
:::

1. 查看目前所有的 Workload Group 并依次按照内存/CPU/IO 降序显示。

    ```sql
    select be_id,workload_group_id,memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second 
    from workload_group_resource_usage
    order by  memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second desc
    ```

2. CPU 使用 topN 的 sql
    
    ```sql
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

3. 内存使用 topN 的 sql

    ```sql
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

4. 扫描数据量 topN 的 sql

    ```sql
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

5. 各个 workload group 的 scan 数据量

    ```sql
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

6. 查看各个 workload group 排队的都是哪些查询，以及排队的时间

    ```sql
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