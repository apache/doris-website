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


在存算分离的架构中，数据被存储在远程存储（例如 S3对象存储、HDFS分布式文件存储等）。Doris数据库通过利用本地硬盘上的缓存来加速数据访问，并采用了一种先进的多队列 LRU（Least Recently Used）策略来高效管理缓存空间。这种策略针对索引和元数据的访问路径进行了优化，旨在最大化地缓存用户频繁访问的数据。针对多计算组（Compute Group）的应用场景，Doris 还提供了缓存预热功能，以便在新计算组建立时，能够迅速加载特定数据（如表或分区）到缓存中，从而提升查询性能。

## 缓存时机

- 查询路径缓存：如果完成查询所需的数据不在本地（cache miss），则会去读远程存储，并把读到的数据写入缓存以备后续使用。
- 导入路径缓存：为了加速对新导入数据的查询速度，导入数据不仅流向远程存储，也会异步地写入本地缓存。

## 多队列 LRU

### 多队列

Doris 对于不同的数据会有不同的访问模式，我们针对不同类型的数据设计了相互独立的 LRU 队列来进行管理：

- Normal 队列：存放普通数据
- Index 队列：存放 Doris 内部使用的各类索引数据，例如 bitmap、反向索引等
- Disposable 队列：存放临时数据，例如数据合并 (compaction) 操作以及 schema change 操作时读取的临时数据、优化器读取统计信息表的临时数据等。您可以通过设置会话变量`set disable_file_cache = true`来手动控制当前会话的查询使用 Disposable 队列，以避免这些查询读取的数据挤占核心缓存的空间。
- TTL (Time-To-Live)：见下文介绍

在数据读取和写入过程中，Doris会选择填充和读取的队列，以最大化缓存利用率。具体机制如下：

| 操作          | 查询未命中填充队列 | 导入填充队列 |
| ------------- | ----------------------| ---------- |
| TTL 表的导入 | TTL | TTL |
| TTL 表的查询 | TTL | TTL |
| TTL 表 schema change | Disposable | TTL |
| TTL 表 compaction | Disposable | TTL |
| TTL 表预热 | N/A | TTL |
| 普通表的导入    | Index / Normal  | Index / Normal    |
| 普通表的查询      | Index / Normal              | N/A        |
| 普通表 schema change | Disposable            | Index / Normal    |
| 普通表 compaction | Disposable            | Index / Normal    |
| 普通表 预热      | N/A                    | Index / Normal     |

### 空间比例

上述各类型缓存共同使用总缓存空间。各种类型缓存可使用空间的比例可以在 be 配置文件中通过 `file_cache_path` 的 `<type>_percent` 属性进行设置，如：

```json
file_cache_path = [{"path": "/path/to/file_cache", "total_size":53687091200, "ttl_percent":50, "normal_percent":40, "disposable_percent":5, "index_percent":5}]
```

默认的空间分配比例为：TTL 占 50%，Normal 占 40%，Index 占 5%，Disposable 占 5%。更多 `file_cache_path` 配置方法详见[配置文档](./compilation-and-deployment)。

注意这些比例并非硬性限制，Doris 会根据需要动态调整以充分利用空间来加速访问。例如用户没有定义 TTL 表或是尚未导入 TTL 表的数据，那么其它类型可以超过各自预设比例以使用原本为 TTL 分配的空间。待有 TTL 数据进入缓存，其它类型的缓存将会进行一定数量的淘汰，让出空间给新加入的 TTL 数据。随着各类型缓存队列的饱和，其空间比例逐渐趋近于设定比例。该过程是由下文将要介绍的多队列 LRU 淘汰算法来保证的。

### 优先级说明

不同类型数据优先级不同。优先级从低到高分别为：

```
Disposable < Normal < Index < TTL
```

优先级越高的数据，在缓存中驻留的时间越长，被淘汰的顺序越靠后。

### 多队列 LRU 淘汰算法详细介绍

缓存淘汰的第一种触发时机为垃圾清理。当用户删除数据时，或是导入 compaction 任务结束时，会异步地对过期的缓存数据进行淘汰。

另一种更常见的淘汰触发时机为缓存空间不足时、需要在目标缓存队列加入新数据。我们用“目标缓存队列”来表示新数据将要进入的缓存队列，并用“源缓存队列”来表示其它需要为目标缓存队列淘汰数据的队列。此时选择哪些队列的哪些数据的策略如下：

1. 首先是基于过期时间的淘汰阶段

   依照缓存类型优先级从低到高的顺序，逐一删除各类缓存中过期数据直到释放出足够空间。过期数据是指该队列中长时间没有被访问的数据。各类型队列的过期时间判定阈值分别为：

   - Disposable: 1小时
   - Normal: 1天
   - Index: 1周
   - TTL: TTL 由用户自定义过期时间，目前不包含在基于过期时间的淘汰的讨论范围内

2. 如果第一步没有释放出足够的空间，那么进入基于空间的淘汰阶段

   对于源缓存队列的集合，依照缓存类型优先级从低到高的顺序，逐一删除各类缓存中最近最少使用的数据，直到释放出足够空间。

   - 注意1：对于每一种需要淘汰的类型，我们不会将该类型的数据全部淘汰再淘汰顺序中的下一个类型，而是至少会保留空间比例设定的空间以避免自身饥饿
   - 注意2：如果目标缓存队列当前获得的空间超过了空间比例设定的空间，那么停止基于空间的淘汰

3. 如果第二步仍然没有释放出足够空间，那么进入目标缓存队列自我 LRU 淘汰阶段

4. 如果上述步骤均没有释放出足够空间，那么将放弃缓存 (Skip Cache)

特别的，对于带有过期时间的 TTL 队列，其数据过期时会先被移动到 Normal 队列，然后作为 Normal 参与淘汰。


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
file_cache_evict_by_time\_[A]\_to\_[B] | 为了写入 B 缓存类型的数据而淘汰的 A 缓存类型的数据量（基于过期时间的淘汰方式）
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

### TTL (Time-To-Live) 简介和设置

TTL 策略确保新导入的数据在缓存中保留一段时间不被淘汰。

应用场景：TTL策略特别适用于希望在本地持久化的小规模数据表。对于常驻表，可以设置较长的TTL值来保护其数据；对于动态分区的数据表，可以根据Hot Partition的活跃时间设定相应的TTL值。

当缓存中的 TTL 空间额度用完后，TTL 自身将进入 LRU 淘汰，即最近最少使用的数据将会为新加入的 TTL 数据让出空间。因此，建议不要大规模使用 TTL 策略，或将空间大于缓存容量的表设置为 TTL 策略，以避免大量的数据挤占真正关键的表的 TTL 空间。

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
