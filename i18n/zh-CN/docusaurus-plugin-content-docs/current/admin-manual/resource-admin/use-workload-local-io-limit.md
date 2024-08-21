---
{
"title": "Use Workload Local IO Limit",
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

# 使用Workload Group管理本地IO

OLAP 系统在做ETL或者大的Adhoc 查询时，需要读取大量的数据，Doris 为了加速数据分析过程，内部会使用多线程并行的方式对多个磁盘文件扫描，会产生巨大的磁盘IO，就会对其他的查询（比如报表分析）产生影响。
可以通过Workload Group 对离线的ETL数据处理和在线的报表查询做分组，限制离线数据处理IO带宽的方式，降低它对在线报表分析的影响。

## 测试本地IO硬限
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

## 注意事项
1. 系统表中的LOCAL_SCAN_BYTES_PER_SECOND字段代表的是当前Workload Group在进程粒度的统计汇总值，比如配置了12个文件路径，那么LOCAL_SCAN_BYTES_PER_SECOND就是这12个文件路径IO的最大值，如果期望查看每个文件路径分别的IO吞吐，可以在grafana上或者BE的bvar监控查看明细的值。
2. 由于操作系统和Doris的Page Cache的存在，通过linux的IO监控脚本看到的IO通常要比系统表看到的要小。