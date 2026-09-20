---
{
    "title": "外表元数据缓存内存管理",
    "language": "zh-CN",
    "description": "介绍受管理外表元数据缓存在 FE、Catalog 和缓存模块三个层级的内存上限，以及 Hive、Iceberg、Paimon、Hudi、MaxCompute 等 Catalog 受管理的缓存模块。",
    "keywords": ["外表元数据缓存", "元数据缓存内存上限", "meta.cache.max-weight", "external_meta_cache_max_weight", "FE 内存", "catalog_meta_cache_statistics"]
}
---

自 Doris 4.1.4 起，受管理的外表元数据缓存可以按估算的保留内存设置上限，避免单张大表、单个 Catalog 或多个 Catalog 的元数据持续占用 FE Heap。

适用场景：

- Hive 表的分区或文件数量很多，分区和文件列表结构占用大量内存。
- Iceberg 表的元数据、分区投影或 Manifest 很大。
- Paimon 表的分区投影很大。
- 一个 FE 同时服务多个 Catalog，需要防止某个 Catalog 独占元数据缓存内存。

:::tip
Doris 4.1.x/4.2.x 与当前版本受管理的缓存模块集合和模块名不同。集群为 4.1.x 或 4.2.x 时，请切换到本页的 4.x 版本。
:::

:::caution
内存上限只覆盖本文列出的受管理元数据缓存，不是 FE Heap 的硬上限。加载过程中的临时内存、仍被运行中查询引用的元数据对象、连接器 SDK 自带的缓存，以及 Catalog 客户端、线程池等共享运行时基础设施都不在配额之内。
:::

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 配置 FE、Catalog 和缓存模块的内存上限 -->
## 快速开始

前置条件：

- 已存在一个外表 Catalog，例如 Hive、Iceberg 或 Paimon。
- 拥有修改 FE 配置和目标 Catalog 的权限。
- 所有 FE 均为 Doris 4.1.4 或更高版本。

### 1. 配置 FE 总上限

在每台 FE 的 `fe.conf` 中设置：

```properties
external_meta_cache_max_weight = 10%
```

该 FE 上所有受管理的外表元数据缓存合计最多使用 JVM 最大堆的 10%。修改后需要重启 FE。

也可以使用固定大小：

```properties
external_meta_cache_max_weight = 8GB
```

### 2. 限制单个 Catalog

以下示例将 `hive_ctl` 中受管理的元数据缓存合计限制为 4 GB：

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB"
);
```

修改后，Doris 会清空该 Catalog 已初始化的缓存，并在下一次访问时按新配置重建。

:::tip
`meta.cache.max-weight` 在没有配置 FE 总上限时同样生效。此时它只限制当前 Catalog，不限制该 FE 上所有 Catalog 的合计。
:::

### 3. 限制具体缓存模块

以下示例同时设置 Catalog 上限和 Hive 各模块的上限：

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.file.max-weight" = "2GB",
    "meta.cache.hive.partition_view.max-weight" = "1GB"
);
```

`file` 和 `partition_view` 模块分别限制为 2 GB 和 1 GB，两者合计不能超过 4 GB 的 Catalog 上限，该 Catalog 仍受 FE 总上限约束。

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 理解 FE、Catalog 和模块上限的组合方式 -->
## 配额层级

外表元数据缓存支持三级内存限制：

| 层级 | 配置位置 | 配置项 | 取值格式 | 默认值 | 作用范围 |
|---|---|---|---|---|---|
| FE | `fe.conf` | `external_meta_cache_max_weight` | 固定大小，或 JVM 最大堆的百分比 | `0`，不启用 FE 总配额 | 当前 FE 上所有受管理的外表元数据缓存 |
| Catalog | Catalog 属性 | `meta.cache.max-weight` | 固定大小，必须为正数 | 未设置，不启用 Catalog 配额 | 当前 Catalog 下所有受管理的缓存模块 |
| 缓存模块 | Catalog 属性 | `meta.cache.<engine>.<entry>.max-weight` | 固定大小，必须为正数 | 未设置，仅受父级上限约束 | 一个缓存模块，或共用该模块名的一组缓存 |

模块的有效上限取其之上所有已配置上限中的最小值。不同配置组合的行为如下：

| FE 上限 | Catalog 上限 | 模块上限 | 实际行为 |
|---|---|---|---|
| 未设置 | 未设置 | 未设置 | 不做内存核算，只按条目数和 TTL 策略管理 |
| 已设置 | 未设置 | 未设置 | 该 FE 上所有受管理模块共享 FE 配额 |
| 未设置 | 已设置 | 未设置 | 该 Catalog 下所有受管理模块共享 Catalog 配额 |
| 未设置 | 未设置 | 已设置 | 只限制该模块，没有 FE 或 Catalog 级的合计上限 |
| 已设置 | 已设置 | 已设置 | 三级同时生效，以最严格者为准 |

校验规则：

- 模块上限不能超过同一 Catalog 的 Catalog 上限，否则 `CREATE CATALOG` 或 `ALTER CATALOG` 失败，报错 `meta.cache.<engine>.<entry>.max-weight can not exceed meta.cache.max-weight`。
- 每台 FE 按自己的 JVM 堆解析 `external_meta_cache_max_weight`。FE 堆大小不同时，同一个百分比得到的字节上限不同。

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 书写大小和百分比取值 -->
## 配置值格式

固定大小支持以下不区分大小写的二进制单位：

```text
B, KB, MB, GB, TB, PB
```

例如 `512MB`、`4GB`。固定大小必须是整数，不能为负数。

只有 `external_meta_cache_max_weight` 接受百分比，例如 `10%` 或 `12.5%`。百分比按每台 FE 自己的 JVM 最大堆计算。

`0` 在不同层级含义不同：

| 配置项 | `0` 的含义 |
|---|---|
| `external_meta_cache_max_weight` | 不启用 FE 总配额，缓存本身不受影响 |
| `meta.cache.max-weight` | 非法，Catalog 上限必须为正数 |
| `meta.cache.<engine>.<entry>.max-weight` | 非法，模块上限必须为正数 |

`0%` 非法。不启用 FE 总配额请直接写 `0`。需要关闭某个缓存模块时，请将其 `enable` 设为 `false` 或 `ttl-second` 设为 `0`，`max-weight` 不能用于关闭模块。

<!-- 知识类型: 能力清单 -->
<!-- 适用场景: 选择需要限制的缓存模块 -->
## 受管理的缓存模块

每个受管理的元数据缓存都带有内存估算器。只要有 FE、Catalog 或模块级任一上限作用于某个模块，该模块就按内存管理。不存在单独一组"只按条目数管理"的模块：没有任何上限时，所有模块只按各自的 `enable`、`ttl-second` 和 `capacity` 管理。

缓存模块通过 `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity,max-weight}` 配置。下表列出各引擎的 `<engine>`、`<entry>` 取值、在 `information_schema.catalog_meta_cache_statistics` 中显示的 `ENTRY_NAME`，以及默认值。只有表中列出的 `<entry>` 接受 `max-weight`；已知引擎下其他任何 `max-weight` 键都会使 `CREATE CATALOG` 或 `ALTER CATALOG` 失败，报错 `Unknown metadata cache weight property`。

### 所有外表 Catalog 的表结构缓存

| `<engine>` | `<entry>` | `ENTRY_NAME` | 缓存内容 | 默认 enable / TTL / capacity |
|---|---|---|---|---|
| `default` | `schema` | `schema` | 所有类型外表的列结构 | `true` / `external_cache_expire_time_seconds_after_access`（86400 秒）/ `max_external_schema_cache_num`（10000） |

旧 Catalog 属性 `schema.cache.ttl-second` 映射为 `meta.cache.default.schema.ttl-second`。

### Hive

`hive` 引擎用于 Hive Catalog，也用于 Hudi Catalog 的 Hive Metastore 缓存。

| `<entry>` | `ENTRY_NAME` | 缓存内容 | 默认 enable / TTL / capacity |
|---|---|---|---|
| `table` | `hive-table` | Hive Metastore 中的表对象 | `true` / 86400 秒 / 10000 |
| `partition_names` | `hive-partition-names` | 表的分区名列表 | `true` / 86400 秒 / 10000 |
| `partition` | `hive-partition` | 分区对象，包括 Location 和输入格式 | `true` / 86400 秒 / 100000 |
| `column_stats` | `hive-column-stats` | Hive Metastore 中的列统计信息 | `true` / 86400 秒 / 10000 |
| `file` | `hive-file` | 表或分区的文件列表 | `true` / 86400 秒 / 10000 |
| `partition_view` | `hive-partition-view` | 由分区名派生的分区裁剪结构 | `true` / 86400 秒 / 1000 |

旧属性与统一键的映射：`schema.cache.ttl-second` 对应 `meta.cache.hive.table.ttl-second`，`partition.cache.ttl-second` 对应 `meta.cache.hive.partition_names.ttl-second`，`file.meta.cache.ttl-second` 对应 `meta.cache.hive.file.ttl-second`。

包含 Iceberg 表的 Hive Metastore Catalog 同时使用下面的 `iceberg` 模块。

### Iceberg

| `<entry>` | `ENTRY_NAME` | 缓存内容 | 默认 enable / TTL / capacity |
|---|---|---|---|
| `table` | `iceberg-table` | 已加载的 Iceberg 表元数据 | `true` / `meta.cache.iceberg.table.ttl-second`（86400 秒）/ 1000 |
| `partition` | `iceberg-partition` | 表快照的原始分区数据 | `true` / 与 `table` 相同 / 1000 |
| `manifest` | `iceberg-manifest` | 解析后的 Manifest 内容；只有 `meta.cache.iceberg.manifest.enable` 为 `true`（默认 `false`）时扫描规划才会使用 | `true` / 不过期 / 100000 |
| `partition_view` | `iceberg.mvcc-partition-view`、`iceberg.list-partitions-view` | 两种派生分区投影，共用一份预算 | `true` / 86400 秒 / 1000 |

以下 Iceberg 缓存没有 `<entry>` 名，只受 Catalog 和 FE 总上限约束，TTL 取自 `meta.cache.iceberg.table.ttl-second`：

| `ENTRY_NAME` | 缓存内容 |
|---|---|
| `iceberg-latest-snapshot` | 表的最新 Snapshot ID |
| `iceberg-format` | 推断出的表文件格式 |
| `iceberg-comment` | 表注释；仅为使用 vended credentials 的 REST Catalog 创建 |
| `iceberg-equality-delete-field-ids` | Snapshot 的 equality delete 字段 ID |

:::note
`iceberg.rest.session` 为 `user` 时，不会创建 `table`、`partition`、`partition_view`、latest-snapshot 和 format 缓存，因为共享缓存会绕过按用户的鉴权。使用 vended credentials 的 REST Catalog 也不会创建 `table` 缓存。
:::

### Paimon

| `<entry>` | `ENTRY_NAME` | 缓存内容 | 默认 enable / TTL / capacity |
|---|---|---|---|
| `partition_view` | `paimon.partition-view` | 由表快照派生的分区投影 | `true` / 86400 秒 / 1000 |

以下 Paimon 缓存没有 `<entry>` 名，只受 Catalog 和 FE 总上限约束：

| `ENTRY_NAME` | 缓存内容 | TTL |
|---|---|---|
| `paimon-schema-at` | 表在指定 Snapshot 下的 Schema | 不过期；capacity 10000 |
| `paimon-latest-snapshot` | 表的最新 Snapshot ID | `meta.cache.paimon.table.ttl-second`（86400 秒）；capacity 1000 |

`meta.cache.paimon.table.ttl-second` 同时控制 Paimon 表结构缓存的 TTL。

### Hudi

Hudi Catalog 的缓存在系统表中显示在 `hudi` 引擎下，但它们就是 Hive Metastore 缓存，使用 `meta.cache.hive.<entry>.*` 键配置：`table`、`partition_names`、`partition` 和 `column_stats`。

### MaxCompute

| `<engine>` | `<entry>` | `ENTRY_NAME` | 缓存内容 | 默认 enable / TTL / capacity |
|---|---|---|---|---|
| `max_compute` | `partition` | `max-compute-partition` | 表的分区列表 | `true` / 600 秒 / 10000 |

### ADBC

| `<engine>` | `<entry>` | `ENTRY_NAME` | 缓存内容 | 默认 enable / TTL / capacity |
|---|---|---|---|---|
| `adbc` | `metadata` | `adbc-namespaces`、`adbc-table-names`、`adbc-table-schema` | 命名空间、表名和表结构，三个缓存共用一份预算 | `true` / 600 秒 / 1000 |

### Doris

Doris Catalog 在 `doris` 引擎下提供 `schema` 和 `backends` 两个模块，使用 `meta.cache.doris.<entry>.*` 键配置。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Hive、Iceberg、Paimon 的典型上限配置 -->
## 配置示例

### 只使用 Catalog 上限

没有 FE 总上限时，可以分别隔离各个 Catalog：

```sql
ALTER CATALOG hive_prod SET PROPERTIES (
    "meta.cache.max-weight" = "6GB"
);

ALTER CATALOG iceberg_ad_hoc SET PROPERTIES (
    "meta.cache.max-weight" = "2GB"
);
```

两个 Catalog 分别限制为 6 GB 和 2 GB，但它们在同一 FE 上的合计没有共同上限。

### 限制 Hive 文件列表和分区结构

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.file.max-weight" = "2GB",
    "meta.cache.hive.partition_view.max-weight" = "1GB"
);
```

文件很多的表的文件列表，以及分区很多的表的分区裁剪结构，通常是 Hive 中占用最大的模块。

### 限制 Iceberg 元数据并开启 Manifest 缓存

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.iceberg.table.max-weight" = "1GB",
    "meta.cache.iceberg.partition.max-weight" = "1GB",
    "meta.cache.iceberg.manifest.enable" = "true",
    "meta.cache.iceberg.manifest.max-weight" = "1GB"
);
```

### 限制 Paimon 分区投影

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "2GB",
    "meta.cache.paimon.partition_view.max-weight" = "1GB"
);
```

其余 Paimon 缓存受 2 GB 的 Catalog 上限约束。

### 同时使用内存上限和 TTL

内存上限可以与 `enable`、`ttl-second`、`capacity` 组合使用：

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.hive.file.enable" = "true",
    "meta.cache.hive.file.ttl-second" = "1800",
    "meta.cache.hive.file.capacity" = "20000",
    "meta.cache.hive.file.max-weight" = "2GB"
);
```

`capacity` 仍是条目数上限，`max-weight` 在其之上增加内存上限，任一先达到都会触发淘汰。`capacity=0` 或 `ttl-second=0` 仍表示关闭该模块。

<!-- 知识类型: 行为说明 -->
<!-- 适用场景: 理解准入拒绝及其对查询的影响 -->
## 达到内存上限时的行为

一次缓存未命中的处理流程如下：

1. Doris 从外部数据源加载元数据。
2. 估算已加载对象的保留内存，并加上 512 字节的固定核算开销。
3. 同时检查 FE、Catalog 和缓存模块三级配额。
4. 配额不足时，不将对象写入缓存，直接返回给当前请求，并异步请求其他模块释放冷数据。优先请求同一 Catalog 的其他模块；FE 总配额不足时再扩展到其他 Catalog。

被拒绝的对象不会导致查询失败。它不会被缓存，因此在异步回收释放出足够预算之前，后续访问会再次加载，查询规划耗时增加。

缓存命中不做估算。估算器分两类：

- 类型专用估算器负责 Hive Metastore 对象、Hive 文件列表、Iceberg 表元数据、Manifest，以及 Hive、Iceberg、Paimon 的派生分区投影。
- 通用估算器完整遍历其余缓存的对象图，并设有固定的访问次数预算。预算耗尽，或对象图中包含无法检查的类时，估算结果视为不完整。

估算不完整时拒绝缓存，而不是低估对象大小。拒绝原因记录在 `LAST_WEIGHT_REJECT_REASON` 中：

| 原因 | 含义 |
|---|---|
| `budget_exceeded` | FE、Catalog 或模块配额容纳不下该对象 |
| `entry_too_large` | 单个对象就超过了模块的有效上限 |
| `incomplete_estimate:<detail>` | 估算器无法可靠地估算该对象 |
| `invalid_zero_estimate` | 估算器返回了零 |

:::caution
配额检查发生在对象加载完成后的缓存准入阶段，不会在访问外部数据源前预留 Heap。因此，远端加载失败，或者单个超大对象在构建完成前已经耗尽 FE Heap，仍可能使当前请求失败。该功能限制的是成功加载后保留在缓存中的内存，不能作为单次元数据加载的 OOM 防护。
:::

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 不中断查询地应用上限变更 -->
## 配置生效与缓存刷新

- 修改 `external_meta_cache_max_weight` 后需要重启 FE。Catalog 初始化后该值不能再改变。
- 修改 `meta.cache.max-weight` 或 `schema.cache.ttl-second` 会丢弃该 Catalog 的全部元数据缓存；修改 `meta.cache.<engine>.<entry>.*` 只丢弃对应引擎的缓存。下一次访问按新配置重建。
- 已经在执行的查询继续使用已加载的对象。
- 当 FE 总上限或 Catalog 上限作用于 Paimon Catalog 时，默认关闭 Paimon SDK 自带的 `CachingCatalog`，避免出现第二份不计入配额的元数据缓存。显式配置 `paimon.cache-enabled` 时以用户配置为准。

内存上限只控制对象是否可以保留在缓存中，不改变外部元数据本身，也不代替 `REFRESH CATALOG`、TTL 或元数据事件同步。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 故障排查 / FE Heap 占用的性能调优 -->
## 监控与排查内存压力

系统表 [`catalog_meta_cache_statistics`](../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics) 为每个 FE、Catalog、元数据缓存引擎和缓存模块各输出一行。与内存治理相关的列如下：

| 列 | 含义 | 时间语义 |
|---|---|---|
| `MAX_WEIGHT` | 该模块生效的内存上限，单位为字节。`-1` 表示没有任何 FE、Catalog 或模块级上限作用于该模块。 | 配置值 |
| `ESTIMATED_WEIGHT` | 该模块当前已预留的估算字节数。 | 查询时刻的瞬时值 |
| `WEIGHT_REJECT_COUNT` | 因上述任一原因被拒绝的准入次数。 | 当前缓存实例的累计值 |
| `LAST_WEIGHT_REJECT_REASON` | 最近一次拒绝的原因。 | 最新值 |

修改 Catalog 属性导致缓存重建，或 FE 重启后，累计值会从零重新开始。系统表不保留历史样本，需要观察趋势时请定期采样。`max_weight >= 0` 的行即受内存管理的模块；上限本身来自 `fe.conf` 和 Catalog 属性。

准入被拒绝时，Doris 还会打印限流的告警日志，每个模块每分钟最多一条：

```text
Metadata cache entry 'hive-file' rejected a value by weight: reason=budget_exceeded, used=..., max=...
```

当 FE Heap 占用偏高并怀疑与外表元数据缓存有关时，可以按以下步骤排查。

### 1. 确认受管理缓存是否是主要来源

```sql
SELECT fe_host,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host
ORDER BY fe_host;
```

将汇总后的预留量与配置的 `external_meta_cache_max_weight` 和 FE Heap 总量对比。该值是估算的缓存保留内存，不是 FE 总堆。加载过程中的临时内存、运行中查询引用的对象以及连接器 SDK 自带的缓存都不在其中。如果 FE Heap 持续偏高而预留量很低，请直接看第 6 步。

### 2. 定位占用较多的 Catalog

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

将每个 Catalog 与其 `meta.cache.max-weight` 对比。关注预留量接近自身上限的 Catalog，以及在某一台 FE 上明显大于其他 FE 的 Catalog。

### 3. 下钻到缓存模块

```sql
SELECT engine_name, entry_name,
       estimated_weight, max_weight,
       weight_reject_count, last_weight_reject_reason
FROM information_schema.catalog_meta_cache_statistics
WHERE fe_host = '<fe_host>'
  AND catalog_name = '<catalog_name>'
  AND max_weight >= 0
ORDER BY estimated_weight DESC;
```

`estimated_weight` 接近 `max_weight` 的模块是该 Catalog 的主要占用者。`weight_reject_count` 持续上升且原因为 `budget_exceeded`，说明配额紧张：对象已加载并返回但无法保留，后续访问会再次加载。`entry_too_large` 表示单个对象超过了模块上限。`incomplete_estimate` 不是配额问题，对象会直接返回给请求而不进入缓存。

### 4. 选择控制手段

| 目标 | 配置项 | 生效方式 |
|---|---|---|
| 限制单台 FE 的总量 | `fe.conf` 中的 `external_meta_cache_max_weight` | 重启 FE 后生效 |
| 隔离单个 Catalog | `meta.cache.max-weight` | `ALTER CATALOG` 后下一次访问生效 |
| 防止某个模块独占配额 | `meta.cache.<engine>.<entry>.max-weight` | `ALTER CATALOG` 后下一次访问生效 |
| 宁要更新的元数据而不是缓存 | 降低 `meta.cache.<engine>.<entry>.ttl-second`，或将 `meta.cache.<engine>.<entry>.enable` 设为 `false` | `ALTER CATALOG` 后下一次访问生效 |

### 5. 修改后的效果

- 修改 Catalog 属性会丢弃受影响的缓存，并在下一次访问时惰性重建。系统表中的累计列从零重新开始。
- 已经在执行的查询继续使用已加载的对象。
- 配额降低会增加缓存未命中。在工作集重新适配配额前，外部元数据加载次数和查询规划耗时都会上升。

### 6. 该机制无法解决的情况

如果 FE Heap 持续偏高而已计入的 weight 很低，说明压力来自配额之外，继续降低 `max-weight` 没有帮助。应转而排查：

- 仍被运行中查询引用的元数据对象。
- 连接器 SDK 自带的缓存，例如显式设置了 `paimon.cache-enabled` 时的 Paimon `CachingCatalog`。
- 单次大元数据加载在准入之前的加载和物化峰值。
- 在受管理 Catalog 之外创建、因此不出现在系统表中的 FE 内部缓存。

### 症状速查表

| 症状 | 查询 | 解读 | 动作 |
|---|---|---|---|
| FE Heap 偏高，且汇总预留量接近 `external_meta_cache_max_weight` | 第 1 步 | 受管理缓存已达到 FE 总上限 | 降低 FE 上限或最大的 Catalog 上限，或为 FE 增加堆内存 |
| FE Heap 偏高，但汇总预留量很低 | 第 1 步 | 压力来自配额之外 | 按第 6 步排查 |
| 某个 Catalog 接近其 `meta.cache.max-weight`，或在某台 FE 上明显偏大 | 第 2 步 | 其工作集超过了分配份额 | 堆内存允许时提高其上限，或在其内部增加模块级上限 |
| `weight_reject_count` 持续上升，原因为 `budget_exceeded` | 第 3 步 | 对象已加载但未保留，后续会重复加载 | 提高配额，或降低其他竞争模块的上限 |
| `weight_reject_count` 持续上升，原因为 `entry_too_large` | 第 3 步 | 单个对象超过模块上限 | 提高模块上限，或接受这些对象不进缓存 |
| `weight_reject_count` 持续上升，原因为 `incomplete_estimate` | 第 3 步 | 对象无法可靠估算，始终不会被缓存 | 调整配额无效；查询仍可正常执行，只是不使用缓存 |
| `estimated_weight` 长期贴近 `max_weight` 且命中率偏低 | 第 3 步 | 模块在自身配额内频繁换入换出 | 提高模块上限，或缩短 TTL 以缩小工作集 |

<!-- 知识类型: 行为说明 -->
<!-- 适用场景: 估算内存核算的边界 -->
## 注意事项

- `max-weight` 是估算的保留缓存准入预算。估算使用结构常量和 payload 计数，不模拟当前 JVM 的精确对象布局，不等同于操作系统 RSS，不能代替 FE Heap 和 GC 监控。
- 缓存值以强引用持有，直到被淘汰、过期或失效。如果不希望元数据缓存随工作集无限增长，请配置配额。
- Catalog 客户端、FileIO 实例、线程池等共享运行时基础设施不计入任何模块。
- 多个物理缓存可能共用一个 `<entry>` 名，因此也共用一个模块上限，例如 Iceberg 的两个 `partition_view` 缓存和 ADBC 的三个 `metadata` 缓存。
- 估算不完整的对象永远不会被缓存。如果某模块命中率偏低且伴随 `incomplete_estimate` 拒绝，说明缓存对该类对象无效。
- 新提交的 DDL 属性会严格拒绝已知引擎下未知的 `max-weight` 键；由更早或更新版本持久化的未知键会被容忍，使升级后的 Catalog 仍可初始化。

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 跨 Catalog 规划元数据缓存内存 -->
## 最佳实践

1. 优先配置 FE 总上限，防止多个 Catalog 的缓存合计失控。
2. 为共享同一 FE 的大型生产 Catalog 增加 Catalog 上限。
3. 只为占用最大的模块设置模块级上限，不需要为每个模块都单独配置。
4. 为查询规划和其他 FE 缓存预留足够的堆内存，不要把大部分 JVM 堆分配给外表元数据缓存。
5. 如果同一对象在 `budget_exceeded` 拒绝后反复重新加载，应提高配额或降低竞争模块的上限。
6. FE 堆大小不一致时使用百分比；需要所有 FE 使用相同字节上限时使用固定大小。
