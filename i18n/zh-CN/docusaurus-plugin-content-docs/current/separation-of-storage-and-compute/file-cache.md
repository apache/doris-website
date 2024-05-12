---
{
    "title": "存算分离数据缓存",
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

## 概述

存算分离架构下的数据是放在远端存储上的，为了加速对数据的访问，实现了一个基于本地硬盘的缓存。缓存提供了两种管理策略：LRU 策略 和 TTL 策略，对索引相关的数据做了优化，让缓存尽可能 Cache 住用户常用的数据。

在多 Cluster（计算集群）的应用场景，还提供了缓存预热功能。当新建一个计算集群的时候，用户可以让新 计算集群 对指定的数据（表或 Partition）进行预热，以便提高查询效率。

## 缓存空间管理

### 缓存数据

数据进入缓存主要有三种方式。

1. 导入。新导入的数据会异步写到缓存中以加速第一次访问。

2. 查询。如果判断查询的数据不在缓存，会从远端存储读取到内存，并会写到缓存中，以便下一次查询。

3. 主动预热。尽管远端存储的数据可以多集群共享，但缓存并不会共享。当新建一个集群的时候，此时的缓存是空的，这时候可以通过主动去预热，让集群快速地从远端存储拉取想要的数据在本地缓存中。

### 缓存淘汰

缓存同时支持 LRU 和 TTL 两种策略。

1. LRU 是缓存的默认策略，缓存会对该策略的数据维护一个队列，当访问队列中的某一块数据的时候，会把对应的数据移动到 LRU 队列的队首。如果有新写入缓存的数据，也会放在队首，避免过早被淘汰。当数据满的时候，会优先淘汰队列尾部的数据。

2. TTL 策略主要用来确保新导入的数据在缓存中的一段时间内不被淘汰（过期时间是由导入时间 + 超时时间来计算的得出）。TTL 的数据的地位是最高且平等的。最高指当缓存满的时候，会通过淘汰 LRU 队列的数据，来让 TTL 的数据写进缓存中。平等是指所有 TTL 策略的数据并不会因为过期时间有差别而进行淘汰。当 TTL 的数据占满了缓存，之后的新导入的数据（无论有没有设置 TTL）或者从远端存储拉取下来的冷数据，都不会被写进缓存。

3. TTL 策略可以用在希望常驻本地的小表。对于常驻表，可以设置一个比较大的 TTL 值来让它在缓存里的数据不会被其他大表的查询淘汰掉。或者对于动态 Partition 的表，可以根据 Partition 的 Hot Partition 的时间，设置对应的 TTL 值，来让 Hot Partition 不会被 Cold Partition 的查询淘汰掉。目前暂不支持查看 TTL 数据在缓存的占比。

   

### 缓存预热

SelectDB 提供多集群的能力，多个集群共享同一份数据，但不会共享同一份缓存。当创建新的 cluster 的时候，在新的 cluster 的缓存是空的，这时候进行查询数据，会比较慢。这时候可以通过手段预热数据，主动从远端存储的数据拉起到本地缓存。 目前支持三种模式：

- 指定集群 A 的缓存预热到集群 B 。在 SelectDB 中，会定期采集每个集群一段时间内访问过的表或者分区的热点信息，然后作为内部表存储下来。当进行集群间的预热的时候，预热集群会根据源集群的热点信息来对某些表/分区进行预热。
- 指定表 A 数据预热到新集群 。
- 指定表 A 的分区 'p1' 的数据预热到新集群。



## 使用方法

### 设置 TTL 策略

在建表的时候设置对应的 PROPERTY，即可该表的数据使用 TTL 策略缓存下来。

- file_cache_ttl_seconds : 新导入的数据期望在缓存中保持的时间，单位是秒。

  ```sql
  # 设置 TTL 的例子，通过建表时指定对应 property
  CREATE TABLE IF NOT EXISTS customer (
    C_CUSTKEY     INTEGER NOT NULL,
    C_NAME        VARCHAR(25) NOT NULL,
    C_ADDRESS     VARCHAR(40) NOT NULL,
    C_NATIONKEY   INTEGER NOT NULL,
    C_PHONE       CHAR(15) NOT NULL,
    C_ACCTBAL     DECIMAL(15,2)   NOT NULL,
    C_MKTSEGMENT  CHAR(10) NOT NULL,
    C_COMMENT     VARCHAR(117) NOT NULL
  )
  DUPLICATE KEY(C_CUSTKEY, C_NAME)
  DISTRIBUTED BY HASH(C_CUSTKEY) BUCKETS 32
  PROPERTIES(
      "file_cache_ttl_seconds"="300"
  )
  ```



对于上面那张表，该表所有新导入的数据都会在缓存中被保留 300s。目前也支持修改表的 TTL 时间，可以将 TTL 的时间延长或减短。注：修改的值目前暂时不会立刻生效，会有一定时间的延迟。

```sql
ALTER TABLE customer set ("file_cache_ttl_seconds"="3000");
```

如果建表的时候没有设置 TTL，也可以通过 ALTER 语句进行修改。



### 缓存预热
目前支持三种模式：
- 指定 cluster_name0 的缓存预热到 cluster_name1 。
查看当前warehouse下所有cluster的最频繁访问的表。
```
show cache hotspot '/';
+------------------------+-----------------------+----------------------------------------+
| cluster_name           | total_file_cache_size | top_table_name                         |
+------------------------+-----------------------+----------------------------------------+
| cluster_name0          |          751620511367 | regression_test.selectdb_cache_hotspot |
+------------------------+-----------------------+----------------------------------------+
```

查看 cluster_name0 下的所有 table 的最热 partition 信息
```
mysql> show cache hotspot '/cluster_name0';
+-----------------------------------------------------------+---------------------+--------------------+
| table_name                                                | last_access_time    | top_partition_name |
+-----------------------------------------------------------+---------------------+--------------------+
| regression_test.selectdb_cache_hotspot                    | 2023-05-29 12:38:02 | p20230529          |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.customer | 2023-06-06 10:56:12 | customer           |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.nation   | 2023-06-06 10:56:12 | nation             |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.orders   | 2023-06-06 10:56:12 | orders             |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.part     | 2023-06-06 10:56:12 | part               |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.partsupp | 2023-06-06 10:56:12 | partsupp           |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.region   | 2023-06-06 10:56:12 | region             |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.supplier | 2023-06-06 10:56:12 | supplier           |
+-----------------------------------------------------------+---------------------+--------------------+
```

查看 cluster_name0 下的 table regression_test_cloud_load_copy_into_tpch_sf1_p1.customer 的信息
```
show cache hotspot '/cluster_name0/regression_test_cloud_load_copy_into_tpch_sf1_p1.customer';
+----------------+---------------------+
| partition_name | last_access_time    |
+----------------+---------------------+
| supplier       | 2023-06-06 10:56:12 |
+----------------+---------------------+
```

当执行下面这条 SQL，cluster_name1 集群会获取到 cluster_name0 集群的访问信息，来尽可能还原出与 cluster_name0 集群一样的缓存。
```
warm up cluster cluster_name1 with cluster cluster_name0
```
- 指定 customer 数据预热到 cluster_name1。执行下面的 SQL ，可以把该表在远端存储上的数据全拉取到本地。
```
warm up cluster cluster_name1 with table customer
```
- 指定 customer 的 partition 'p1' 的数据预热到 cluster_name1。执行下面的 SQL ，可以把该分区在远端存储上的数据全拉取到本地。
```
warm up cluster cluster_name1 with table customer partition p1
```
以上三条SQL都会返回一个JobID的结果。例如
```
mysql> warm up cluster cloud_warm_up with table test_warm_up;
+-------+
| JobId |
+-------+
| 13418 |
+-------+
1 row in set (0.01 sec)
```
然后通过下面的 SQL 来查看预热进度。
```
SHOW WARM UP JOB; // 获取job信息
SHOW WARM UP JOB WHERE ID = 13418; // 指定job_id
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
| JobId | ClusterName       | Status  | Type  | CreateTime              | FinishBatch | AllBatch | FinishTime |
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
| 13418 | cloud_warm_up     | RUNNING | TABLE | 2023-05-30 20:19:34.059 | 0           | 1        | NULL       |
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
1 row in set (0.02 sec)
```
根据 FinishBatch 和 All Batch 来判断当前任务进度，每个 Batch 约 10GB。
目前一个 cluster 同一时间内只支持执行一个预热的JOB。也可以停止正在进行的预热job

```
mysql> cancel warm up job where id = 13418;
Query OK, 0 rows affected (0.02 sec)

mysql> show warm up job where id = 13418;
+-------+-------------------+-----------+-------+-------------------------+-------------+----------+-------------------------+
| JobId | ClusterName       | Status    | Type  | CreateTime              | FinishBatch | AllBatch | FinishTime              |
+-------+-------------------+-----------+-------+-------------------------+-------------+----------+-------------------------+
| 13418 | cloud_warm_up     | CANCELLED | TABLE | 2023-05-30 20:19:34.059 | 0           | 1        | 2023-05-30 20:27:14.186 |
+-------+-------------------+-----------+-------+-------------------------+-------------+----------+-------------------------+
1 row in set (0.00 sec)
```

## 实践案例

某用户有若干张表，总数据量为 3TB+，缓存只有 1.2TB。其中经常访问的有两张表，其中有一张小表 200 MB，还有一张 100 GB 的表。其他的大表也会每天有流量，但不多，在 LRU 策略下，查询大表有可能淘汰掉需要经常访问的小表的数据，造成性能波动。为了让常驻的表的缓存不被淘汰，通过设置两张表的 TTL 时间，让这两张表的数据常驻在缓存中。对于小表，因为数据量较大，每天变动不大，设置了 TTL 超时 1 年来让他长期在缓存。对于另一张表，用户每天会做一次表的备份，然后再进行全量导入，所以推荐设置了 1 天的 TTL 超时时间。
