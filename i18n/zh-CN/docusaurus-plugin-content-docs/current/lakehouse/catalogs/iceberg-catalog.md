---
{
    "title": "Iceberg Catalog",
    "language": "zh-CN"
}
---

Doris 支持通过多种元数据服务访问 Iceberg 表数据。除支持数据读取外，Doris 也支持对 Iceberg 表进行写入操作。

[使用 Docker 快速体验 Apache Doris & Iceberg](../best-practices/doris-iceberg.md)

:::tip
用户可以通过 Hive Catalog 访问使用 Hive Metastore 作为元数据的 Iceberg 表。但依然推荐直接使用 Iceberg Catalog 以避免一些兼容性问题。
:::

## 适用场景

| 场景 | 说明                 |
| ---- | ------------------------------------------------------- |
| 查询加速 | 利用 Doris 分布式计算引擎，直接访问 Iceberg 数据进行查询加速。                 |
| 数据集成 | 读取 Iceberg 数据并写入到 Doris 内表。或通过 Doris 计算引擎进行 ZeroETL 操作。 |
| 数据写回 | 将任意 Doris 支持读取的数据源数据进行加工后，写回到 Iceberg 表存储。              |

## 配置 Catalog

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = '<iceberg_catalog_type>',
    'warehouse' = '<warehouse>' --optional
    {MetaStoreProperties},
    {StorageProperties},
    {CommonProperties}
);
```

* `<iceberg_catalog_type>`

  Iceberg Catalog 的类型，支持以下几种：

  * `hms`：使用 Hive Metastore 作为元数据服务。

  * `rest`：兼容 Iceberg Rest Catalog 接口的元数据服务。

  * `hadoop`：直接访问文件系统上存储的元数据。

  * `glue`：使用 AWS Glue 作为元数据服务。

  * `dlf`：使用阿里云 DLF 作为元数据服务。

  * `s3tables`: 使用 AWS S3 Tables Catalog 访问 [S3 Table Bucket](https://aws.amazon.com/s3/features/tables/).

* `<warehouse>`

  Iceberg 的仓库路径。当 `<iceberg_catalog_type>` 为 `hadoop` 时，需指定这个参数。

  `warehouse` 的路径必须指向 `Database` 路径的上一级。如您的表路径是：`s3://bucket/path/to/db1/table1`，那么 `warehouse` 应该是：`s3://bucket/path/to/`

* `{MetaStoreProperties}`

  MetaStoreProperties 部分用于填写 Metastore 元数据服务连接和认证信息。具体可参阅【支持的元数据服务】部分。

* `{StorageProperties}`

  StorageProperties 部分用于填写存储系统相关的连接和认证信息。具体可参阅【支持的存储系统】部分。

* `{CommonProperties}`

  CommonProperties 部分用于填写通用属性。请参阅[ 数据目录概述 ](../catalog-overview.md)中【通用属性】部分。

### 支持的 Iceberg 版本

当前使用的 Iceberg 依赖为 1.6.1 版本，可以兼容更高版本的 Iceberg。

### 支持的 Iceberg 格式

* 支持 Iceberg V1/V2 格式。

* 支持 Position Delete 和 Equality Delete。

### 支持的元数据服务

* [ Hive Metastore](../metastores/hive-metastore.md)

* [ AWS Glue](../metastores/aws-glue.md)

* [ Aliyun DLF ](../metastores/aliyun-dlf.md)

* [ Iceberg Rest Catalog](../metastores/iceberg-rest.md)

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

| Iceberg Type                           | Doris Type           | Comment               |
| -------------------------------------- | -------------------- | --------------------- |
| boolean                                | boolean              |                       |
| integer                                | int                  |                       |
| long                                   | bigint               |                       |
| float                                  | float                |                       |
| double                                 | double               |                       |
| decimal(P, S)                          | decimal(P, S)        |                       |
| date                                   | date                 |                       |
| timestamp (Timestamp without timezone) | datetime(6)          | 固定映射到精度为 6 的 datetime |
| timestamptz (Timestamp with timezone)  | datetime(6)          | 固定映射到精度为 6 的 datetime |
| fixed(N)                               | char(N)              |                       |
| string                                 | string               |                       |
| binary                                 | string               |                       |
| uuid                                   | string               |                       |
| struct                                 | struct（2.1.3 版本开始支持） |                       |
| map                                    | map（2.1.3 版本开始支持）    |                       |
| list                                   | array                |                       |
| other                                  | UNSUPPORTED          |                       |

## 基础示例

### Iceberg on Hive Metastore

```sql
CREATE CATALOG iceberg_hms PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:7004',
    'hadoop.username' = 'hive',
    'dfs.nameservices' = 'your-nameservice',
    'dfs.ha.namenodes.your-nameservice' = 'nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1' = '172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2' = '172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

### Iceberg on Hadoop

```sql
CREATE CATALOG iceberg_hadoop PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hadoop',
    'warehouse' = 'hdfs://namenode:8020/dir/key'
);
```

### Iceberg on S3

```sql
CREATE CATALOG iceberg_s3 PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hadoop',
    'warehouse' = 's3://bucket/dir/key',
    's3.endpoint' = 's3.us-east-1.amazonaws.com',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```

### Iceberg on Glue

```sql
-- Using access key and secret key
CREATE CATALOG iceberg_glue PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'glue',
    'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com/',
    'client.credentials-provider' = 'com.amazonaws.glue.catalog.credentials.ConfigAWSProvider',
    'client.credentials-provider.glue.access_key' = 'ak',
    'client.credentials-provider.glue.secret_key' = 'sk'
);
```

### Iceberg on DLF

```sql
CREATE CATALOG iceberg_dlf PROPERTIES (
   'type' = 'hms',
   'hive.metastore.type' = 'dlf',
   'dlf.proxy.mode' = 'DLF_ONLY',
   'dlf.endpoint' = 'datalake-vpc.cn-beijing.aliyuncs.com',
   'dlf.region' = 'cn-beijing',
   'dlf.uid' = 'uid',
   'dlf.catalog.id' = 'catalog_id',
   'dlf.access_key' = 'ak',
   'dlf.secret_key' = 'sk'
);
```

### Iceberg on Rest

```sql
CREATE CATALOG iceberg_rest PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'uri' = 'http://172.21.0.1:8181'
);
```

### Iceberg on Rest with MINIO

```sql
CREATE CATALOG iceberg_minio PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'uri' = 'http://172.21.0.1:8181',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk',
    's3.endpoint' = 'http://10.0.0.1:9000',
    's3.region' = 'us-east-1'
);
```

### Iceberg on Google Dataproc Metastore

```sql
CREATE CATALOG iceberg_gdm PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:9083',
    'gs.endpoint' = 'https://storage.googleapis.com',
    'gs.region' = 'us-east-1',
    'gs.access_key' = 'ak',
    'gs.secret_key' = 'sk',
    'use_path_style' = 'true'
);
```

### Iceberg on S3 Tables

```sql
CREATE CATALOG iceberg_s3 PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 's3tables',
    'warehouse' = 'arn:aws:s3tables:us-east-1:169000000000:bucket/doris-s3-table-bucket',
    's3.region' = 'us-east-1',
    's3.endpoint' = 's3.us-east-1.amazonaws.com',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```

可参阅 [集成 S3 Tables](../best-practices/doris-aws-s3tables.md) 文档。

## 查询操作

### 基础查询

```sql
-- 1. switch to catalog, use database and query
SWITCH iceberg;
USE iceberg_db;
SELECT * FROM iceberg_tbl LIMIT 10;

-- 2. use iceberg database directly
USE iceberg.iceberg_db;
SELECT * FROM iceberg_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM iceberg.iceberg_db.iceberg_tbl LIMIT 10;
```

### 时间旅行

支持读取 Iceberg 表指定的 Snapshot。

默认情况下，读取请求只会读取最新版本的快照。

可以通过 `iceberg_meta()` 表函数查询查询指定 Iceberg 表的 Snapshot：

```sql
SELECT * FROM iceberg_meta(
    'table' = 'iceberg_ctl.iceberg_db.iceberg_tbl',
    'query_type' = 'snapshots'
)\G

*************************** 1. row ***************************
 committed_at: 2024-11-28 11:07:29
  snapshot_id: 8903826400153112036
    parent_id: -1
    operation: append
manifest_list: oss://path/to/metadata/snap-8903826400153112036-1-3835e66d-9a18-4cb0-b9b0-9ec80527ad8d.avro
      summary: {"added-data-files":"2","added-records":"3","added-files-size":"2742","changed-partition-count":"2","total-records":"3","total-files-size":"2742","total-data-files":"2","total-delete-files":"0","total-position-deletes":"0","total-equality-deletes":"0"}
*************************** 2. row ***************************
 committed_at: 2024-11-28 11:10:11
  snapshot_id: 6099853805930794326
    parent_id: 8903826400153112036
    operation: append
manifest_list: oss://path/to/metadata/snap-6099853805930794326-1-dd46a1bd-219b-4fb0-bb46-ac441d8b3105.avro
      summary: {"added-data-files":"1","added-records":"1","added-files-size":"1367","changed-partition-count":"1","total-records":"4","total-files-size":"4109","total-data-files":"3","total-delete-files":"0","total-position-deletes":"0","total-equality-deletes":"0"}
```

可以使用 `FOR TIME AS OF` 和 `FOR VERSION AS OF` 语句，根据快照 ID 或者快照产生的时间读取历史版本的数据。示例如下：

```sql
SELECT * FROM iceberg_tbl FOR TIME AS OF "2022-10-07 17:20:37";

SELECT * FROM iceberg_tbl FOR VERSION AS OF 868895038966572;
```

### Branch 和 Tag

> 该功能自 3.1.0 版本支持

支持读取指定 Iceberg 表的分支（Branch）和标签（Tag）。

支持多种不同的语法形式，以兼容 Spark/Trino 等系统的语法。

```sql
-- BRANCH
SELECT * FROM iceberg_tbl@brand(branch1);
SELECT * FROM iceberg_tbl@brand("name" = "branch1");
SELECT * FROM iceberg_tbl FOR VERSION AS OF 'branch1';

-- TAG
SELECT * FROM iceberg_tbl@tag(tag1);
SELECT * FROM iceberg_tbl@tag("name" = "tag1");
SELECT * FROM iceberg_tbl FOR VERSION AS OF 'tag1';
```

对于 `FOR VERSION AS OF` 语法，Doris 会根据后面的参数，自动判断是时间戳还是 Branch/Tag 名称。

## 系统表

> 该功能自 3.1.0 版本支持

Doris 支持查询 Iceberg 系统表，用来查询表的相关元信息。支持使用系统表查看快照历史、清单文件、数据文件、分区等信息。

要访问 Iceberg 表的元数据，可以在表名后添加 `$` 符号，后跟系统表名称：

```sql
SELECT * FROM iceberg_table$system_table_name;
```

例如，要查看表的历史记录，可以执行：

```sql
SELECT * FROM iceberg_table$history;
```

> 目前 `all_manifests` 和 `position_deletes` 系统表尚未支持，计划在以后版本中支持。

### entries

显示表当前快照的所有清单条目：

`all_entries` 和 `entries` 类似，区别在于 `all_entries` 包含了所有快照的条目，而 `entries` 只包含当前快照的条目。

```sql
SELECT * FROM iceberg_table$entries;
```

结果：

```text
+--------+---------------------+-----------------+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| status | snapshot_id         | sequence_number | file_sequence_number | data_file                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | readable_metrics                                                                                                                                                                                                                                                   |
+--------+---------------------+-----------------+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|      2 | 4890031351138056789 |               1 |                    1 | {"content":0, "file_path":"s3://.../iceberg_table/data/id=1/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00001.parquet", "file_format":"PARQUET", "spec_id":0, "partition":{"id":1}, "record_count":1, "file_size_in_bytes":625, "column_sizes":{1:36, 2:41}, "value_counts":{1:1, 2:1}, "null_value_counts":{1:0, 2:0}, "nan_value_counts":{}, "lower_bounds":{1:"   ", 2:"Alice"}, "upper_bounds":{1:"   ", 2:"Alice"}, "key_metadata":null, "split_offsets":[4], "equality_ids":null, "sort_order_id":0, "first_row_id":null, "referenced_data_file":null, "content_offset":null, "content_size_in_bytes":null} | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":1, "upper_bound":1}, "name":{"column_size":41, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Alice", "upper_bound":"Alice"}} |
|      0 | 1851184769713369003 |               1 |                    1 | {"content":0, "file_path":"s3://.../iceberg_table/data/id=2/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00002.parquet", "file_format":"PARQUET", "spec_id":0, "partition":{"id":2}, "record_count":1, "file_size_in_bytes":611, "column_sizes":{1:36, 2:39}, "value_counts":{1:1, 2:1}, "null_value_counts":{1:0, 2:0}, "nan_value_counts":{}, "lower_bounds":{1:"   ", 2:"Bob"}, "upper_bounds":{1:"   ", 2:"Bob"}, "key_metadata":null, "split_offsets":[4], "equality_ids":null, "sort_order_id":0, "first_row_id":null, "referenced_data_file":null, "content_offset":null, "content_size_in_bytes":null}     | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":2, "upper_bound":2}, "name":{"column_size":39, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Bob", "upper_bound":"Bob"}}     |
+--------+---------------------+-----------------+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

### files

显示当前快照的文件信息：

```sql
SELECT * FROM iceberg_table$files;
```

结果：
```text
+---------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------+---------+-----------+--------------+--------------------+--------------+--------------+-------------------+------------------+-----------------------+-----------------------+--------------+---------------+--------------+---------------+--------------+----------------------+----------------+-----------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| content | file_path                                                                                       | file_format | spec_id | partition | record_count | file_size_in_bytes | column_sizes | value_counts | null_value_counts | nan_value_counts | lower_bounds          | upper_bounds          | key_metadata | split_offsets | equality_ids | sort_order_id | first_row_id | referenced_data_file | content_offset | content_size_in_bytes | readable_metrics                                                                                                                                                                                                                                                   |
+---------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------+---------+-----------+--------------+--------------------+--------------+--------------+-------------------+------------------+-----------------------+-----------------------+--------------+---------------+--------------+---------------+--------------+----------------------+----------------+-----------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|       0 | s3://.../iceberg_table/data/id=2/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00002.parquet  | PARQUET     |       0 | {"id":2}  |            1 |                611 | {1:36, 2:39} | {1:1, 2:1}   | {1:0, 2:0}        | {}               | {1:"   ", 2:"Bob"}   | {1:"   ", 2:"Bob"}   | NULL         | [4]           | NULL         |             0 |         NULL | NULL                 |           NULL |                  NULL | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":2, "upper_bound":2}, "name":{"column_size":39, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Bob", "upper_bound":"Bob"}}     |
|       0 | s3://.../iceberg_table/data/id=4/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00004.parquet  | PARQUET     |       0 | {"id":4}  |            1 |                618 | {1:36, 2:40} | {1:1, 2:1}   | {1:0, 2:0}        | {}               | {1:"   ", 2:"Dave"}  | {1:"   ", 2:"Dave"}  | NULL         | [4]           | NULL         |             0 |         NULL | NULL                 |           NULL |                  NULL | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":4, "upper_bound":4}, "name":{"column_size":40, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Dave", "upper_bound":"Dave"}}   |
|       0 | s3://.../iceberg_table/data/id=6/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00006.parquet  | PARQUET     |       0 | {"id":6}  |            1 |                625 | {1:36, 2:41} | {1:1, 2:1}   | {1:0, 2:0}        | {}               | {1:"   ", 2:"Frank"} | {1:"   ", 2:"Frank"} | NULL         | [4]           | NULL         |             0 |         NULL | NULL                 |           NULL |                  NULL | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":6, "upper_bound":6}, "name":{"column_size":41, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Frank", "upper_bound":"Frank"}} |
|       0 | s3://.../iceberg_table/data/id=8/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00008.parquet  | PARQUET     |       0 | {"id":8}  |            1 |                625 | {1:36, 2:41} | {1:1, 2:1}   | {1:0, 2:0}        | {}               | {1:"   ", 2:"Heidi"} | {1:"   ", 2:"Heidi"} | NULL         | [4]           | NULL         |             0 |         NULL | NULL                 |           NULL |                  NULL | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":8, "upper_bound":8}, "name":{"column_size":41, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Heidi", "upper_bound":"Heidi"}} |
|       0 | s3://.../iceberg_table/data/id=10/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00010.parquet | PARQUET     |       0 | {"id":10} |            1 |                618 | {1:36, 2:40} | {1:1, 2:1}   | {1:0, 2:0}        | {}               | {1:"   ", 2:"Judy"}  | {1:"   ", 2:"Judy"}  | NULL         | [4]           | NULL         |             0 |         NULL | NULL                 |           NULL |                  NULL | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":10, "upper_bound":10}, "name":{"column_size":40, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Judy", "upper_bound":"Judy"}} |
+---------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------+---------+-----------+--------------+--------------------+--------------+--------------+-------------------+------------------+-----------------------+-----------------------+--------------+---------------+--------------+---------------+--------------+----------------------+----------------+-----------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

类似于 `files` 系统表，还可以通过以下系统表查询特定类型的文件信息：

```sql
-- 查询当前快照的数据文件
SELECT * FROM iceberg_table$data_files;

-- 查询当前快照的删除文件
SELECT * FROM iceberg_table$delete_files;

-- 查询所有快照的所有文件（包括数据和删除文件）
SELECT * FROM iceberg_table$all_files;

-- 查询所有快照的数据文件
SELECT * FROM iceberg_table$all_data_files;

-- 查询所有快照的删除文件
SELECT * FROM iceberg_table$all_delete_files;
```

这些表的结果格式与 `files` 系统表相似，但分别专注于数据文件或删除文件。`all_` 前缀的系统表包含了所有快照中的文件，而不仅仅是当前快照的文件。

注意：当表中不存在特定类型的文件时（例如，表中没有删除文件时查询 `delete_files`），查询结果可能为空。

### history

显示表的所有历史记录：

```sql
SELECT * FROM iceberg_table$history;
```

结果：

```text
+----------------------------+---------------------+---------------------+---------------------+
| made_current_at            | snapshot_id         | parent_id           | is_current_ancestor |
+----------------------------+---------------------+---------------------+---------------------+
| 2025-06-12 22:29:16.357000 | 1851184769713369003 |                NULL |                   1 |
| 2025-06-12 22:29:39.922000 | 4890031351138056789 | 1851184769713369003 |                   1 |
+----------------------------+---------------------+---------------------+---------------------+
```

### manifests

显示表的当前 manifest 文件信息：

```sql
SELECT * FROM iceberg_table$manifests;
```

结果：

```text
+---------+------------------------------------------------------------------------------------------------------------------------------------------------+--------+-------------------+---------------------+------------------------+---------------------------+--------------------------+--------------------------+-----------------------------+----------------------------+--------------------------------------------------------------------------------+
| content | path                                                                         | length | partition_spec_id | added_snapshot_id   | added_data_files_count | existing_data_files_count | deleted_data_files_count | added_delete_files_count | existing_delete_files_count | deleted_delete_files_count | partition_summaries                                                            |
+---------+------------------------------------------------------------------------------------------------------------------------------------------------+--------+-------------------+---------------------+------------------------+---------------------------+--------------------------+--------------------------+-----------------------------+----------------------------+--------------------------------------------------------------------------------+
|       0 | s3://.../iceberg_table/metadata/3194eb8b-5ea4-4cbe-95ba-073229458e7b-m0.avro |   7138 |                 0 | 4890031351138056789 |                      0 |                         5 |                        5 |                        0 |                           0 |                          0 | [{"contains_null":0, "contains_nan":0, "lower_bound":"1", "upper_bound":"10"}] |
+---------+------------------------------------------------------------------------------------------------------------------------------------------------+--------+-------------------+---------------------+------------------------+---------------------------+--------------------------+--------------------------+-----------------------------+----------------------------+--------------------------------------------------------------------------------+
```

### metadata_log_entries

显示表的元数据日志条目：

```sql
SELECT * FROM iceberg_table$metadata_log_entries;
```

结果：

```text
+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------+------------------+------------------------+
| timestamp                  | file                                                                                     | latest_snapshot_id  | latest_schema_id | latest_sequence_number |
+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------+------------------+------------------------+
| 2025-06-12 22:29:06.948000 | s3://.../iceberg_table/metadata/00000-e373aa16-15f1-4e69-ae7d-5ed64199cf9a.metadata.json |                NULL |             NULL |                   NULL |
| 2025-06-12 22:29:16.357000 | s3://.../iceberg_table/metadata/00001-bbc8e244-e41c-4958-92f4-63b8c3ee1196.metadata.json | 1851184769713369003 |                0 |                      1 |
| 2025-06-12 22:29:39.922000 | s3://.../iceberg_table/metadata/00002-7dc00d6a-6269-4200-9d28-5f8c1c6b9f99.metadata.json | 4890031351138056789 |                0 |                      2 |
+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------+------------------+------------------------+
```

### partitions

显示表的当前分区信息：

```sql
SELECT * FROM iceberg_table$partitions;
```

结果：

```text
+-----------+---------+--------------+------------+-------------------------------+------------------------------+----------------------------+------------------------------+----------------------------+----------------------------+--------------------------+
| partition | spec_id | record_count | file_count | total_data_file_size_in_bytes | position_delete_record_count | position_delete_file_count | equality_delete_record_count | equality_delete_file_count | last_updated_at            | last_updated_snapshot_id |
+-----------+---------+--------------+------------+-------------------------------+------------------------------+----------------------------+------------------------------+----------------------------+----------------------------+--------------------------+
| {"id":8}  |       0 |            1 |          1 |                           625 |                            0 |                          0 |                            0 |                          0 | 2025-06-12 22:29:16.357000 |      1851184769713369003 |
| {"id":6}  |       0 |            1 |          1 |                           625 |                            0 |                          0 |                            0 |                          0 | 2025-06-12 22:29:16.357000 |      1851184769713369003 |
| {"id":10} |       0 |            1 |          1 |                           618 |                            0 |                          0 |                            0 |                          0 | 2025-06-12 22:29:16.357000 |      1851184769713369003 |
| {"id":4}  |       0 |            1 |          1 |                           618 |                            0 |                          0 |                            0 |                          0 | 2025-06-12 22:29:16.357000 |      1851184769713369003 |
| {"id":2}  |       0 |            1 |          1 |                           611 |                            0 |                          0 |                            0 |                          0 | 2025-06-12 22:29:16.357000 |      1851184769713369003 |
+-----------+---------+--------------+------------+-------------------------------+------------------------------+----------------------------+------------------------------+----------------------------+----------------------------+--------------------------+
```

注意：

1. 对于非分区表，`partitions` 表将不包含 `partition` 和 `spec_id` 字段。
2. `partitions` 表显示当前快照中包含数据文件或删除文件的分区。但是，删除文件未应用，因此在某些情况下，即使分区的所有数据行都已被删除文件标记为已删除，分区仍可能显示。

### refs

显示表的所有已知快照引用（分支和标签）：

```sql
SELECT * FROM iceberg_table$refs;
```

结果：

```text
+------+--------+---------------------+-------------------------+-----------------------+------------------------+
| name | type   | snapshot_id         | max_reference_age_in_ms | min_snapshots_to_keep | max_snapshot_age_in_ms |
+------+--------+---------------------+-------------------------+-----------------------+------------------------+
| main | BRANCH | 4890031351138056789 |                    NULL |                  NULL |                   NULL |
+------+--------+---------------------+-------------------------+-----------------------+------------------------+
```

### snapshots

显示表的所有有效快照：

```sql
SELECT * FROM iceberg_table$snapshots;
```

结果：

```text
+----------------------------+---------------------+---------------------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| committed_at               | snapshot_id         | parent_id           | operation | manifest_list                                                                                        | summary                                                                                                                                                                                                                                                                                                                      |
+----------------------------+---------------------+---------------------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 2025-06-12 22:29:16.357000 | 1851184769713369003 |                NULL | append    | s3://.../iceberg_table/metadata/snap-1851184769713369003-1-82059f57-821a-4983-b083-002cc2cde313.avro | {"spark.app.id":"application_1738810850199_0472", "added-data-files":"10", "added-records":"10", "added-files-size":"6200", "changed-partition-count":"10", "total-records":"10", "total-files-size":"6200", "total-data-files":"10", "total-delete-files":"0", "total-position-deletes":"0", "total-equality-deletes":"0"}  |
| 2025-06-12 22:29:39.922000 | 4890031351138056789 | 1851184769713369003 | overwrite | s3://.../iceberg_table/metadata/snap-4890031351138056789-1-3194eb8b-5ea4-4cbe-95ba-073229458e7b.avro | {"spark.app.id":"application_1738810850199_0472", "deleted-data-files":"5", "deleted-records":"5", "removed-files-size":"3103", "changed-partition-count":"5", "total-records":"5", "total-files-size":"3097", "total-data-files":"5", "total-delete-files":"0", "total-position-deletes":"0", "total-equality-deletes":"0"} |
+----------------------------+---------------------+---------------------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

## 写入操作

### INSERT INTO

INSERT 操作会将数据以追加的方式写入到目标表中。

例如：

```sql
INSERT INTO iceberg_tbl values (val1, val2, val3, val4);
INSERT INTO iceberg.iceberg_db.iceberg_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO iceberg_tbl(col1, col2) values (val1, val2);
INSERT INTO iceberg_tbl(col1, col2, partition_col1, partition_col2) values (1, 2, "beijing", "2023-12-12");
```

### INSERT OVERWRITE

INSERT OVERWRITE 会使用新的数据完全覆盖原有表中的数据。

```sql
INSERT OVERWRITE TABLE VALUES(val1, val2, val3, val4)
INSERT OVERWRITE TABLE iceberg.iceberg_db.iceberg_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;
```

### CTAS

可以通过 `CTAS` 语句创建 Iceberg 表并写入数据：

```sql
CREATE TABLE iceberg_ctas AS SELECT * FROM other_table;
```

CTAS 支持指定文件格式、分区方式等信息

```sql
CREATE TABLE iceberg_ctas
PARTITION BY LIST (pt1, pt2) ()
AS SELECT col1,pt1,pt2 FROM part_ctas_src WHERE col1>0;
    
CREATE TABLE iceberg.iceberg_db.iceberg_ctas (col1,col2,pt1)
PARTITION BY LIST (pt1) ()
PROPERTIES (
    'write-format'='parquet',
    'compression-codec'='zstd'
)
AS SELECT col1,pt1 as col2,pt2 as pt1 FROM test_ctas.part_ctas_src WHERE col1>0;
```

### 相关参数

* BE

  | 参数名称                                                                          | 默认值                                                                                                                                                                                                                                                                             | 描述   |
  | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
  | `iceberg_sink_max_file_size`                                                  | 最大的数据文件大小。当写入数据量超过该大小后会关闭当前文件，滚动产生一个新文件继续写入。                                                                                                                                                                                                                                    | 1GB  |
  | `table_sink_partition_write_max_partition_nums_per_writer`                    | BE 节点上每个 Instance 最大写入的分区数目。                                                                                                                                                                                                                                                    | 128  |
  | `table_sink_non_partition_write_scaling_data_processed_threshold`             | 非分区表开始 scaling-write 的数据量阈值。每增加 `table_sink_non_partition_write_scaling_data_processed_threshold` 数据就会发送给一个新的 writer(instance) 进行写入。scaling-write 机制主要是为了根据数据量来使用不同数目的 writer(instance) 来进行写入，会随着数据量的增加而增大写入的 writer(instance) 数目，从而提高并发写入的吞吐。当数据量比较少的时候也会节省资源，并且尽可能地减少产生的文件数目。 | 25MB |
  | `table_sink_partition_write_min_data_processed_rebalance_threshold`           | 分区表开始触发重平衡的最少数据量阈值。如果 `当前累积的数据量` - `自从上次触发重平衡或者最开始累积的数据量` >= `table_sink_partition_write_min_data_processed_rebalance_threshold`，就开始触发重平衡机制。如果发现最终生成的文件大小差异过大，可以调小改阈值来增加均衡度。当然过小的阈值会导致重平衡的成本增加，可能会影响性能。                                                                         | 25MB |
  | `table_sink_partition_write_min_partition_data_processed_rebalance_threshold` | 分区表开始进行重平衡时的最少的分区数据量阈值。如果 `当前分区的数据量` >= `阈值` \* `当前分区已经分配的 task 数目`，就开始对该分区进行重平衡。如果发现最终生成的文件大小差异过大，可以调小改阈值来增加均衡度。当然过小的阈值会导致重平衡的成本增加，可能会影响性能。                                                                                                                                    |      |

## 库表管理

### 创建和删除库

可以通过 `SWITCH` 语句切换到对应的 Catalog 下，执行 `CREATE DATABASE` 语句：

```sql
SWITCH iceberg;
CREATE DATABASE [IF NOT EXISTS] iceberg_db;
```

也可以使用全限定名创建，或指定 location（目前只有 hms 类型的 Catalog 支持指定 location），如：

```sql
CREATE DATABASE [IF NOT EXISTS] iceberg.iceberg_db;
    
CREATE DATABASE [IF NOT EXISTS] iceberg.iceberg_db
PROPERTIES ('location'='hdfs://172.21.16.47:4007/path/to/db/');
```

之后可以通过 `SHOW CREATE DATABASE` 命令可以查看 Database 的 Location 信息：

```sql
mysql> SHOW CREATE DATABASE iceberg_db;
+-------------+-------------------------------------------------------------------------------------------------+
| Database    | Create Database                                                                                 |
+-------------+-------------------------------------------------------------------------------------------------+
| iceberg_db  | CREATE DATABASE iceberg_db LOCATION 'hdfs://172.21.16.47:4007/usr/hive/warehouse/iceberg_db.db' |
+----------+----------------------------------------------------------------------------------------------------+
```

删除库：

```sql
DROP DATABASE [IF EXISTS] iceberg.iceberg_db;
```

:::caution
对于 Iceberg Database，必须先删除这个 Database 下的所有表后，才能删除 Database，否则会报错
:::

### 创建和删除表

* **创建**

  Doris 支持在 Iceberg 中创建分区或非分区表。

  例如：

  ```sql
  -- Create unpartitioned iceberg table
  CREATE TABLE unpartitioned_table (
    `col1` BOOLEAN COMMENT 'col1',
    `col2` INT COMMENT 'col2',
    `col3` BIGINT COMMENT 'col3',
    `col4` FLOAT COMMENT 'col4',
    `col5` DOUBLE COMMENT 'col5',
    `col6` DECIMAL(9,4) COMMENT 'col6',
    `col7` STRING COMMENT 'col7',
    `col8` DATE COMMENT 'col8',
    `col9` DATETIME COMMENT 'col9'
  )
  PROPERTIES (
    'write-format'='parquet'
  );

  -- Create partitioned iceberg table
  -- The partition columns must be in table's column definition list
  CREATE TABLE partition_table (
    `ts` DATETIME COMMENT 'ts',
    `col1` BOOLEAN COMMENT 'col1',
    `col2` INT COMMENT 'col2',
    `col3` BIGINT COMMENT 'col3',
    `col4` FLOAT COMMENT 'col4',
    `col5` DOUBLE COMMENT 'col5',
    `col6` DECIMAL(9,4) COMMENT 'col6',
    `col7` STRING COMMENT 'col7',
    `col8` DATE COMMENT 'col8',
    `col9` DATETIME COMMENT 'col9',
    `pt1` STRING COMMENT 'pt1',
    `pt2` STRING COMMENT 'pt2'
  )
  PARTITION BY LIST (day(ts), pt1, pt2) ()
  PROPERTIES (
    'write-format'='orc',
    'compression-codec'='zlib'
  );
  ```

  创建后，可以通过 `SHOW CREATE TABLE` 命令查看 Iceberg 的建表语句。关于分区表的分区函数，可以参阅后面的【分区】小节。

* **删除**

  可以通过 `DROP TABLE` 语句删除一个 Iceberg 表。当前删除表后，会同时删除数据，包括分区数据。

  例如：

  ```sql
  DROP TABLE [IF EXISTS] iceberg_tbl;
  ```

* **列类型映射**

  参考【列类型映射】部分。

* **分区**

  Iceberg 中的分区类型对应 Doris 中的 List 分区。因此，在 Doris 中 创建 Iceberg 分区表，需使用 List 分区的建表语句，但无需显式的枚举各个分区。在写入数据时，Doris 会根据数据的值，自动创建对应的 Iceberg 分区。

  * 支持创建单列或多列分区表。

  * 支持分区转换函数来支持 Iceberg 隐式分区以及分区演进的功能。具体 Iceberg 分区转换函数可以查看 [Iceberg partition transforms](https://iceberg.apache.org/spec/#partition-transforms)

      * `year(ts)` 或者 `years(ts)`

      * `month(ts)` 或者 `months(ts)`

      * `day(ts)` 或者 `days(ts)` 或者 `date(ts)`

      * `hour(ts)` 或者 `hours(ts)` 或者 `date_hour(ts)`

      * `bucket(N, col)`

      * `truncate(L, col)`

* **文件格式**

  * Parquet（默认）

    注意，由 Doris 创建的 Iceberg 表，Datetime 对应的是 `timestamp_ntz` 类型。

    2.1.11 和 3.0.7 之后的版本中，Datetime 类型写入到 Parquet 文件时，物理类型使用的是 INT64 而非 INT96。

    此外，如果是其他系统创建的 Iceberg 表，虽然 `timestamp` 和 `timestamp_ntz` 类型都映射为 Doris 的 Datetime 类型。但在写入时，会根据实际类型判断是否需要处理时区。

  * ORC

* **压缩格式**

  * Parquet：snappy，zstd（默认），plain。（plain 就是不采用压缩）

  * ORC：snappy，zlib（默认），zstd，plain。（plain 就是不采用压缩）

* **存储介质**

  * HDFS

  * 对象存储

### Schema 变更

Doris 支持 Iceberg 表的 Schema 变更（Schema Change），可以通过 `ALTER TABLE` 语句来修改表的 Schema。

支持的 Schema 变更操作包括：

* **修改列名称**
通过 `RENAME COLUMN` 子句修改列名称，不支持修改嵌套类型中的列名称。
```sql
ALTER TABLE iceberg_table RENAME COLUMN old_col_name TO new_col_name;
```

* **添加一列**
通过 `ADD COLUMN` 添加新列，新列会被添加到表的末尾, 不支持为嵌套类型添加新列。
在添加新列时，可以指定nullable属性、默认值和注释。
```sql
ALTER TABLE iceberg_table ADD COLUMN col_name col_type [nullable, [default default_value, [comment 'comment']]];
```
示例：
```sql
ALTER TABLE iceberg_table ADD COLUMN new_col STRING NOT NULL DEFAULT 'default_value' COMMENT 'This is a new col';
```

* **添加多列**
可以通过 `ADD COLUMN` 添加多列，新列会被添加到表的末尾, 不支持为嵌套类型添加新列。
每一列的语法和添加单列时一样。
```sql
ALTER TABLE iceberg_table ADD COLUMN (col_name1 col_type1 [nullable, [default default_value, [comment 'comment']]], col_name2 col_type2 [nullable, [default default_value, [comment 'comment']]] ...);
```

* **删除列**
通过 `DROP COLUMN` 删除列，不支持删除嵌套类型中的列。
```sql
ALTER TABLE iceberg_table DROP COLUMN col_name;
```

* **修改列**
通过 `MODIFY COLUMN` 语句修改列的属性，包括类型，nullable，默认值和注释。
注意：修改列的属性时，所有没有被修改的属性也应该显式地指定为原来的值。
```sql
ALTER TABLE iceberg_table MODIFY COLUMN col_name col_type [nullable, [default default_value, [comment 'comment']]];
```
示例：
```sql
CREATE TABLE iceberg_table (
    id INT,
    name STRING
);
-- 修改 id 列的类型为 BIGINT，设置为 NOT NULL，默认值为 0，并添加注释
ALTER TABLE iceberg_table MODIFY COLUMN id BIGINT NOT NULL DEFAULT 0 COMMENT 'This is a modified id column';
```

* **重新排序**
通过 `REORDER COLUMNS` 重新排序列，指定新的列顺序。
```sql
ALTER TABLE iceberg_table REORDER COLUMNS (col_name1, col_name2, ...);
```

## 附录

### 版本更新记录

| Doris 版本 | 功能支持                           |
| -------- | ------------------------------ |
| 2.1.3    | 支持 ORC 文件格式，支持 Equality Delete |
| 2.1.6    | 支持 DDL，DML                     |

