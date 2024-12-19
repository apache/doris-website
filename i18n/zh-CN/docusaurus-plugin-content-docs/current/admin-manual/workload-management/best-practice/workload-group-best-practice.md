---
{
"title": "Workload Group最佳实践",
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
Adhoc类查询通常输入的SQL不确定，使用的内存资源也不确定，因此存在少数查询占用很大内存的风险。
可以对这类负载可以划分到独立的分组，通过Workload Group对内存的硬限的功能，避免突发性的大查询占满所有内存，导致其他查询没有可用内存或者OOM。
当这个Workload Group的内存使用超过配置的硬限值时，会通过杀死查询的方式释放内存，避免进程内存被打满。

### 测试环境
1FE，1BE，BE配置为96核，内存大小为375G。

测试数据集为clickbench，测试方法为使用jmeter起三并发执行q29。

### 测试不开启Workload Group的内存硬限
1. 查看进程使用内存。ps命令输出第四列代表进程使用的物理内存的用量，单位为kb，可以看到当前测试负载下，进程的内存使用为7.7G左右。
```
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7896792
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7929692
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 8101232
```

2. 使用Doris系统表查看当前Workload Group的内存用量，Workload Group的内存用量为5.8G左右。
```
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
这里可以看到进程的内存使用通常要远大于一个Workload Group的内存用量，即使进程内只有一个Workload Group在跑，这是因为Workload Group只统计了查询和部分导入的内存，进程内的其他组件比如元数据，各种Cache的内存是不计算Workload Group内的，也不由Workload Group管理。

### 测试开启Workload Group的内存硬限
1. 执行SQL命令修改内存配置。
```
alter workload group g2 properties('memory_limit'='0.5%');
alter workload group g2 properties('enable_memory_overcommit'='false');
```

2. 执行同样的测试，查看系统表的内存用量，内存用量为1.5G左右。
```
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

3. 使用ps命令查看进程的内存用量，内存用量为3.8G左右。
```
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         1.0 4071364
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         1.0 4059012
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         1.0 4057068
```

4. 同时客户端会观察到大量由于内存不足导致的查询失败。
```
1724074250162,14126,1c_sql,HY000 1105,"java.sql.SQLException: errCode = 2, detailMessage = (127.0.0.1)[MEM_LIMIT_EXCEEDED]GC wg for hard limit, wg id:11201, name:g2, used:1.71 GB, limit:1.69 GB, backend:10.16.10.8. cancel top memory used tracker <Query#Id=4a0689936c444ac8-a0d01a50b944f6e7> consumption 1.71 GB. details:process memory used 3.01 GB exceed soft limit 304.41 GB or sys available memory 101.16 GB less than warning water mark 12.80 GB., Execute again after enough memory, details see be.INFO.",并发 1-3,text,false,,444,0,3,3,null,0,0,0
```
这个报错信息中可以看到，Workload Group使用了1.7G的内存，但是Workload Group的限制是1.69G，这里的计算方式是这样的1.69G = 物理机内存(375) * mem_limit(be.conf中的值，默认为0.9) * 0.5%（Workload Group的配置）
也就是说，Workload Group中配置的内存百分比是基于Doris进程可用内存再次进行计算的。


### 使用建议
如上文测试，硬限可以控制Workload Group的内存使用，但却是通过杀死查询的方式释放内存，这对用户来说体验会非常不友好，极端情况下可能会导致所有查询都失败。
因此在生产环境中推荐内存硬限配合查询排队的功能一起使用，可以在限制内存使用的同时保证查询的成功率。



## CPU硬限测试
Doris 的负载大体可以分为三类：
1. 核心报表查询，通常给公司高层查看报表使用，负载不一定很高，但是对可用性要求较高，这类查询可以划分到一个分组，配置较高优先级的软限，保证CPU资源不够时可以获得更多的CPU资源。
2. Adhoc类查询，这类查询通常偏探索分析，SQL比较随机，具体的资源用量也比较未知，优先级通常不高。因此可以使用CPU硬限进行管理，并配置较低的值，避免占用过多CPU资源降低集群可用性。
3. ETL类查询，这类查询的SQL比较固定，资源用量通常也比较稳定，偶尔会出现上游数据量增长导致资源用量暴涨的情况，因此可以使用CPU硬限进行配置。

不同的负载对CPU的消耗不一样，用户对响应延时的需求也不一样。当BE的CPU 被用的很满时，可用性会变差，响应延时会变高。比如可能一个Adhoc的分析类查询把整个集群的CPU打满，导致核心报表的延时变大，影响到了SLA。所以需要CPU 隔离机制来对不同的业务进行隔离，保障集群的可用性和SLA。
Workload Group支持CPU的软限和硬限，目前比较推荐在线上环境把Workload Group配置成硬限。原因是CPU的软限通常在CPU被打满时才能体现出优先级的作用，但是在CPU被用满时，Doris的内部组件（例如rpc组件）以及操作系统可用的CPU会减少，此时集群整体的可用性是下降比较严重的，因此生产环境通常需要避免CPU资源被打满的情况，当然其他资源也一样，内存资源同理。


### 测试环境
1FE，1BE，96核机器。
数据集为clickbench，测试sql为q29。

### 测试
1. 使用jmeter发起3并发查询，把BE进程的CPU使用压到比较高的使用率，这里测试的机器是96核，使用top命令看到BE进程CPU使用率为7600%的含义是该进程目前使用中的核数是76个。

![use workload group cpu](/images/workload-management/use_wg_cpu_1.png)

2. 修改使用中的Workload Group的CPU硬限为10%。
```
alter workload group g2 properties('cpu_hard_limit'='10%');
```

3. 集群开启硬限模式，此时集群中所有Group都会切换为硬限。
```
ADMIN SET FRONTEND CONFIG ("enable_cpu_hard_limit" = "true");
```

4. 重新压测查询负载，可以看到当前进程只能使用9到10个核，占总核数的10%左右。

![use workload group cpu](/images/workload-management/use_wg_cpu_2.png)

需要注意的是，这里的测试最好使用查询负载会比较能体现出效果，因为如果是高吞吐导入的话，可能会触发Compaction，使得实际观测的值要比Workload Group配置的值大。而Compaction的负载目前是没有归入Workload Group的管理的。

5. 除了使用Linux 的系统命令外，还可以通过使用Doris的系统表观察Group目前的CPU使用为10%左右。
```
mysql [information_schema]>select CPU_USAGE_PERCENT from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
+-------------------+
| CPU_USAGE_PERCENT |
+-------------------+
|              9.57 |
+-------------------+
1 row in set (0.02 sec)
```

### 注意事项
1. 在实际配置的时候，所有Group的CPU累加值最好不要正好等于100%，这主要是为了保证低延迟场景的可用性。因为需要让出一部分资源给其他组件使用。当然如果对延迟不是很敏感的场景，期望最高的资源利用率，那么可以考虑所有Group的CPU累加值配置等于100%。
2. 目前FE向BE同步Workload Group元数据的时间间隔为30秒，因此对于Workload Group的变更最大需要等待30秒才能生效。


## 测试本地IO硬限
OLAP 系统在做ETL或者大的Adhoc 查询时，需要读取大量的数据，Doris 为了加速数据分析过程，内部会使用多线程并行的方式对多个磁盘文件扫描，会产生巨大的磁盘IO，就会对其他的查询（比如报表分析）产生影响。
可以通过Workload Group 对离线的ETL数据处理和在线的报表查询做分组，限制离线数据处理IO带宽的方式，降低它对在线报表分析的影响。

### 测试环境
1FE,1BE, 配置为96核。

测试数据集为clickbench。

### 不开启IO硬限测试
1. 关闭缓存。
```
// 清空操作系统缓存
sync; echo 3 > /proc/sys/vm/drop_caches

// 禁用BE的page cache
disable_storage_page_cache = true
```

2. 对clickbench的表执行全表扫描，执行单并发查询即可。
```
set dry_run_query = true;
select * from hits.hits;
```

3. 通过Doris的内表查看当前Group的最大吞吐为3GB每秒。
```
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

4. 使用pidstat命令查看进程IO，图中第一列是进程id，第二列是读IO的吞吐（单位是kb/s）。可以看到不限制IO时，最大吞吐为2G每秒。

![use workload group io](/images/workload-management/use_wg_io_1.png)


### 开启IO硬限后测试
1. 关闭缓存。
```
// 清空操作系统缓存
sync; echo 3 > /proc/sys/vm/drop_caches

// 禁用BE的page cache
disable_storage_page_cache = true
```

2. 修改Workload Group的配置，限制每秒最大吞吐为100M。
```
// 限制当前Group的读吞吐为每秒100M
alter workload group g2 properties('read_bytes_per_second'='104857600');
```

3. 使用Doris系统表查看Workload Group的最大IO吞吐为每秒98M。
```
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

4. 使用pid工具查看进程最大IO吞吐为每秒131M。

![use workload group io](/images/workload-management/use_wg_io_2.png)

### 注意事项
1. 系统表中的LOCAL_SCAN_BYTES_PER_SECOND字段代表的是当前Workload Group在进程粒度的统计汇总值，比如配置了12个文件路径，那么LOCAL_SCAN_BYTES_PER_SECOND就是这12个文件路径IO的最大值，如果期望查看每个文件路径分别的IO吞吐，可以在grafana上或者BE的bvar监控查看明细的值。
2. 由于操作系统和Doris的Page Cache的存在，通过linux的IO监控脚本看到的IO通常要比系统表看到的要小。


## 测试远程IO限制
BrokerLoad和S3Load 是常用的大批量数据导入方式，用户可以把数据先上传到HDFS或者S3，然后通过Brokerload和S3Load 对数据进行并行导入。 Doris为了加快导入速度，会使用多线程并行的方式从HDFS/S3拉取数据，此时会对HDFS/S3 产生巨大的压力，会导致HDFS/S3上运行的别的作业不稳定。
可以通过Workload Group 远程IO的限制功能来限制导入过程中对HDFS/S3的带宽，降低对其他业务的影响。


### 测试环境
1FE，1BE部署在同一台机器，配置为16核64G内存。测试数据为clickbench数据集，测试前需要把数据集上传到S3上。考虑到上传时间的问题，我们只取其中的1千万行数据上传，然后使用tvf的功能查询s3的数据。

上传成功后可以使用命令查看Schema信息。
```
// 查看schema
DESC FUNCTION s3 (
    "URI" = "https://bucketname/1kw.tsv",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "csv",
    "use_path_style"="true"
);
```

### 测试不限制远程读的IO
1. 发起单并发测试，全表扫描clickbench表。
```
// 设置只scan数据，不返回结果
set dry_run_query = true;

// 使用tvf查询s3的数据
SELECT * FROM s3(
    "URI" = "https://bucketname/1kw.tsv",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "csv",
    "use_path_style"="true"
);
```

2. 使用系统表查看此时的远程IO吞吐。可以看到这个查询的远程IO吞吐为837M每秒，需要注意的是，这里的实际IO吞吐受环境影响较大，如果BE所在的机器连接外部存储的带宽比较低，那么可能实际的吞吐会小。
```
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

3. 使用sar(sar -n DEV 1 3600)命令查看机器的网络带宽，可以看到机器级别最大网络带宽为1033M每秒。
   输出的第一列为当前机器某个网卡每秒接收的字节数，单位为KB每秒。

![use workload group rio](/images/workload-management/use_wg_rio_1.png)

### 测试限制远程读的IO
1. 修改Workload Group的配置，限制远程读的IO吞吐为100M每秒。
```
alter workload group normal properties('remote_read_bytes_per_second'='104857600');
```

2. 发起单并发扫全表的查询。
```
// 设置只scan数据，不返回结果
set dry_run_query = true;

// 使用tvf查询s3的数据
SELECT * FROM s3(
    "URI" = "https://bucketname/1kw.tsv",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "csv",
    "use_path_style"="true"
);
```

3. 使用系统表查看此时的远程读IO吞吐，此时的IO吞吐在100M左右，会有一定的波动，这个波动是受目前算法设计的影响，通常会有一个高峰，但不会持续很长时间，属于正常情况。
```
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

4. 使用sar命令（sar -n DEV 1 3600）查看目前的网卡接收流量，第一列为每秒接收的数据量，可以看到最大值变成了207M每秒，说明读IO的限制是生效的，但是由于sar命令看到的是机器级别的流量，因此要比Doris统计到的会大一些。

![use workload group rio](/images/workload-management/use_wg_rio_2.png)