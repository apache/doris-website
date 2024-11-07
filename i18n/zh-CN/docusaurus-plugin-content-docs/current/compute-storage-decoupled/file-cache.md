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

在存算分离的架构中，数据被存储在远程存储。Doris 数据库通过利用本地硬盘上的缓存来加速数据访问，并采用了一种先进的多队列 LRU（Least Recently Used）策略来高效管理缓存空间。这种策略特别优化了索引和元数据的访问路径，旨在最大化地缓存用户频繁访问的数据。针对多计算组（Compute Group）的应用场景，Doris 还提供了缓存预热功能，以便在新计算组建立时，能够迅速加载特定数据（如表或分区）到缓存中，从而提升查询性能。

## 多队列 LRU

### LRU

 * LRU 通过维护一个数据访问队列来管理缓存。当数据被访问时，该数据会被移动到队列的前端。新加入缓存的数据同样会被置于队列前端，以防止其过早被淘汰。当缓存空间达到上限时，队列尾部的数据将优先被移除。

### TTL (Time-To-Live)

  * TTL 策略确保新导入的数据在缓存中保留一段时间不被淘汰。在这段时间内，数据具有最高优先级，且所有 TTL 数据之间地位平等。当缓存空间不足时，系统会优先淘汰其它队列中的数据，以确保 TTL 数据能够被写入缓存。

  * 应用场景：TTL 策略特别适用于希望在本地持久化的小规模数据表。对于常驻表，可以设置较长的 TTL 值来保护其数据；对于动态分区的数据表，可以根据 Hot Partition 的活跃时间设定相应的 TTL 值。

  * 注意事项：目前系统不支持直接查看 TTL 数据在缓存中的占比。

### 多队列

 * Doris 采用基于 LRU 的多队列策略，根据 TTL 属性和数据属性将数据分为四类，并分别置于 TTL 队列、Index 队列、NormalData 队列和 Disposable 队列中。设置了 TTL 属性的数据被放置到 TTL 队列，没有设置 TTL 属性的索引数据被放置到 Index 队列，没有设置 TTL 属性的索引数据被放置到 NormalData 队列，临时使用的数据被放置到 Disposable 队列中。

* 在数据读取和写入过程中，Doris 会地选择填充和读取的队列，以最大化缓存利用率。具体机制如下：

| 操作          | 未命中时填充的队列 | 写入数据时填充的队列    |
| ------------- | ----------------------| ---------- |
| 导入          | TTL / Index / NormalData  | TTL / Index / NormalData    |
| 查询          | TTL / Index / NormalData              | N/A        |
| schema change | Disposable            | TTL / Index / NormalData     |
| compaction    | Disposable            | TTL / Index / NormalData    |
| 预热          | N/A                    | TTL / Index / NormalData     |


### 淘汰


上述各类型缓存共同使用总缓存空间。根据重要程度的不同我们可以为它们划分比例。比例可以在 be 配置文件中通过 `file_cache_path` 设置，默认为：TTL : Normal : Index : Disposable = 50% :  30% : 10% : 10%。

这些比例不是硬性限制，Doris 会根据需要动态调整以充分利用空间来加速访问。例如用户如果不使用 TTL 类型的缓存，那么其它类型可以超过预设比例使用原本为 TTL 分配的空间。

缓存的淘汰有两种触发时机：垃圾清理或者缓存空间不足。当用户删除数据时，或是导入 compaction 任务结束时，会异步地对过期的缓存数据进行淘汰。写入缓存空间不足时，会按照 Disposable、Normal Data、Index、TTL 的顺序淘汰。例如：如果写入 Normal Data 时空间不足，那么 Doris 会依次淘汰 Disposable、Index、TTL 的部分数据（按照 LRU 的顺序）。注意我们不会将淘汰目标类型的数据全部淘汰再淘汰顺序中的下一个类型，而是至少会保留上述比例的空间以让其它类型也能正常工作。如果这个过程不能成功淘汰出足够的空间，那么将会触发自身类型的 LRU 淘汰。接着上面写 Normal Data 时空间不足例子，如果不能从其它类型中淘汰出足够的空间，此时 Normal Data 将从自身按照 LRU 顺序淘汰出数据。

需要特别注意的是，对于带有过期时间的 TTL 队列，其数据过期时会被移动到 Normal Data 队列，作为 Normal Data 参与淘汰。

特别的，对于带有过期时间的 TTL 队列，其数据过期时会被移动到 Normal Data 队列，作为 Normal Data 参与淘汰。

## 缓存预热

在存算分离模式下，Doris 支持多计算组部署，各计算组间共享数据但不共享缓存。新计算组创建时，其缓存为空，可能影响查询性能。为此，Doris 提供缓存预热功能，允许用户从远端存储主动拉取数据至本地缓存。该功能支持以下三种模式：

- **计算组间预热**：将计算组 A 的缓存数据预热至计算组 B。Doris 定期收集各计算组在一段时间内被访问的表/分区的热点信息，并根据这些信息选择性地预热某些表/分区。
- **表数据预热**：指定将表 A 的数据预热至新计算组。
- **分区数据预热**：指定将表 A 的分区 `p1` 的数据预热至新计算组。

## Compute Group 扩缩容

Compute Group 扩缩容时，为了避免 Cache 波动，Doris 会首先对受影响的 Tablet 重新映射并预热数据。

## 缓存观测

### 热点信息

Doris 每 10 分钟收集各个计算组的缓存热点信息到内部系统表，您可以通过 `SHOW CACHE HOTSPOT '/'` 命令查看热点信息。

### Cache 空间以及命中率

Doris BE 节点通过 `curl {be_ip}:{brpc_port}/vars ( brpc_port 默认为 8060 ) 获取 cache 统计信息，指标项的名称开始为磁盘路径。

上述例子中指标前缀为 File Cache 的路径，例如前缀 "_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_" 表示 "/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/"
去掉前缀的部分为统计指标，比如 "file_cache_cache_size" 表示当前 路径的 File Cache 大小为 26111 字节


下表为全部的指标意义 (以下表示 size 大小单位均为字节)

指标名称 (不包含路径前缀) | 语义
-----|------
file_cache_cache_size | 当前 File Cache 的总大小
file_cache_disposable_queue_cache_size | 当前 disposable 队列的大小
file_cache_disposable_queue_element_count | 当前 disposable 队列里的元素个数
file_cache_disposable_queue_evict_size | 从启动到当前 disposable 队列总共淘汰的数据量大小
file_cache_index_queue_cache_size | 当前 index 队列的大小
file_cache_index_queue_element_count | 当前 index 队列里的元素个数
file_cache_index_queue_evict_size | 从启动到当前 index 队列总共淘汰的数据量大小
file_cache_normal_queue_cache_size | 当前 normal 队列的大小
file_cache_normal_queue_element_count | 当前 normal 队列里的元素个数
file_cache_normal_queue_evict_size | 从启动到当前 normal 队列总共淘汰的数据量大小
file_cache_total_evict_size | 从启动到当前，整个 File Cache 总共淘汰的数据量大小
file_cache_ttl_cache_evict_size | 从启动到当前 TTL 队列总共淘汰的数据量大小
file_cache_ttl_cache_lru_queue_element_count | 当前 TTL 队列里的元素个数
file_cache_ttl_cache_size | 当前 TTL 队列的大小
file_cache_evict_by_heat\_[A]\_to\_[B] | 为了写入 B 缓存类型的数据而淘汰的 A 缓存类型的数据量（基于过期时间的淘汰方式） 
file_cache_evict_by_size\_[A]\_to\_[B] | 为了写入 B 缓存类型的数据而淘汰的 A 缓存类型的数据量（基于空间的淘汰方式） 
file_cache_evict_by_self_lru\_[A] | A 缓存类型的数据为了写入新数据而淘汰自身的数据量（基于 LRU 的淘汰方式） 

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

您可以通过 [查询性能分析](../query-acceleration/tuning/query-profile) 查看查询性能分析。

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

```sql
WARM UP COMPUTE GROUP compute_group_name1 WITH COMPUTE GROUP compute_group_name0
```

查看当前所有计算组中最频繁访问的表。

```sql
SHOW CACHE HOTSPOT '/';
```

查看 `compute_group_name0` 下的所有表中最频繁访问的 Partition。

```sql
SHOW CACHE HOTSPOT '/compute_group_name0';
```

查看 `compute_group_name0` 下，表`regression_test_cloud_load_copy_into_tpch_sf1_p1.customer` 的访问信息。

```sql
SHOW CACHE HOTSPOT '/compute_group_name0/regression_test_cloud_load_copy_into_tpch_sf1_p1.customer';
```

- 将表 `customer` 的数据预热到 `compute_group_name1`。执行以下 SQL，可以将该表在远端存储上的数据全部拉取到本地。

```sql
WARM UP COMPUTE GROUP compute_group_name1 WITH TABLE customer
```

- 将表 `customer` 的分区 `p1` 的数据预热到 `compute_group_name1`。执行以下 SQL，可以将该分区在远端存储上的数据全部拉取到本地。

```sql
WARM UP COMPUTE GROUP compute_group_name1 with TABLE customer PARTITION p1
```

上述三条缓存预热 SQL 均会返回一个 JobID 结果。例如：

```sql
WARM UP COMPUTE GROUP cloud_warm_up WITH TABLE test_warm_up;
```

然后可以通过以下 SQL 查看缓存预热进度。

```sql
SHOW WARM UP JOB WHERE ID = 13418; 
```

可根据 `FinishBatch` 和 `AllBatch` 判断当前任务进度，每个 Batch 的数据大小约为 10GB。目前，一个计算组中，同一时间内只支持执行一个预热 Job。用户可以停止正在进行的预热 Job。

```sql
CANCEL WARM UP JOB WHERE id = 13418;
```

## 实践案例

某用户拥有一系列数据表，总数据量超过 3TB，而可用缓存容量仅为 1.2TB。其中，访问频率较高的表有两张：一张是大小为 200MB 的维度表 (`dimension_table`)，另一张是大小为 100GB 的事实表 (`fact_table`)，后者每日都有新数据导入，并需要执行 T+1 查询操作。此外，其他大表访问频率不高。

在 LRU 缓存策略下，大表数据如果被查询访问，可能会替换掉需要常驻缓存的小表数据，造成性能波动。为了解决这个问题，用户采取 TTL 缓存策略，将两张表的 TTL 时间分别设置为 1 年和 1 天。

```shell
ALTER TABLE dimension_table set ("file_cache_ttl_seconds"="31536000");

ALTER TABLE fact_table set ("file_cache_ttl_seconds"="86400");
```

对于维度表，由于其数据量较小且变动不大，用户设置 1 年的 TTL 时间，以确保其数据在一年内都能被快速访问；对于事实表，用户每天需要进行一次表备份，然后进行全量导入，因此将其 TTL 时间设置为 1 天。
