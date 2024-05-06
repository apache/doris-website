---
{
"title": "Workload系统表",
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

## 背景
Doris支持通过Workload系统表对运行中的工作负载的资源使用情况进行分析，常用于以下场景：

1. 查看集群中Workload Group的资源用量，包括CPU和内存。
2. 查看目前集群中目前资源用量最大的N个sql。
3. 查看集群中Workload Group的排队情况

用户可以通过提交sql的方式查询这些信息，找出目前系统中资源占用比较高的Workload Group或者sql，并进行相应的处理。

## Workload系统表介绍
目前系统表主要在```information_schema```库里。
### active_queries
```active_queries```表记录了当前在FE上查询的执行信息，字段的详细信息如下：
* query_id，查询的id
* query_start_time，查询开始执行的时间；如果查询有排队的话，那么就代表排队结束之后开始执行的时间
* query_time_ms，查询的耗时，单位是毫秒
* workload_group_id，查询使用的workload group的id
* database，查询中的sql使用的database
* frontend_instance，查询所在FE的节点名称
* queue_start_time，如果查询到来时进入了排队了逻辑，那么代表查询排队开始的时间点
* queue_end_time，如果查询到来时进入了排队的逻辑，那么代表查询排队结束的时间点
* query_status，查询目前的状态，目前主要有两个取值RUNNING和QUEUED，RUNNIG代表查询处于运行状态；QUEUED代表当前查询正在排队
* sql，查询的sql文本

### backend_active_tasks
一个查询通常会被分成多个fragment在多个BE上执行，```backend_active_tasks```就代表了一个查询在单个BE上使用的CPU和内存资源的总量。如果这个查询在单BE上有多个并发和多个fragment，那么也会汇总成一行数据。
字段详细信息如下：
* be_id，be的id
* fe_host，代表了这个查询是从哪个FE提交的
* query_id，查询的id
* task_time_ms，查询在当前be上的执行时间，单位是毫秒
* task_cpu_time_ms，查询在be上执行时的cpu时间，单位是毫秒
* scan_rows，查询在当前be上扫描的行数，如果扫描了多个表，那么就是多个表的累加值
* scan_bytes，查询在当前be上扫描的字节数，如果扫描了多个表，那么就是多个表的累加值
* be_peak_memory_bytes，查询在当前be上使用的内存的峰值，单位是字节
* current_used_memory_bytes，查询在当前be上使用中的内存量，单位是字节
* shuffle_send_bytes，查询在当前节点作为shuffle客户端发送的字节数
* shuffle_send_rows，查询在当前节点作为shuffle客户端发送的行数

## 基本用法
1. 查看资源用量topN的sql
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

2. 查看目前单BE上资源用量topN的sql
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


3. 查看各个workload group运行中/排队的查询数量
    ```
    select 
        workload_group_id, 
        sum(case when query_status='QUEUED' then 1 else 0 end) as queue_num, 
        sum(case when query_status='RUNNING' then 1 else 0 end) as running_query_num
    from 
        active_queries
    group by workload_group_id
    ```

4. 查看各个workload group排队的都是哪些查询，以及排队的时间
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

## 应用场景
当集群的查询延迟上升时，可用性下降时，可以通过集群的整体监控确瓶颈点：
1. 当BE的CPU资源用满，内存使用不高，说明主要瓶颈应该在CPU上。
2. 当BE的CPU资源和内存资源使用都很高，说明主要瓶颈在内存上。
3. 当BE的CPU资源和内存资源使用都不高，但是IO使用很高，说明主要瓶颈在IO上。
4. CPU/内存/IO都不高，但是排队的查询较多，说明排队参数配置不合理，可以尝试调大排队并发。
   确认了集群的瓶颈点之后，可以通过workload group系统表进一步分析出目前使用资源较多的sql，然后进行查询的降级处理。

### 找出CPU使用最高的sql
1. CPU使用topN的sql
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

2. 统计workload group的cpu时间
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

如果是单sql的CPU使用率过高，那么可以通过取消查询的方式来缓解。

如果是cpu时间较长的sql都来自于同一个workload group，那么可以通过调低这个workload group的cpu优先级或者调低scan线程的数量来降低cpu的使用。

### 找出内存使用最高的sql
1. 内存使用topN的sql
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

2. 各个workload group的内存用量
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

如果是单个查询占掉了大部分内存，那么可以通过取消这个查询来快速释放内存。

如果有优先级较低的workload group使用了较多的内存，那么可以通过对这个workload group进行降级来释放内存：
1. 如果内存配置的是软限，那么可以修改为硬限，并减小workload group的内存限制
2. 通过workload group的排队功能降低这个workload的查询并发

### 找出扫描数据量过高的查询
目前Doris没有直接收集查询的磁盘IO的指标，不过可以通过扫描数据的行数和字节数进行间接的判断

1. 扫描数据量topN的sql
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

2. 各个workload group的scan数据量
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

如果是单个sql的scan数据量较大，那么可以通过杀死查询的方式查看是否会有缓解

如果是某个workload group的扫描数据量较大，那么可以通过调低workload group的扫描线程数来降低IO