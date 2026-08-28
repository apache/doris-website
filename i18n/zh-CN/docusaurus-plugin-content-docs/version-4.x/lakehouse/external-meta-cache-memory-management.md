---
{
    "title": "外部元数据缓存内存管理",
    "language": "zh-CN",
    "description": "介绍 Doris 4.1.4 中外部元数据缓存的 FE、Catalog 和缓存模块三级内存限制，以及 Hive、Iceberg 和 Paimon 的配置方法。"
}
---

从 Doris 4.1.4 开始，可以按估算内存大小限制部分外部元数据缓存，避免单个大表、单个 Catalog 或多个 Catalog 的元数据缓存持续占用 FE Heap。

该功能适合以下场景：

- Hive 表包含大量分区，分区裁剪结构占用较多 FE 内存；
- Iceberg 表的表元数据、Snapshot 或 Manifest 较大；
- Paimon 表元数据代际或 Snapshot 包含大量保留元数据和分区投影；
- 一个 FE 同时服务多个 Catalog，需要避免单个 Catalog 占用过多缓存内存。

:::caution
内存限制针对本文列出的、支持内存估算的缓存模块，不是 FE Heap 的硬限制。Catalog 客户端、线程池等共享运行时基础设施不会全部归属于单个缓存项；但缓存项实际持有的认证上下文、Iceberg FileIO 配置和凭证等有界 owner payload 会按保守值计入。尚未接入内存估算的元数据缓存不计入该配额。
:::

## 快速开始

使用该功能前，需要具备以下条件：

- 已创建 Hive、Iceberg 或 Paimon Catalog；
- 具有修改 FE 配置和对应 Catalog 属性的权限；
- 所有 FE 节点都使用 Doris 4.1.4 或更高版本。

### 1. 配置 FE 总上限

在每个 FE 节点的 `fe.conf` 中设置：

```properties
external_meta_cache_max_weight = 10%
```

该配置表示：当前 FE 上所有已接入内存管理的外部元数据缓存，合计最多使用当前 JVM 最大 Heap 的 10%。配置修改后需要重启 FE。

如果不希望按 Heap 比例配置，也可以使用固定大小：

```properties
external_meta_cache_max_weight = 8GB
```

### 2. 限制单个 Catalog

下面的示例将 `iceberg_ctl` 中受管理的元数据缓存总量限制为 4 GB：

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB"
);
```

修改成功后，Doris 会清理该 Catalog 已初始化的相关缓存，并在下一次访问时使用新配置重新创建缓存。

:::tip
即使没有配置 FE 总上限，也可以单独配置 `meta.cache.max-weight`。此时只限制该 Catalog，不限制当前 FE 上所有 Catalog 的合计值。
:::

### 3. 限制具体缓存模块

下面的示例同时限制 Iceberg Catalog 总量以及各缓存模块：

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.iceberg.table.max-weight" = "1GB",
    "meta.cache.iceberg.snapshot.max-weight" = "2GB",
    "meta.cache.iceberg.manifest.enable" = "true",
    "meta.cache.iceberg.manifest.max-weight" = "1GB"
);
```

配置后：

- Iceberg `table` 缓存最多占用 1 GB；
- Iceberg `snapshot` 缓存最多占用 2 GB；
- Iceberg `manifest` 缓存最多占用 1 GB；
- 三者合计不能超过 Catalog 的 4 GB 上限；
- 该 Catalog 的内存仍受 FE 总上限约束。

## 配额层级

外部元数据缓存支持三级内存限制：

| 层级 | 配置位置 | 配置项 | 作用范围 |
|---|---|---|---|
| FE | `fe.conf` | `external_meta_cache_max_weight` | 当前 FE 上所有受管理的外部元数据缓存 |
| Catalog | Catalog 属性 | `meta.cache.max-weight` | 当前 Catalog 下所有受管理的缓存模块 |
| 缓存模块 | Catalog 属性 | `meta.cache.<engine>.<entry>.max-weight` | 指定引擎的一个缓存模块 |

最终有效上限取所有已配置上限中的最小值。不同配置组合的行为如下：

| FE 上限 | Catalog 上限 | 模块上限 | 实际行为 |
|---|---|---|---|
| 未配置 | 未配置 | 未配置 | 不启用按内存计费，继续使用原有的条目数和 TTL 策略 |
| 已配置 | 未配置 | 未配置 | 所有受管理模块共享 FE 总配额 |
| 未配置 | 已配置 | 未配置 | 当前 Catalog 内的受管理模块共享 Catalog 配额 |
| 未配置 | 未配置 | 已配置 | 只限制指定缓存模块，不限制多个模块或 Catalog 的合计值 |
| 已配置 | 已配置 | 已配置 | 同时满足三级限制，取最严格的上限 |

配置必须满足以下层级关系：

- Catalog 上限不能大于 FE 总上限；
- 模块上限不能大于已配置的直接父级上限；
- 在不同 FE Heap 大小不一致的集群中，从节点会按本地 FE 总上限进一步收紧配额。

如果配置违反层级关系，`CREATE CATALOG` 或 `ALTER CATALOG` 会失败，而不会静默忽略配置。

## 配置值格式

固定大小支持以下单位，单位不区分大小写，按 1024 进制换算：

```text
B, KB, MB, GB, TB, PB
```

例如：`512MB`、`4GB`。

固定大小只支持整数；只有百分比支持小数，例如 `12.5%`。

只有 FE 配置 `external_meta_cache_max_weight` 支持百分比，例如 `10%`、`12.5%`。百分比以每个 FE 自身的 JVM 最大 Heap 为基准计算，因此不同 Heap 大小的 FE 会得到不同的字节上限。

各层级对 `0` 的处理不同：

| 配置项 | `0` 的含义 |
|---|---|
| `external_meta_cache_max_weight` | 关闭 FE 总配额，但不会关闭缓存 |
| `meta.cache.max-weight` | 不允许设置为 `0` |
| `meta.cache.<engine>.<entry>.max-weight` | 关闭该缓存模块，而不是取消模块级覆盖 |

`0%` 不是有效的 FE 配置。需要关闭 FE 总配额时，请使用不带百分号的 `0`。

## 支持按内存限制的缓存模块

当前版本只允许为下列缓存模块设置 `max-weight`：

| Catalog/引擎 | 缓存模块 | 配置项 | 缓存内容 |
|---|---|---|---|
| Hive | `partition_values` | `meta.cache.hive.partition_values.max-weight` | 分区名称、分区值、分区裁剪索引和排序范围 |
| Iceberg | `table` | `meta.cache.iceberg.table.max-weight` | Iceberg 表元数据及当前元数据代际 |
| Iceberg | `snapshot` | `meta.cache.iceberg.snapshot.max-weight` | Snapshot、分区投影和与其绑定的表元数据代际 |
| Iceberg | `manifest` | `meta.cache.iceberg.manifest.max-weight` | 解析后的 DataFile 和 DeleteFile 列表；该模块默认关闭，使用前还需设置 `enable=true` |
| Paimon | `table` | `meta.cache.paimon.table.max-weight` | 保留的 Paimon 表元数据及其元数据代际 |
| Paimon | `snapshot` | `meta.cache.paimon.snapshot.max-weight` | Snapshot、Schema 代际和分区投影 |

以下常见模块目前仍按条目数管理，不能配置 `max-weight`：

- Hive `schema`、`partition`、`file`；
- Iceberg `schema`、`view`；
- Paimon `schema`；
- Hudi、MaxCompute 和 Doris Catalog 的现有缓存模块。

为不支持的模块设置 `max-weight` 会导致 Catalog 创建或修改失败。例如，下面的配置无效：

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.hive.file.max-weight" = "1GB"
);
```

:::note
HMS Catalog 可以同时路由 Hive、Hudi 和 Iceberg 元数据缓存。如果 HMS 中包含 Iceberg 表，可以在同一个 HMS Catalog 上使用 `meta.cache.iceberg.table.max-weight`、`meta.cache.iceberg.snapshot.max-weight` 和 `meta.cache.iceberg.manifest.max-weight`。
:::

## 配置示例

### 只使用 Catalog 上限

如果 FE 没有统一总上限，可以分别隔离不同 Catalog：

```sql
ALTER CATALOG hive_prod SET PROPERTIES (
    "meta.cache.max-weight" = "6GB"
);

ALTER CATALOG iceberg_ad_hoc SET PROPERTIES (
    "meta.cache.max-weight" = "2GB"
);
```

此时两个 Catalog 分别受 6 GB 和 2 GB 限制，但当前 FE 上所有 Catalog 的合计值没有统一上限。

### 限制 Hive 大分区表

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.partition_values.max-weight" = "3GB"
);
```

该配置主要限制大分区表生成的分区裁剪结构。Hive 文件列表缓存当前不计入此配额。

### 限制 Paimon 表元数据代际和 Snapshot

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "2GB",
    "meta.cache.paimon.table.max-weight" = "512MB",
    "meta.cache.paimon.snapshot.max-weight" = "1536MB"
);
```

Paimon 的 `table` 和 `snapshot` 模块都支持独立的内存上限。该示例为表元数据代际最多分配 512 MB，为 Snapshot 投影最多分配 1536 MB，二者合计仍受 2 GB Catalog 上限约束。

### 与现有缓存属性的兼容关系

为兼容已有 Catalog 配置，Iceberg 和 Paimon 的 `table.enable`、`table.ttl-second`、`table.capacity` 会在未显式配置对应 `snapshot` 属性时同时作为 Snapshot 缓存的默认值。例如：

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.paimon.table.ttl-second" = "600",
    "meta.cache.paimon.snapshot.max-weight" = "1536MB"
);
```

其中 `table.ttl-second` 同时控制 Paimon 表对象和 Snapshot 缓存的 TTL，而 `snapshot.max-weight` 只限制 Snapshot 缓存。

`max-weight` 不参与上述兼容映射。必须使用实际支持内存估算的模块名：

- Iceberg 表对象使用 `meta.cache.iceberg.table.max-weight`；
- Iceberg Snapshot 使用 `meta.cache.iceberg.snapshot.max-weight`；
- Paimon 表元数据代际使用 `meta.cache.paimon.table.max-weight`；
- Paimon Snapshot 使用 `meta.cache.paimon.snapshot.max-weight`。

### 同时使用内存上限和 TTL

内存上限可以和 `enable`、`ttl-second`、`capacity` 一起配置：

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.iceberg.snapshot.enable" = "true",
    "meta.cache.iceberg.snapshot.ttl-second" = "1800",
    "meta.cache.iceberg.snapshot.capacity" = "1000",
    "meta.cache.iceberg.snapshot.max-weight" = "2GB"
);
```

启用 `max-weight` 后，缓存的淘汰上限按内存权重执行，不再同时使用 `capacity` 作为最大条目数。但 `capacity=0` 仍会关闭缓存；因此使用内存限制时，应保留一个大于 0 的 `capacity`。

## 达到内存上限时的行为

一次缓存未命中的处理流程如下：

1. Doris 从外部数据源加载元数据；
2. 对即将缓存的对象进行冻结或物化，计算其保留内存大小；
3. 同时检查 FE、Catalog 和缓存模块三级配额；
4. 配额不足时，优先淘汰同一缓存模块中的冷数据并重试；如果本地无法满足预留，则异步请求回收同 Catalog 的兄弟模块（FE 总配额不足时也会尝试其他 Catalog）；
5. 仍无法满足配额时，不将新对象写入缓存，但把已经加载的对象返回给当前请求。

因此，单个新对象大于可用配额时，正常查询不会因为缓存配额不足而失败。不过该对象不会被缓存，后续访问可能再次从外部数据源加载，导致查询规划时间增加。

如果对象无法完成可靠估算，例如保留的表类型不受支持、Iceberg 元数据仍处于懒加载状态、准备过程失败或估算工作量超过安全预算，Doris 同样会放弃缓存，而不是使用不完整结果低估内存。估算器不做通用反射对象图遍历，也不对容器采样。Iceberg 只使用一个 fail-closed 私有字段探针确认 Snapshot 元数据已经加载，从而避免估算过程触发 IO。

:::note
本地淘汰是同步的，peer reclaim 是异步且尽力而为的。因此当前这次未命中仍可能不写入缓存，而兄弟模块的回收会影响后续访问。若不希望某个模块长期占用共享的 FE 或 Catalog 配额，应为热点模块分别设置模块级上限。
:::

定时刷新得到的新值如果估算不完整或因配额不足无法准入，Doris 会继续保留之前已知可用的缓存代际，不发布被拒绝的刷新结果。

:::caution
配额检查发生在对象加载和准备完成后的缓存准入阶段，不会在访问外部数据源前预留 Heap。因此，远端加载失败，或者单个超大对象在构建完成前已经耗尽 FE Heap，仍可能使当前请求失败。该功能限制的是成功构建后可保留在缓存中的内存，不能作为单次元数据加载的 OOM 防护。
:::

## 配置生效与缓存刷新

- 修改 `external_meta_cache_max_weight` 后，需要重启对应 FE；
- 修改 Catalog 属性（包括 `meta.cache.max-weight` 或 `meta.cache.<engine>.<entry>.*`）会重置 Catalog 执行上下文，并清理该 Catalog 路由到的所有元数据缓存引擎中已初始化的条目；下一次访问会使用新的上下文和配置重建；
- 缓存重建期间，已经开始的查询可以继续使用已加载对象；后续访问按新配置重新加载和缓存。

内存上限只控制对象是否可以保留在缓存中，不改变外部元数据本身，也不代替 `REFRESH CATALOG`、TTL 或元数据事件同步。

## 注意事项

- `max-weight` 是估算的保留缓存准入预算。类型专用公式使用离线校准后向上取整的结构常量，并叠加 loader 阶段统计的 payload；它不模拟当前 JVM 或第三方 SDK 的精确对象布局，也不等同于操作系统 RSS，不能代替 FE Heap 和 GC 监控；
- 共享运行时基础设施不会全部归属于单个缓存项，但缓存项实际持有的认证上下文、FileIO 配置、存储凭证和 Transform payload 会按有界保守值计入；
- 按权重管理的缓存使用 soft value。Reservation 只保留 key、generation 和 weight，不强引用缓存 value。Heap 压力下 JVM 可能在 TTL 到期或配额用满前回收 value；Doris 会释放对应 reservation，后续访问重新加载；
- 大对象只在加载、刷新或替换时估算。完成的权重随发布代际保留，缓存命中不会重新扫描对象内容；
- Iceberg 首次缓存表或 Snapshot 时，可能需要提前物化当前 Snapshot 的 Manifest 列表，因此第一次加载的耗时可能增加；
- 新提交的 DDL 属性会严格拒绝拼写错误的引擎名、模块名和参数名；历史持久化属性在运行时无法解析时会告警并忽略，使升级后的 Catalog 仍可初始化；
- Iceberg Catalog 启用 Doris 内存治理后，不再自动开启 Iceberg SDK 的 Manifest 内容缓存，因为该缓存位于 Doris 配额之外；显式配置 `io.manifest.cache-enabled` 时以用户配置为准；
- Paimon Catalog 启用 Doris 内存治理后，默认关闭 Paimon SDK 自带的 `CachingCatalog`，避免出现第二份无界元数据缓存；显式配置 `paimon.cache-enabled` 时以用户配置为准；
- 升级 Iceberg 或 Paimon SDK 后，应使用与当前 Doris 版本匹配的依赖，不建议单独替换 FE 中的 SDK JAR。

## 最佳实践

1. 优先配置 FE 总上限，防止多个 Catalog 的缓存合计失控；
2. 对共享 FE 上的大型生产 Catalog 配置 Catalog 上限，实现租户或工作负载隔离；
3. 只有在某个模块明显占用较大时，再增加模块级上限，避免为每个缓存模块都配置参数；
4. 为查询规划和其他 FE 缓存保留足够 Heap，不要把大部分 JVM Heap 都分配给外部元数据缓存；
5. 如果配额不足导致同一对象频繁重新加载，可适当提高上限，或降低其他模块的上限；
6. 对异构 FE 集群，使用百分比可以按各节点 Heap 自动缩放；需要所有节点保持相同字节上限时，使用固定大小。
