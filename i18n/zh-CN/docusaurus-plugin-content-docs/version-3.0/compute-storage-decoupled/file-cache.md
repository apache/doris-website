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

在涉及多计算集群（Compute Cluster）的应用场景中，Doris 提供缓存预热功能。当新计算集群建立时，用户可以选择对特定的数据（如表或分区）进行预热，以提高查询效率。

## 缓存空间管理

### 缓存数据

数据主要通过以下三种方式进入缓存：

- **导入**：新导入的数据将异步写入缓存，以加速数据的首次访问。
- **查询**：如果查询所需数据不在缓存中，系统将从远端存储读取该数据至内存，并同时写入缓存，以便后续查询。
- **主动预热**：尽管远端存储的数据可实现多计算集群共享，但缓存数据并不会共享。当新计算集群创建时，缓存为空，此时可主动预热，使集群迅速从远端存储拉取所需数据至本地缓存。

### 缓存淘汰

Doris 支持 LRU 和 TTL 两种缓存管理策略。

- **LRU 策略**：作为默认策略，LRU 通过维护一个队列来管理数据。当队列中某块数据被访问时，该数据将被移至队列前端。新写入缓存的数据同样置于队列前端，以避免过早被淘汰。当缓存空间已满时，队列尾部的数据将被优先淘汰。
- **TTL 策略**：旨在确保新导入的数据在缓存中保留一段时间不被淘汰（过期时间 = 导入时间 + 设定的超时时间）。TTL 策略下的数据在缓存中具有最高地位，且 TTL 数据之间互相平等。当缓存已满时，系统会通过淘汰 LRU 队列中的数据来确保 TTL 数据能够写入缓存。同时，所有 TTL 策略下的数据并不会因过期时间差异而被区别对待。当 TTL 数据占据全部缓存空间时，新导入的数据（无论是否设置 TTL）或从远端存储拉取的冷数据，均不会被写入缓存。
  -  TTL 策略可以应用于期望在本地持久化的小规模数据表。对于此类常驻表，可设置一个相对较大的 TTL 值，以确保其在缓存中的数据不会因其他大型数据表的查询操作而被过早淘汰。

  -  此外，对于采用动态分区策略的数据表，可以根据分区中 Hot Partition 的活跃时间，针对性地设定相应的 TTL 值，从而保障 Hot Partition 的数据在缓存中的留存，避免其被 Cold Partition 的查询操作所影响。

  -  目前，系统暂不支持直接查看 TTL 数据在缓存中的占比。

### 缓存预热

在存算分离模式下，Doris 支持多计算集群部署，各计算集群间共享数据但不共享缓存。当新计算集群创建时，其缓存处于空置状态，此时查询性能可能受到影响。为此，Doris 提供缓存预热功能，允许用户主动从远端存储拉取数据至本地缓存。目前，该功能支持以下三种模式：

- **计算集群间预热**：将计算集群 A 的缓存数据预热至计算集群 B 中。Doris 会定期收集各计算集群在一段时间内被访问的表/分区的热点信息，并作为内部表存储下来，预热时根据这些信息选择性地预热某些表/分区。
- **表数据预热**：指定将表 A 的数据预热至新计算集群。
- **分区数据预热**：指定将表 A 的分区`p1`的数据预热至新集群。

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

- 将 `cluster_name0` 的缓存数据预热到 `cluster_name1` 。 

当执行以下 SQL 时，`cluster_name1` 计算集群会获取 `cluster_name0` 计算集群的访问信息，来尽可能还原出与 `cluster_name0` 集群一致的缓存。

```Plain
warm up cluster cluster_name1 with cluster cluster_name0
```

查看当前所有计算集群中最频繁访问的表。

```Plain
show cache hotspot '/';
+------------------------+-----------------------+----------------------------------------+
| cluster_name           | total_file_cache_size | top_table_name                         |
+------------------------+-----------------------+----------------------------------------+
| cluster_name0          |          751620511367 | regression_test.doris_cache_hotspot    |
+------------------------+-----------------------+----------------------------------------+
```

查看 `cluster_name0` 下的所有表中最频繁访问的 Partition 。

```Plain
mysql> show cache hotspot '/cluster_name0';
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

查看 `cluster_name0` 下，表`regression_test_cloud_load_copy_into_tpch_sf1_p1.customer` 的访问信息。

```Plain
show cache hotspot '/cluster_name0/regression_test_cloud_load_copy_into_tpch_sf1_p1.customer';
+----------------+---------------------+
| partition_name | last_access_time    |
+----------------+---------------------+
| supplier       | 2023-06-06 10:56:12 |
+----------------+---------------------+
```

- 将表 `customer` 的数据预热到 `cluster_name1`。执行以下 SQL ，可以将该表在远端存储上的数据全部拉取到本地。

```Plain
warm up cluster cluster_name1 with table customer
```

- 将表 `customer` 的分区 `p1` 的数据预热到 `cluster_name1`。执行以下 SQL ，可以将该分区在远端存储上的数据全部拉取到本地。

```Plain
warm up cluster cluster_name1 with table customer partition p1
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
| JobId | ClusterName       | Status  | Type  | CreateTime              | FinishBatch | AllBatch | FinishTime |
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
| 13418 | cloud_warm_up     | RUNNING | TABLE | 2023-05-30 20:19:34.059 | 0           | 1        | NULL       |
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
1 row in set (0.02 sec)
```

可根据 `FinishBatch` 和 `AllBatch` 判断当前任务进度，每个 Batch 的数据大小约为 10GB。 目前，一个计算集群中，同一时间内只支持执行一个预热 Job 。用户可以停止正在进行的预热 Job 。

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

对于维度表，由于其数据量较小且变动不大，用户设置了长达 1 年的 TTL 时间，以确保其数据在一年内都能被快速访问；对于事实表，用户每天需要进行一次表备份，然后进行全量导入，因此将其 TTL 时间设置为 1 天。
