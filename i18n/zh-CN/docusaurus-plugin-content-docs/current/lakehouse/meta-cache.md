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

:::note
对于 Doris 4.1.x 及之后版本，外表元数据缓存已重构并使用统一配置键 `meta.cache.*`。
请参阅[统一外表元数据缓存（4.1.x+）](./meta-cache/unified-meta-cache.md)。

从 Doris 4.1.x 开始，外表元数据缓存可以分成两层来理解：

- 通用 catalog 缓存：库/表名称列表、库/表对象等，仍由 `max_meta_object_cache_num`、`external_cache_refresh_time_minutes`、`external_cache_expire_time_seconds_after_access` 等 FE 配置控制。
- 引擎特定 entry 缓存：schema、分区元数据、manifest、文件列表等，这些按 catalog 使用统一键 `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity}` 配置。

统一文档主要描述第二层。
:::

本文主体主要记录 2.1.x / 3.x 旧缓存模型中的 FE 默认值与兼容参数。
对于 Doris 4.1.x+ 的当前引擎级 cache entry，请直接阅读统一页和各 Catalog 文档。

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

下面的内容主要描述代表性的 FE 默认值与旧模型兼容参数，不应理解为 Doris 4.1.x+ 的完整 cache entry 列表。

| 类别 | 作用域 | 主要 FE 默认值 | 说明 |
|---|---|---|---|
| 库 / 表名称列表 | 每个 catalog / 每个 database | `external_cache_expire_time_seconds_after_access`、`external_cache_refresh_time_minutes` | 用于 `SHOW DATABASES` / `SHOW TABLES` |
| 库 / 表对象 | 每个 catalog / 每个 database | `max_meta_object_cache_num`、`external_cache_expire_time_seconds_after_access`、`external_cache_refresh_time_minutes` | 对象缓存与名称列表缓存可能短暂不一致 |
| 表 schema | 每个 catalog | `max_external_schema_cache_num`、`external_cache_expire_time_seconds_after_access`、`external_cache_refresh_time_minutes` | 旧的 catalog 级兼容参数：`schema.cache.ttl-second` |
| Hive 分区值 | 每个 Hive catalog | `max_hive_partition_table_cache_num`、`external_cache_expire_time_seconds_after_access`、`external_cache_refresh_time_minutes` | 旧的 catalog 级兼容参数：`partition.cache.ttl-second` |
| Hive 分区属性 | 每个 Hive catalog | `max_hive_partition_cache_num`、`external_cache_expire_time_seconds_after_access` | 没有旧的 catalog 级 TTL 覆盖参数 |
| Hive 文件列表 | 每个 Hive catalog | `max_external_file_cache_num`、`external_cache_expire_time_seconds_after_access`、`external_cache_refresh_time_minutes` | 旧的 catalog 级兼容参数：`file.meta.cache.ttl-second` |
| Hudi / Iceberg / Paimon 旧表级元数据 | 每个 catalog | `max_external_table_cache_num`、`external_cache_expire_time_seconds_after_access`、`external_cache_refresh_time_minutes` | Doris 4.1.x+ 下的 `fs_view`、`meta_client`、`view`、`manifest` 等请看对应 Catalog 页 |

### 库、表名称列表

库名称列表（Database name list）指的是一个 Catalog 下所有库的名称的列表。

表名称列表（Table name list）指的是一个库下所有表的名称列表。

名称列表仅用于需要列举名称的操作，如 `SHOW TABLES` 或 `SHOW DATABASES` 语句。

每个 Catalog 下都有一个库名称列表缓存。每个库下都有一个表名称列表缓存。

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

每个 Catalog 下都有一个库对象缓存。每个库下都有一个表对象缓存。

- 最大缓存数量

    由 FE 配置项 `max_meta_object_cache_num` 控制，默认为 1000。可以根据单个 Catalog 下数据库的数量，或单个数据库下表的数量，适当调整这个参数。

- 淘汰时间

    固定 86400 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时地在 Doris 中看到最新的库或表，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

### 表 Schema

缓存表的 Schema 信息，如列名等。该缓存主要用于按需加载被访问到的表的 Schema，以防止同步大量不需要被访问的表的 Schema 而占用 FE 的内存。

该缓存按 catalog 维度管理。

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

    由 FE 配置项 `max_external_file_cache_num` 控制，默认为 10000。

    可以根据所需要访问的文件数量，适当调整这个参数。

- 淘汰时间

    默认 28800 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

    如果 Catalog 属性中设置了 `file.meta.cache.ttl-second` 属性。则使用设置的时间。

    某些情况下，Hive 表的数据文件会频繁变动，导致缓存无法满足时效性。可以通过将该参数设置为 0，关闭该缓存。这种情况下，每次都会实时获取文件列表进行查询，性能可能降低，文件时效性提升。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时地在 Doris 中访问到最新的文件列表，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

### Hudi 表分区

这里描述的是 Hudi 分区元数据缓存的旧模型摘要。
对于 Doris 4.1.x+ 的当前 Hudi cache entry（如 `fs_view`、`meta_client`），请参阅 [Hudi Catalog](./catalogs/hudi-catalog.md#meta-cache-unified)。

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

这里描述的是 Iceberg 表元数据缓存的旧模型摘要。表对象通过 Iceberg API 加载并构建。
对于 Doris 4.1.x+ 的当前可观测 cache entry，请参阅 [Iceberg Catalog](./catalogs/iceberg-catalog.mdx#meta-cache-unified)。

该缓存，每个 Iceberg Catalog 有一个。

- 最大缓存数量

    由 FE 配置项 `max_external_table_cache_num` 控制，默认为 1000。

    可以根据 Iceberg 表的数量，适当调整这个参数。

- 淘汰时间

    固定 28800 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时的在 Doris 中访问到最新的 Iceberg 表属性，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

### Iceberg Snapshot 相关元数据

这里描述的是从 Iceberg 表元数据派生出的 snapshot 相关缓存行为。
在当前实现里，不应将它理解为 Doris 4.1.x 下和 `table`、`view`、`manifest` 并列的独立 cache entry。

- 最大缓存数量

    由 FE 配置项 `max_external_table_cache_num` 控制，默认为 1000。

    可以根据 Iceberg 表的数量，适当调整这个参数。

- 淘汰时间

    固定 28800 秒。3.0.7 版本之后，由 FE 参数 `external_cache_expire_time_seconds_after_access` 配置，默认 86400 秒。

- 最短刷新时间

    由 FE 配置项 `external_cache_expire_time_minutes_after_access` 控制。单位为分钟。默认 10 分钟。减少该时间，可以更实时的在 Doris 中访问到最新的 Iceberg 表属性，但会增加访问外部数据源的频率。

    3.0.7 版本后，配置项名称修改为 `external_cache_refresh_time_minutes`。默认值不变。

## 缓存刷新

除了上述刷新和淘汰策略外，用户也可以通过手动或定时方式刷新元数据。

### 手动刷新

使用 `REFRESH` 语句可以失效 catalog、database 或 table 级元数据。
当前语法、权限要求与示例请参阅 [REFRESH](../sql-manual/sql-statements/catalog/REFRESH.md)。

行为摘要：

- `REFRESH CATALOG` 会刷新 catalog 级对象缓存，并默认继续失效更细粒度的元数据缓存。
- `REFRESH DATABASE` 会刷新一个 database 下的元数据。
- `REFRESH TABLE` 会刷新单表元数据。
- 对 `REFRESH CATALOG`，若设置 `invalid_cache = false`，则只刷新对象/名称列表，不继续失效更细粒度缓存。

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

`REFRESH CATALOG ctl1;`

## 最佳实践

缓存可以显著提升元数据的访问性能，避免频繁的远程访问元数据导致性能抖动或者对元数据服务造成压力。但同时，缓存会降低数据的时效性。比如缓存刷新时间是 10 分钟，则在十分钟内，只能读到缓存的元数据。因此，需要根据情况，合理的设置缓存。

### 默认行为

这里主要介绍，默认参数配置情况下，用户可能关注的缓存行为。

- 外部数据源新增库、表后，在 Doris 中可以通过 SELECT 实时查询到。但 SHOW DATABASES 和 SHOW TABLES 可能看不到，需要手动刷新缓存，或最多等待 10 分钟。
- 外部数据源新增分区，需要手动刷新缓存，或最多等待 10 分钟后，可以查询到新分区的数据。
- 分区数据文件变动，需要手动刷新缓存，或最多等待 10 分钟后，可以查询到新分区的数据。

### 关闭 Schema 缓存

对于所有类型的 External Catalog，如果希望实时可见最新的 Table Schema，可以关闭 Schema Cache：

:::note
对于 Doris 4.1.x+，推荐使用统一键 `meta.cache.<engine>.schema.ttl-second = "0"`。
详细说明请参阅：
[统一外表元数据缓存（4.1.x+）](./meta-cache/unified-meta-cache.md)。
:::

- 全局关闭

    ```text
    -- fe.conf
    max_external_schema_cache_num=0 // 关闭 Schema 缓存。
    ```

- Doris 4.1.x+ 的 catalog 级关闭方式

    ```text
    -- Catalog property
    "meta.cache.<engine>.schema.ttl-second" = "0"
    ```

- 旧的 catalog 级兼容参数

    ```text
    -- Catalog property
    "schema.cache.ttl-second" = "0" // 旧参数，2.1.11 / 3.0.6 支持
    ```

设置完成后，Doris 会实时可见最新的 Table Schema。但此设置可能会增加元数据服务的压力。

### 关闭 Hive Catalog 元数据缓存

针对 Hive Catalog，如果想关闭缓存来查询到实时更新的数据，可以配置以下参数：

:::note
对于 Doris 4.1.x+，推荐优先使用统一键 `meta.cache.hive.*`，并参考：
[Hive Catalog](./catalogs/hive-catalog.mdx#meta-cache-unified) 与
[统一外表元数据缓存（4.1.x+）](./meta-cache/unified-meta-cache.md)。
:::

- 全局关闭

    ```text
    -- fe.conf
    max_external_file_cache_num=0    // 关闭文件列表缓存
    max_hive_partition_table_cache_num=0  // 关闭分区列表缓存
    max_hive_partition_cache_num=0   // 关闭分区属性缓存
    ```

- Doris 4.1.x+ 的 catalog 级关闭方式

    ```text
    -- Catalog property
    "meta.cache.hive.partition_values.ttl-second" = "0" // 关闭分区列表缓存
    "meta.cache.hive.partition.ttl-second" = "0"        // 关闭分区属性缓存
    "meta.cache.hive.file.ttl-second" = "0"             // 关闭文件列表缓存
    ```

- 旧的 catalog 级兼容参数

    ```text
    -- Catalog property
    "file.meta.cache.ttl-second" = "0" // 关闭文件列表缓存
    "partition.cache.ttl-second" = "0" // 关闭分区列表缓存（2.1.11 / 3.0.6 支持）
    ```

设置以上参数后：

- 外部数据源新增分区可以实时查询到。
- 分区数据文件变动可以实时查询到。
- 如果希望实时看到分区属性变化，也需要同时关闭分区属性缓存。

但会增加外部源数据（如 Hive Metastore 和 HDFS）的访问压力，可能导致元数据访问延迟不稳定等现象。
