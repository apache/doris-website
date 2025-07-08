---
{
    "title": "Paimon Catalog",
    "language": "zh-CN"
}
---

Doris 支持通过多种元数据服务访问 Paimon 表元数据，并进行 Paimon 数据查询。

目前只支持 Paimon 表的读操作，未来会支持的写入 Paimon 表。

[使用 Docker 快速体验 Apache Doris & Paimon](../best-practices/doris-paimon.md)

## 适用场景

| 场景 | 说明                 |
| ---- | ------------------------------------------------------ |
| 查询加速 | 利用 Doris 分布式计算引擎，直接访问 Paimon 数据进行查询加速。                 |
| 数据集成 | 读取 Paimon 数据并写入到 Doris 内表。或通过 Doris 计算引擎进行 ZeroETL 操作。 |
| 数据写回 | 暂不支持。                                                   |

## 配置 Catalog

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = '<paimon_catalog_type>',
    'warehouse' = '<paimon_warehouse>'
    {MetaStoreProperties},
    {StorageProperties},
    {CommonProperties}
);
```

* `<paimon_catalog_type>`

  Paimon Catalog 的类型，支持以下几种：

  * `filesystem`：默认。直接访问文件系统上存储的元数据。

  * `hms`：使用 Hive Metastore 作为元数据服务。

  * `dlf`：使用阿里云 DLF 作为元数据服务。

* `<paimon_warehouse>`

  Paimon 的仓库路径。当 `<paimon_catalog_type>` 为 `filesystem` 时，需指定这个参数。

  `warehouse` 的路径必须指向 `Database` 路径的上一级。如您的表路径是：`s3://bucket/path/to/db1/table1`，那么 `warehouse` 应该是：`s3://bucket/path/to/`。

* `{MetaStoreProperties}`

  MetaStoreProperties 部分用于填写 Metastore 元数据服务连接和认证信息。具体可参阅【支持的元数据服务】部分。

* `{StorageProperties}`

  StorageProperties 部分用于填写存储系统相关的连接和认证信息。具体可参阅【支持的存储系统】部分。

* `{CommonProperties}`

  CommonProperties 部分用于填写通用属性。请参阅[ 数据目录概述 ](../catalog-overview.md)中【通用属性】部分。

### 支持的 Paimon 版本

当前依赖的 Paimon 版本为 1.0.0。

### 支持的 Paimon 格式

* 支持读取 Paimon Deletion Vector

### 支持的元数据服务

* [ Hive Metastore](../metastores/hive-metastore.md)

* [ Aliyun DLF ](../metastores/aliyun-dlf.md)

* [ FileSystem](../metastores/filesystem.md)

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

| Paimon Type                        | Doris Type    | Comment                                |
| ---------------------------------- | ------------- | -------------------------------------- |
| boolean                            | boolean       |                                        |
| tinyint                            | tinyint       |                                        |
| smallint                           | smallint      |                                        |
| integer                            | int           |                                        |
| bigint                             | bigint        |                                        |
| float                              | float         |                                        |
| double                             | double        |                                        |
| decimal(P, S)                      | decimal(P, S) |                                        |
| varchar                            | string        |                                        |
| char                               | string        |                                        |
| bianry                             | string        |                                        |
| varbinary                          | string        |                                        |
| date                               | date          |                                        |
| timestamp\_without\_time\_zone     | datetime(N)   | 会根据精度进行对应映射。如果精度大于 6，则最大映射到 6。（可能导致精度丢失） |
| timestamp\_with\_local\_time\_zone | datetime(N)   | 会根据精度进行对应映射。如果精度大于 6，则最大映射到 6。（可能导致精度丢失） |
| array                              | array         |                                        |
| map                                | map           |                                        |
| row                                | struct        |                                        |
| other                              | UNSUPPORTED   |                                        |

## 基础示例

### Paimon on HDFS

```sql
CREATE CATALOG paimon_hdfs PROPERTIES (
    'type' = 'paimon',
    'warehouse' = 'hdfs://HDFS8000871/user/paimon',
    'dfs.nameservices' = 'HDFS8000871',
    'dfs.ha.namenodes.HDFS8000871' = 'nn1,nn2',
    'dfs.namenode.rpc-address.HDFS8000871.nn1' = '172.21.0.1:4007',
    'dfs.namenode.rpc-address.HDFS8000871.nn2' = '172.21.0.2:4007',
    'dfs.client.failover.proxy.provider.HDFS8000871' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'hadoop.username' = 'hadoop'
);
```

### Paimon on HMS

```sql
CREATE CATALOG paimon_hms PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'hms',
    'warehouse' = 'hdfs://HDFS8000871/user/zhangdong/paimon2',
    'hive.metastore.uris' = 'thrift://172.21.0.44:7004',
    'dfs.nameservices' = 'HDFS8000871',
    'dfs.ha.namenodes.HDFS8000871' = 'nn1,nn2',
    'dfs.namenode.rpc-address.HDFS8000871.nn1' = '172.21.0.1:4007',
    'dfs.namenode.rpc-address.HDFS8000871.nn2' = '172.21.0.2:4007',
    'dfs.client.failover.proxy.provider.HDFS8000871' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'hadoop.username' = 'hadoop'
);
```

### Paimon on DLF

```sql
CREATE CATALOG paimon_dlf PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'dlf',
    'warehouse' = 'oss://xx/yy/',
    'dlf.proxy.mode' = 'DLF_ONLY',
    'dlf.uid' = 'xxxxx',
    'dlf.region' = 'cn-beijing',
    'dlf.access_key' = 'ak',
    'dlf.secret_key' = 'sk'
);
```

### Paimon on Google Dataproc Metastore

```sql
CREATE CATALOG `paimon_gms` PROPERTIES (
    "type" = "paimon",
    "paimon.catalog.type" = "hms",
    "hive.metastore.uris" = "thrift://ip:port",
    "warehouse" = "gs://bucket/warehouse",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "region",
    "s3.endpoint" = "storage.googleapis.com"
);
```

### Paimon on Google Cloud Storage

```sql
CREATE CATALOG `paimon_gcs` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "gs://bucket/warehouse",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "region",
    "s3.endpoint" = "storage.googleapis.com"
);
```

## 查询操作

### 基础查询

配置好 Catalog 后，可以通过以下方式查询 Catalog 中的表数据：

```sql
-- 1. switch to catalog, use database and query
SWITCH paimon_ctl;
USE paimon_db;
SELECT * FROM paimon_tbl LIMIT 10;

-- 2. use paimon database directly
USE paimon_ctl.paimon_db;
SELECT * FROM paimon_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM paimon_ctl.paimon_db.paimon_tbl LIMIT 10;
```

### 增量查询

> 该功能自 3.1.0 版本支持

支持类似 Flink 针对 Paimon 的 [Batch Incremental](https://paimon.apache.org/docs/master/flink/sql-query/#batch-incremental) 查询。

支持查询指定的快照或时间戳区间内的增量数据。区间为左闭右开区间。

```sql
-- read from snapshot 2
SELECT * FROM paimon_table@incr('startSnapshotId'='2');

-- between snapshots [0, 5)
SELECT * FROM paimon_table@incr('startSnapshotId'='0', 'endSnapshotId'='5');

-- between snapshots [0, 5) with specified scan mode
SELECT * FROM paimon_table@incr('startSnapshotId'='0', 'endSnapshotId'='5', 'incrementalBetweenScanMode'='diff');

-- read from start timestamp
SELECT * FROM paimon_table@incr('startTimestamp'='1750844949');

-- read between timestamp
SELECT * FROM paimon_table@incr('startTimestamp'='1750844949', 'endTimestamp'='1750944949');
```

参数说明：

| 参数 | 说明 | 示例 |
| --- | --- | -- |
| `startSnapshotId` | 起始快照 ID，必须大于 0 | `'startSnapshotId'='3'` |
| `endSnapshotId` | 结束快照 ID，必须大于 `startSnapshotId`。可选，如不指定，则表示从 `startSnapshotId` 开始读取到最新的快照 | `'endSnapshotId'='10'` |
| `incrementalBetweenScanMode` | 指定增量读取的模式，默认 `auto`，支持 `delta`， `changelog` 和 `diff` |  `'incrementalBetweenScanMode'='delta'` |
| `startTimestamp` | 起始快照时间，必须大于等于 0 | `'startTimestamp'='1750844949'` |
| `endTimestamp` | 结束快照时间，必须大于 `startTimestamp`。可选，如不指定，则表示从 `startTimestamp` 开始读取到最新的快照 | `'endTimestamp'='1750944949'` |

> 注：

> - `startSnapshotId` 和 `endSnapshotId` 会组成 Paimon 参数 `'incremental-between'='3,10'`

> - `startTimestamp` 和 `endTimestamp` 会组成 Paimon 参数 `'incremental-between-timestamp'='1750844949,1750944949'`

> - `incrementalBetweenScanMode` 对应 Paimon 参数 `incremental-between-scan-mode`。

可参阅 [Paimon 文档](https://paimon.apache.org/docs/master/maintenance/configurations/) 进一步了解这些参数。


## 系统表

> 该功能自 3.1.0 版本支持

Doris 支持查询 Paimon 系统表，用来查询表的相关元信息。支持使用系统表查看快照历史、清单文件、数据文件、分区等信息。

要访问 Paimon 表的元数据，可以在表名后添加 $ 符号，后跟系统表名称：

```sql
SELECT * FROM my_table$system_table_name;
```

例如，要查看表的审计记录，可以执行：

```sql
SELECT * FROM my_table$audit_log;
```

> 注意点：Doris 不支持读取 Paimon 全局系统表，其只在 Flink 中支持。

### schemas

显示表的当前和历史模式信息。当使用 `ALTER TABLE`、`CREATE TABLE AS` 或 `CREATE DATABASE AS` 语句修改表模式时，每次修改都会在 schemas 表中生成一条记录：

```sql
SELECT * FROM my_table$schemas;
```

结果：
```text
+-----------+--------------------------------------------------------------------------------------------------------------------+----------------+--------------+---------+---------+-------------------------+
| schema_id | fields                                                                                                             | partition_keys | primary_keys | options | comment | update_time             |
+-----------+--------------------------------------------------------------------------------------------------------------------+----------------+--------------+---------+---------+-------------------------+
|         0 | [{"id":0,"name":"k","type":"INT NOT NULL"},{"id":1,"name":"f0","type":"INT"},{"id":2,"name":"f1","type":"STRING"}] | []             | ["k"]        | {}      |         | 2025-03-04 22:48:41.666 |
+-----------+--------------------------------------------------------------------------------------------------------------------+----------------+--------------+---------+---------+-------------------------+
```

### snapshots

显示表的所有有效快照信息，包括快照创建时间、提交用户、操作类型等：

```sql
SELECT * FROM my_table$snapshots;
```

结果：
```text
+-------------+-----------+--------------------------------------+---------------------+-------------+-------------------------+------------------------------------------------------+------------------------------------------------------+-------------------------+--------------------+--------------------+------------------------+----------------------+
| snapshot_id | schema_id | commit_user                          | commit_identifier   | commit_kind | commit_time             | base_manifest_list                                   | delta_manifest_list                                  | changelog_manifest_list | total_record_count | delta_record_count | changelog_record_count | watermark            |
+-------------+-----------+--------------------------------------+---------------------+-------------+-------------------------+------------------------------------------------------+------------------------------------------------------+-------------------------+--------------------+--------------------+------------------------+----------------------+
|           1 |         0 | d7ea4996-92c7-469f-b9ff-c76525954f1c | 9223372036854775807 | APPEND      | 2025-03-04 22:48:45.575 | manifest-list-dc5490ba-420c-445a-b6f7-6962d394935c-0 | manifest-list-dc5490ba-420c-445a-b6f7-6962d394935c-1 | NULL                    |                  1 |                  1 |                      0 | -9223372036854775808 |
|           2 |         0 | 34de47f6-31d1-4f06-b378-c85ef4fbca41 | 9223372036854775807 | APPEND      | 2025-07-01 23:11:35.406 | manifest-list-dca6aa5b-6fc6-4b4f-ac22-acfa15bbf171-0 | manifest-list-dca6aa5b-6fc6-4b4f-ac22-acfa15bbf171-1 | NULL                    |                  2 |                  1 |                      0 | -9223372036854775808 |
|           3 |         0 | 89f67183-a1f8-4ee9-b73c-3f7e992b79a7 | 9223372036854775807 | APPEND      | 2025-07-01 23:11:45.114 | manifest-list-6d624d1b-c774-4d95-905e-8258a7b89ecb-0 | manifest-list-6d624d1b-c774-4d95-905e-8258a7b89ecb-1 | NULL                    |                  3 |                  1 |                      0 | -9223372036854775808 |
|           4 |         0 | 31924a7c-1389-490c-adf1-3bb805b33cd7 | 9223372036854775807 | APPEND      | 2025-07-01 23:12:42.042 | manifest-list-09097a51-afde-485e-929b-d2cc39eb6eb2-0 | manifest-list-09097a51-afde-485e-929b-d2cc39eb6eb2-1 | NULL                    |                  5 |                  2 |                      0 | -9223372036854775808 |
|           5 |         0 | 1e90a80b-41cb-4242-b97c-889728f76810 | 9223372036854775807 | APPEND      | 2025-07-01 23:14:26.445 | manifest-list-b8471969-9c4d-41cd-b790-64f6efb2d142-0 | manifest-list-b8471969-9c4d-41cd-b790-64f6efb2d142-1 | NULL                    |                  6 |                  1 |                      0 | -9223372036854775808 |
|           6 |         0 | 1e90a80b-41cb-4242-b97c-889728f76810 | 9223372036854775807 | COMPACT     | 2025-07-01 23:14:29.317 | manifest-list-b8471969-9c4d-41cd-b790-64f6efb2d142-2 | manifest-list-b8471969-9c4d-41cd-b790-64f6efb2d142-3 | NULL                    |                  5 |                 -1 |                      0 | -9223372036854775808 |
+-------------+-----------+--------------------------------------+---------------------+-------------+-------------------------+------------------------------------------------------+------------------------------------------------------+-------------------------+--------------------+--------------------+------------------------+----------------------+
```

### options

显示表的当前配置选项。如果表选项未包含在表中，则该选项设置为默认值：

```sql
SELECT * FROM my_table$options;
```

结果：
```text
+------------------------+--------------------+
|         key            |        value       |
+------------------------+--------------------+
| snapshot.time-retained |         5 h        |
+------------------------+--------------------+
```

### files

显示当前快照指向的所有数据文件信息，包括文件格式、记录数、文件大小等：

```sql
SELECT * FROM my_table$files;
```

结果：
```text
mysql> SELECT * FROM my_table$files;
+-----------+--------+------------------------------------------------------------------------------------------------------------------------+-------------+-----------+-------+--------------+--------------------+---------+---------+-------------------+---------------------+---------------------+---------------------+---------------------+-------------------------+-------------+
| partition | bucket | file_path                                                                                                              | file_format | schema_id | level | record_count | file_size_in_bytes | min_key | max_key | null_value_counts | min_value_stats     | max_value_stats     | min_sequence_number | max_sequence_number | creation_time           | file_source |
+-----------+--------+------------------------------------------------------------------------------------------------------------------------+-------------+-----------+-------+--------------+--------------------+---------+---------+-------------------+---------------------+---------------------+---------------------+---------------------+-------------------------+-------------+
| {}        |      0 | s3://paimon-warehouse-dev/test-flink/cookbook.db/my_table/bucket-0/data-b4a49c57-6ef6-4c04-8813-07a4960d987c-0.parquet | parquet     |         0 |     5 |            5 |               1321 | [1]     | [6]     | {f0=0, f1=0, k=0} | {f0=4, f1=111, k=1} | {f0=11, f1=k7, k=6} |                   0 |                   5 | 2025-07-01 23:14:23.967 | COMPACT     |
+-----------+--------+------------------------------------------------------------------------------------------------------------------------+-------------+-----------+-------+--------------+--------------------+---------+---------+-------------------+---------------------+---------------------+---------------------+---------------------+-------------------------+-------------+
```

### tags

显示表的所有标签信息，包括标签名称和关联的快照：

```sql
SELECT * FROM my_table$tags;
```

结果：
```text
+----------+-------------+-----------+-------------------------+--------------+--------------+
| tag_name | snapshot_id | schema_id |             commit_time | record_count |   branches   |
+----------+-------------+-----------+-------------------------+--------------+--------------+
|     tag1 |           1 |         0 | 2025-03-04 14:55:29.344 |            3 |      []      |
|     tag3 |           3 |         0 | 2025-03-04 14:58:24.691 |            7 |  [branch-1]  |
+----------+-------------+-----------+-------------------------+--------------+--------------+
```

### branches

显示表的所有已知分支信息：

```sql
SELECT * FROM my_table$branches;
```

结果：
```text
+----------------------+-------------------------+
|          branch_name |             create_time |
+----------------------+-------------------------+
|              branch1 | 2025-03-04 20:31:39.084 |
|              branch2 | 2025-03-04 21:11:14.373 |
+----------------------+-------------------------+
```

### consumers

显示表的消费者信息，用于跟踪数据消费情况：

```sql
SELECT * FROM my_table$consumers;
```

结果：
```text
+-------------+------------------+
| consumer_id | next_snapshot_id |
+-------------+------------------+
|         id1 |                1 |
|         id2 |                3 |
+-------------+------------------+
```

### manifests

显示表当前快照的清单文件信息：

```sql
SELECT * FROM my_table$manifests;
```

结果：
```text
+-------------------------------------------------+-----------+-----------------+-------------------+-----------+---------------------+---------------------+
| file_name                                       | file_size | num_added_files | num_deleted_files | schema_id | min_partition_stats | max_partition_stats |
+-------------------------------------------------+-----------+-----------------+-------------------+-----------+---------------------+---------------------+
| manifest-3df9bb64-5c11-4aef-994e-d8717fedfc70-0 |      1949 |               1 |                 0 |         0 | {}                  | {}                  |
| manifest-d7eb4ec4-7238-478a-9ae6-91a4ccebd561-0 |      1946 |               1 |                 0 |         0 | {}                  | {}                  |
| manifest-3b6f4079-c893-4413-aedc-1e8fbcea6db1-0 |      1948 |               1 |                 0 |         0 | {}                  | {}                  |
| manifest-abe5177f-82da-4e86-9864-40efffb391bd-0 |      1964 |               1 |                 0 |         0 | {}                  | {}                  |
| manifest-ee89dff3-a523-4655-a4b8-d7c9e471a1d6-0 |      1949 |               1 |                 0 |         0 | {}                  | {}                  |
| manifest-ee89dff3-a523-4655-a4b8-d7c9e471a1d6-1 |      2232 |               1 |                 5 |         0 | {}                  | {}                  |
+-------------------------------------------------+-----------+-----------------+-------------------+-----------+---------------------+---------------------+
```

### aggregation_fields

显示表的聚合字段信息，用于聚合表的字段配置：

```sql
SELECT * FROM my_table$aggregation_fields;
```

结果：
```text
+------------+--------------+----------+------------------+---------+
| field_name | field_type   | function | function_options | comment |
+------------+--------------+----------+------------------+---------+
| k          | INT NOT NULL | []       | []               | NULL    |
| f0         | INT          | []       | []               | NULL    |
| f1         | STRING       | []       | []               | NULL    |
+------------+--------------+----------+------------------+---------+
```

### partitions

显示表的分区信息，包括每个分区的总记录数和文件总大小：

```sql
SELECT * FROM my_table$partitions;
```

结果：
```text
+-----------+--------------+--------------------+------------+-------------------------+
| partition | record_count | file_size_in_bytes | file_count | last_update_time        |
+-----------+--------------+--------------------+------------+-------------------------+
| {}        |            5 |               1321 |          1 | 2025-07-01 23:14:23.967 |
+-----------+--------------+--------------------+------------+-------------------------+
```

### buckets

显示表的分桶信息，包括每个分桶的统计数据：

```sql
SELECT * FROM my_table$buckets;
```

结果：
```text
+-----------+--------+--------------+--------------------+------------+-------------------------+
| partition | bucket | record_count | file_size_in_bytes | file_count | last_update_time        |
+-----------+--------+--------------+--------------------+------------+-------------------------+
| {}        |      0 |            5 |               1321 |          1 | 2025-07-01 23:14:23.967 |
+-----------+--------+--------------+--------------------+------------+-------------------------+
```

### statistics

显示表的统计信息，包括行数、数据大小等统计数据：

```sql
SELECT * FROM my_table$statistics;
```

结果：
```text
+--------------+------------+-----------------------+------------------+----------+
|  snapshot_id |  schema_id |     mergedRecordCount | mergedRecordSize |  colstat |
+--------------+------------+-----------------------+------------------+----------+
|            2 |          0 |              2        |         2        |    {}    |
+--------------+------------+-----------------------+------------------+----------+
```

### table_indexes

显示表的索引信息：

```sql
SELECT * FROM my_table$table_indexes;
```

结果：
```text
+--------------------------------+-------------+--------------------------------+--------------------------------+----------------------+----------------------+--------------------------------+
|                      partition |      bucket |                     index_type |                      file_name |            file_size |            row_count |                      dv_ranges |
+--------------------------------+-------------+--------------------------------+--------------------------------+----------------------+----------------------+--------------------------------+
|                   {2025-03-01} |           0 |                           HASH | index-70abfebf-149e-4796-9f... |                   12 |                    3 |                         <NULL> |
|                   {2025-04-01} |           0 |               DELETION_VECTORS | index-633857e7-cdce-47d2-87... |                   33 |                    1 | [(data-346cb9c8-4032-4d66-a... |
+--------------------------------+-------------+--------------------------------+--------------------------------+----------------------+----------------------+--------------------------------+
```

### 系统表使用场景

通过系统表，您可以轻松完成以下运维和监控任务。

#### 查看表的最新快照信息，了解表的当前状态

```sql
SELECT snapshot_id, commit_time, commit_kind, total_record_count FROM catalog_sales$snapshots ORDER BY snapshot_id DESC;
```
结果：

```text
+-------------+-------------------------+-------------+--------------------+
| snapshot_id | commit_time             | commit_kind | total_record_count |
+-------------+-------------------------+-------------+--------------------+
|           1 | 2025-07-01 21:21:54.179 | APPEND      |           14329288 |
+-------------+-------------------------+-------------+--------------------+
```

#### 查看快照的表信息

```sql
SELECT s.snapshot_id, t.schema_id, t.fields FROM store_sales$snapshots s JOIN store_sales$schemas t ON s.schema_id=t.schema_id;
```

结果：

```text
+-------------+-----------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| snapshot_id | schema_id | fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
+-------------+-----------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|           1 |         0 | [{"id":0,"name":"ss_sold_date_sk","type":"INT"},{"id":1,"name":"ss_item_sk","type":"INT NOT NULL"},{"id":2,"name":"ss_ticket_number","type":"INT NOT NULL"},{"id":3,"name":"ss_sold_time_sk","type":"INT"},{"id":4,"name":"ss_customer_sk","type":"INT"},{"id":5,"name":"ss_cdemo_sk","type":"INT"},{"id":6,"name":"ss_hdemo_sk","type":"INT"},{"id":7,"name":"ss_addr_sk","type":"INT"},{"id":8,"name":"ss_store_sk","type":"INT"},{"id":9,"name":"ss_promo_sk","type":"INT"},{"id":10,"name":"ss_quantity","type":"INT"},{"id":11,"name":"ss_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":12,"name":"ss_list_price","type":"DECIMAL(7, 2)"},{"id":13,"name":"ss_sales_price","type":"DECIMAL(7, 2)"},{"id":14,"name":"ss_ext_discount_amt","type":"DECIMAL(7, 2)"},{"id":15,"name":"ss_ext_sales_price","type":"DECIMAL(7, 2)"},{"id":16,"name":"ss_ext_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":17,"name":"ss_ext_list_price","type":"DECIMAL(7, 2)"},{"id":18,"name":"ss_ext_tax","type":"DECIMAL(7, 2)"},{"id":19,"name":"ss_coupon_amt","type":"DECIMAL(7, 2)"},{"id":20,"name":"ss_net_paid","type":"DECIMAL(7, 2)"},{"id":21,"name":"ss_net_paid_inc_tax","type":"DECIMAL(7, 2)"},{"id":22,"name":"ss_net_profit","type":"DECIMAL(7, 2)"}] |
|           2 |         0 | [{"id":0,"name":"ss_sold_date_sk","type":"INT"},{"id":1,"name":"ss_item_sk","type":"INT NOT NULL"},{"id":2,"name":"ss_ticket_number","type":"INT NOT NULL"},{"id":3,"name":"ss_sold_time_sk","type":"INT"},{"id":4,"name":"ss_customer_sk","type":"INT"},{"id":5,"name":"ss_cdemo_sk","type":"INT"},{"id":6,"name":"ss_hdemo_sk","type":"INT"},{"id":7,"name":"ss_addr_sk","type":"INT"},{"id":8,"name":"ss_store_sk","type":"INT"},{"id":9,"name":"ss_promo_sk","type":"INT"},{"id":10,"name":"ss_quantity","type":"INT"},{"id":11,"name":"ss_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":12,"name":"ss_list_price","type":"DECIMAL(7, 2)"},{"id":13,"name":"ss_sales_price","type":"DECIMAL(7, 2)"},{"id":14,"name":"ss_ext_discount_amt","type":"DECIMAL(7, 2)"},{"id":15,"name":"ss_ext_sales_price","type":"DECIMAL(7, 2)"},{"id":16,"name":"ss_ext_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":17,"name":"ss_ext_list_price","type":"DECIMAL(7, 2)"},{"id":18,"name":"ss_ext_tax","type":"DECIMAL(7, 2)"},{"id":19,"name":"ss_coupon_amt","type":"DECIMAL(7, 2)"},{"id":20,"name":"ss_net_paid","type":"DECIMAL(7, 2)"},{"id":21,"name":"ss_net_paid_inc_tax","type":"DECIMAL(7, 2)"},{"id":22,"name":"ss_net_profit","type":"DECIMAL(7, 2)"}] |
+-------------+-----------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

#### 查看 buckets 的数据分布情况

```sql
SELECT `bucket` , COUNT(*) as file_count, SUM(file_size_in_bytes)/1024/1024 as total_size_mb from paimon_s3.tpcds.catalog_sales$files GROUP BY `bucket`  ORDER BY total_size_mb;
```
> 注意：Paimon 系统表中的许多字段是 Doris 中的关键字，因此需要加上 `。

结果：

```text
+--------+------------+--------------------+
| bucket | file_count | total_size_mb      |
+--------+------------+--------------------+
|     35 |          1 | 12.144722938537598 |
|     81 |          1 | 12.143454551696777 |
|     37 |          1 |  12.14071273803711 |
|     36 |          1 | 12.139023780822754 |
|     63 |          1 | 12.137332916259766 |
|      7 |          1 | 12.122495651245117 |
|     15 |          1 | 12.117934226989746 |
|     11 |          1 | 12.116133689880371 |
|     12 |          1 |  12.11155891418457 |
|     46 |          1 | 12.111005783081055 |
+--------+------------+--------------------+
```

## 附录

