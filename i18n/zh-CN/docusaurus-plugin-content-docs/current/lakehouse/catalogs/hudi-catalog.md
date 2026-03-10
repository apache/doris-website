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

## 元数据缓存（4.1.x+） {#meta-cache-unified}

从 Doris 4.1.x 开始，Hudi 相关外表元数据缓存使用统一键 `meta.cache.*` 进行配置。
本节说明 Hudi 相关 cache 模块的配置与观测方式。

统一属性语义可参阅：[统一外表元数据缓存（4.1.x+）](../meta-cache/unified-meta-cache.md)。

### 缓存模块 {#meta-cache-unified-modules}

| 模块 | 属性键前缀 | 典型缓存内容 |
|---|---|---|
| `schema` | `meta.cache.hudi.schema.` | 表 schema 加载对应的 schema cache entry。 |
| `partition` | `meta.cache.hudi.partition.` | Hudi 分区相关元数据（用于分区发现/剪枝等）。 |
| `fs_view` | `meta.cache.hudi.fs_view.` | Hudi FS View 相关元数据。 |
| `meta_client` | `meta.cache.hudi.meta_client.` | Hudi Meta Client 相关元数据。 |

说明：

- 属性键使用上表中的模块名。这些名字也会出现在 `information_schema.catalog_meta_cache_statistics` 的 `ENTRY_NAME` 中。
- 如果 Hudi 表是通过 HMS catalog 提供访问的，`meta.cache.hudi.*` 也配置在该 HMS catalog 上。

示例：

```sql
ALTER CATALOG hudi_ctl SET PROPERTIES (
  "meta.cache.hudi.fs_view.capacity" = "2000"
);
```

### 可观测性 {#meta-cache-unified-observability}

Hudi 缓存指标可通过 `information_schema.catalog_meta_cache_statistics` 查询。
系统表字段与指标说明见：[catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md)。

Hudi 常见 entry：

| Entry | 含义 |
|---|---|
| `schema` | Schema cache entry |
| `partition` | 分区元数据缓存 entry |
| `fs_view` | FS View 缓存 entry |
| `meta_client` | Meta Client 缓存 entry |

示例查询：

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'hudi_ctl'
  AND engine_name = 'hudi'
ORDER BY entry_name;
```

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
