---
{
    "title": "元数据缓存",
    "language": "zh-CN",
    "description": "为了提升访问外部数据源的性能，Apache Doris 会对外部数据源的元数据进行缓存。"
}
---

为了提升访问外部数据源的性能，Apache Doris 会对外部数据源的**元数据**进行缓存。

元数据包括库、表、列信息、分区信息、快照信息、文件列表等。

本文详细介绍缓存的元数据的种类、策略和相关参数配置。

关于**数据缓存**，可参阅[数据缓存文档](./data-cache.md)。

:::tip
该文档适用于 2.1.6 之后的版本。
:::

## 缓存策略

大多数缓存都有如下三个策略指标：

- 最大缓存数量

    缓存所能容纳的最大对象个数。如最多缓存 1000 张表。当缓存数量超过阈值后，会使用 LRU（Least-Recent-Used）策略移除部分缓存。

- 淘汰时间

    - 3.0.6（含）版本前：

        缓存对象写入缓存一段时间后，该对象会被自动从缓存中移除，下次访问时，会重新从数据源拉取最新的信息并更新缓存。

        比如用户在 08:00 第一访问表 A，并写入缓存。若淘汰时间为 4 小时。则在没有因容量问题被汰换的情况下，用户在之后的 08:00-14:00 之间，都会直接访问缓存中的表 A。14:00 后，缓存被淘汰。若用户再次访问表 A，会从数据源拉取最新的信息并更新缓存。

    - 3.0.7（含）版本后：

        3.0.7 版本开始，此策略修改为 **缓存对象被访问** 一段时候，该对象会被自动从缓存中移除。而不是 **写入** 一段时间后。每次缓存对象被访问，都会重新计时，以确保频繁被访问的对象始终在缓存中。

        比如用户在 08:00 第一访问表 A，并写入缓存。若淘汰时间为 4 小时。则在没有因容量问题被汰换的情况下，用户在之后的 08:00-14:00 之间，都会直接访问缓存中的表 A。假设用户在 09:00 时又访问了这个对象，则缓存淘汰时间将重新从 09:00 开始计算，即变为 15:00。

- 最短刷新时间

    缓存对象写入缓存一段时间后，会自动触发刷新。

    比如用户在 08:00 第一访问表 A，并写入缓存。若最短刷新时间为 10 分钟。则在没有因容量问题被汰换的情况下，用户在之后的 08:00-8:10 之间，都会直接访问缓存中的表 A。08:10，该缓存对象会被标记为【准备刷新】，当用户再次访问这个缓存对象时，仍会返回当前对象，但会同时触发缓存刷新操作。假设缓存更新需要 1 分钟，则 1 分钟后再次访问缓存，会得到更新后的缓存对象。

    注意，触发缓存刷新的时间是在【超过最短刷新时间后，第一次访问该缓存对象时】，并且是异步刷新。所以比如最短刷新时间是 10 分钟，并不意味着 10 分钟后一定会获取到最新的对象。

    该策略有别于【淘汰时间】，主要用于调整缓存的时效性，并且通过异步刷新的方式避免缓存更新阻塞当前操作。

## 缓存类型

### 库、表名称列表

库名称列表（Database name list）指的是一个 Catalog 下所有库的名称的列表。

表名称列表（Table name list）指的是一个库下所有表的名称列表。

名称列表仅用于需要列举名称得操作，如 `SHOW TABLES` 或 `SHOW DATABASES` 语句。

每个 Catalog 下都一个库名称列表缓存。每个库下都有一个表名称列表缓存。

- 最大缓存数量

    每个缓存有且仅有一个条目。所以最大缓存数量为 1。

- 淘汰时间

    固定 86400 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时的在 Doris 中查看到最新的名称列表，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

### 库、表对象

缓存单独的库和表对象。任何对库、表的访问操作，如查询、写入等，都会从这个缓存中获取对应的对象。

注意，该缓存中的对象所组成的列表，可能与**库、表名称列表**缓存中的不一致。

比如通过 `SHOW TABLES` 命令，从名称列表缓存中获取到 `A`、`B`、`C` 三个表。假设此时外部数据源增加了表 `D`，那么 `SELECT * FROM D` 可以访问到表 `D`，同时【表对象】缓存里会增加表 `D` 对象，但【表名称列表】缓存中可能依然是 `A`、`B`、`C`。只有当【表名称列表】缓存刷新后，才会变成 `A`、`B`、`C`、`D`。

每个 Catalog 下都一个库名称列表缓存。每个库下都有一个表名称列表缓存。

- 最大缓存数量

    由 FE 配置项 `max_meta_object_cache_num` 控制，默认为 1000。可以根据单个 Catalog 下数据库的数量，或单个数据库下表的数量，适当调整这个参数。

- 淘汰时间

    固定 86400 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时的在 Doris 中到最新的库或表，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

### 表 Schema

缓存表的 Schema 信息，如列名等。该缓存主要用于按需加载被访问到的表的 Schema，以防止同步大量不需要被访问的表的 Schema 而占用 FE 的内存。

该缓存由所有 Catalog 共享，全局唯一。

- 最大缓存数量

    由 FE 配置项 `max_external_schema_cache_num` 控制，默认为 10000。

    可以根据一个 Catalog 下所有表的数量，适当调整这个参数。

- 淘汰时间

    固定 86400 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时的在 Doris 中访问到最新的 Schema，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

### Hive Metastore 表分区列表

用于缓存从 Hive Metastore 同步过来的表的分区列表。分区列表用于查询是进行分区裁剪。

该缓存，每个 Hive Catalog 有一个。

- 最大缓存数量

    由 FE 配置项 `max_hive_partition_table_cache_num` 控制，默认为 1000。

    可以根据一个 Catalog 下所有表的数量，适当调整这个参数。

- 淘汰时间

    固定 28800 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时的在 Doris 中访问到最新的分区列表，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

### Hive Metastore 表分区属性

用于缓存 Hive 表，每个分区的属性，如文件格式，分区根路径等。每个查询，经过分区裁剪得到要访问的分区列表后，会通过该缓存获取每个分区的详细属性。

该缓存，每个 Hive Catalog 有一个。

- 最大缓存数量

    由 FE 配置项 `max_hive_partition_cache_num` 控制，默认为 10000。

    可以根据一个 Catalog 下，所需要访问的分区的总数量，适当调整这个参数。

- 淘汰时间

    固定 28800 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时的在 Doris 中访问到最新的分区属性，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

### Hive Metastore 表分区文件列表

用于缓存 Hive 表，单个分区下的文件列表信息。该缓存用于降低文件系统的 List 操作带来的开销。

- 最大缓存数量

    由 FE 配置项 `max_external_file_cache_num` 控制，默认为 100000。

    可以根据所需要访问的文件数量，适当调整这个参数。

- 淘汰时间

    默认 28800 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

    如果 Catalog 属性中设置了 `file.meta.cache.ttl-second` 属性。则使用设置的时间。

    某些情况下，Hive 表的数据文件会频繁变动，导致缓存无法满足时效性。可以通过将该参数设置为 0，关闭该缓存。这种情况下，每次都会实时获取文件列表进行查询，性能可能降低，文件时效性提升。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时的在 Doris 中访问到最新的分区属性，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

### Hudi 表分区

用于缓存 Hudi 表的分区信息。

该缓存，每个 Hudi Catalog 有一个。

- 最大缓存数量

    由 FE 配置项 `max_external_table_cache_num` 控制，默认为 1000。

    可以根据 Hudi 表的数量，适当调整这个参数。

- 淘汰时间

    固定 28800 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时的在 Doris 中访问到最新的 Hudi 分区属性，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

### Iceberg 表信息

用于缓存 Iceberg 表对象。该对象通过 Iceberg API 加载并构建。

该缓存，每个 Iceberg Catalog 有一个。

- 最大缓存数量

    由 FE 配置项 `max_external_table_cache_num` 控制，默认为 1000。

    可以根据 Iceberg 表的数量，适当调整这个参数。

- 淘汰时间

    固定 28800 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时的在 Doris 中访问到最新的 Iceberg 表属性，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

### Iceberg 表 Snapshot

用于缓存 Iceberg 表的 Snapshot 列表。该对象通过 Iceberg API 加载并构建。

该缓存，每个 Iceberg Catalog 有一个。

- 最大缓存数量

    由 FE 配置项 `max_external_table_cache_num` 控制，默认为 1000。

    可以根据 Iceberg 表的数量，适当调整这个参数。

- 淘汰时间

    固定 28800 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时的在 Doris 中访问到最新的 Iceberg 表属性，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

## Iceberg 元数据缓存增强（4.0.3 版本起）

:::tip 版本说明
以下增强功能从 4.0.3 版本开始提供。对于早期版本，请参考上述基础缓存配置。
:::

从 4.0.3 版本开始，Doris 引入了全新的 Iceberg 元数据缓存架构，提供了更精细的可配置性、更好的性能和更清晰的语义。

### 整体架构

新的 Iceberg 元数据缓存架构包含两个核心缓存组件，每个 Iceberg Catalog 都有独立的缓存实例：

#### **架构层次**

**Iceberg Catalog**
└── **IcebergMetadataCache**（每个 Catalog 一个实例）
    ├── **1. Table Cache**（核心缓存）
    │   ├── 缓存内容
    │   │   ├── Table 对象（IcebergTableCacheValue）
    │   │   │   ├── Schema ID（表结构版本）
    │   │   │   ├── Current Snapshot ID（当前快照）
    │   │   │   ├── Partition Spec（分区规范）
    │   │   │   └── Snapshot 列表（懒加载，用于 MTMV）
    │   │   └── View 对象（独立缓存，配置相同）
    │   ├── 影响范围
    │   │   ├── ✓ Schema 版本
    │   │   ├── ✓ Snapshot 版本（数据可见性）
    │   │   └── ✓ Partition 信息
    │   └── 配置参数：`iceberg.table.meta.cache.ttl-second`
    │
    └── **2. Manifest Cache**（4.0.3 新增）
        ├── 缓存内容
        │   ├── 已解析的 DataFile 对象
        │   │   └── 文件路径、分区值、统计信息
        │   └── 已解析的 DeleteFile 对象
        │       └── Equality Delete 元数据
        ├── 影响范围
        │   ├── ✓ 仅影响查询性能
        │   └── ✗ 不影响数据正确性和可见性
        └── 配置参数：`iceberg.manifest.cache.enable`

#### **查询执行流程**

1. **Table Cache** 决定使用哪个 Snapshot
2. 根据 Snapshot 加载 Manifest List
3. **Manifest Cache** 加速 Manifest 文件的解析
4. 返回 DataFile 列表用于查询执行

#### **可选的外部缓存层**

- **Iceberg 原生 Manifest Cache**：缓存 Manifest 文件字节，加速 I/O（可选配置）
- **对象存储/HDFS**：存储原始 Manifest 文件

**关键设计要点：**

1. **Table Cache** 控制元数据版本和数据可见性
   - 缓存的是 Iceberg Table 对象，包含 Schema、Snapshot 等核心元数据
   - View Cache 与 Table Cache 独立但配置相同
   - TTL 过期或设为 0 时，会强制重新加载，看到最新数据

2. **Manifest Cache** 仅优化查询性能
   - 缓存的是已解析的 Manifest 文件内容（DataFile/DeleteFile 对象）
   - Manifest 文件不可变，因此缓存不影响数据正确性
   - 即使缓存了旧的 Manifest，Table Cache 会控制使用哪个 Snapshot

3. **两级缓存协同工作**
   - 可选配合 Iceberg 原生 Manifest Cache，形成三级缓存
   - 原生缓存加速 I/O，Doris Manifest Cache 加速解析

### 缓存组件详解

#### 1. Table Cache（表缓存）

**功能定位：**

Table Cache 是 Iceberg 元数据缓存的核心组件，负责缓存 Iceberg Table 对象，控制查询使用的元数据版本。这是整个缓存体系中最关键的部分。

:::info 关于 View Cache
`IcebergMetadataCache` 同时包含一个 View Cache 用于缓存 Iceberg View 对象，其工作原理与 Table Cache 类似。本文档主要介绍 Table Cache，View Cache 的配置和行为与之一致。
:::

**缓存内容：**

Table Cache 缓存的核心对象是 `IcebergTableCacheValue`，包含：

| 组成部分 | 包含信息 | 用途 |
|---------|----------|------|
| **Iceberg Table 对象** | • Schema ID（表结构版本）<br>• Current Snapshot ID（当前快照）<br>• Partition Spec（分区规范）<br>• Table Properties（表属性） | 决定查询看到的数据版本和表结构 |
| **Snapshot 信息**<br>（懒加载） | • Snapshot 信息<br>• Partition 信息 | 主要用于多表物化视图（MTMV）场景 |

**对数据可见性的影响：**

Table Cache 是唯一控制数据可见性的缓存组件，直接影响：

| 影响维度 | 说明 | 缓存滞后的后果 |
|---------|------|---------------|
| **Schema（表结构）** | `schemaId` 决定查询看到的列定义 | 看不到新增/修改的列 |
| **Snapshot（数据版本）** | `currentSnapshotId` 决定查询哪个数据快照 | 看不到最新写入的数据 |
| **Partition（分区信息）** | Partition Spec 和 Snapshot 决定分区元数据 | 分区列表不是最新状态 |

:::warning 重要
**Table Cache 是数据新鲜度的唯一控制点：**
- 要看到最新数据，必须刷新或禁用 Table Cache
- 设置 `iceberg.table.meta.cache.ttl-second=0` 可禁用缓存，强制每次查询都获取最新元数据
- Manifest Cache 和其他缓存不影响数据可见性
:::

#### 2. Manifest Cache（Manifest 缓存）

**功能定位：**

Manifest Cache 是 4.0.3 版本新引入的纯性能优化组件，通过缓存已解析的 Manifest 文件内容来加速查询执行。

**缓存内容：**

Manifest Cache 存储的是**已解析的对象**，而非原始文件字节：

| 缓存对象 | 包含信息 | 用途 |
|---------|----------|------|
| `DataFile` 对象 | • 文件路径<br>• 分区值<br>• 记录数<br>• 文件大小<br>• 列统计信息（min/max/null count） | 用于文件扫描规划和分区裁剪 |
| `DeleteFile` 对象 | • Delete 文件路径<br>• Delete 条件<br>• 相关 DataFile 引用 | 用于 MOR (Merge-On-Read) 查询 |

**性能收益：**

Manifest Cache 提供两方面的性能优化：

1. **减少 I/O 开销**：避免重复读取相同的 Manifest 文件
2. **减少 CPU 开销**：避免重复解析 Avro 格式的 Manifest 文件

:::tip 性能最佳实践
**推荐启用三级缓存架构以获得最佳性能：**

```sql
CREATE CATALOG iceberg_catalog PROPERTIES (
    'type' = 'iceberg',
    ...
    -- Level 1: Iceberg 原生文件 I/O 缓存
    'io.manifest.cache-enabled' = 'true',

    -- Level 2: Doris Manifest 对象缓存
    'iceberg.manifest.cache.enable' = 'true',
    'iceberg.manifest.cache.capacity-mb' = '1024'
);
```

**三级缓存协同工作：**
1. **对象存储/HDFS** → 原始 Manifest 文件
2. **Iceberg 原生缓存** → 缓存文件字节，加速 I/O
3. **Doris Manifest Cache** → 缓存解析后的 DataFile/DeleteFile 对象，跳过解析
:::

**关于数据正确性的重要说明：**

:::info Manifest 不可变特性
Iceberg 的 Manifest 文件遵循**不可变（Immutable）设计**：

- **新提交创建新文件**：每次数据提交都会生成新的 Manifest 文件，不会修改已有文件
- **文件内容永不改变**：一旦创建，Manifest 文件内容永远不会被修改
- **通过路径标识唯一性**：相同路径的 Manifest 文件内容始终一致

**因此：**
- ✅ Manifest Cache **不影响数据正确性**
- ✅ Manifest Cache **不影响数据可见性**
- ✅ 即使缓存了"旧"的 Manifest 文件，也不会看到错误数据
  - Table Cache 控制使用哪个 Snapshot
  - Snapshot 决定读取哪些 Manifest 文件
  - 即使某个 Manifest 被缓存了，只要不在当前 Snapshot 的 Manifest List 中，就不会被使用
- ❌ 禁用 Manifest Cache **不会**让您看到更新的数据，只会降低性能
:::

### 配置参数

#### Table Cache 配置

Table Cache 支持在 Catalog 级别和 FE 全局级别进行配置。

:::info
View Cache 使用与 Table Cache 相同的配置参数，无需单独配置。
:::

**Catalog 级别参数**

| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| `iceberg.table.meta.cache.ttl-second` | `86400`（24 小时） | Table 元数据缓存的过期时间（秒）<br>• 同时控制 Table Cache 和 View Cache<br>• 设置为 `0` 禁用缓存，强制每次重新加载<br>• 建议生产环境设置 1-2 小时 |

**FE 全局参数（`fe.conf`）**

| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| `external_cache_expire_time_seconds_after_access` | `86400`（24 小时） | 全局默认的缓存过期时间（秒）<br>当 Catalog 未指定 TTL 时使用 |
| `max_external_table_cache_num` | `1000` | 单个 Catalog 最大缓存的 Table/View 数量 |
| `external_cache_refresh_time_minutes` | `10` | 缓存异步刷新的最小间隔（分钟）<br>在后台更新未过期的缓存，不阻塞查询 |

:::info 参数优先级
Catalog 级别 `iceberg.table.meta.cache.ttl-second` > FE 全局 `external_cache_expire_time_seconds_after_access`
:::

#### Manifest Cache 配置

Manifest Cache 仅支持 Catalog 级别配置：

| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| `iceberg.manifest.cache.enable` | `false` | 是否启用 Manifest 缓存<br>• **建议启用**以提升查询性能 |
| `iceberg.manifest.cache.capacity-mb` | `1024` | 最大缓存容量（MB）<br>• 根据表数量和查询频率调整<br>• 达到上限后使用 LRU 策略淘汰 |
| `iceberg.manifest.cache.ttl-second` | `172800`（48 小时） | 缓存条目的过期时间（秒）<br>• Manifest 文件不可变，可以设置较长 TTL |
| `io.manifest.cache-enabled` | `false` | Iceberg 原生 Manifest I/O 缓存<br>• **建议与 Doris Manifest Cache 一起启用** |

### 配置示例

#### 示例 1：生产环境推荐配置（平衡性能与数据新鲜度）

```sql
CREATE CATALOG iceberg_prod PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://your-hive-metastore:9083',

    -- Table Cache: 1 小时 TTL，平衡数据新鲜度和性能
    'iceberg.table.meta.cache.ttl-second' = '3600',

    -- Manifest Cache: 启用并配置合理容量
    'iceberg.manifest.cache.enable' = 'true',
    'iceberg.manifest.cache.capacity-mb' = '2048',
    'iceberg.manifest.cache.ttl-second' = '172800',

    -- Iceberg 原生缓存: 配合使用
    'io.manifest.cache-enabled' = 'true'
);
```

同时在 `fe.conf` 中设置：
```properties
external_cache_refresh_time_minutes = 5    # 5 分钟异步刷新
max_external_table_cache_num = 2000        # 根据表数量调整
```

**此配置的效果：**
- ✅ Table Cache 1 小时过期，访问时同步重新加载最新元数据
- ✅ 每 5 分钟后台异步刷新，大多数时候能看到 5 分钟内的最新数据
- ✅ Manifest Cache 加速查询，减少 I/O 和解析开销
- ✅ 三级缓存协同工作，性能最优

#### 示例 2：开发/测试环境配置（优先数据实时性）

```sql
CREATE CATALOG iceberg_dev PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://your-hive-metastore:9083',

    -- Table Cache: 禁用，始终获取最新元数据
    'iceberg.table.meta.cache.ttl-second' = '0',

    -- Manifest Cache: 仍然可以启用，不影响数据新鲜度
    'iceberg.manifest.cache.enable' = 'true',
    'iceberg.manifest.cache.capacity-mb' = '512'
);
```

**此配置的效果：**
- ✅ 每次查询都获取最新的 Table 元数据，看到最新数据
- ✅ Manifest Cache 仍然工作，提升性能但不影响数据正确性
- ⚠️ 每次查询都需要访问 Metastore，延迟略高

#### 示例 3：高性能只读场景（优先查询性能）

```sql
CREATE CATALOG iceberg_readonly PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://your-hive-metastore:9083',

    -- Table Cache: 较长 TTL，减少 Metastore 访问
    'iceberg.table.meta.cache.ttl-second' = '7200',

    -- Manifest Cache: 大容量，长 TTL
    'iceberg.manifest.cache.enable' = 'true',
    'iceberg.manifest.cache.capacity-mb' = '4096',
    'iceberg.manifest.cache.ttl-second' = '259200',  -- 3 天

    -- Iceberg 原生缓存
    'io.manifest.cache-enabled' = 'true'
);
```

同时在 `fe.conf` 中设置：
```properties
external_cache_refresh_time_minutes = 30   # 减少刷新频率
max_external_table_cache_num = 5000        # 更大的缓存容量
```

**此配置的效果：**
- ✅ Table Cache 2 小时过期，显著减少 Metastore 访问
- ✅ 大容量 Manifest Cache，查询性能最优
- ⚠️ 适合元数据变更不频繁的场景
- ⚠️ 如需看到最新数据，需要手动 REFRESH

#### 示例 4：仅启用 Manifest Cache（不影响数据新鲜度的性能优化）

```sql
CREATE CATALOG iceberg_balance PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://your-hive-metastore:9083',

    -- Table Cache: 禁用，始终获取最新元数据
    'iceberg.table.meta.cache.ttl-second' = '0',

    -- Manifest Cache: 启用，仅优化性能
    'iceberg.manifest.cache.enable' = 'true',
    'iceberg.manifest.cache.capacity-mb' = '2048',

    -- Iceberg 原生缓存
    'io.manifest.cache-enabled' = 'true'
);
```

**此配置的效果：**
- ✅ 始终看到最新的 Snapshot 和 Schema
- ✅ Manifest 解析性能仍然优化
- ✅ 适合需要数据实时性但查询性能也很重要的场景

## 缓存刷新

除了上述每个缓存各自的刷新和淘汰策略外，用户也可以通过手动或定时的方式直接刷新元数据缓存。

### 手动刷新

用户可以通过 `REFRESH` 命令手动刷新元数据。

1. REFRESH CATALOG

    刷新指定 Catalog。

    `REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");`

    - 该命令会刷新指定 Catalog 的库列表，表列名以及所有缓存信息等。
    - `invalid_cache` 表示是否要刷新分区和文件列表等缓存。默认为 true。如果为 false，则只会刷新 Catalog 的库、表列表，而不会刷新分区和文件列表等缓存信息。该参数适用于，用户只想同步新增删的库表信息时，可以设置为 false。

2. REFRESH DATABASE

    刷新指定 Database。

    `REFRESH DATABASE [ctl.]db1 PROPERTIES("invalid_cache" = "true");`

    - 该命令会刷新指定 Database 的表列名以及 Database 下的所有缓存信息等。
    - `invalid_cache` 属性含义同上。默认为 true。如果为 false，则只会刷新 Database 的表列表，而不会刷新缓存信息。该参数适用于，用户只想同步新增删的表信息时。

3. REFRESH TABLE

    刷新指定 Table。

    `REFRESH TABLE [ctl.][db.]tbl1;`

    - 该命令会刷新指定 Table 下的所有缓存信息等。

### 定时刷新

用户可以在创建 Catalog 时，设置该 Catalog 的定时刷新。

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'metadata_refresh_interval_sec' = '3600'
);
```

在上例中，`metadata_refresh_interval_sec` 表示每 3600 秒刷新一次 Catalog。相当于每隔 3600 秒，自动执行一次：

`REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");`

## 最佳实践

缓存可以显著提升元数据的访问性能，避免频繁的远程访问元数据导致性能抖动或者对元数据服务造成压力。但同时，缓存会降低数据的时效性。比如缓存刷新时间是 10 分钟，则在十分钟内，只能读到缓存的元数据。因此，需要根据情况，合理的设置缓存。

### 默认行为

这里主要介绍，默认参数配置情况下，用户可能关注的缓存行为。

- 外部数据源新增库、表后，在 Doris 中可以通过 SELECT 实时查询到。但 SHOW DATABASES 和 SHOW TABLES 可能看不到，需要手动刷新缓存，或最多等待 10 分钟。
- 外部数据源新增分区，需要手动刷新缓存，或最多等待 10 分钟后，可以查询到新分区的数据。
- 分区数据文件变动，需要手动刷新缓存，或最多等待 10 分钟后，可以查询到新分区的数据。

### 关闭 Schema 缓存

对于所有类型的 External Catalog，如果希望实时可见最新的 Table Schema，可以关闭 Schema Cache：

- 全局关闭

    ```text
    -- fe.conf
    max_external_schema_cache_num=0 // 关闭 Schema 缓存。
    ```

- Catalog 级别关闭

    ```text
    -- Catalog property
    "schema.cache.ttl-second" = "0" // 针对某个 Catalog，关闭 Schema 缓存（2.1.11, 3.0.6 支持）
    ```

:::note
对于 **Iceberg Catalog**，仅关闭 Schema Cache **不能**保证实时看到最新的 Schema。schemaId 是从缓存的 Table 对象中获取的（由 Table Cache 控制）。要看到最新的 Schema，必须关闭 Table Cache。

对于 **4.0.3 及以上版本**，在 Catalog 属性中使用 `iceberg.table.meta.cache.ttl-second=0`。详细信息请参考 [Iceberg 元数据缓存增强](#iceberg-元数据缓存增强403-版本起)。

Schema Cache 只影响是否重新解析 Schema（性能优化），不影响使用哪个版本的 Schema。
:::

设置完成后，Doris 会实时可见最新的 Table Schema。但此设置可能会增加元数据服务的压力。

### 关闭 Hive Catalog 元数据缓存

针对 Hive Catalog，如果想关闭缓存来查询到实时更新的数据，可以配置以下参数：

- 全局关闭

    ```text
    -- fe.conf
    max_external_file_cache_num=0    // 关闭文件列表缓存
    max_hive_partition_table_cache_num=0  // 关闭分区列表缓存
    ```

- Catalog 级别关闭

    ```text
    -- Catalog property
    "file.meta.cache.ttl-second" = "0" // 针对某个 Catalog，关闭文件列表缓存
    "partition.cache.ttl-second" = "0" // 针对某个 Catalog，关闭分区列表缓存（2.1.11, 3.0.6 支持）
    ```

设置以上参数后：

- 外部数据源新增分区可以实时查询到。
- 分区数据文件变动可以实时查询到。

但会增加外部源数据（如 Hive Metastore 和 HDFS）的访问压力，可能导致元数据访问延迟不稳定等现象。

### 关闭 Iceberg Catalog 元数据缓存

针对 Iceberg Catalog，如果想关闭缓存来查询到实时更新的数据，可以配置以下参数：

- **4.0.3 及以上版本**：

    ```sql
    CREATE CATALOG iceberg_catalog PROPERTIES (
        'type' = 'iceberg',
        ...
        'iceberg.table.meta.cache.ttl-second' = '0'       -- 关闭表/视图缓存
        -- 注意：Manifest 缓存默认是关闭的，无需显式设置
    );
    ```

    详细信息请参考 [Iceberg 元数据缓存增强（4.0.3 版本起）](#iceberg-元数据缓存增强403-版本起)。

- **4.0.3 之前的版本**：

    使用全局 FE 配置来控制缓存行为：

    ```text
    -- fe.conf
    max_external_table_cache_num=0  // 全局禁用表缓存
    ```

设置以上参数后：

- 新的表 Snapshot 可以实时查询到。

:::note
在 4.0.3+ 版本中，Manifest Cache **默认是关闭的**。由于 Iceberg 的 Manifest 文件是**不可变的**（创建后永远不会被修改），**Manifest Cache 不影响最新数据的可见性**。当向 Iceberg 表提交新数据时，会创建新的 Manifest 文件，表的快照会更新以引用这些新 Manifest。是 **Table Cache** 控制了使用哪个快照版本，从而影响数据可见性。通过禁用 Table Cache（如上所示），可以确保查询始终使用最新的快照。
:::

但会增加外部数据源（如 Iceberg Catalog 服务和对象存储）的访问压力，可能导致元数据访问延迟不稳定等现象。
