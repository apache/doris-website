---
{
   "title": "工作负载分析",
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
Doris支持通过Workload系统表对集群中的工作负载进行分析，可以解决以下问题：
1. 帮助用户了解每个Workload Group的资源利用率，合理的设置资源上限，避免资源的浪费。
2. 当集群由于资源不足导致可用性下降时，可以使用系统表快速定位出目前资源使用的分布情况，从做出相应的资源管控决策，恢复集群的可用性。

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

### workload_group_resource_usage
```workload_group_resource_usage```实时展示了Workload Group当前的资源用量。
字段说明如下：
* be_id，be的id
* workload_group_id，workload group的id
* memory_usage_bytes，workload group的内存用量
* cpu_usage_percent，workload group CPU用量的百分比，计算方式为1s内Workload Group总的CPU活跃时间/1s内总可用的CPU时间，该值取的是最近10s的平均值。
* local_scan_bytes_per_second，workload group读本地文件的每秒字节数。
需要注意的是，由于Doris的Page Cache和操作系统缓存的存在，该值通常要大于使用pidstat等系统工具监控到的值。如果配置了多个文件夹，那么该值为所有文件夹读IO的累加值。
如果需要每个文件夹粒度的读IO吞吐，可以在BE的bvar监控上看到明细数据。
* remote_scan_bytes_per_second，workload group读远程数据的每秒字节数。

## 工作负载分析与处理方法
当通过监控发现集群的可用性下降时，可以按照以下流程进行处理：
1. 先通过监控大致判断目前集群的瓶颈点，比如是内存用量过高，CPU用量过高，还是IO过高，如果都很高，那么可以考虑优先解决内存的问题。
2. 确定了集群瓶颈点之后，可以通过```workload_group_resource_usage```表来查看目前资源用量最高的Group，比如是内存瓶颈，那么可以先找出内存用量最高的N个Group。
3. 确定了资源用量最高的Group之后，首先可以尝试调低这个Group的查询并发，因为此时集群资源已经很紧张了，要避免持续有新的查询进来耗尽集群的资源。
4. 对当前Group的查询进行降级，根据瓶颈点的不同，可以有不同的处理方法：
* 如果是CPU瓶颈，那么可以尝试把这个Group的CPU修改为硬限，并将```cpu_hard_limit```设置为一个较低的值，主动让出CPU资源。
* 如果是IO瓶颈，可以通过```read_bytes_per_second```参数限制该Group的最大IO。
* 如果是内存瓶颈，可以通过设置该Group的内存为硬限，并调低```memory_limit```的值，来释放部分内存，需要注意的是这可能会导致当前Group大量查询失败。
5. 完成以上步骤后，通常集群的可用性会有所恢复。此时可以做更进一步的分析，也就是引起该Group资源用量升高的主要原因，
是这个Group的整体查询并发升高导致的还是某些大查询导致的，如果是某些大查询导致的，那么可以通过快速杀死这些大查询的方式进行故障恢复。
6. 可以使用```backend_active_tasks```结合```active_queries```找出目前集群中资源用量比较异常的SQL，然后通过kill语句杀死这些SQL释放资源。

## 常用SQL
1. 查看目前所有的Workload Group并依次按照内存/CPU/IO降序显示。
```
select be_id,workload_group_id,memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second 
   from workload_group_resource_usage
order by  memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second desc
```

2. CPU使用topN的sql
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

3. 内存使用topN的sql
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

4. 扫描数据量topN的sql
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

5. 各个workload group的scan数据量
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

6. 查看各个workload group排队的都是哪些查询，以及排队的时间
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