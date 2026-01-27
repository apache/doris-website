---
{
    "title": "文件缓存功能介绍",
    "language": "zh-CN",
    "description": "在存算分离的架构中，数据被存储在远程存储。Doris 数据库通过利用本地硬盘上的缓存来加速数据访问，并采用了一种先进的多队列 LRU（Least Recently Used）策略来高效管理缓存空间。这种策略特别优化了索引和元数据的访问路径，旨在最大化地缓存用户频繁访问的数据。"
}
---

在存算分离的架构中，数据被存储在远程存储。Doris 数据库通过利用本地硬盘上的缓存来加速数据访问，并采用了一种先进的多队列 LRU（Least Recently Used）策略来高效管理缓存空间。这种策略特别优化了索引和元数据的访问路径，旨在最大化地缓存用户频繁访问的数据。针对多计算组（Compute Group）的应用场景，Doris 还提供了缓存预热功能，以便在新计算组建立时，能够迅速加载特定数据（如表或分区）到缓存中，从而提升查询性能。

## 缓存的作用

在存算分离架构中，数据通常存储在远程存储系统中，如对象存储 S3、HDFS 等。在这种场景下，Doris 数据库可以利用本地磁盘空间作为缓存，将部分数据缓存到本地，从而减少对远程存储的频繁访问，提升数据访问效率，降低运行成本。

远程存储（如对象存储）的访问延迟通常较高，且可能受到 QPS（每秒查询率）和带宽限制的约束。例如，对象存储的 QPS 限制可能导致在高并发查询时出现瓶颈，而网络带宽的限制则会影响数据传输速度。通过使用本地文件缓存，Doris 可以将热点数据存储在本地磁盘上，从而显著降低查询延迟，提升查询性能。

另一方面，对象存储服务通常会根据请求次数和数据传输量收费。频繁的访问和大量的数据下载会增加查询经济成本。通过缓存机制，可以减少对对象存储的访问次数和数据传输量，从而降低费用。

Doris 的文件缓存在存算分离架构中通常缓存以下两种文件

- segment 数据文件：Doris 中内表存储数据的基本单元。缓存这些文件可以加速对数据的读取操作，提升查询性能。
- inverted index 反向索引文件：用于加速查询中的过滤操作。通过缓存这些文件，可以更快地定位到满足查询条件的数据，进一步提升查询效率，并支持复杂的查询场景。

## 缓存的配置

Doris 提供了一系列的配置项来帮助用户灵活地管理文件缓存。这些配置项包括缓存的启用、缓存路径和大小的设置、缓存块的大小、自动清理的开关以及预先淘汰机制等。以下是详细的配置说明：


1.启用文件缓存

```plaintext
enable_file_cache 默认 "false"
```

参数说明：此配置项用于控制是否启用文件缓存功能。如果设置为`true`，则启用文件缓存；如果设置为`false`，则禁用文件缓存。

2.配置文件缓存路径和大小

```plaintext
file_cache_path 默认 be 部署路径下的 storage 目录
```


参数说明：此配置项用于指定文件缓存的路径和大小。格式为 JSON 数组，每个元素是一个 JSON 对象，包含以下字段：

- `path`：缓存文件存储的路径。

- `total_size`：该路径下缓存的总大小（单位：字节）。

- `ttl_percent`：TTL 队列占用的比例（百分比）。

- `normal_percent`：Normal 队列占用的比例（百分比）。

- `disposable_percent`：Disposable 队列占用的比例（百分比）。

- `index_percent`：Index 队列占用的比例（百分比）。

- `storage`：缓存存储类型，可以是`disk`或`memory`。默认值为`disk`。

示例：

- 单路径配置：

```json
[{"path":"/path/to/file_cache","total_size":21474836480}]
```

- 多路径配置：

```json
[{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
```

- 内存存储配置：

```json
[{"path": "xxx", "total_size":53687091200, "storage": "memory"}]
```

3.自动清理缓存

```plaintext
clear_file_cache 默认 "false"
```


参数说明：此配置项用于控制是否在 BE 重启时自动清理已经缓存的数据。如果设置为`true`，则每次 BE 重启时会自动清理缓存；如果设置为`false`，则不会自动清理缓存。

4.预先淘汰机制

```plaintext
enable_evict_file_cache_in_advance 默认 "true"
```

- 参数说明：此配置项用于控制是否启用预先淘汰机制。如果设置为`true`，则当缓存使用空间达到一定阈值后，系统会主动进行预先淘汰，留出空间为未来的查询使用；如果设置为`false`，则不会进行预先淘汰。


```plaintext
file_cache_enter_need_evict_cache_in_advance_percent 默认 "88"
```

- 参数说明：此配置项用于设置触发预先淘汰的阈值百分比。当缓存使用空间/inode数量达到此百分比时，系统开始进行预先淘汰。


```plaintext
file_cache_exit_need_evict_cache_in_advance_percent 默认 "85"
```

- 参数说明：此配置项用于设置停止预先淘汰的阈值百分比。当缓存使用空间降至此百分比时，系统停止进行预先淘汰。

## 缓存的预热

Doris 提供了缓存预热功能，允许用户从远端存储主动拉取数据至本地缓存。该功能支持以下三种模式：

- 计算组间预热：将计算组 A 的缓存数据预热至计算组 B。Doris 定期收集各计算组在一段时间内被访问的表/分区的热点信息，并根据这些信息选择性地预热某些表/分区。

- 表数据预热：指定将表 A 的数据预热至新计算组。

- 分区数据预热：指定将表 A 的分区`p1`的数据预热至新计算组。
  具体用法详见[WARM-UP SQL文档](#)。

## 缓存的清理

Doris 提供了同步清理和异步清理两种方式：

- 同步清理：命令为`curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=true'`，命令返回则代表清理完成。当需要立即清理缓存时，Doris 会同步删除本地文件系统目录中的缓存文件，并清理内存中的管理元数据。这种方式可以快速释放空间，但可能会对正在执行的查询效率乃至系统稳定性造成一定影响，通常用于快速测试。

- 异步清理：命令为`curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=false'`，命令直接返回，清理步骤异步执行，可以观察到缓存空间逐步减小。在异步清理过程中，Doris 会遍历内存中的管理元数据，逐一删除对应的缓存文件。如果发现某些缓存文件正在被查询使用中，Doris 会延迟删除这些文件，直到它们不再被使用。这种方式可以减少对正在执行查询的影响，但完全清理干净缓存通常需要相对同步清理更长的时间。

## 缓存的观测

### 热点信息

Doris 每 10 分钟收集各个计算组的缓存热点信息到内部系统表，您可以通过查询语句查看热点信息。
用户可以根据这些信息更好地规划缓存的使用。

:::info 备注
在 3.0.4 版本之前，可以使用 `SHOW CACHE HOTSPOT` 语句进行缓存热度信息统计查询。从 3.0.4 版本开始，不再支持使用 `SHOW CACHE HOTSPOT` 语句进行缓存热度信息统计查询。请直接访问系统表 `__internal_schema.cloud_cache_hotspot` 进行查询。
:::

用户通常关注计算组和库表两个维度的缓存使用情况。以下提供了一些常用的查询语句以及示例。

#### 查看当前所有计算组中最频繁访问的表

```sql
-- 等价于 3.0.4 版本前的 SHOW CACHE HOTSPOT "/"
WITH t1 AS (
  SELECT
    cluster_id,
    cluster_name,
    table_id,
    table_name,
    insert_day,
    SUM(query_per_day) AS query_per_day_total,
    SUM(query_per_week) AS query_per_week_total
  FROM __internal_schema.cloud_cache_hotspot
  GROUP BY cluster_id, cluster_name, table_id, table_name, insert_day
)
SELECT
  cluster_id AS ComputeGroupId,
  cluster_name AS ComputeGroupName,
  table_id AS TableId,
  table_name AS TableName
FROM (
  SELECT
    ROW_NUMBER() OVER (
      PARTITION BY cluster_id
      ORDER BY insert_day DESC, query_per_day_total DESC, query_per_week_total DESC
    ) AS dr2,
    *
  FROM t1
) t2
WHERE dr2 = 1;
```

#### 查看某个计算组下的所有表中最频繁访问的表

查看计算组 `compute_group_name0` 下的所有表中最频繁访问的表

注意：将其中的 `cluster_name = "compute_group_name0"` 条件替换为实际的计算组名称。

```sql
-- 等价于 3.0.4 版本前的 SHOW CACHE HOTSPOT '/compute_group_name0';
WITH t1 AS (
  SELECT
    cluster_id,
    cluster_name,
    table_id,
    table_name,
    insert_day,
    SUM(query_per_day) AS query_per_day_total,
    SUM(query_per_week) AS query_per_week_total
  FROM __internal_schema.cloud_cache_hotspot
  WHERE cluster_name = "compute_group_name0" -- 替换为实际的计算组名称，例如 "default_compute_group"
  GROUP BY cluster_id, cluster_name, table_id, table_name, insert_day
)
SELECT
  cluster_id AS ComputeGroupId,
  cluster_name AS ComputeGroupName,
  table_id AS TableId,
  table_name AS TableName
FROM (
  SELECT
    ROW_NUMBER() OVER (
      PARTITION BY cluster_id
      ORDER BY insert_day DESC, query_per_day_total DESC, query_per_week_total DESC
    ) AS dr2,
    *
  FROM t1
) t2
WHERE dr2 = 1;
```

### Cache 空间以及命中率

Doris BE 节点通过 `curl {be_ip}:{brpc_port}/vars` ( brpc_port 默认为 8060 ) 获取 cache 统计信息，指标项的名称开始为磁盘路径。

上述例子中指标前缀为 File Cache 的路径，例如前缀"_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_" 表示 "/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/"
去掉前缀的部分为统计指标，比如 "file_cache_cache_size" 表示当前 路径的 File Cache 大小为 26111 字节


下表为全部的指标意义 (以下表示 size 大小单位均为字节)

| 指标名称(不包含路径前缀)                     | 语义                                                         |
| -------------------------------------------- | ------------------------------------------------------------ |
| file_cache_cache_size                        | 当前 File Cache 的总大小                                     |
| file_cache_disposable_queue_cache_size       | 当前 disposable 队列的大小                                   |
| file_cache_disposable_queue_element_count    | 当前 disposable 队列里的元素个数                             |
| file_cache_disposable_queue_evict_size       | 从启动到当前 disposable 队列总共淘汰的数据量大小             |
| file_cache_index_queue_cache_size            | 当前 index 队列的大小                                        |
| file_cache_index_queue_element_count         | 当前 index 队列里的元素个数                                  |
| file_cache_index_queue_evict_size            | 从启动到当前 index 队列总共淘汰的数据量大小                  |
| file_cache_normal_queue_cache_size           | 当前 normal 队列的大小                                       |
| file_cache_normal_queue_element_count        | 当前 normal 队列里的元素个数                                 |
| file_cache_normal_queue_evict_size           | 从启动到当前 normal 队列总共淘汰的数据量大小                 |
| file_cache_total_evict_size                  | 从启动到当前，整个 File Cache 总共淘汰的数据量大小           |
| file_cache_ttl_cache_evict_size              | 从启动到当前 TTL 队列总共淘汰的数据量大小                    |
| file_cache_ttl_cache_lru_queue_element_count | 当前 TTL 队列里的元素个数                                    |
| file_cache_ttl_cache_size                    | 当前 TTL 队列的大小                                          |
| file_cache_evict_by_heat\_[A]\_to\_[B]       | 为了写入 B 缓存类型的数据而淘汰的 A 缓存类型的数据量（基于过期时间的淘汰方式） |
| file_cache_evict_by_size\_[A]\_to\_[B]       | 为了写入 B 缓存类型的数据而淘汰的 A 缓存类型的数据量（基于空间的淘汰方式） |
| file_cache_evict_by_self_lru\_[A]            | A 缓存类型的数据为了写入新数据而淘汰自身的数据量（基于 LRU 的淘汰方式） |

SQL profile
SQL profile 中 cache 相关的指标在 SegmentIterator 下，包括

| 指标名称               | 语义                                       |
| ---------------------- | ------------------------------------------ |
| BytesScannedFromCache  | 从 File Cache 读取的数据量                 |
| BytesScannedFromRemote | 从远程存储读取的数据量                     |
| BytesWriteIntoCache    | 写入 File Cache 的数据量                   |
| LocalIOUseTimer        | 读取 File Cache 的耗时                     |
| NumLocalIOTotal        | 读取 File Cache 的次数                     |
| NumRemoteIOTotal       | 读取远程存储的次数                         |
| NumSkipCacheIOTotal    | 从远程存储读取并没有进入 File Cache 的次数 |
| RemoteIOUseTimer       | 读取远程存储的耗时                         |
| WriteCacheIOUseTimer   | 写 File Cache 的耗时                       |

您可以通过 [查询性能分析](../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile) 查看查询性能分析。

## TTL 用法

在建表时，设置相应的 PROPERTY，即可将该表的数据使用 TTL 策略进行缓存。

- `file_cache_ttl_seconds`:新导入的数据期望在缓存中保留的时间，单位为秒。

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

## 实践案例

某用户拥有一系列数据表，总数据量超过 3TB，而可用缓存容量仅为 1.2TB。其中，访问频率较高的表有两张：一张是大小为 200MB 的维度表 (`dimension_table`)，另一张是大小为 100GB 的事实表 (`fact_table`)，后者每日都有新数据导入，并需要执行 T+1 查询操作。此外，其他大表访问频率不高。

在 LRU 缓存策略下，大表数据如果被查询访问，可能会替换掉需要常驻缓存的小表数据，造成性能波动。为了解决这个问题，用户采取 TTL 缓存策略，将两张表的 TTL 时间分别设置为 1 年和 1 天。

```shell
ALTER TABLE dimension_table set ("file_cache_ttl_seconds"="31536000");

ALTER TABLE fact_table set ("file_cache_ttl_seconds"="86400");
```

对于维度表，由于其数据量较小且变动不大，用户设置 1 年的 TTL 时间，以确保其数据在一年内都能被快速访问；对于事实表，用户每天需要进行一次表备份，然后进行全量导入，因此将其 TTL 时间设置为 1 天。
