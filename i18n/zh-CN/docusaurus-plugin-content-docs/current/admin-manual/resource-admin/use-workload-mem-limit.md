---
{
"title": "使用Workload Group管理内存资源",
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

Adhoc类查询通常输入的SQL不确定，使用的内存资源也不确定，因此存在少数查询占用很大内存的风险。
可以对这类负载可以划分到独立的分组，通过Workload Group对内存的硬限的功能，避免突发性的大查询占满所有内存，导致其他查询没有可用内存或者OOM。
当这个Workload Group的内存使用超过配置的硬限值时，会通过杀死查询的方式释放内存，避免进程内存被打满。

## 测试内存硬限
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


## 使用建议
如上文测试，硬限可以控制Workload Group的内存使用，但却是通过杀死查询的方式释放内存，这对用户来说体验会非常不友好，极端情况下可能会导致所有查询都失败。
因此在生产环境中推荐内存硬限配合查询排队的功能一起使用，可以在限制内存使用的同时保证查询的成功率。