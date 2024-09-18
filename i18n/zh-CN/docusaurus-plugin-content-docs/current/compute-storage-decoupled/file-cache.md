---
{
    "title": "数据缓存",
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

在存算分离架构下，数据存储在远端存储上。为了加速数据访问，Doris 实现了一个基于本地硬盘的缓存机制，并提供两种高效的缓存管理策略：LRU 策略和 TTL 策略，对索引相关的数据进行了优化，旨在最大程度上缓存用户常用数据。

在涉及多计算组（Compute Group）的应用场景中，Doris 提供缓存预热功能。当新计算组建立时，用户可以选择对特定的数据（如表或分区）进行预热，以提高查询效率。

## 缓存类型

File Cache 分为 TTL、LRU 和 Disposable 三种类型，各种操作读取默认会检查所有类型是否可以命中，但是各种操作写入 File Cache 的类型有差异。

| 操作          | 未命中 File Cache 数据进入 File Cache 的类型 | 写入数据进入 File Cache 的类型        | 读取数据使用 Cache |
| ------------- | -------------------------------------- | ---------- | ----------------- |
| 导入          | TTL / LRU (insert into ... from select) | TTL / LRU     | ALL              |
| 查询          | TTL / LRU                                 | N/A        | ALL            |
| schema change | Disposable                             | TTL / LRU     | ALL               |
| compaction    | Disposable                             | TTL / LRU     | ALL               |
| 预热          | N/A                                    | TTL /L LRU     | ALL               |


## 缓存策略

Doris 提供了两种主要的缓存管理策略：LRU（最近最少使用）和 TTL（时间到期）。这些策略旨在优化数据访问效率和缓存使用，确保系统在高负载情况下仍能保持良好的性能。

### LRU 策略

LRU 策略是默认的缓存管理策略。它通过维护一个队列来管理缓存中的数据。当队列中的某块数据被访问时，该数据将被移至队列的前端。新写入缓存的数据同样会被置于队列前端，以避免过早被淘汰。当缓存空间已满时，队列尾部的数据将被优先淘汰。

### TTL 策略

TTL 策略旨在确保新导入的数据在缓存中保留一段时间不被淘汰（过期时间 = 导入时间 + 设定的超时时间）。在 TTL 策略下，数据在缓存中具有最高优先级，且所有 TTL 数据之间互相平等。当缓存已满时，系统会通过淘汰 LRU 队列中的数据来确保 TTL 数据能够写入缓存。

*应用场景*
- TTL 策略适用于期望在本地持久化的小规模数据表。对于常驻表，可以设置较大的 TTL 值，以确保其数据不会因其他大型数据表的查询操作而被过早淘汰。
- 对于采用动态分区策略的数据表，可以根据 Hot Partition 的活跃时间，设定相应的 TTL 值，以保障 Hot Partition 数据在缓存中的留存。

*注意事项*
- 目前，系统不支持直接查看 TTL 数据在缓存中的占比。


## 缓存淘汰

### 淘汰步骤

当 Cache 空间不够用时，Doris 采用如下步骤淘汰各类型 Cache 中的数据，直到释放出足够的空间为止。

1. 淘汰 disposable 和 LRU 中的过期数据，过期数据是指自上次访问以来超过指定有效期的缓存。LRU 和 Disposable 缓存的有效时间分别为：
   - LRU 索引缓存：7 天
   - LRU 普通数据：1 天
   - LRU Disposable（临时数据）：1 小时

2. 如果 `file_cache_enable_evict_from_other_queue_by_size` 开关已打开且当前队列的缓存大小和数量未超限（该限制可通过 `file_cache_path` 进行设置，默认限制为总 File Cache 容量的 85%），则可以强制从 Disposable 类型中淘汰数据。

3. 根据 LRU 策略释放自身的数据。

*注意*

TTL 中的数据过期之后会移动到 LRU，之后按照 LRU 淘汰。

### TTL 淘汰

TTL 类型缓存在缓存管理中具有最高优先级，可以抢占其他缓存的空间，直到剩余空间满足要求。

- 为保证其他类型缓存的生存空间，TTL 的抢占有限制，即 TTL 不能超过总 Cache 容量的 90%（可由 `be` 配置 `max_ttl_cache_ratio` 指定）。如果超过这个限制，将不会淘汰任何其他类型缓存的数据。
- 如果开启了 TTL 自身支持 LRU 淘汰策略的开关（`be` 配置 `enable_ttl_cache_evict_using_lru = true`），则 TTL 可依照 LRU 淘汰自身数据；否则将不会淘汰任何数据，可能导致访问跳过 File Cache 直接访问远端数据，从而影响性能。
- TTL 类型缓存的后台会有线程异步扫描 TTL 的过期时间。如果过期，则将 TTL 降级为 Normal，并依据上述 Normal 淘汰顺序进行删除。

### 删除淘汰

当文件被删除时，其在缓存中的数据也会被淘汰。

## 缓存预热

在存算分离模式下，Doris 支持多计算组部署，各��算组间共享数据但不共享缓存。新计算组创建时，其缓存为空，可能影响查询性能。为此，Doris 提供缓存预热功能，允许用户从远端存储主动拉取数据至本地缓存。该功能支持以下三种模式：

- **计算组间预热**：将计算组 A 的缓存数据预热至计算组 B。Doris 定期收集各计算组在一段时间内被访问的表/分区的热点信息，并根据这些信息选择性地预热某些表/分区。
- **表数据预热**：指定将表 A 的数据预热至新计算组。
- **分区数据预热**：指定将表 A 的分区 `p1` 的数据预热至新计算组。

## 缓存观测

### 热点信息

Doris 每 10 分钟收集各个计算组的缓存热点信息到内部系统表，您可以通过 `SHOW CACHE HOTSPOT '/'` 命令查看热点信息。

### Cache 空间以及命中率

Doris BE 节点通过 `curl {be_ip}:{brpc_port}/vars ( brpc_port 默认为 8060 ) 获取 cache 统计信息，指标项的名称开始为磁盘路径。

磁盘路径 | 指标名称 | 语义 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_cache_size | 当前 file cache 使用大小 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_cache_size | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_disposable_queue_cache_size | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_disposable_queue_element_count | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_disposable_queue_evict_size | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_index_queue_cache_size | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_index_queue_element_count | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_index_queue_evict_size | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_normal_queue_cache_size | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_normal_queue_element_count | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_normal_queue_evict_size | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_total_evict_size | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_ttl_cache_evict_size | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_ttl_cache_lru_queue_element_count | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_ttl_cache_lru_queue_size | 0 |
|/opt/apache/dpris/be/storage/file_cache | file_cache_ttl_cache_size | 0 |

### SQL profile

SQL profile 中 cache 相关的指标在 SegmentIterator 下，包括

| 指标名称                     | 语义      |
|------------------------------|---------|
| BytesScannedFromCache        | 从 File Cache 读取的数据量    |
| BytesScannedFromRemote       | 从远程存储读取的数据量    |
| BytesWriteIntoCache          | 写入 File Cache 的数据量    |
| LocalIOUseTimer              | 读取 File Cache 的耗时     |
| NumLocalIOTotal              | 读取 File Cache 的次数       |
| NumRemoteIOTotal             | 读取远程存储的次数       |
| NumSkipCacheIOTotal          | 从远程存储读取并没有进入 File Cache 的次数       |
| RemoteIOUseTimer             | 读取远程存储的耗时     |
| WriteCacheIOUseTimer         | 写 File Cache 的耗时     |

您可以通过 [查询性能分析](../query/query-analysis/query-analytics) 查看查询性能分析。

## 使用方法

### 设置 TTL 策略

在建表时，设置相应的 PROPERTY，即可将该表的数据使用 TTL 策略进行缓存。

- `file_cache_ttl_seconds` : 新导入的数据期望在缓存中保留的时间，单位为秒。

```shell
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

上表中，所有新导入的数据将在缓存中被保留 300 秒。系统当前支持修改表的 TTL 时间，用户可以根据实际需求将 TTL 的时间延长或减短。

```SQL
ALTER TABLE customer set ("file_cache_ttl_seconds"="3000");
```

:::info 备注

修改后的 TTL 值并不会立即生效，而会存在一定的延迟。

如果在建表时没有设置 TTL，用户同样可以通过执行 ALTER 语句来修改表的 TTL 属性。

:::

### 缓存预热

目前支持三种缓存预热模式：

- 将 `compute_group_name0` 的缓存数据预热到 `compute_group_name1` 。

当执行以下 SQL 时，`compute_group_name1` 计算组会获取 `compute_group_name0` 计算组的访问信息，来尽可能还原出与 `compute_group_name0` 计算组一致的缓存。

```Plain
warm up cluster compute_group_name1 with cluster compute_group_name0
```

查看当前所有计算组中最频繁访问的表。

```Plain
show cache hotspot '/';
+------------------------+-----------------------+----------------------------------------+
| compute_group_name           | total_file_cache_size | top_table_name                         |
+------------------------+-----------------------+----------------------------------------+
| compute_group_name0          |          751620511367 | regression_test.doris_cache_hotspot    |
+------------------------+-----------------------+----------------------------------------+
```

查看 `compute_group_name0` 下的所有表中最频繁访问的 Partition 。

```Plain
mysql> show cache hotspot '/compute_group_name0';
+-----------------------------------------------------------+---------------------+--------------------+
| table_name                                                | last_access_time    | top_partition_name |
+-----------------------------------------------------------+---------------------+--------------------+
| regression_test.doris_cache_hotspot                       | 2023-05-29 12:38:02 | p20230529          |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.customer | 2023-06-06 10:56:12 | customer           |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.nation   | 2023-06-06 10:56:12 | nation             |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.orders   | 2023-06-06 10:56:12 | orders             |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.part     | 2023-06-06 10:56:12 | part               |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.partsupp | 2023-06-06 10:56:12 | partsupp           |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.region   | 2023-06-06 10:56:12 | region             |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.supplier | 2023-06-06 10:56:12 | supplier           |
+-----------------------------------------------------------+---------------------+--------------------+
```

查看 `compute_group_name0` 下，表`regression_test_cloud_load_copy_into_tpch_sf1_p1.customer` 的访问信息。

```Plain
show cache hotspot '/compute_group_name0/regression_test_cloud_load_copy_into_tpch_sf1_p1.customer';
+----------------+---------------------+
| partition_name | last_access_time    |
+----------------+---------------------+
| supplier       | 2023-06-06 10:56:12 |
+----------------+---------------------+
```

- 将表 `customer` 的数据预热到 `compute_group_name1`。执行以下 SQL ，可以将该表在远端存储上的数据全部拉取到本地。

```Plain
warm up cluster compute_group_name1 with table customer
```

- 将表 `customer` 的分区 `p1` 的数据预热到 `compute_group_name1`。执行以下 SQL ，可以将该分区在远端存储上的数据全部拉取到本地。

```Plain
warm up cluster compute_group_name1 with table customer partition p1
```

上述三条缓存预热 SQL 均会返回一个 JobID 结果。例如：

```Plain
mysql> warm up cluster cloud_warm_up with table test_warm_up;
+-------+
| JobId |
+-------+
| 13418 |
+-------+
1 row in set (0.01 sec)
```

然后可以通过以下 SQL 查看缓存预热进度。

```Plain
SHOW WARM UP JOB; // 获取 Job 信息
SHOW WARM UP JOB WHERE ID = 13418; // 指定 JobID
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
| JobId | ComputeGroup       | Status  | Type  | CreateTime              | FinishBatch | AllBatch | FinishTime |
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
| 13418 | cloud_warm_up     | RUNNING | TABLE | 2023-05-30 20:19:34.059 | 0           | 1        | NULL       |
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
1 row in set (0.02 sec)
```

可根据 `FinishBatch` 和 `AllBatch` 判断当前任务进度，每个 Batch 的数据大小约为 10GB。 目前，一个计算组中，同一时间内只支持执行一个预热 Job 。用户可以停止正在进行的预热 Job 。

```Plain
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

某用户拥有一系列数据表，总数据量超过 3TB，而可用缓存容量仅为 1.2TB。其中，访问频率较高的表有两张：一张是大小为 200MB 的维度表 (`dimension_table`)，另一张是大小为 100GB 的事实表 (`fact_table`)，后者每日都有新数据导入，并需要执行 T+1 查询操作。此外，其他大表访问频率不高。

在 LRU 缓存策略下，大表数据如果被查询访问，可能会替换掉需要常驻缓存的小表数据，造成性能波动。为了解决这个问题，用户采取 TTL 缓存策略，将两张表的 TTL 时间分别设置为 1 年和 1 天。

```shell
ALTER TABLE dimension_table set ("file_cache_ttl_seconds"="31536000");

ALTER TABLE fact_table set ("file_cache_ttl_seconds"="86400");
```

对于维度表，由于其数据量较小且变动不大，用户设置 1 年的 TTL 时间，以确保其数据在一年内都能被快速访问；对于事实表，用户每天需要进行一次表备份，然后进行全量导入，因此将其 TTL 时间设置为 1 天。
