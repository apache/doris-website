---
{
    "title": "EXPORT | Export",
    "language": "en",
    "description": "This document will introduce how to use the EXPORT command to export the data stored in Doris."
}
---

This document will introduce how to use the `EXPORT` command to export the data stored in Doris.

`Export` is a function provided by Doris for asynchronously exporting data. This function can export the data of the tables or partitions specified by users in the specified file format to the target storage systems, including object storage, HDFS or local file system.

`Export` is an asynchronously executed command. Once the command is executed successfully, it will return the result immediately. Users can view the detailed information of the Export task through the `Show Export` command.

For the detailed introduction of the `EXPORT` command, please refer to: [EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT)

Regarding how to choose between `SELECT INTO OUTFILE` and `EXPORT`, please refer to [Export Overview](../../data-operate/export/export-overview.md).

## Applicable Scenarios

`Export` is applicable to the following scenarios:

- Exporting a single table with a large amount of data, only requiring simple filtering conditions.
- Scenarios where tasks need to be submitted asynchronously.

The following limitations should be noted when using `Export`:

- Currently, exporting in compressed text file formats is not supported.
- Exporting the result set of `Select` is not supported. If you need to export the `Select` result set, please use [OUTFILE Export](../../data-operate/export/outfile.md).

## Quick Start
### Table Creation and Data Import

```sql
CREATE TABLE IF NOT EXISTS tbl (
    `c1` int(11) NULL,
    `c2` string NULL,
    `c3` bigint NULL
)
DISTRIBUTED BY HASH(c1) BUCKETS 20
PROPERTIES("replication_num" = "1");


insert into tbl values
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, null, null);
```

### Create an Export Job

#### Export to HDFS

Export all data from the `tbl` table to HDFS. Set the file format of the export job to csv (the default format) and set the column delimiter to `,`. 

```sql
EXPORT TABLE tbl
TO "hdfs://host/path/to/export/" 
PROPERTIES
(
    "line_delimiter" = ","
)
with HDFS (
    "fs.defaultFS"="hdfs://hdfs_host:port",
    "hadoop.username" = "hadoop"
);
```

#### Export to Object Storage

Export all the data in the `tbl` table to the object storage, set the file format of the export job to csv (the default format), and set the column delimiter to `,`.

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

### View Export Jobs

After submitting a job, you can query the status of the export job via the [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT) command. An example of the result is as follows: 

```sql
mysql> show export\G
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

For the detailed usage of the `show export` command and the meaning of each column in the returned results, please refer to [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT).

### Cancel Export Jobs

After submitting an Export job, the export job can be cancelled via the [CANCEL EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT) command before the Export task succeeds or fails. An example of the cancellation command is as follows: 

```sql
CANCEL EXPORT FROM dbName WHERE LABEL like "%export_%";
```

## Export Instructions

### Export Data Sources

`EXPORT` currently supports exporting the following types of tables or views:

- Internal tables in Doris
- Logical views in Doris
- Tables in External Catalog

### Export Data Storage Locations

`Export` currently supports exporting to the following storage locations:

- Object storage: Amazon S3, COS, OSS, OBS, Google GCS
- HDFS

### Export File Types

`EXPORT` currently supports exporting to the following file formats:

* Parquet
* ORC
* csv
* csv\_with\_names
* csv\_with\_names\_and\_types

## Examples

### Export to an HDFS Cluster with High Availability Enabled

If the HDFS has high availability enabled, HA information needs to be provided. For example:

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
with HDFS (
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

### Export to an HDFS Cluster with High Availability and Kerberos Authentication Enabled

If the HDFS cluster has both high availability enabled and Kerberos authentication enabled, you can refer to the following SQL statements: 

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
with HDFS (
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

### Specify Partition for Export

The export job supports exporting only some partitions of the internal tables in Doris. For example, only export partitions p1 and p2 of the `test` table. 

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

### Filter Data During Export

The export job supports filtering data according to predicate conditions during the export process, exporting only the data that meets the conditions. For example, only export the data that satisfies the condition `k1 < 50`. 

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

### Export External Table Data

The export job supports the data of tables in External Catalog.

```sql
-- Create a hive catalog
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083'
);

-- Export hive table
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

### Clearing the Export Directory Before Exporting

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

If `"delete_existing_files" = "true"` is set, the export job will first delete all files and directories under the `s3://bucket/export/` directory, and then export the data to this directory.

If you want to use the `delete_existing_files` parameter, you also need to add the configuration `enable_delete_existing_files = true` in the `fe.conf` and restart the FE. Only then will the `delete_existing_files` take effect. This operation will delete the data of the external system and is a high-risk operation. Please ensure the permissions and data security of the external system on your own.

### Setting the Size of Exported Files

The export job supports setting the size of the export file. If the size of a single file exceeds the set value, it will be divided into multiple files for export according to the specified size.

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

By setting `"max_file_size" = "512MB"`, the maximum size of a single exported file is 512MB.

`max_file_size` cannot be less than 5MB and cannot be greater than 2GB.

In versions 2.1.11 and 3.0.7, the maximum limit of 2GB was removed, leaving only the minimum limit of 5MB.

## Notice

* Export Data Volume

	It is not recommended to export a large amount of data at one time. The recommended maximum export data volume for an Export job is several tens of gigabytes. Excessive exports will lead to more junk files and higher retry costs. If the table data volume is too large, it is recommended to export by partitions.

	In addition, the Export job will scan data and occupy IO resources, which may affect the query latency of the system.

* Export File Management

	If the Export job fails, the files that have already been generated will not be deleted, and users need to delete them manually.

* Export Timeout

	If the amount of exported data is very large and exceeds the export timeout period, the Export task will fail. At this time, you can specify the `timeout` parameter in the Export command to increase the timeout period and retry the Export command.

* Export Failure

	During the operation of the Export job, if the FE restarts or switches the master, the Export job will fail, and the user needs to resubmit it. You can check the status of the Export task through the `show export` command.

* Number of Exported Partitions

	The maximum number of partitions allowed to be exported by an Export Job is 2000. You can add the parameter `maximum_number_of_export_partitions` in fe.conf and restart the FE to modify this setting.

* Data Integrity

	After the export operation is completed, it is recommended to verify whether the exported data is complete and correct to ensure the quality and integrity of the data.

## Appendix

### Basic Principle

The underlying layer of the Export task is to execute the `SELECT INTO OUTFILE` SQL statement. After a user initiates an Export task, Doris will construct one or more `SELECT INTO OUTFILE` execution plans according to the table to be exported by Export, and then submit these `SELECT INTO OUTFILE` execution plans to the Job Schedule task scheduler of Doris. The Job Schedule task scheduler will automatically schedule and execute these tasks.

### Exporting to the Local File System

The function of exporting to the local file system is disabled by default. This function is only used for local debugging and development, and should not be used in the production environment.

If you want to enable this function, please add `enable_outfile_to_local=true` in the `fe.conf` and restart the FE.

Example: Export all the data in the `tbl` table to the local file system, set the file format of the export job to csv (the default format), and set the column delimiter to `,`.

```sql
EXPORT TABLE tbl TO "file:///path/to/result_"
PROPERTIES (
  "format" = "csv",
  "line_delimiter" = ","
);
```

This function will export and write data to the disk of the node where the BE is located. If there are multiple BE nodes, the data will be scattered on different BE nodes according to the concurrency of the export task, and each node will have a part of the data.

As in this example, a set of files similar to `result_7052bac522d840f5-972079771289e392_0.csv` will eventually be produced under `/path/to/` of the BE node.

The specific BE node IP can be viewed in the `OutfileInfo` column in the `SHOW EXPORT` result, such as:

```
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

:::caution
This function is not applicable to the production environment, and please ensure the permissions of the export directory and data security on your own.
:::

