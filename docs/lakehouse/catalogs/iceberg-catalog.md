---
{
    "title": "Iceberg Catalog",
    "language": "en"
}
---

Doris supports accessing Iceberg table data through various metadata services. In addition to reading data, Doris also supports writing to Iceberg tables.

[Quick start with Apache Doris and Apache Iceberg](../best-practices/doris-iceberg.md).

:::tip
Users can access Iceberg tables using Hive Metastore as metadata through the Hive Catalog. However, it is still recommended to use the Iceberg Catalog directly to avoid some compatibility issues.
:::

## Applicable Scenarios

| Scenario    | Description                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| Query Acceleration | Use Doris's distributed computing engine to directly access Iceberg data for faster queries.      |
| Data Integration  | Read Iceberg data and write it to internal Doris tables, or perform ZeroETL operations using the Doris computing engine. |
| Data Write-back   | Process data from any Doris-supported data source and write it back to Iceberg table storage.       |

## Configuring Catalog

### Syntax

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

  The type of Iceberg Catalog, supporting the following options:

  * `hms`: Uses Hive Metastore as the metadata service.

  * `rest`: Metadata service compatible with the Iceberg Rest Catalog interface.

  * `hadoop`: Directly accesses metadata stored on the file system.

  * `glue`: Uses AWS Glue as the metadata service.

  * `dlf`: Uses Alibaba Cloud DLF as the metadata service.

  * `s3tables`: Uses AWS S3 Tables Catalog to visit [S3 Table Bucket](https://aws.amazon.com/s3/features/tables/).

* `<warehouse>`

  The warehouse path for Iceberg. This parameter must be specified when `<iceberg_catalog_type>` is `hadoop`.

  The `warehouse` path must point to the level above the `Database` path. For example, if your table path is `s3://bucket/path/to/db1/table1`, then the `warehouse` should be `s3://bucket/path/to/`.

* `{MetaStoreProperties}`

  The MetaStoreProperties section is for entering connection and authentication information for the Metastore metadata service. Refer to the section on [Supported Metadata Services].

* `{StorageProperties}`

  The StorageProperties section is for entering connection and authentication information related to the storage system. Refer to the section on [Supported Storage Systems].

* `{CommonProperties}`

  The CommonProperties section is for entering general properties. See the [Catalog Overview](../catalog-overview.md) for details on common properties.

### Supported Iceberg Versions

The current Iceberg dependency is version 1.6.1, which is compatible with higher versions of Iceberg.

### Supported Iceberg Formats

* Supports Iceberg V1/V2 formats.
* Supports Position Delete and Equality Delete.

### Supported Metadata Services

* [Hive Metastore](../metastores/hive-metastore.md)
* [AWS Glue](../metastores/aws-glue.md)
* [Aliyun DLF](../metastores/aliyun-dlf.md)
* [Iceberg Rest Catalog](../metastores/iceberg-rest.md)
* [FileSystem](../metastores/filesystem.md)

### Supported Storage Systems

* [HDFS](../storages/hdfs.md)
* [AWS S3](../storages/s3.md)
* [Google Cloud Storage](../storages/gcs.md)
* [Aliyun OSS](../storages/aliyun-oss.md)
* [Tencent COS](../storages/tencent-cos.md)
* [Huawei OBS](../storages/huawei-obs.md)
* [MINIO](../storages/minio.md)

### Supported Data Formats

* [Parquet](../file-formats/parquet.md)
* [ORC](../file-formats/orc.md)

## Column Type Mapping

| Iceberg Type                           | Doris Type           | Comment                                 |
| -------------------------------------- | -------------------- | --------------------------------------- |
| boolean                                | boolean              |                                         |
| integer                                | int                  |                                         |
| long                                   | bigint               |                                         |
| float                                  | float                |                                         |
| double                                 | double               |                                         |
| decimal(P, S)                          | decimal(P, S)        |                                         |
| date                                   | date                 |                                         |
| timestamp (Timestamp without timezone) | datetime(6)          | Mapped to datetime with precision 6     |
| timestamptz (Timestamp with timezone)  | datetime(6)          | Mapped to datetime with precision 6     |
| fixed(N)                               | char(N)              |                                         |
| string                                 | string               |                                         |
| binary                                 | string               |                                         |
| uuid                                   | string               |                                         |
| struct                                 | struct (supported from version 2.1.3) |                                         |
| map                                    | map (supported from version 2.1.3)    |                                         |
| list                                   | array                |                                         |
| other                                  | UNSUPPORTED          |                                         |

## Examples

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

Please refer to [Integration with AWS S3 Tables](../best-practices/doris-aws-s3tables.md).

## Query Operations

### Basic Query

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

### Time Travel

You can read a specific snapshot of an Iceberg table.

By default, read requests will access the latest snapshot version.

You can query a specific snapshot of an Iceberg table using the `iceberg_meta()` table function:

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

You can use the `FOR TIME AS OF` and `FOR VERSION AS OF` clauses to read historical data based on snapshot ID or the time the snapshot was created. Here are some examples:

```sql
-- Read data as of a specific timestamp
SELECT * FROM iceberg_table FOR TIME AS OF '2023-01-01 00:00:00';

-- Read data as of a specific snapshot ID
SELECT * FROM iceberg_table FOR VERSION AS OF 123456789;
```

### Branch and Tag

> This feature is supported since version 3.1.0

Reading specific branches and tags of Iceberg tables is supported.

Multiple syntax forms are supported to be compatible with systems such as Spark/Trino.

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

For the `FOR VERSION AS OF` syntax, Doris will automatically determine whether the parameter is a timestamp or a Branch/Tag name.

## System Tables

> This feature is supported since version 3.1.0

Doris supports querying Iceberg system tables to retrieve metadata information about tables. You can use system tables to view snapshot history, manifest files, data files, partitions, and other metadata.

To access metadata of an Iceberg table, append a `$` symbol followed by the system table name to the table name:

```sql
SELECT * FROM iceberg_table$system_table_name;
```

For example, to view the table's history, you can execute:

```sql
SELECT * FROM iceberg_table$history;
```

> Currently, the `all_manifests` and `position_deletes` system tables are not yet supported and are planned to be supported in future versions.

### entries

Shows all manifest entries for the current snapshot of the table:

`all_entries` and `entries` are similar, with the difference that `all_entries` contains entries from all snapshots, while `entries` only contains entries from the current snapshot.

```sql
SELECT * FROM iceberg_table$entries;
```

Result:

```text
+--------+---------------------+-----------------+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| status | snapshot_id         | sequence_number | file_sequence_number | data_file                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | readable_metrics                                                                                                                                                                                                                                                   |
+--------+---------------------+-----------------+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|      2 | 4890031351138056789 |               1 |                    1 | {"content":0, "file_path":"s3://.../iceberg_table/data/id=1/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00001.parquet", "file_format":"PARQUET", "spec_id":0, "partition":{"id":1}, "record_count":1, "file_size_in_bytes":625, "column_sizes":{1:36, 2:41}, "value_counts":{1:1, 2:1}, "null_value_counts":{1:0, 2:0}, "nan_value_counts":{}, "lower_bounds":{1:"   ", 2:"Alice"}, "upper_bounds":{1:"   ", 2:"Alice"}, "key_metadata":null, "split_offsets":[4], "equality_ids":null, "sort_order_id":0, "first_row_id":null, "referenced_data_file":null, "content_offset":null, "content_size_in_bytes":null} | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":1, "upper_bound":1}, "name":{"column_size":41, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Alice", "upper_bound":"Alice"}} |
|      0 | 1851184769713369003 |               1 |                    1 | {"content":0, "file_path":"s3://.../iceberg_table/data/id=2/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00002.parquet", "file_format":"PARQUET", "spec_id":0, "partition":{"id":2}, "record_count":1, "file_size_in_bytes":611, "column_sizes":{1:36, 2:39}, "value_counts":{1:1, 2:1}, "null_value_counts":{1:0, 2:0}, "nan_value_counts":{}, "lower_bounds":{1:"   ", 2:"Bob"}, "upper_bounds":{1:"   ", 2:"Bob"}, "key_metadata":null, "split_offsets":[4], "equality_ids":null, "sort_order_id":0, "first_row_id":null, "referenced_data_file":null, "content_offset":null, "content_size_in_bytes":null}     | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":2, "upper_bound":2}, "name":{"column_size":39, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Bob", "upper_bound":"Bob"}}     |
+--------+---------------------+-----------------+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

### files

Shows file list for the current snapshot of the table:

```sql
SELECT * FROM iceberg_table$files;
```

Result:

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

Similar to the `files` system table, you can also query specific file type information through the following system tables:

```sql
-- Query data files for the current snapshot
SELECT * FROM iceberg_table$data_files;

-- Query delete files for the current snapshot
SELECT * FROM iceberg_table$delete_files;

-- Query all files (including data and delete files) from all snapshots
SELECT * FROM iceberg_table$all_files;

-- Query data files from all snapshots
SELECT * FROM iceberg_table$all_data_files;

-- Query delete files from all snapshots
SELECT * FROM iceberg_table$all_delete_files;
```

The result format of these tables is similar to the `files` system table, but each focuses specifically on data files or delete files. System tables with the `all_` prefix contain files from all snapshots, not just files from the current snapshot.

Note: When specific types of files do not exist in the table (for example, querying `delete_files` when there are no delete files in the table), the query result may be empty.

### history

Shows all history of the table:

```sql
SELECT * FROM iceberg_table$history;
```

Result:

```text
+----------------------------+---------------------+---------------------+---------------------+
| made_current_at            | snapshot_id         | parent_id           | is_current_ancestor |
+----------------------------+---------------------+---------------------+---------------------+
| 2025-06-12 22:29:16.357000 | 1851184769713369003 |                NULL |                   1 |
| 2025-06-12 22:29:39.922000 | 4890031351138056789 | 1851184769713369003 |                   1 |
+----------------------------+---------------------+---------------------+---------------------+
```

### manifests

Shows manifest file info of the table:

```sql
SELECT * FROM iceberg_table$manifests;
```

Result:

```text
+---------+------------------------------------------------------------------------------------------------------------------------------------------------+--------+-------------------+---------------------+------------------------+---------------------------+--------------------------+--------------------------+-----------------------------+----------------------------+--------------------------------------------------------------------------------+
| content | path                                                                         | length | partition_spec_id | added_snapshot_id   | added_data_files_count | existing_data_files_count | deleted_data_files_count | added_delete_files_count | existing_delete_files_count | deleted_delete_files_count | partition_summaries                                                            |
+---------+------------------------------------------------------------------------------------------------------------------------------------------------+--------+-------------------+---------------------+------------------------+---------------------------+--------------------------+--------------------------+-----------------------------+----------------------------+--------------------------------------------------------------------------------+
|       0 | s3://.../iceberg_table/metadata/3194eb8b-5ea4-4cbe-95ba-073229458e7b-m0.avro |   7138 |                 0 | 4890031351138056789 |                      0 |                         5 |                        5 |                        0 |                           0 |                          0 | [{"contains_null":0, "contains_nan":0, "lower_bound":"1", "upper_bound":"10"}] |
+---------+------------------------------------------------------------------------------------------------------------------------------------------------+--------+-------------------+---------------------+------------------------+---------------------------+--------------------------+--------------------------+-----------------------------+----------------------------+--------------------------------------------------------------------------------+
```

### metadata_log_entries

Shows meta logs of the table:

```sql
SELECT * FROM iceberg_table$metadata_log_entries;
```

Result:

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

Shows partitions of the table:

```sql
SELECT * FROM iceberg_table$partitions;
```

Result:

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

Note:

1. For non-partitioned tables, the `partitions` table will not contain the `partition` and `spec_id` fields.
2. The `partitions` table shows partitions that contain data files or delete files in the current snapshot. However, delete files are not applied, so in some cases, a partition may still be displayed even if all data rows in the partition have been marked as deleted by delete files.

### refs

Shows all known snapshot references (branches and tags) for the table:

```sql
SELECT * FROM iceberg_table$refs;
```

Result:

```text
+------+--------+---------------------+-------------------------+-----------------------+------------------------+
| name | type   | snapshot_id         | max_reference_age_in_ms | min_snapshots_to_keep | max_snapshot_age_in_ms |
+------+--------+---------------------+-------------------------+-----------------------+------------------------+
| main | BRANCH | 4890031351138056789 |                    NULL |                  NULL |                   NULL |
+------+--------+---------------------+-------------------------+-----------------------+------------------------+
```

### snapshots

Shows all snapshots of the table:

```sql
SELECT * FROM iceberg_table$snapshots;
```

Result:

```text
+----------------------------+---------------------+---------------------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| committed_at               | snapshot_id         | parent_id           | operation | manifest_list                                                                                        | summary                                                                                                                                                                                                                                                                                                                      |
+----------------------------+---------------------+---------------------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 2025-06-12 22:29:16.357000 | 1851184769713369003 |                NULL | append    | s3://.../iceberg_table/metadata/snap-1851184769713369003-1-82059f57-821a-4983-b083-002cc2cde313.avro | {"spark.app.id":"application_1738810850199_0472", "added-data-files":"10", "added-records":"10", "added-files-size":"6200", "changed-partition-count":"10", "total-records":"10", "total-files-size":"6200", "total-data-files":"10", "total-delete-files":"0", "total-position-deletes":"0", "total-equality-deletes":"0"}  |
| 2025-06-12 22:29:39.922000 | 4890031351138056789 | 1851184769713369003 | overwrite | s3://.../iceberg_table/metadata/snap-4890031351138056789-1-3194eb8b-5ea4-4cbe-95ba-073229458e7b.avro | {"spark.app.id":"application_1738810850199_0472", "deleted-data-files":"5", "deleted-records":"5", "removed-files-size":"3103", "changed-partition-count":"5", "total-records":"5", "total-files-size":"3097", "total-data-files":"5", "total-delete-files":"0", "total-position-deletes":"0", "total-equality-deletes":"0"} |
+----------------------------+---------------------+---------------------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

## Write Operations

### INSERT INTO

The INSERT operation appends data to the target table.

For example:

```sql
INSERT INTO iceberg_tbl VALUES (val1, val2, val3, val4);
INSERT INTO iceberg.iceberg_db.iceberg_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO iceberg_tbl(col1, col2) VALUES (val1, val2);
INSERT INTO iceberg_tbl(col1, col2, partition_col1, partition_col2) VALUES (1, 2, 'beijing', '2023-12-12');
```

### INSERT OVERWRITE

The INSERT OVERWRITE operation completely replaces the existing data in the table with new data.

```sql
INSERT OVERWRITE TABLE iceberg_tbl VALUES (val1, val2, val3, val4);
INSERT OVERWRITE TABLE iceberg.iceberg_db.iceberg_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;
```

### CTAS

You can create an Iceberg table and write data using the `CTAS` (Create Table As Select) statement:

```sql
CREATE TABLE iceberg_ctas AS SELECT * FROM other_table;
```

CTAS supports specifying file formats, partitioning, and other properties:

```sql
CREATE TABLE iceberg_ctas
PARTITION BY LIST (pt1, pt2) ()
AS SELECT col1, pt1, pt2 FROM part_ctas_src WHERE col1 > 0;

CREATE TABLE iceberg.iceberg_db.iceberg_ctas (col1, col2, pt1)
PARTITION BY LIST (pt1) ()
PROPERTIES (
    'write-format'='parquet',
    'compression-codec'='zstd'
)
AS SELECT col1, pt1 AS col2, pt2 AS pt1 FROM test_ctas.part_ctas_src WHERE col1 > 0;
```

### Related Parameters

* BE (Backend)

  | Parameter Name                                                               | Default Value | Description |
  | ----------------------------------------------------------------------------- | ------------- | ----------- |
  | `iceberg_sink_max_file_size`                                                  | 1GB           | Maximum data file size. When the written data exceeds this size, the current file is closed and a new file is created to continue writing. |
  | `table_sink_partition_write_max_partition_nums_per_writer`                    | 128           | Maximum number of partitions each instance can write to on a BE node. |
  | `table_sink_non_partition_write_scaling_data_processed_threshold`             | 25MB          | Data threshold for starting scaling-write in non-partitioned tables. A new writer (instance) is used for every additional `table_sink_non_partition_write_scaling_data_processed_threshold` of data. This mechanism adjusts the number of writers based on data volume to enhance throughput while conserving resources and minimizing file numbers for smaller data volumes. |
  | `table_sink_partition_write_min_data_processed_rebalance_threshold`           | 25MB          | Minimum data volume threshold to trigger rebalancing for partitioned tables. Rebalancing starts if `current accumulated data volume` - `data volume since last rebalancing` >= `table_sink_partition_write_min_data_processed_rebalance_threshold`. Lowering this threshold can improve balance if file size differences are significant, but may increase rebalancing costs and impact performance. |
  | `table_sink_partition_write_min_partition_data_processed_rebalance_threshold` |               | Minimum partition data volume threshold to trigger rebalancing. Rebalancing starts if `current partition data volume` >= `threshold` \* `number of tasks already allocated to the partition`. Lowering this threshold can improve balance if file size differences are significant, but may increase rebalancing costs and impact performance. |
  
## Database and Table Management

### Creating and Dropping Databases

You can switch to the desired catalog using the `SWITCH` statement and execute the `CREATE DATABASE` command:

```sql
SWITCH iceberg;
CREATE DATABASE [IF NOT EXISTS] iceberg_db;
```

You can also create a database using a fully qualified name or specify a location (currently, only HMS-type catalogs support specifying a location), such as:

```sql
CREATE DATABASE [IF NOT EXISTS] iceberg.iceberg_db;

CREATE DATABASE [IF NOT EXISTS] iceberg.iceberg_db
PROPERTIES ('location'='hdfs://172.21.16.47:4007/path/to/db/');
```

You can view the database's location information using the `SHOW CREATE DATABASE` command:

```sql
mysql> SHOW CREATE DATABASE iceberg_db;
+-------------+-------------------------------------------------------------------------------------------------+
| Database    | Create Database                                                                                 |
+-------------+-------------------------------------------------------------------------------------------------+
| iceberg_db  | CREATE DATABASE iceberg_db LOCATION 'hdfs://172.21.16.47:4007/usr/hive/warehouse/iceberg_db.db' |
+-------------+-------------------------------------------------------------------------------------------------+
```

To drop a database:

```sql
DROP DATABASE [IF EXISTS] iceberg.iceberg_db;
```

:::caution
For an Iceberg Database, you must first drop all tables under the database before you can drop the database itself; otherwise, an error will occur.
:::

### Creating and Dropping Tables

* **Creating Tables**

  Doris supports creating both partitioned and non-partitioned tables in Iceberg.

  For example:
  
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

  After creation, you can use the `SHOW CREATE TABLE` command to view the Iceberg table creation statement. For details about partition functions, see the [Partitioning](#) section.

* **Dropping Tables**

  You can drop an Iceberg table using the `DROP TABLE` statement. Dropping a table will also remove its data, including partition data.

  For example:

  ```sql
  DROP TABLE [IF EXISTS] iceberg_tbl;
  ```

* **Column Type Mapping**

  Refer to the [Column Type Mapping](#) section.

* **Partitioning**

  Partition types in Iceberg correspond to List partitions in Doris. Therefore, when creating an Iceberg partitioned table in Doris, you should use the List partitioning syntax, but you don't need to explicitly enumerate each partition. Doris will automatically create the corresponding Iceberg partitions based on the data values during data insertion.

  * Supports creating single-column or multi-column partitioned tables.

  * Supports partition transformation functions to enable Iceberg implicit partitioning and partition evolution. For specific Iceberg partition transformation functions, see [Iceberg partition transforms](https://iceberg.apache.org/spec/#partition-transforms):

    * `year(ts)` or `years(ts)`

    * `month(ts)` or `months(ts)`

    * `day(ts)` or `days(ts)` or `date(ts)`

    * `hour(ts)` or `hours(ts)` or `date_hour(ts)`

    * `bucket(N, col)`

    * `truncate(L, col)`

* **File Formats**

  * Parquet (default)

    Note that for the Iceberg table created by Doris, the Datetime corresponds to the `timestamp_ntz` type.

    In versions after 2.1.11 and 3.0.7, when the Datetime type is written to the Parquet file, the physical type used is INT64 instead of INT96.
    
    And if the Iceberg table is created by other systems, although the `timestamp` and `timestamp_ntz` types are both mapped to the Doris Datetime type. However, when writing, it will determine whether the time zone needs to be processed based on the actual type.

  * ORC

* **Compression Formats**

  * Parquet: snappy, zstd (default), plain (no compression).

  * ORC: snappy, zlib (default), zstd, plain (no compression).

* **Storage Medium**

  * HDFS

  * Object storage

  ### Schema Change

  Doris supports schema changes for Iceberg tables, which can be modified using the `ALTER TABLE` statement.

  Supported schema change operations include:

  * **Rename Column**
  Use the `RENAME COLUMN` clause to rename columns. Renaming columns within nested types is not supported.
  ```sql
  ALTER TABLE iceberg_table RENAME COLUMN old_col_name TO new_col_name;
  ```

  * **Add a Column**
  Use `ADD COLUMN` to add a new column. The new column will be added to the end of the table. Adding new columns to nested types is not supported.
  When adding a new column, you can specify nullable attributes, default values, and comments.
  ```sql
  ALTER TABLE iceberg_table ADD COLUMN col_name col_type [nullable, [default default_value, [comment 'comment']]];
  ```
  Example:
  ```sql
  ALTER TABLE iceberg_table ADD COLUMN new_col STRING NOT NULL DEFAULT 'default_value' COMMENT 'This is a new col';
  ```

  * **Add Columns**
  You can also use `ADD COLUMN` to add multiple columns. The new columns will be added to the end of the table. Adding new columns to nested types is not supported.
  The syntax for each column is the same as adding a single column.
  ```sql
  ALTER TABLE iceberg_table ADD COLUMN (col_name1 col_type1 [nullable, [default default_value, [comment 'comment']]], col_name2 col_type2 [nullable, [default default_value, [comment 'comment']]] ...);
  ```

  * **Drop Column**
  Use `DROP COLUMN` to drop columns. Dropping columns within nested types is not supported.
  ```sql
  ALTER TABLE iceberg_table DROP COLUMN col_name;
  ```
  * **Modify Column**
  Use the `MODIFY COLUMN` statement to modify column attributes, including type, nullable, default value, and comment.
  Note: When modifying column attributes, all attributes that are not being modified should also be explicitly specified with their original values.
  ```sql
  ALTER TABLE iceberg_table MODIFY COLUMN col_name col_type [nullable, [default default_value, [comment 'comment']]];
  ```
  Example:
  ```sql
  CREATE TABLE iceberg_table (
      id INT,
      name STRING
  );
  -- Modify the id column type to BIGINT, set as NOT NULL, default value to 0, and add comment
  ALTER TABLE iceberg_table MODIFY COLUMN id BIGINT NOT NULL DEFAULT 0 COMMENT 'This is a modified id column';
  ```

  * **Reorder Columns**
  Use `ORDER BY` to reorder columns by specifying the new column order.
  ```sql
  ALTER TABLE iceberg_table ORDER BY (col_name1, col_name2, ...);
  ```

## Appendix

### Change Log

| Doris Version | Feature Support                        |
| -------------- | -------------------------------------- |
| 2.1.3          | Support for ORC file format, Equality Delete |
| 2.1.6          | Support for DDL, DML                   |
