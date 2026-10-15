---
{
    "title": "Hudi Catalog",
    "language": "zh-CN",
    "description": "Hudi Catalog 复用了 Hive Catalog。通过连接 Hive Metastore，或者兼容 Hive Metatore 的元数据服务，Doris 可以自动获取 Hudi 的库表信息，并进行数据查询。"
}
---

Hudi Catalog 复用了 Hive Catalog。通过连接 Hive Metastore，或者兼容 Hive Metatore 的元数据服务，Doris 可以自动获取 Hudi 的库表信息，并进行数据查询。

[使用 Docker 快速体验 Apache Doris & Hudi](../best-practices/doris-hudi.md)

## 适用场景

| 场景 | 说明                 |
| ---- | ---------------------------------------------------- |
| 查询加速 | 利用 Doris 分布式计算引擎，直接访问 Hudi 数据进行查询加速。                 |
| 数据集成 | 读取 Hudi 数据并写入到 Doris 内表。或通过 Doris 计算引擎进行 ZeroETL 操作。 |
| 数据写回 | 不支持。                                                 |

## 配置 Catalog

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'hms', -- required
    'hive.metastore.uris' = '<metastore_thrift_url>', -- required
    {MetaStoreProperties},
    {StorageProperties},
    {HudiProperties},
    {CommonProperties}
);
```

* `[MetaStoreProperties]`

  MetaStoreProperties 部分用于填写 Metastore 元数据服务连接和认证信息。具体可参阅【支持的元数据服务】部分。

* `[StorageProperties]`

  StorageProperties 部分用于填写存储系统相关的连接和认证信息。具体可参阅【支持的存储系统】部分。

* `[CommonProperties]`

  CommonProperties 部分用于填写通用属性。请参阅[ 数据目录概述 ](../catalog-overview.md)中【通用属性】部分。

* `{HudiProperties}`

  | 参数名称                            | 曾用名                        | 说明                                                                                                                                                       | 默认值   |
  | ------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
  | `hudi.use_hive_sync_partition` | `use_hive_sync_partition` | 是否使用 Hive Metastore 已同步的分区信息。如果为 true，则会直接从 Hive Metastore 中获取分区信息。否则，会从文件系统的元数据文件中获取分区信息。通过 Hive Metastore 获取信息性能更好，但需要用户保证最新的元数据已经同步到了 Hive Metastore。 | false |

## 元数据缓存 {#meta-cache}

为了提升访问外部数据源的性能，Apache Doris 会缓存 Hudi 表依赖的 Hive Metastore 元数据，包括表对象、分区名、分区对象和列统计信息。

:::tip
Doris 4.1.x 之前的版本，元数据缓存主要由 FE 配置项全局控制，详见[元数据缓存](../meta-cache)。
自 Doris 4.1.x 起，Hudi 相关的外表元数据缓存使用统一的 `meta.cache.*` 键配置。下文的模块描述当前版本；Doris 4.1.x 和 4.2.x 的模块集合与此不同，见本页的 4.x 版本。
:::

### 缓存属性配置 {#meta-cache-unified-model}

每个缓存模块使用统一的配置键格式：`meta.cache.<engine>.<entry>.{enable,ttl-second,capacity,max-weight}`。Hudi Catalog 的缓存在系统表中显示在 `hudi` 引擎下，但它们就是共享的 Hive Metastore 缓存，使用 `hive` 引擎名配置：`meta.cache.hive.<entry>.*`。

| 属性 | 示例 | 含义 |
|---|---|---|
| `enable` | `true/false` | 是否开启该缓存模块。 |
| `ttl-second` | `600`、`0`、`-1` | `0` 表示关闭该模块（立即生效，可用于查看最新数据）；`-1` 表示永不过期；其他正整数表示按访问时间计算的 TTL 秒数。 |
| `capacity` | `10000` | 缓存条目数上限。`0` 表示关闭该模块。 |
| `max-weight` | `1GB` | 自 Doris 4.1.4 起支持。可选的模块估算保留内存上限。必须为正数，`0` 会被拒绝。只有下表标注的模块接受该属性。 |

**生效逻辑：** 模块在 `enable=true`、`ttl-second != 0` 且 `capacity > 0` 时生效。FE 总上限、Catalog 上限或模块上限存在时，还会按估算内存控制准入，详见 [外表元数据缓存内存管理](../external-meta-cache-memory-management)。

### 缓存模块 {#meta-cache-unified-modules}

Hudi Catalog 包含以下缓存模块，全部接受 `max-weight`。

| 模块（`<entry>`） | 属性键前缀 | `ENTRY_NAME` | 缓存内容与影响 | 默认 enable / TTL / capacity |
|---|---|---|---|---|
| `table` | `meta.cache.hive.table.` | `hive-table` | Hive Metastore 中的表对象。 | `true` / 86400 秒 / 10000 |
| `partition_names` | `meta.cache.hive.partition_names.` | `hive-partition-names` | 分区名列表。影响：分区发现和裁剪；关闭后可实时看到新分区。 | `true` / 86400 秒 / 10000 |
| `partition` | `meta.cache.hive.partition.` | `hive-partition` | 分区对象，例如 Location 和输入格式。 | `true` / 86400 秒 / 100000 |
| `column_stats` | `meta.cache.hive.column_stats.` | `hive-column-stats` | Hive Metastore 中的列统计信息。 | `true` / 86400 秒 / 10000 |

Hudi 表的列结构由共享的 `default` 引擎缓存（`meta.cache.default.schema.*`）。

### 旧参数映射与转换 {#meta-cache-mapping}

| 旧属性键 | 统一键 | 说明 |
|---|---|---|
| `schema.cache.ttl-second` | `meta.cache.default.schema.ttl-second` 和 `meta.cache.hive.table.ttl-second` | 表结构缓存和表对象缓存的过期时间 |
| `partition.cache.ttl-second` | `meta.cache.hive.partition_names.ttl-second` | 分区名列表的过期时间 |

### 最佳实践 {#meta-cache-best-practices}

* **实时访问最新数据**：希望每次查询都看到 Hudi 表的最新分区时，将分区名缓存的 TTL 设为 `0`。
  ```sql
  -- 关闭分区名缓存，感知 Hudi 表的最新分区
  ALTER CATALOG hudi_ctl SET PROPERTIES ("meta.cache.hive.partition_names.ttl-second" = "0");
  ```
* **性能优化**：Catalog 属性修改成功后，受影响的元数据缓存会被丢弃，并在下一次访问时按新配置重建。修改 `meta.cache.max-weight` 或 `schema.cache.ttl-second` 会丢弃该 Catalog 的全部缓存；修改 `meta.cache.<engine>.<entry>.*` 只丢弃对应引擎的缓存。正在执行的查询不受影响。

### 可观测性 {#meta-cache-unified-observability}

可以通过 `information_schema.catalog_meta_cache_statistics` 系统表观察缓存指标。`ENTRY_NAME` 显示上表中列出的名称，`default` 引擎的行是所有 Catalog 共享的表结构缓存：

```sql
SELECT engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, max_weight, estimated_weight
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'hudi_ctl'
ORDER BY engine_name, entry_name;
```

系统表说明请参阅 [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics)。

### 支持的 Hudi 版本

当前依赖的 Hudi 版本为 0.15。推荐访问 0.14 版本以上的 Hudi 数据。

### 支持的查询类型

| 表类型           | 支持的查询类型                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| Copy On Write | Snapshot Query, Time Travel, Incremental Read                           |
| Merge On Read | Snapshot Queries, Read Optimized Queries, Time Travel, Incremental Read |

### 支持的元数据服务

* [ Hive Metastore](../metastores/hive-metastore.md)

### 支持的存储系统

* [ HDFS](../storages/hdfs.md)

* [ AWS S3](../storages/s3.md)

* [ Google Cloud Storage](../storages/gcs.md)

* [ 阿里云 OSS](../storages/aliyun-oss.md)

* [ 腾讯云 COS](../storages/tencent-cos.md)

* [ 华为云 OBS](../storages/huawei-obs.md)

* [ MINIO](../storages/minio.md)

### 支持的数据格式

* [ Parquet](../file-formats/parquet.md)

* [ ORC](../file-formats/orc.md)

## 列类型映射

| Hudi Type     | Doris Type    | Comment                              |
| ------------- | ------------- | ------------------------------------ |
| boolean       | boolean       |                                      |
| int           | int           |                                      |
| long          | bigint        |                                      |
| float         | float         |                                      |
| double        | double        |                                      |
| decimal(P, S) | decimal(P, S) |                                      |
| bytes         | string        |                                      |
| string        | string        |                                      |
| date          | date          |                                      |
| timestamp     | datetime(N)   | 根据精度，自动映射到 datetime(3) 或 datetime(6) |
| array         | array         |                                      |
| map           | map           |                                      |
| struct        | struct        |                                      |
| other         | UNSUPPORTED   |                                      |

## 基础示例

Hudi Catalog 的创建方式和 Hive Catalog 一致。更多示例可参阅[ Hive Catalog](./hive-catalog)

```sql
CREATE CATALOG hudi_hms PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:7004',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

## 查询操作

### 基础查询

配置好 Catalog 后，可以通过以下方式查询 Catalog 中的表数据：

```sql
-- 1. switch to catalog, use database and query
SWITCH hudi_ctl;
USE hudi_db;
SELECT * FROM hudi_tbl LIMIT 10;

-- 2. use hudi database directly
USE hudi_ctl.hudi_db;
SELECT * FROM hudi_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM hudi_ctl.hudi_db.hudi_tbl LIMIT 10;
```

### 时间旅行

每一次对 Hudi 表的写操作都会产生一个新的快照，Doris 支持读取 Hudi 表指定的 Snapshot。默认情况下，查询请求只会读取最新版本的快照。

可以通过 `hudi_meta()` 表函数查询查询指定 Hudi 表的 Timeline：

该函数自 3.1.0 版本支持。

```sql
SELECT * FROM hudi_meta(
    'table' = 'hudi_ctl.hudi_db.hudi_tbl',
    'query_type' = 'timeline'
);

+-------------------+--------+--------------------------+-----------+-----------------------+
| timestamp         | action | file_name                | state     | state_transition_time |
+-------------------+--------+--------------------------+-----------+-----------------------+
| 20241202171214902 | commit | 20241202171214902.commit | COMPLETED | 20241202171215756     |
| 20241202171217258 | commit | 20241202171217258.commit | COMPLETED | 20241202171218127     |
| 20241202171219557 | commit | 20241202171219557.commit | COMPLETED | 20241202171220308     |
| 20241202171221769 | commit | 20241202171221769.commit | COMPLETED | 20241202171222541     |
| 20241202171224269 | commit | 20241202171224269.commit | COMPLETED | 20241202171224995     |
| 20241202171226401 | commit | 20241202171226401.commit | COMPLETED | 20241202171227155     |
| 20241202171228827 | commit | 20241202171228827.commit | COMPLETED | 20241202171229570     |
| 20241202171230907 | commit | 20241202171230907.commit | COMPLETED | 20241202171231686     |
| 20241202171233356 | commit | 20241202171233356.commit | COMPLETED | 20241202171234288     |
| 20241202171235940 | commit | 20241202171235940.commit | COMPLETED | 20241202171236757     |
+-------------------+--------+--------------------------+-----------+-----------------------+
```

可以使用 `FOR TIME AS OF` 语句，根据快照的时间 ([时间格式](https://hudi.apache.org/docs/0.14.0/quick-start-guide/#timetravel)和 Hudi 官网保持一致) 读取历史版本的数据。示例如下：

```sql
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07 17:20:37";
SELECT * FROM hudi_tbl FOR TIME AS OF "20221007172037";
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07";
```

Hudi 表不支持 `FOR VERSION AS OF` 语句，使用该语法查询 Hudi 表将报错。

### 增量查询

Incremental Read 可以查询在指定时间段之间变化的数据，返回的结果集是数据在指定时间段结束时的最终状态。

Doris 提供了 `@incr` 语法支持 Incremental Read:

```sql
SELECT * from hudi_table@incr('beginTime'='xxx', ['endTime'='xxx'], ['hoodie.read.timeline.holes.resolution.policy'='FAIL'], ...);
```

* `beginTime`

  必填项。时间格式和 Hudi 官网 [hudi\_table\_changes](https://hudi.apache.org/docs/0.14.0/quick-start-guide/#incremental-query) 保持一致，支持 "earliest"。

* `endTime`

  选填，默认最新 commitTime。

可以在 `@incr`函数中添加更多选项，兼容 [Spark Read Options](https://hudi.apache.org/docs/0.14.0/configurations#Read-Options)。

通过 `desc` 查看执行计划，可以发现 Doris 将 `@incr` 转化为 `predicates` 下推给 `VHUDI_SCAN_NODE`:

```text
|   0:VHUDI_SCAN_NODE(113)                                                                                            |
|      table: lineitem_mor                                                                                            |
|      predicates: (_hoodie_commit_time[#0] > '20240311151019723'), (_hoodie_commit_time[#0] <= '20240311151606605') |
|      inputSplitNum=1, totalFileSize=13099711, scanRanges=1              
```

## FAQ

1. 通过 JNI 调用 Java SDK 读取 Hudi 增量数据偶发卡死

    请在 `be.conf` 的 `JAVA_OPTS_FOR_JDK_17` 或 `JAVA_OPTS` 中添加 `-Djol.skipHotspotSAAttach=true`.

## 附录

### 版本更新记录

| Doris 版本    | 功能支持                                      |
| ----------- | ----------------------------------------- |
| 2.1.8/3.0.4 | Hudi 依赖升级到 0.15。新增 Hadoop Hudi JNI Scanner。 |
