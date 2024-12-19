---
{
"title": "Workload Group 最佳实践",
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

## 测试内存硬限
Adhoc 类查询通常输入的 SQL 不确定，使用的内存资源也不确定，因此存在少数查询占用很大内存的风险。
可以对这类负载可以划分到独立的分组，通过 Workload Group 对内存的硬限的功能，避免突发性的大查询占满所有内存，导致其他查询没有可用内存或者 OOM。
当这个 Workload Group 的内存使用超过配置的硬限值时，会通过杀死查询的方式释放内存，避免进程内存被打满。

### 测试环境
1FE，1BE，BE 配置为 96 核，内存大小为 375G。

测试数据集为 clickbench，测试方法为使用 jmeter 起三并发执行 q29。

### 测试不开启 Workload Group 的内存硬限

1. 查看进程使用内存。ps 命令输出第四列代表进程使用的物理内存的用量，单位为 kb，可以看到当前测试负载下，进程的内存使用为 7.7G 左右。

    ```sql
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 7896792
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 7929692
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 8101232
    ```

2. 使用 Doris 系统表查看当前 Workload Group 的内存用量，Workload Group 的内存用量为 5.8G 左右。

    ```sql
    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +-------------------+
    | wg_mem_used_mb    |
    +-------------------+
    | 5797.524360656738 |
    +-------------------+
    1 row in set (0.01 sec)

    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +-------------------+
    | wg_mem_used_mb    |
    +-------------------+
    | 5840.246627807617 |
    +-------------------+
    1 row in set (0.02 sec)

    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +-------------------+
    | wg_mem_used_mb    |
    +-------------------+
    | 5878.394917488098 |
    +-------------------+
    1 row in set (0.02 sec)
    ```
    
这里可以看到进程的内存使用通常要远大于一个 Workload Group 的内存用量，即使进程内只有一个 Workload Group 在跑，这是因为 Workload Group 只统计了查询和部分导入的内存，进程内的其他组件比如元数据，各种 Cache 的内存是不计算 Workload Group 内的，也不由 Workload Group 管理。

### 测试开启 Workload Group 的内存硬限
1. 执行 SQL 命令修改内存配置。
    
    ```sql
    alter workload group g2 properties('memory_limit'='0.5%');
    alter workload group g2 properties('enable_memory_overcommit'='false');
    ```

2. 执行同样的测试，查看系统表的内存用量，内存用量为 1.5G 左右。

    ```sql
    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 1575.3877239227295 |
    +--------------------+
    1 row in set (0.02 sec)

    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +------------------+
    | wg_mem_used_mb   |
    +------------------+
    | 1668.77405834198 |
    +------------------+
    1 row in set (0.01 sec)

    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 499.96760272979736 |
    +--------------------+
    1 row in set (0.01 sec)
    ```

3. 使用 ps 命令查看进程的内存用量，内存用量为 3.8G 左右。

    ```sql
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4071364
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4059012
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4057068
    ```

4. 同时客户端会观察到大量由于内存不足导致的查询失败。

    ```sql
    1724074250162,14126,1c_sql,HY000 1105,"java.sql.SQLException: errCode = 2, detailMessage = (127.0.0.1)[MEM_LIMIT_EXCEEDED]GC wg for hard limit, wg id:11201, name:g2, used:1.71 GB, limit:1.69 GB, backend:10.16.10.8. cancel top memory used tracker <Query#Id=4a0689936c444ac8-a0d01a50b944f6e7> consumption 1.71 GB. details:process memory used 3.01 GB exceed soft limit 304.41 GB or sys available memory 101.16 GB less than warning water mark 12.80 GB., Execute again after enough memory, details see be.INFO.",并发 1-3,text,false,,444,0,3,3,null,0,0,0
    ```

这个报错信息中可以看到，Workload Group 使用了 1.7G 的内存，但是 Workload Group 的限制是 1.69G，这里的计算方式是这样的 1.69G = 物理机内存 (375) * mem_limit(be.conf 中的值，默认为 0.9) * 0.5%（Workload Group 的配置）
也就是说，Workload Group 中配置的内存百分比是基于 Doris 进程可用内存再次进行计算的。


### 使用建议
如上文测试，硬限可以控制 Workload Group 的内存使用，但却是通过杀死查询的方式释放内存，这对用户来说体验会非常不友好，极端情况下可能会导致所有查询都失败。
因此在生产环境中推荐内存硬限配合查询排队的功能一起使用，可以在限制内存使用的同时保证查询的成功率。



## CPU 硬限测试
Doris 的负载大体可以分为三类：
1. 核心报表查询，通常给公司高层查看报表使用，负载不一定很高，但是对可用性要求较高，这类查询可以划分到一个分组，配置较高优先级的软限，保证 CPU 资源不够时可以获得更多的 CPU 资源。
2. Adhoc 类查询，这类查询通常偏探索分析，SQL 比较随机，具体的资源用量也比较未知，优先级通常不高。因此可以使用 CPU 硬限进行管理，并配置较低的值，避免占用过多 CPU 资源降低集群可用性。
3. ETL 类查询，这类查询的 SQL 比较固定，资源用量通常也比较稳定，偶尔会出现上游数据量增长导致资源用量暴涨的情况，因此可以使用 CPU 硬限进行配置。

不同的负载对 CPU 的消耗不一样，用户对响应延时的需求也不一样。当 BE 的 CPU 被用的很满时，可用性会变差，响应延时会变高。比如可能一个 Adhoc 的分析类查询把整个集群的 CPU 打满，导致核心报表的延时变大，影响到了 SLA。所以需要 CPU 隔离机制来对不同的业务进行隔离，保障集群的可用性和 SLA。
Workload Group 支持 CPU 的软限和硬限，目前比较推荐在线上环境把 Workload Group 配置成硬限。原因是 CPU 的软限通常在 CPU 被打满时才能体现出优先级的作用，但是在 CPU 被用满时，Doris 的内部组件（例如 rpc 组件）以及操作系统可用的 CPU 会减少，此时集群整体的可用性是下降比较严重的，因此生产环境通常需要避免 CPU 资源被打满的情况，当然其他资源也一样，内存资源同理。


### 测试环境
1FE，1BE，96 核机器。
数据集为 clickbench，测试 sql 为 q29。

### 测试
1. 使用 jmeter 发起 3 并发查询，把 BE 进程的 CPU 使用压到比较高的使用率，这里测试的机器是 96 核，使用 top 命令看到 BE 进程 CPU 使用率为 7600% 的含义是该进程目前使用中的核数是 76 个。

    ![use workload group cpu](/images/workload-management/use_wg_cpu_1.png)

2. 修改使用中的 Workload Group 的 CPU 硬限为 10%。
    
    ```sql
    alter workload group g2 properties('cpu_hard_limit'='10%');
    ```

3. 集群开启硬限模式，此时集群中所有 Group 都会切换为硬限。

    ```sql
    ADMIN SET FRONTEND CONFIG ("enable_cpu_hard_limit" = "true");
    ```

4. 重新压测查询负载，可以看到当前进程只能使用 9 到 10 个核，占总核数的 10% 左右。

    ![use workload group cpu](/images/workload-management/use_wg_cpu_2.png)

需要注意的是，这里的测试最好使用查询负载会比较能体现出效果，因为如果是高吞吐导入的话，可能会触发 Compaction，使得实际观测的值要比 Workload Group 配置的值大。而 Compaction 的负载目前是没有归入 Workload Group 的管理的。

5. 除了使用 Linux 的系统命令外，还可以通过使用 Doris 的系统表观察 Group 目前的 CPU 使用为 10% 左右。

    ```sql
    mysql [information_schema]>select CPU_USAGE_PERCENT from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +-------------------+
    | CPU_USAGE_PERCENT |
    +-------------------+
    |              9.57 |
    +-------------------+
    1 row in set (0.02 sec)
    ```

### 注意事项
1. 在实际配置的时候，所有 Group 的 CPU 累加值最好不要正好等于 100%，这主要是为了保证低延迟场景的可用性。因为需要让出一部分资源给其他组件使用。当然如果对延迟不是很敏感的场景，期望最高的资源利用率，那么可以考虑所有 Group 的 CPU 累加值配置等于 100%。
2. 目前 FE 向 BE 同步 Workload Group 元数据的时间间隔为 30 秒，因此对于 Workload Group 的变更最大需要等待 30 秒才能生效。


## 测试本地 IO 硬限
OLAP 系统在做 ETL 或者大的 Adhoc 查询时，需要读取大量的数据，Doris 为了加速数据分析过程，内部会使用多线程并行的方式对多个磁盘文件扫描，会产生巨大的磁盘 IO，就会对其他的查询（比如报表分析）产生影响。
可以通过 Workload Group 对离线的 ETL 数据处理和在线的报表查询做分组，限制离线数据处理 IO 带宽的方式，降低它对在线报表分析的影响。

### 测试环境
1FE,1BE, 配置为 96 核。

测试数据集为 clickbench。

### 不开启 IO 硬限测试
1. 关闭缓存。

    ```sql
    // 清空操作系统缓存
    sync; echo 3 > /proc/sys/vm/drop_caches

    // 禁用 BE 的 page cache
    disable_storage_page_cache = true
    ```

2. 对 clickbench 的表执行全表扫描，执行单并发查询即可。

    ```sql
    set dry_run_query = true;
    select * from hits.hits;
    ```

3. 通过 Doris 的内表查看当前 Group 的最大吞吐为 3GB 每秒。

    ```sql
    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 1146.6208400726318 |
    +--------------------+
    1 row in set (0.03 sec)

    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 3496.2762966156006 |
    +--------------------+
    1 row in set (0.04 sec)

    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 2192.7690029144287 |
    +--------------------+
    1 row in set (0.02 sec)
    ```

4. 使用 pidstat 命令查看进程 IO，图中第一列是进程 id，第二列是读 IO 的吞吐（单位是 kb/s）。可以看到不限制 IO 时，最大吞吐为 2G 每秒。

    ![use workload group io](/images/workload-management/use_wg_io_1.png)


### 开启 IO 硬限后测试
1. 关闭缓存。

    ```sql
    // 清空操作系统缓存
    sync; echo 3 > /proc/sys/vm/drop_caches

    // 禁用 BE 的 page cache
    disable_storage_page_cache = true
    ```

2. 修改 Workload Group 的配置，限制每秒最大吞吐为 100M。

    ```sql
    // 限制当前 Group 的读吞吐为每秒 100M
    alter workload group g2 properties('read_bytes_per_second'='104857600');
    ```

3. 使用 Doris 系统表查看 Workload Group 的最大 IO 吞吐为每秒 98M。

    ```sql
    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 97.94296646118164  |
    +--------------------+
    1 row in set (0.03 sec)

    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.37584781646729  |
    +--------------------+
    1 row in set (0.04 sec)

    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.06641292572021  |
    +--------------------+
    1 row in set (0.02 sec)
    ```

4. 使用 pid 工具查看进程最大 IO 吞吐为每秒 131M。

    ![use workload group io](/images/workload-management/use_wg_io_2.png)

### 注意事项
1. 系统表中的 LOCAL_SCAN_BYTES_PER_SECOND 字段代表的是当前 Workload Group 在进程粒度的统计汇总值，比如配置了 12 个文件路径，那么 LOCAL_SCAN_BYTES_PER_SECOND 就是这 12 个文件路径 IO 的最大值，如果期望查看每个文件路径分别的 IO 吞吐，可以在 grafana 上或者 BE 的 bvar 监控查看明细的值。

2. 由于操作系统和 Doris 的 Page Cache 的存在，通过 linux 的 IO 监控脚本看到的 IO 通常要比系统表看到的要小。


## 测试远程 IO 限制
BrokerLoad 和 S3Load 是常用的大批量数据导入方式，用户可以把数据先上传到 HDFS 或者 S3，然后通过 Brokerload 和 S3Load 对数据进行并行导入。Doris 为了加快导入速度，会使用多线程并行的方式从 HDFS/S3 拉取数据，此时会对 HDFS/S3 产生巨大的压力，会导致 HDFS/S3 上运行的别的作业不稳定。
可以通过 Workload Group 远程 IO 的限制功能来限制导入过程中对 HDFS/S3 的带宽，降低对其他业务的影响。


### 测试环境
1FE，1BE 部署在同一台机器，配置为 16 核 64G 内存。测试数据为 clickbench 数据集，测试前需要把数据集上传到 S3 上。考虑到上传时间的问题，我们只取其中的 1 千万行数据上传，然后使用 tvf 的功能查询 s3 的数据。

上传成功后可以使用命令查看 Schema 信息。

    ```sql
    // 查看schema
    DESC FUNCTION s3 (
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key"= "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style"="true"
    );
    ```

### 测试不限制远程读的 IO
1. 发起单并发测试，全表扫描 clickbench 表。

    ```sql
    // 设置只 scan 数据，不返回结果
    set dry_run_query = true;

    // 使用 tvf 查询 s3 的数据
    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key"= "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style"="true"
    );
    ```

2. 使用系统表查看此时的远程 IO 吞吐。可以看到这个查询的远程 IO 吞吐为 837M 每秒，需要注意的是，这里的实际 IO 吞吐受环境影响较大，如果 BE 所在的机器连接外部存储的带宽比较低，那么可能实际的吞吐会小。

    ```sql
    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     837 |
    +---------+
    1 row in set (0.104 sec)

    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.070 sec)

    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.186 sec)
    ```

3. 使用 sar(sar -n DEV 1 3600) 命令查看机器的网络带宽，可以看到机器级别最大网络带宽为 1033M 每秒。
   输出的第一列为当前机器某个网卡每秒接收的字节数，单位为 KB 每秒。

    ![use workload group rio](/images/workload-management/use_wg_rio_1.png)

### 测试限制远程读的 IO
1. 修改 Workload Group 的配置，限制远程读的 IO 吞吐为 100M 每秒。

    ```sql
    alter workload group normal properties('remote_read_bytes_per_second'='104857600');
    ```

2. 发起单并发扫全表的查询。

    ```sql
    // 设置只 scan 数据，不返回结果
    set dry_run_query = true;

    // 使用 tvf 查询 s3 的数据
    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key"= "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style"="true"
    );
    ```

3. 使用系统表查看此时的远程读 IO 吞吐，此时的 IO 吞吐在 100M 左右，会有一定的波动，这个波动是受目前算法设计的影响，通常会有一个高峰，但不会持续很长时间，属于正常情况。

    ```sql
    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |      56 |
    +---------+
    1 row in set (0.010 sec)

    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     131 |
    +---------+
    1 row in set (0.009 sec)

    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     111 |
    +---------+
    1 row in set (0.009 sec)
    ```

4. 使用 sar 命令（sar -n DEV 1 3600）查看目前的网卡接收流量，第一列为每秒接收的数据量，可以看到最大值变成了 207M 每秒，说明读 IO 的限制是生效的，但是由于 sar 命令看到的是机器级别的流量，因此要比 Doris 统计到的会大一些。

    ![use workload group rio](/images/workload-management/use_wg_rio_2.png)