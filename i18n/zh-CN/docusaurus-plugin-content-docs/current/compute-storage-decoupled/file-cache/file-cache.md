---
{
    "title": "文件缓存配置与使用指南（存算分离）",
    "sidebar_label": "文件缓存配置",
    "language": "zh-CN",
    "description": "介绍存算分离架构下 Doris 文件缓存的配置、配额管理、缓存预热与清理、命中率监控及 TTL 策略，助力提升查询性能、降低对象存储成本。",
    "keywords": ["Doris 文件缓存", "存算分离缓存", "file cache", "缓存预热", "缓存配额", "TTL 缓存", "LRU", "缓存命中率", "对象存储加速"]
}
---

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 存算分离部署 / 查询性能优化 / 对象存储成本优化 -->

在存算分离架构中，数据存储于远程对象存储（如 S3、HDFS）。Doris 利用 BE 节点本地磁盘作为文件缓存层，配合多队列 LRU（Least Recently Used）策略高效管理缓存空间，特别优化了索引与元数据的访问路径，以最大化热点数据的缓存命中率。

针对多计算组（Compute Group）场景，Doris 额外提供**缓存预热**功能，在新计算组启动时可主动拉取指定表或分区的数据，快速建立本地缓存，提升首次查询性能。

## 文件缓存的作用

<!-- 知识类型: 架构选型决策 -->

在存算分离架构下，远程存储的访问存在以下两类典型问题：

| 问题类型 | 说明 |
|---|---|
| 高访问延迟 | 对象存储延迟远高于本地磁盘，高并发时尤为明显 |
| QPS / 带宽限制 | 对象存储通常有 QPS 上限与带宽约束，高并发查询易触发瓶颈 |
| 按需计费成本 | 对象存储按请求次数与数据传输量计费，频繁访问会增加运营成本 |

通过将热点数据缓存到本地磁盘，Doris 可以显著降低查询延迟，同时减少对对象存储的直接请求，从而节约成本。

### 缓存的文件类型

Doris 文件缓存主要缓存以下两类文件：

- **Segment 数据文件**：Doris 内表存储数据的基本单元，缓存后可加速数据读取，提升查询性能。
- **Inverted Index 反向索引文件**：用于加速查询中的过滤操作，缓存后可更快定位满足条件的数据，支持复杂查询场景。

## 缓存配置

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 存算分离部署前配置 / BE 参数调优 -->

Doris 通过 BE 配置文件中的以下参数控制文件缓存行为。

### 启用文件缓存

| 参数 | 默认值 | 说明 |
|---|---|---|
| `enable_file_cache` | `false` | 是否启用文件缓存功能。存算分离模式下建议设置为 `true`。 |

### 配置缓存路径与大小

```plaintext
file_cache_path  默认：BE 部署路径下的 storage 目录
```

该参数为 JSON 数组，每个元素指定一个缓存路径及其属性，支持字段如下：

| 字段 | 说明 |
|---|---|
| `path` | 缓存文件存储路径 |
| `total_size` | 该路径下缓存总大小（单位：字节） |
| `ttl_percent` | TTL 队列占用比例（百分比） |
| `normal_percent` | Normal 队列占用比例（百分比） |
| `disposable_percent` | Disposable 队列占用比例（百分比） |
| `index_percent` | Index 队列占用比例（百分比） |
| `storage` | 缓存存储类型，可选 `disk`（默认）或 `memory` |

**配置示例：**

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

### 自动清理缓存

| 参数 | 默认值 | 说明 |
|---|---|---|
| `clear_file_cache` | `false` | 是否在 BE 重启时自动清理已缓存数据。设为 `true` 时，每次重启均会清空缓存。 |

### 预先淘汰机制

预先淘汰机制在缓存使用率达到阈值时主动释放空间，避免查询时触发被动淘汰导致性能抖动。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `enable_evict_file_cache_in_advance` | `true` | 是否启用预先淘汰机制 |
| `file_cache_enter_need_evict_cache_in_advance_percent` | `88` | 触发预先淘汰的使用率阈值（%）。缓存使用空间或 inode 数量达到此百分比时开始预先淘汰 |
| `file_cache_exit_need_evict_cache_in_advance_percent` | `85` | 停止预先淘汰的使用率阈值（%）。缓存使用空间降至此百分比时停止淘汰 |

## 缓存配额

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 多用户共享缓存 / 防止大查询缓存抖动 -->

> 该功能自 4.0.3 版本起支持。

**缓存配额（Cache Query Limit）**功能允许限制单个查询可填充的文件缓存比例。在多用户或复杂查询共享缓存资源的场景下，单个大查询可能占用过多缓存，导致其他查询的热点数据被淘汰。通过设置查询配额，可保证资源的公平使用，防止缓存抖动。

查询占用的缓存空间指该查询因数据未命中而填充到缓存中的数据总大小。若填充总量达到配额上限，后续填充的数据将基于 LRU 算法替换该查询先前填充的数据。

### 配置说明

该功能涉及 BE 配置、FE 配置与会话变量三个层面。

**BE 配置**

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `enable_file_cache_query_limit` | Boolean | `false` | BE 端缓存查询限制主开关。仅开启后，BE 才会处理 FE 传递的查询限制参数 |

**FE 配置**

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `file_cache_query_limit_max_percent` | Integer | `100` | 查询配额的最大约束值，用于校验会话变量的上限 |

**会话变量**

| 变量 | 类型 | 说明 |
|---|---|---|
| `file_cache_query_limit_percent` | Integer (1–100) | 单个查询可使用的最大缓存比例（%）。上限受 `file_cache_query_limit_max_percent` 约束。建议计算后的缓存配额不低于 256 MB，低于该值时 BE 会在日志中输出告警 |

### 使用示例

```sql
-- 限制单个查询最多使用 50% 的缓存
SET file_cache_query_limit_percent = 50;

-- 执行查询
SELECT * FROM large_table;
```

> **注意：** 设置的值必须在 `[0, file_cache_query_limit_max_percent]` 范围内。

## 缓存预热

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 新计算组上线 / 热点数据快速加载 -->

Doris 提供缓存预热功能，允许用户从远端存储主动拉取数据至本地缓存。支持以下三种预热模式：

| 模式 | 说明 |
|---|---|
| 计算组间预热 | 将计算组 A 的缓存热点数据预热至计算组 B。Doris 定期收集各计算组的表/分区访问热点，并据此选择性预热 |
| 表数据预热 | 指定将某张表的全量数据预热至目标计算组 |
| 分区数据预热 | 指定将某张表的特定分区数据预热至目标计算组 |

具体用法详见 [WARM-UP SQL 文档](#)。

## 缓存清理

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 缓存空间不足 / 测试环境重置 / 故障排查 -->

Doris 提供同步与异步两种缓存清理方式：

| 方式 | 命令 | 说明 |
|---|---|---|
| 同步清理 | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=true'` | 命令返回即代表清理完成。Doris 同步删除本地文件系统中的缓存文件并清理内存元数据，可快速释放空间，但可能影响正在执行的查询。通常用于快速测试 |
| 异步清理 | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=false'` | 命令立即返回，清理步骤异步执行，可观察到缓存空间逐步减小。Doris 遍历内存元数据逐一删除缓存文件，对正在使用的文件会延迟删除。对正在执行的查询影响较小，但完全清理耗时较长 |

## 缓存监控

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 缓存命中率分析 / 故障排查 / 性能调优 -->

### 热点信息

Doris 每 10 分钟收集各计算组的缓存热点信息，并写入内部系统表 `__internal_schema.cloud_cache_hotspot`。可通过以下查询语句分析热点数据，指导缓存规划。

:::info 备注
在 3.0.4 版本之前，可使用 `SHOW CACHE HOTSPOT` 语句查询缓存热度信息。从 3.0.4 版本起，该语句已不再支持，请直接查询系统表 `__internal_schema.cloud_cache_hotspot`。
:::

#### 查看所有计算组中访问最频繁的表

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

#### 查看指定计算组中访问最频繁的表

将 `cluster_name = "compute_group_name0"` 替换为实际的计算组名称。

```sql
-- 等价于 3.0.4 版本前的 SHOW CACHE HOTSPOT '/compute_group_name0'
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

### 缓存空间与命中率指标

<!-- 知识类型: 配置参数 -->

通过以下接口获取 BE 节点的缓存统计信息（`brpc_port` 默认为 8060）：

```bash
curl {be_ip}:{brpc_port}/vars
```

返回的指标名称以磁盘路径为前缀，例如前缀 `_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_` 表示路径 `/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/`。去掉路径前缀后，各指标含义如下（大小单位均为字节）：

| 指标名称（不含路径前缀） | 含义 |
|---|---|
| `file_cache_cache_size` | 当前 File Cache 总大小 |
| `file_cache_disposable_queue_cache_size` | 当前 Disposable 队列大小 |
| `file_cache_disposable_queue_element_count` | 当前 Disposable 队列元素个数 |
| `file_cache_disposable_queue_evict_size` | 启动至今 Disposable 队列累计淘汰数据量 |
| `file_cache_index_queue_cache_size` | 当前 Index 队列大小 |
| `file_cache_index_queue_element_count` | 当前 Index 队列元素个数 |
| `file_cache_index_queue_evict_size` | 启动至今 Index 队列累计淘汰数据量 |
| `file_cache_normal_queue_cache_size` | 当前 Normal 队列大小 |
| `file_cache_normal_queue_element_count` | 当前 Normal 队列元素个数 |
| `file_cache_normal_queue_evict_size` | 启动至今 Normal 队列累计淘汰数据量 |
| `file_cache_total_evict_size` | 启动至今整个 File Cache 累计淘汰数据量 |
| `file_cache_ttl_cache_evict_size` | 启动至今 TTL 队列累计淘汰数据量 |
| `file_cache_ttl_cache_lru_queue_element_count` | 当前 TTL 队列元素个数 |
| `file_cache_ttl_cache_size` | 当前 TTL 队列大小 |
| `file_cache_evict_by_heat_[A]_to_[B]` | 为写入 B 类型缓存而淘汰的 A 类型缓存数据量（基于过期时间的淘汰方式） |
| `file_cache_evict_by_size_[A]_to_[B]` | 为写入 B 类型缓存而淘汰的 A 类型缓存数据量（基于空间的淘汰方式） |
| `file_cache_evict_by_self_lru_[A]` | A 类型缓存为写入新数据而淘汰自身的数据量（基于 LRU 的淘汰方式） |

### SQL Profile 缓存指标

SQL Profile 中缓存相关指标位于 `SegmentIterator` 节点下：

| 指标名称 | 含义 |
|---|---|
| `BytesScannedFromCache` | 从 File Cache 读取的数据量 |
| `BytesScannedFromRemote` | 从远程存储读取的数据量 |
| `BytesWriteIntoCache` | 写入 File Cache 的数据量 |
| `LocalIOUseTimer` | 读取 File Cache 的耗时 |
| `NumLocalIOTotal` | 读取 File Cache 的次数 |
| `NumRemoteIOTotal` | 读取远程存储的次数 |
| `NumSkipCacheIOTotal` | 从远程存储读取但未写入 File Cache 的次数 |
| `RemoteIOUseTimer` | 读取远程存储的耗时 |
| `WriteCacheIOUseTimer` | 写入 File Cache 的耗时 |

您可以通过[查询性能分析](../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile)查看完整的查询性能报告。

## TTL 缓存策略

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 热点表常驻缓存 / 防止大查询驱逐热点数据 -->

TTL（Time-To-Live）缓存策略允许为特定表的数据设置缓存保留时长，保证热点小表或近期导入数据在缓存中有足够的保留时间，避免被大查询的 LRU 淘汰逻辑替换。

### 建表时设置 TTL

在 `CREATE TABLE` 的 `PROPERTIES` 中设置 `file_cache_ttl_seconds`（单位：秒）：

```sql
CREATE TABLE IF NOT EXISTS customer (
    C_CUSTKEY     INTEGER NOT NULL,
    C_NAME        VARCHAR(25) NOT NULL,
    C_ADDRESS     VARCHAR(40) NOT NULL,
    C_NATIONKEY   INTEGER NOT NULL,
    C_PHONE       CHAR(15) NOT NULL,
    C_ACCTBAL     DECIMAL(15,2) NOT NULL,
    C_MKTSEGMENT  CHAR(10) NOT NULL,
    C_COMMENT     VARCHAR(117) NOT NULL
)
DUPLICATE KEY(C_CUSTKEY, C_NAME)
DISTRIBUTED BY HASH(C_CUSTKEY) BUCKETS 32
PROPERTIES (
    "file_cache_ttl_seconds" = "300"
);
```

上表中，所有新导入的数据将在缓存中保留 300 秒。

### 修改表的 TTL 设置

```sql
ALTER TABLE customer SET ("file_cache_ttl_seconds" = "3000");
```

:::info 备注
修改后的 TTL 值不会立即生效，存在一定延迟。若建表时未设置 TTL，同样可通过 `ALTER TABLE` 语句补充设置。
:::

## 实践案例

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 混合大小表场景 / TTL 策略调优 -->

**场景描述：**

某用户拥有一系列数据表，总数据量超过 3 TB，可用缓存容量仅为 1.2 TB。其中有两张高频访问表：

| 表名 | 大小 | 访问特征 |
|---|---|---|
| `dimension_table`（维度表） | 200 MB | 访问频繁，数据变动不大 |
| `fact_table`（事实表） | 100 GB | 每日新增数据导入，需要 T+1 查询 |

其他大表访问频率较低。

**问题：** 在默认 LRU 策略下，大表查询可能将维度表数据从缓存中淘汰，导致维度表查询性能波动。

**解决方案：** 为两张高频表分别设置 TTL，保证其数据在缓存中的保留时长。

```sql
-- 维度表：数据量小，变动不大，设置 1 年 TTL 确保常驻缓存
ALTER TABLE dimension_table SET ("file_cache_ttl_seconds" = "31536000");

-- 事实表：每日全量导入，设置 1 天 TTL 与导入周期对齐
ALTER TABLE fact_table SET ("file_cache_ttl_seconds" = "86400");
```

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 缓存命中率低 / 缓存配置问题排查 -->

**Q：缓存命中率低，查询仍然慢，如何排查？**

1. 通过 `curl {be_ip}:{brpc_port}/vars` 检查各队列的 `evict_size` 指标，判断是否存在频繁淘汰。
2. 查看 SQL Profile 中的 `BytesScannedFromRemote` 与 `BytesScannedFromCache` 比值，确认命中情况。
3. 若大查询频繁驱逐热点数据，考虑启用**缓存配额**功能（`enable_file_cache_query_limit`）或为热点表配置 **TTL 策略**。

**Q：BE 重启后缓存数据丢失？**

检查 `clear_file_cache` 配置是否被设置为 `true`。若不希望重启清空缓存，将其设置为 `false`（默认值）。

**Q：新计算组上线后首次查询很慢？**

使用**缓存预热**功能，提前将热点表或分区数据从远端存储拉取到新计算组的本地缓存中。具体用法详见 [WARM-UP SQL 文档](#)。

**Q：如何判断当前缓存空间是否已满？**

通过 `file_cache_cache_size` 指标与 `file_cache_path` 中配置的 `total_size` 进行对比。若接近上限，可检查是否需要扩容或调整各队列的占用比例。
