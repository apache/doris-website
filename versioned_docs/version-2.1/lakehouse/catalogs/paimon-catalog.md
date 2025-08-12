---
{
    "title": "Paimon Catalog",
    "language": "en"
}
---

Doris currently supports accessing Paimon table metadata through various metadata services and querying Paimon data.

At present, only read operations on Paimon tables are supported. Write operations to Paimon tables will be supported in the future.

[Quick start with Apache Doris and Apache Paimon](../best-practices/doris-paimon.md).

## Applicable Scenarios

| Scenario     | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| Query Acceleration | Use Doris's distributed computing engine to directly access Paimon data for query acceleration. |
| Data Integration   | Read Paimon data and write it into Doris internal tables, or perform ZeroETL operations using the Doris computing engine. |
| Data Write-back    | Not supported yet.                                      |

## Configuring Catalog

### Syntax

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

  The type of Paimon Catalog, supporting the following:

  * `filesystem`: Default. Directly accesses metadata stored on the file system.

  * `hms`: Uses Hive Metastore as the metadata service.

  * `dlf`: Uses Alibaba Cloud DLF as the metadata service.

* `<paimon_warehouse>`

  The warehouse path for Paimon. This parameter must be specified when `<paimon_catalog_type>` is `filesystem`.

  The `warehouse` path must point to the level above the `Database` path. For example, if your table path is: `s3://bucket/path/to/db1/table1`, then `warehouse` should be: `s3://bucket/path/to/`.

* `{MetaStoreProperties}`

  The MetaStoreProperties section is used to fill in connection and authentication information for the Metastore metadata service. Refer to the section on [Supported Metadata Services] for details.

* `{StorageProperties}`

  The StorageProperties section is used to fill in connection and authentication information related to the storage system. Refer to the section on [Supported Storage Systems] for details.

* `{CommonProperties}`

  The CommonProperties section is used to fill in common properties. Please refer to the [Catalog Overview](../catalog-overview.md) section on [Common Properties].
  
### Supported Paimon Versions

The currently dependent Paimon version is 1.0.0.

### Supported Paimon Formats

* Supports reading Paimon Deletion Vector

### Supported Metadata Services

* [Hive Metastore](../metastores/hive-metastore.md)

* [Aliyun DLF](../metastores/aliyun-dlf.md)

* [FileSystem](../metastores/filesystem.md)

### Supported Storage Systems

* [HDFS](../storages/hdfs.md)

* [AWS S3](../storages/s3.md)

* [Google Cloud Storage](../storages/gcs.md)

* [Alibaba Cloud OSS](../storages/aliyun-oss.md)

* [Tencent Cloud COS](../storages/tencent-cos.md)

* [Huawei Cloud OBS](../storages/huawei-obs.md)

* [MINIO](../storages/minio.md)

### Supported Data Formats

* [Parquet](../file-formats/parquet.md)

* [ORC](../file-formats/orc.md)

## Column Type Mapping

| Paimon Type                        | Doris Type    | Comment                                                                 |
| ---------------------------------- | ------------- | ----------------------------------------------------------------------- |
| boolean                            | boolean       |                                                                         |
| tinyint                            | tinyint       |                                                                         |
| smallint                           | smallint      |                                                                         |
| integer                            | int           |                                                                         |
| bigint                             | bigint        |                                                                         |
| float                              | float         |                                                                         |
| double                             | double        |                                                                         |
| decimal(P, S)                      | decimal(P, S) |                                                                         |
| varchar                            | string        |                                                                         |
| char                               | string        |                                                                         |
| binary                             | string        |                                                                         |
| varbinary                          | string        |                                                                         |
| date                               | date          |                                                                         |
| timestamp\_without\_time\_zone     | datetime(N)   | Mapped according to precision. If precision is greater than 6, it maps to a maximum of 6 (may cause precision loss). |
| timestamp\_with\_local\_time\_zone | datetime(N)   | Mapped according to precision. If precision is greater than 6, it maps to a maximum of 6 (may cause precision loss). |
| array                              | array         |                                                                         |
| map                                | map           |                                                                         |
| row                                | struct        |                                                                         |
| other                              | UNSUPPORTED   |                                                                         |

## Examples

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

### Paimon on DLF 1.0

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

### Paimon on DLF Rest Catalog

> Since 3.1.0

```sql
CREATE CATALOG paimon_dlf_test PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'rest',
    'uri' = 'http://cn-beijing-vpc.dlf.aliyuncs.com',
    'warehouse' = 'new_dfl_paimon_catalog',
    'paimon.rest.token.provider' = 'dlf',
    'paimon.rest.dlf.access-key-id' = 'ak',
    'paimon.rest.dlf.access-key-secret' = 'sk'
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

## Query Operations

### Basic Query

Once the Catalog is configured, you can query the table data in the Catalog as follows:

```sql
-- 1. Switch to catalog, use database, and query
SWITCH paimon_ctl;
USE paimon_db;
SELECT * FROM paimon_tbl LIMIT 10;

-- 2. Use Paimon database directly
USE paimon_ctl.paimon_db;
SELECT * FROM paimon_tbl LIMIT 10;

-- 3. Use fully qualified name to query
SELECT * FROM paimon_ctl.paimon_db.paimon_tbl LIMIT 10;
```

### Batch Incremental Query

> This feature is supported since version 3.1.0

Supports [Batch Incremental](https://paimon.apache.org/docs/master/flink/sql-query/#batch-incremental) queries for Paimon, similar to Flink.

Supports querying incremental data within specified snapshot or timestamp intervals. The interval is left-closed and right-open.

```sql
-- between snapshots [0, 5)
SELECT * FROM paimon_table@incr('startSnapshotId'='0', 'endSnapshotId'='5');

-- between snapshots [0, 5) with specified scan mode
SELECT * FROM paimon_table@incr('startSnapshotId'='0', 'endSnapshotId'='5', 'incrementalBetweenScanMode'='diff');

-- read from start timestamp
SELECT * FROM paimon_table@incr('startTimestamp'='1750844949000');

-- read between timestamp
SELECT * FROM paimon_table@incr('startTimestamp'='1750844949000', 'endTimestamp'='1750944949000');
```

Parameter:

| Parameter | Description | Example |
| --- | --- | -- |
| `startSnapshotId` | Starting snapshot ID, must be greater than 0. Must be specified with `endSnapshotId` together. | `'startSnapshotId'='3'` |
| `endSnapshotId` | Ending snapshot ID, must be greater than `startSnapshotId`. Must be specified with `startSnapshotId` together. | `'endSnapshotId'='10'` |
| `incrementalBetweenScanMode` | Specifies the incremental read mode, default is `auto`, supports `delta`, `changelog` and `diff` |  `'incrementalBetweenScanMode'='delta'` |
| `startTimestamp` | Starting snapshot timestamp, must be greater than or equal to 0. Unit is millisecond. | `'startTimestamp'='1750844949000'` |
| `endTimestamp` | Ending snapshot timestamp, must be greater than `startTimestamp`. Optional, if not specified, reads from `startTimestamp` to the latest snapshot. Unit is millisecond. | `'endTimestamp'='1750944949000'` |

> Notice:
>
> `startSnapshotId` and `endSnapshotId` will compose the Paimon parameter `'incremental-between'='3,10'`
>
> `startTimestamp` and `endTimestamp` will compose the Paimon parameter `'incremental-between-timestamp'='1750844949000,1750944949000'`
>
> `incrementalBetweenScanMode` corresponds to the Paimon parameter `incremental-between-scan-mode`.

Refer to the [Paimon documentation](https://paimon.apache.org/docs/master/maintenance/configurations/) for further details about these parameters.


## System Tables

> This feature is supported since version 3.1.0

Doris supports querying Paimon system tables to retrieve table-related metadata. System tables can be used to view snapshot history, manifest files, data files, partitions, and other information.

To access metadata of a Paimon table, add a `$` symbol after the table name, followed by the system table name:

```sql
SELECT * FROM my_table$system_table_name;
```

> Note: Doris does not support reading Paimon global system tables, which are only supported in Flink.


### schemas

Shows current and historical schema information of the table. When modifying table schema using `ALTER TABLE`, `CREATE TABLE AS`, or `CREATE DATABASE AS` statements, each modification generates a record in the schemas table:

```sql
SELECT * FROM my_table$schemas;
```

Result:
```text
+-----------+--------------------------------------------------------------------------------------------------------------------+----------------+--------------+---------+---------+-------------------------+
| schema_id | fields                                                                                                             | partition_keys | primary_keys | options | comment | update_time             |
+-----------+--------------------------------------------------------------------------------------------------------------------+----------------+--------------+---------+---------+-------------------------+
|         0 | [{"id":0,"name":"k","type":"INT NOT NULL"},{"id":1,"name":"f0","type":"INT"},{"id":2,"name":"f1","type":"STRING"}] | []             | ["k"]        | {}      |         | 2025-03-04 22:48:41.666 |
+-----------+--------------------------------------------------------------------------------------------------------------------+----------------+--------------+---------+---------+-------------------------+
```

### snapshots

Shows all valid snapshot information of the table, including snapshot creation time, commit user, operation type, etc.:

```sql
SELECT * FROM my_table$snapshots;
```

Result:
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

Shows current configuration options of the table. If a table option is not included in the table, that option is set to its default value:

```sql
SELECT * FROM my_table$options;
```

Result:
```text
+------------------------+--------------------+
|         key            |        value       |
+------------------------+--------------------+
| snapshot.time-retained |         5 h        |
+------------------------+--------------------+
```

### files

Shows information about all data files pointed to by the current snapshot, including file format, record count, file size, etc.:

```sql
SELECT * FROM my_table$files;
```

Result:
```text
mysql> SELECT * FROM my_table$files;
+-----------+--------+------------------------------------------------------------------------------------------------------------------------+-------------+-----------+-------+--------------+--------------------+---------+---------+-------------------+---------------------+---------------------+---------------------+---------------------+-------------------------+-------------+
| partition | bucket | file_path                                                                                                              | file_format | schema_id | level | record_count | file_size_in_bytes | min_key | max_key | null_value_counts | min_value_stats     | max_value_stats     | min_sequence_number | max_sequence_number | creation_time           | file_source |
+-----------+--------+------------------------------------------------------------------------------------------------------------------------+-------------+-----------+-------+--------------+--------------------+---------+---------+-------------------+---------------------+---------------------+---------------------+---------------------+-------------------------+-------------+
| {}        |      0 | s3://paimon-warehouse-dev/test-flink/cookbook.db/my_table/bucket-0/data-b4a49c57-6ef6-4c04-8813-07a4960d987c-0.parquet | parquet     |         0 |     5 |            5 |               1321 | [1]     | [6]     | {f0=0, f1=0, k=0} | {f0=4, f1=111, k=1} | {f0=11, f1=k7, k=6} |                   0 |                   5 | 2025-07-01 23:14:23.967 | COMPACT     |
+-----------+--------+------------------------------------------------------------------------------------------------------------------------+-------------+-----------+-------+--------------+--------------------+---------+---------+-------------------+---------------------+---------------------+---------------------+---------------------+-------------------------+-------------+
```

### tags

Shows all tag information of the table, including tag names and associated snapshots:

```sql
SELECT * FROM my_table$tags;
```

Result:
```text
+----------+-------------+-----------+-------------------------+--------------+--------------+
| tag_name | snapshot_id | schema_id |             commit_time | record_count |   branches   |
+----------+-------------+-----------+-------------------------+--------------+--------------+
|     tag1 |           1 |         0 | 2025-03-04 14:55:29.344 |            3 |      []      |
|     tag3 |           3 |         0 | 2025-03-04 14:58:24.691 |            7 |  [branch-1]  |
+----------+-------------+-----------+-------------------------+--------------+--------------+
```

### branches

Shows all known branch information of the table:

```sql
SELECT * FROM my_table$branches;
```

Result:
```text
+----------------------+-------------------------+
|          branch_name |             create_time |
+----------------------+-------------------------+
|              branch1 | 2025-03-04 20:31:39.084 |
|              branch2 | 2025-03-04 21:11:14.373 |
+----------------------+-------------------------+
```

### consumers

Shows consumer information of the table, used to track data consumption:

```sql
SELECT * FROM my_table$consumers;
```

Result:
```text
+-------------+------------------+
| consumer_id | next_snapshot_id |
+-------------+------------------+
|         id1 |                1 |
|         id2 |                3 |
+-------------+------------------+
```

### manifests

Shows manifest file information of the table's current snapshot:

```sql
SELECT * FROM my_table$manifests;
```

Result:
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

Shows aggregation field information of the table, used for field configuration in aggregate tables:

```sql
SELECT * FROM my_table$aggregation_fields;
```

Result:
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

Shows partition information of the table, including total record count and total file size for each partition:

```sql
SELECT * FROM my_table$partitions;
```

Result:
```text
+-----------+--------------+--------------------+------------+-------------------------+
| partition | record_count | file_size_in_bytes | file_count | last_update_time        |
+-----------+--------------+--------------------+------------+-------------------------+
| {}        |            5 |               1321 |          1 | 2025-07-01 23:14:23.967 |
+-----------+--------------+--------------------+------------+-------------------------+
```

### buckets

Shows bucket information of the table, including statistics for each bucket:

```sql
SELECT * FROM my_table$buckets;
```

Result:
```text
+-----------+--------+--------------+--------------------+------------+-------------------------+
| partition | bucket | record_count | file_size_in_bytes | file_count | last_update_time        |
+-----------+--------+--------------+--------------------+------------+-------------------------+
| {}        |      0 |            5 |               1321 |          1 | 2025-07-01 23:14:23.967 |
+-----------+--------+--------------+--------------------+------------+-------------------------+
```

### statistics

Shows statistical information of the table, including row count, data size, and other statistics:

```sql
SELECT * FROM my_table$statistics;
```

Result:
```text
+--------------+------------+-----------------------+------------------+----------+
|  snapshot_id |  schema_id |     mergedRecordCount | mergedRecordSize |  colstat |
+--------------+------------+-----------------------+------------------+----------+
|            2 |          0 |              2        |         2        |    {}    |
+--------------+------------+-----------------------+------------------+----------+
```

### table_indexes

Shows index information of the table:

```sql
SELECT * FROM my_table$table_indexes;
```

Result:
```text
+--------------------------------+-------------+--------------------------------+--------------------------------+----------------------+----------------------+--------------------------------+
|                      partition |      bucket |                     index_type |                      file_name |            file_size |            row_count |                      dv_ranges |
+--------------------------------+-------------+--------------------------------+--------------------------------+----------------------+----------------------+--------------------------------+
|                   {2025-03-01} |           0 |                           HASH | index-70abfebf-149e-4796-9f... |                   12 |                    3 |                         <NULL> |
|                   {2025-04-01} |           0 |               DELETION_VECTORS | index-633857e7-cdce-47d2-87... |                   33 |                    1 | [(data-346cb9c8-4032-4d66-a... |
+--------------------------------+-------------+--------------------------------+--------------------------------+----------------------+----------------------+--------------------------------+
```

### System Table Use Cases

Through system tables, you can easily accomplish the following operations and monitoring tasks.

#### View the latest snapshot information of a table to understand its current state

```sql
SELECT snapshot_id, commit_time, commit_kind, total_record_count FROM catalog_sales$snapshots ORDER BY snapshot_id DESC;
```
Result:

```text
+-------------+-------------------------+-------------+--------------------+
| snapshot_id | commit_time             | commit_kind | total_record_count |
+-------------+-------------------------+-------------+--------------------+
|           1 | 2025-07-01 21:21:54.179 | APPEND      |           14329288 |
+-------------+-------------------------+-------------+--------------------+
```

#### View table information for snapshots

```sql
SELECT s.snapshot_id, t.schema_id, t.fields FROM store_sales$snapshots s JOIN store_sales$schemas t ON s.schema_id=t.schema_id;
```

Result:

```text
+-------------+-----------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| snapshot_id | schema_id | fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
+-------------+-----------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|           1 |         0 | [{"id":0,"name":"ss_sold_date_sk","type":"INT"},{"id":1,"name":"ss_item_sk","type":"INT NOT NULL"},{"id":2,"name":"ss_ticket_number","type":"INT NOT NULL"},{"id":3,"name":"ss_sold_time_sk","type":"INT"},{"id":4,"name":"ss_customer_sk","type":"INT"},{"id":5,"name":"ss_cdemo_sk","type":"INT"},{"id":6,"name":"ss_hdemo_sk","type":"INT"},{"id":7,"name":"ss_addr_sk","type":"INT"},{"id":8,"name":"ss_store_sk","type":"INT"},{"id":9,"name":"ss_promo_sk","type":"INT"},{"id":10,"name":"ss_quantity","type":"INT"},{"id":11,"name":"ss_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":12,"name":"ss_list_price","type":"DECIMAL(7, 2)"},{"id":13,"name":"ss_sales_price","type":"DECIMAL(7, 2)"},{"id":14,"name":"ss_ext_discount_amt","type":"DECIMAL(7, 2)"},{"id":15,"name":"ss_ext_sales_price","type":"DECIMAL(7, 2)"},{"id":16,"name":"ss_ext_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":17,"name":"ss_ext_list_price","type":"DECIMAL(7, 2)"},{"id":18,"name":"ss_ext_tax","type":"DECIMAL(7, 2)"},{"id":19,"name":"ss_coupon_amt","type":"DECIMAL(7, 2)"},{"id":20,"name":"ss_net_paid","type":"DECIMAL(7, 2)"},{"id":21,"name":"ss_net_paid_inc_tax","type":"DECIMAL(7, 2)"},{"id":22,"name":"ss_net_profit","type":"DECIMAL(7, 2)"}] |
|           2 |         0 | [{"id":0,"name":"ss_sold_date_sk","type":"INT"},{"id":1,"name":"ss_item_sk","type":"INT NOT NULL"},{"id":2,"name":"ss_ticket_number","type":"INT NOT NULL"},{"id":3,"name":"ss_sold_time_sk","type":"INT"},{"id":4,"name":"ss_customer_sk","type":"INT"},{"id":5,"name":"ss_cdemo_sk","type":"INT"},{"id":6,"name":"ss_hdemo_sk","type":"INT"},{"id":7,"name":"ss_addr_sk","type":"INT"},{"id":8,"name":"ss_store_sk","type":"INT"},{"id":9,"name":"ss_promo_sk","type":"INT"},{"id":10,"name":"ss_quantity","type":"INT"},{"id":11,"name":"ss_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":12,"name":"ss_list_price","type":"DECIMAL(7, 2)"},{"id":13,"name":"ss_sales_price","type":"DECIMAL(7, 2)"},{"id":14,"name":"ss_ext_discount_amt","type":"DECIMAL(7, 2)"},{"id":15,"name":"ss_ext_sales_price","type":"DECIMAL(7, 2)"},{"id":16,"name":"ss_ext_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":17,"name":"ss_ext_list_price","type":"DECIMAL(7, 2)"},{"id":18,"name":"ss_ext_tax","type":"DECIMAL(7, 2)"},{"id":19,"name":"ss_coupon_amt","type":"DECIMAL(7, 2)"},{"id":20,"name":"ss_net_paid","type":"DECIMAL(7, 2)"},{"id":21,"name":"ss_net_paid_inc_tax","type":"DECIMAL(7, 2)"},{"id":22,"name":"ss_net_profit","type":"DECIMAL(7, 2)"}] |
+-------------+-----------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

#### View data distribution of buckets

```sql
SELECT `bucket` , COUNT(*) as file_count, SUM(file_size_in_bytes)/1024/1024 as total_size_mb from paimon_s3.tpcds.catalog_sales$files GROUP BY `bucket`  ORDER BY total_size_mb;
```
> Note: Many fields in Paimon system tables are keywords in Doris, so they need to be enclosed in backticks.

Result:

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

## Appendix

