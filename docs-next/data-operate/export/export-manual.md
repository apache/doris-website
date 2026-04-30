---
{
    "title": "Export Asynchronous Export",
    "language": "en",
    "description": "Use the EXPORT command to asynchronously export Doris table or partition data to HDFS, S3, or object storage, with support for Parquet/ORC/CSV formats.",
    "keywords": [
        "Doris EXPORT",
        "asynchronous export",
        "export to S3",
        "export to HDFS",
        "Parquet export",
        "ORC export",
        "CSV export",
        "SHOW EXPORT",
        "CANCEL EXPORT",
        "SELECT INTO OUTFILE"
    ]
}
---

<!-- Knowledge type: Operating procedure / Configuration parameters / Architectural selection decision -->
<!-- Applicable scenarios: Data export / Data archiving / Cross-system data movement -->

This document describes how to use the `EXPORT` command to asynchronously export data stored in Doris to an external storage system.

`EXPORT` is the **asynchronous data export** capability provided by Doris. It exports data from a specified table or partition to object storage, HDFS, or the local file system, in a specified file format.

The command returns immediately after submission. You can query the task status with `SHOW EXPORT`.

## Applicable Scenarios

| Scenario Type                       | Recommended for EXPORT | Description                                                |
| ----------------------------------- | ---------------------- | ---------------------------------------------------------- |
| Exporting a single large table      | Recommended            | Only simple filter conditions are required                 |
| Asynchronous job submission         | Recommended            | The command returns immediately and does not block the client |
| Exporting a SELECT result set       | Not supported          | Use [OUTFILE export](../../data-operate/export/outfile.md) instead |
| Compressed text file export         | Not supported          | The current version does not support compressed text formats |

For guidance on choosing between `SELECT INTO OUTFILE` and `EXPORT`, see [Export Overview](../../data-operate/export/export-overview.md).

For the full syntax of the `EXPORT` command, see [EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT).

## Capability Overview

### Supported Data Sources

`EXPORT` supports exporting the following types of tables and views:

- Doris internal tables
- Doris logical views
- Tables in External Catalogs (such as Hive external tables)

### Supported Storage Locations

| Storage Type             | Specifically Supported                              |
| ------------------------ | --------------------------------------------------- |
| Object storage           | Amazon S3, Tencent Cloud COS, Alibaba Cloud OSS, Huawei Cloud OBS, Google GCS |
| Distributed file system  | HDFS                                                |
| Local file system        | For local debugging and development only, must be enabled manually |

### Supported File Formats

- Parquet
- ORC
- CSV
- csv\_with\_names
- csv\_with\_names\_and\_types

## Quick Start

<!-- Knowledge type: Operating procedure -->

### Step 1: Create a table and load data

```sql
CREATE TABLE IF NOT EXISTS tbl (
    `c1` int(11) NULL,
    `c2` string NULL,
    `c3` bigint NULL
)
DISTRIBUTED BY HASH(c1) BUCKETS 20
PROPERTIES("replication_num" = "1");

INSERT INTO tbl VALUES
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, NULL, NULL);
```

### Step 2: Create an export job

#### Export to HDFS

Export all data from the `tbl` table to HDFS, using the default CSV format with `,` as the column separator:

```sql
EXPORT TABLE tbl
TO "hdfs://host/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS"="hdfs://hdfs_host:port",
    "hadoop.username" = "hadoop"
);
```

#### Export to object storage (S3)

Export all data from the `tbl` table to S3 object storage, using the default CSV format with `,` as the column separator:

```sql
EXPORT TABLE tbl TO "s3://bucket/export/export_" 
PROPERTIES (
    "line_delimiter" = ","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### Step 3: Check the export job status

Use the [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT) command to query the progress and result of an export task:

```sql
mysql> SHOW EXPORT\G
*************************** 1. row ***************************
      JobId: 143265
      Label: export_0aa6c944-5a09-4d0b-80e1-cb09ea223f65
      State: FINISHED
   Progress: 100%
   TaskInfo: {"partitions":[],"parallelism":5,"data_consistency":"partition","format":"csv","broker":"S3","column_separator":"\t","line_delimiter":"\n","max_file_size":"2048MB","delete_existing_files":"","with_bom":"false","db":"tpch1","tbl":"lineitem"}
       Path: s3://bucket/export/export_
 CreateTime: 2024-06-11 18:01:18
  StartTime: 2024-06-11 18:01:18
 FinishTime: 2024-06-11 18:01:31
    Timeout: 7200
   ErrorMsg: NULL
OutfileInfo: [
  [
    {
      "fileNumber": "1",
      "totalRows": "6001215",
      "fileSize": "747503989",
      "url": "s3://bucket/export/export_6555cd33e7447c1-baa9568b5c4eb0ac_*"
    }
  ]
]
1 row in set (0.00 sec)
```

For the meaning of each column in the result, see [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT).

### Step 4: Cancel an export job (optional)

Before an Export task succeeds or fails, you can cancel it with the [CANCEL EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT) command:

```sql
CANCEL EXPORT FROM dbName WHERE LABEL like "%export_%";
```

## Advanced Usage Examples

<!-- Knowledge type: Operating procedure -->

### Export to a high-availability HDFS cluster

If HDFS has high availability (HA) enabled, you must provide additional HA-related parameters:

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

### Export to an HDFS cluster with HA and Kerberos authentication

If a Hadoop cluster has both high availability and Kerberos authentication enabled, refer to the following SQL:

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS"="hdfs://hacluster/",
    "hadoop.username" = "hadoop",
    "dfs.nameservices"="hacluster",
    "dfs.ha.namenodes.hacluster"="n1,n2",
    "dfs.namenode.rpc-address.hacluster.n1"="192.168.0.1:8020",
    "dfs.namenode.rpc-address.hacluster.n2"="192.168.0.2:8020",
    "dfs.client.failover.proxy.provider.hacluster"="org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "dfs.namenode.kerberos.principal"="hadoop/_HOST@REALM.COM"
    "hadoop.security.authentication"="kerberos",
    "hadoop.kerberos.principal"="doris_test@REALM.COM",
    "hadoop.kerberos.keytab"="/path/to/doris_test.keytab"
);
```

### Export only specified partitions

To export only some partitions of a Doris internal table, for example only the `p1` and `p2` partitions of the `test` table:

```sql
EXPORT TABLE test
PARTITION (p1,p2)
TO "s3://bucket/export/export_" 
PROPERTIES (
    "columns" = "k1,k2"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### Export with predicate filtering

Use a `WHERE` clause to filter data and export only the rows that match the condition. For example, export only rows where `k1 < 50`:

```sql
EXPORT TABLE test
WHERE k1 < 50
TO "s3://bucket/export/export_"
PROPERTIES (
    "columns" = "k1,k2",
    "column_separator"=","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### Export data from External Catalog external tables

`EXPORT` supports exporting data from External Catalog external tables (such as Hive external tables):

```sql
-- Create a Hive Catalog
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083'
);

-- Export the Hive table
EXPORT TABLE hive_catalog.sf1.lineitem TO "s3://bucket/export/export_"
PROPERTIES(
    "format" = "csv",
    "max_file_size" = "1024MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### Clear the target directory before export

Use the `delete_existing_files` parameter to clear the target directory before exporting:

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "true"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

Activation conditions and behavior:

- When `"delete_existing_files" = "true"` is set, the export job **first deletes** all files and subdirectories under the `s3://bucket/export/` directory, and then exports the data.
- For this parameter to take effect, you must add `enable_delete_existing_files = true` to `fe.conf` and restart the FE.

:::caution
This operation deletes data in an external system and is a **high-risk operation**. Please ensure permission control and data security in the external system on your own.
:::

### Control the size of a single export file

Use `max_file_size` to control the size of a single export file. Files exceeding the configured value are split automatically:

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

The valid range for `max_file_size` is as follows:

| Version Range                          | Minimum | Maximum   |
| -------------------------------------- | ------- | --------- |
| Before 2.1.11 / before 3.0.7           | 5MB     | 2GB       |
| 2.1.11 and later / 3.0.7 and later     | 5MB     | Unlimited |

## Notes and Best Practices

<!-- Knowledge type: Best practices / Troubleshooting -->
<!-- Applicable scenarios: Production usage / Fault diagnosis -->

| Concern                  | Recommendations and Notes                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Per-job data volume      | A single Export job is recommended to be no more than tens of GB. For large tables, export by partition in batches to avoid generating more garbage files and incurring higher retry cost |
| System resource impact   | Export jobs scan data and consume IO resources, which may affect query latency                                         |
| Failed file management   | When a job fails, the files already generated are not deleted automatically and must be cleaned up manually            |
| Export timeout           | Very large data volumes may trigger timeouts. You can extend the timeout with the `timeout` parameter in the Export command and retry |
| FE restart or master switch | If the FE restarts or switches master during execution, the job fails. Check the status with `SHOW EXPORT` and resubmit |
| Partition count limit    | A single Export Job can export at most 2000 partitions. You can adjust `maximum_number_of_export_partitions` in `fe.conf` and restart the FE |
| Data integrity check     | After the export completes, verify the row count and correctness of the data to ensure data quality                     |

## Appendix

### Basic Principles

<!-- Knowledge type: Architectural principles -->

`EXPORT` tasks are executed under the hood based on the `SELECT INTO OUTFILE` SQL statement. The overall flow is:

1. The user submits an `EXPORT` task.
2. Based on the table to be exported, Doris constructs one or more `SELECT INTO OUTFILE` execution plans.
3. These execution plans are submitted to the Doris Job Schedule task scheduler.
4. The Job Schedule schedules and executes the tasks automatically, ultimately producing the export files.

### Export to the local file system

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Local debugging / Development environment -->

:::caution
Exporting to the local file system is **for local debugging and development only. Do not use it in production**, and please ensure permission control and data security of the export directory on your own.
:::

#### How to enable

This feature is disabled by default. To enable it:

1. Add `enable_outfile_to_local=true` to `fe.conf`.
2. Restart the FE for the configuration to take effect.

#### Usage example

Export all data from the `tbl` table to the local file system, using the default CSV format with `,` as the column separator:

```sql
EXPORT TABLE db.tbl TO "file:///path/to/result_"
PROPERTIES (
  "format" = "csv",
  "line_delimiter" = ","
);
```

#### Data distribution

- Data is written to the local disks of BE nodes.
- In a multi-BE environment, data is distributed across different BE nodes according to the export task's parallelism, with each node storing a portion of the data.
- In the example above, files such as `result_7052bac522d840f5-972079771289e392_0.csv` are generated under the `/path/to/` directory on the BE nodes.

#### Find the specific BE nodes

The IPs of the specific BE nodes can be found in the `OutfileInfo` column of the `SHOW EXPORT` result:

```text
[
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.136/path/to/result_7052bac522d840f5-972079771289e392_*"
        }
    ], 
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.137/path/to/result_22aba7ec933b4922-ba81e5eca12bf0c2_*"
        }
    ]
]
```
