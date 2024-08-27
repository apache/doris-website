---
{
"title": "Use Workload Remote IO Limit",
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

# 使用Workload Group管理远程IO

BrokerLoad和S3Load 是常用的大批量数据导入方式，用户可以把数据先上传到HDFS或者S3，然后通过Brokerload和S3Load 对数据进行并行导入。 Doris为了加快导入速度，会使用多线程并行的方式从HDFS/S3拉取数据，此时会对HDFS/S3 产生巨大的压力，会导致HDFS/S3上运行的别的作业不稳定。
可以通过Workload Group 远程IO的限制功能来限制导入过程中对HDFS/S3的带宽，降低对其他业务的影响。

## 测试远程IO限制
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
