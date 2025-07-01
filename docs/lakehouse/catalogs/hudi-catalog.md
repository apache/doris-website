---
{
    "title": "Hudi Catalog",
    "language": "en"
}
---

Hudi Catalog reuses the Hive Catalog. By connecting to the Hive Metastore, or a metadata service compatible with the Hive Metastore, Doris can automatically obtain Hudi's database and table information and perform data queries.

[Quick start with Apache Doris and Apache Hudi](../best-practices/doris-hudi.md).

## Applicable Scenarios

| Scenario | Description |
| -------- | ----------- |
| Query Acceleration | Use Doris's distributed computing engine to directly access Hudi data for query acceleration. |
| Data Integration | Read Hudi data and write it into Doris internal tables, or perform ZeroETL operations using the Doris computing engine. |
| Data Write-back | Not supported. |

## Configuring Catalog

### Syntax

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

* `{MetaStoreProperties}`

  The MetaStoreProperties section is used to fill in the connection and authentication information for the Metastore metadata service. See the section [Supported Metadata Services] for details.

* `{StorageProperties}`

  The StorageProperties section is used to fill in the connection and authentication information related to the storage system. See the section [Supported Storage Systems] for details.

* `{CommonProperties}`

  The CommonProperties section is used to fill in common properties. Please refer to the [Data Catalog Overview](../catalog-overview.md) section on [Common Properties].

* `{HudiProperties}`

  | Parameter Name                  | Former Name                | Description                                                                                                                                               | Default Value |
  | ------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
  | `hudi.use_hive_sync_partition`  | `use_hive_sync_partition`  | Whether to use the partition information already synchronized by Hive Metastore. If true, partition information will be obtained directly from Hive Metastore. Otherwise, it will be obtained from the metadata file of the file system. Obtaining information from Hive Metastore is more efficient, but users need to ensure that the latest metadata has been synchronized to Hive Metastore. | false |

### Supported Hudi Versions

The current dependent Hudi version is 0.15. It is recommended to access Hudi data version 0.14 and above.

### Supported Query Types

| Table Type    | Supported Query Types                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Copy On Write | Snapshot Query, Time Travel, Incremental Read                            |
| Merge On Read | Snapshot Queries, Read Optimized Queries, Time Travel, Incremental Read  |

### Supported Metadata Services

* [Hive Metastore](../metastores/hive-metastore.md)

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

| Hudi Type     | Doris Type    | Comment                                                   |
| ------------- | ------------- | --------------------------------------------------------- |
| boolean       | boolean       |                                                           |
| int           | int           |                                                           |
| long          | bigint        |                                                           |
| float         | float         |                                                           |
| double        | double        |                                                           |
| decimal(P, S) | decimal(P, S) |                                                           |
| bytes         | string        |                                                           |
| string        | string        |                                                           |
| date          | date          |                                                           |
| timestamp     | datetime(N)   | Automatically maps to datetime(3) or datetime(6) based on precision |
| array         | array         |                                                           |
| map           | map           |                                                           |
| struct        | struct        |                                                           |
| other         | UNSUPPORTED   |                                                           |

## Examples

The creation of a Hudi Catalog is similar to a Hive Catalog. For more examples, please refer to [Hive Catalog](./hive-catalog.md).

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

## Query Operations

### Basic Query

Once the Catalog is configured, you can query the tables within the Catalog using the following method:

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

### Time Travel

Every write operation to a Hudi table creates a new snapshot. Doris supports reading a specified snapshot of a Hudi table. By default, query requests only read the latest snapshot.

You can query the timeline of a specified Hudi table using the `hudi_meta()` table function:

This table function is supported since 3.1.0.

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

You can use the `FOR TIME AS OF` statement to read historical versions of data based on the snapshot's timestamp. The time format is consistent with the Hudi documentation. Here are some examples:

```sql
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07 17:20:37";
SELECT * FROM hudi_tbl FOR TIME AS OF "20221007172037";
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07";
```

Note that Hudi tables do not support the `FOR VERSION AS OF` statement. Attempting to use this syntax with a Hudi table will result in an error.

### Incremental Query

Incremental Read allows querying data changes within a specified time range, returning the final state of the data at the end of that period.

Doris provides the `@incr` syntax to support Incremental Read:

```sql
SELECT * from hudi_table@incr('beginTime'='xxx', ['endTime'='xxx'], ['hoodie.read.timeline.holes.resolution.policy'='FAIL'], ...);
```

* `beginTime`

  Required. The time format must be consistent with the Hudi official [hudi\_table\_changes](https://hudi.apache.org/docs/0.14.0/quick-start-guide/#incremental-query), supporting "earliest".

* `endTime`

  Optional, defaults to the latest commitTime.

You can add more options in the `@incr` function, compatible with [Spark Read Options](https://hudi.apache.org/docs/0.14.0/configurations#Read-Options).

By using `desc` to view the execution plan, you can see that Doris converts `@incr` into predicates pushed down to `VHUDI_SCAN_NODE`:

```text
|   0:VHUDI_SCAN_NODE(113)                                                                                            |
|      table: lineitem_mor                                                                                            |
|      predicates: (_hoodie_commit_time[#0] >= '20240311151019723'), (_hoodie_commit_time[#0] <= '20240311151606605') |
|      inputSplitNum=1, totalFileSize=13099711, scanRanges=1              
```

## FAQ

1. Query blocked when using Java SKD to read incremental data through JNI

    Please add `-Djol.skipHotspotSAAttach=true` to `JAVA_OPTS_FOR_JDK_17` or `JAVA_OPTS` in `be.conf`.

## Appendix

### Change Log

| Doris Version | Feature Support                               |
| ------------- | ---------------------------------------------- |
| 2.1.8/3.0.4   | Hudi dependency upgraded to 0.15. Added Hadoop Hudi JNI Scanner. |
