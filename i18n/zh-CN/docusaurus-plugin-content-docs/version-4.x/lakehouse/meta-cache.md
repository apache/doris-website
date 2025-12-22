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
