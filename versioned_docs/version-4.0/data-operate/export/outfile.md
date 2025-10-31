---
{
    "title": "SELECT INTO OUTFILE",
    "language": "en"
}
---

This document will introduce how to use the `SELECT INTO OUTFILE` command to perform the export operation of query results.

The `SELECT INTO OUTFILE` command exports the result data of the `SELECT` part to the target storage system in the specified file format, including object storage or HDFS.

The `SELECT INTO OUTFILE` is a synchronous command, the return of the command means the export is finished. If the export is successful, information such as the number, size, and path of the exported files will be returned. If the export fails, error information will be returned.

Regarding how to choose between `SELECT INTO OUTFILE` and `EXPORT`, please refer to [Export Overview](./export-overview.md).

For a detailed introduction to the `SELECT INTO OUTFILE` command, please refer to: [SELECT INTO OUTFILE](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE)

## Applicable Scenarios

The `SELECT INTO OUTFILE` is applicable to the following scenarios:

- When the exported data needs to go through complex calculation logic, such as filtering, aggregation, joining, etc.
- It is suitable for scenarios where synchronous tasks need to be executed.

The following limitations should be noted when using the `SELECT INTO OUTFILE`:

- Compression formats for text is not supported.
- The pipeline engine in version 2.1 does not support concurrent exports.

## Quick Start
### Creating Tables and Importing Data

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

### Export to HDFS

Export the query results to the directory `hdfs://path/to/` and specify the export format as Parquet: 

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://ip:port/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://ip:port",
    "hadoop.username" = "hadoop"
);
```

### Export to Object Storage

Export the query results to the `s3://bucket/export/` directory in the s3 storage, specify the export format as ORC, and information such as `sk` (secret key) and `ak` (access key) needs to be provided.

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

## Export Instructions

### Export Desctination

The `SELECT INTO OUTFILE` currently supports exporting to the following storage locations:

- Object Storage: Amazon S3, COS, OSS, OBS, Google GCS
- HDFS

### Supported File Types

The `SELECT INTO OUTFILE` currently supports exporting the following file formats:

* Parquet
* ORC
* csv
* csv\_with\_names
* csv\_with\_names\_and\_types

### Export concurrency

You can enable concurrent export through the session variable `enable_parallel_outfile`.

`SET enable_parallel_outfile=true;`

Concurrent export will use multi-node and multi-thread to export result data to improve the overall export throughout. However, concurrent export may generate more files.

Note that some queries cannot perform concurrent export even if this variable is turned on, such as queries containing global sorting. If the number of rows returned by the export command is greater than 1, it means that concurrent export is enabled.

## Export Examples

### Export to an HDFS Cluster with High Availability Enabled

If HDFS has high availability enabled, HA (High Availability) information needs to be provided, such as:

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://HDFS8000871/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
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

If the HDFS cluster has high availability enabled and Kerberos authentication is enabled, you can refer to the following SQL statement:

```sql
SELECT * FROM tbl
INTO OUTFILE "hdfs://path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS"="hdfs://hacluster/",
    "hadoop.username" = "hadoop",
    "dfs.nameservices"="hacluster",
    "dfs.ha.namenodes.hacluster"="n1,n2",
    "dfs.namenode.rpc-address.hacluster.n1"="192.168.0.1:8020",
    "dfs.namenode.rpc-address.hacluster.n2"="192.168.0.2:8020",
    "dfs.client.failover.proxy.provider.hacluster"="org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "dfs.namenode.kerberos.principal"="hadoop/_HOST@REALM.COM",
    "hadoop.security.authentication"="kerberos",
    "hadoop.kerberos.principal"="doris_test@REALM.COM",
    "hadoop.kerberos.keytab"="/path/to/doris_test.keytab"
);
```

### Generating an Export Success Indicator File

The `SELECT INTO OUTFILE` command is a synchronous command. Therefore, it is possible that the task connection is disconnected during the execution of the SQL, making it impossible to know whether the exported data has ended normally or is complete. At this time, you can use the `success_file_name` parameter to require that a file indicator be generated in the directory after a successful export.

Similar to Hive, users can judge whether the export has ended normally and whether the files in the export directory are complete by checking whether there is a file specified by the `success_file_name` parameter in the export directory.

For example: Export the query results of the select statement to the object storage: `s3://bucket/export/`. Specify the export format as `csv`. Specify the name of the export success indicator file as `SUCCESS`. After the export is completed, a indicator file will be generated.

```sql
SELECT k1,k2,v1 FROM tbl1 LIMIT 100000
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "success_file_name" = "SUCCESS"
);
```

After the export is completed, one more file will be written, and the file name of this file is `SUCCESS`.

### Clearing the Export Directory Before Exporting

```sql
SELECT * FROM tbl1
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "delete_existing_files" = "true"
);
```

If `"delete_existing_files" = "true"` is set, the export job will first delete all files and directories under the `s3://bucket/export/` directory, and then export the data to this directory.

If you want to use the `delete_existing_files` parameter, you also need to add the configuration `enable_delete_existing_files = true` in `fe.conf` and restart the FE. Only then will the `delete_existing_files` parameter take effect. This operation will delete the data of the external system, which is a high-risk operation. Please ensure the permissions and data security of the external system on your own.


### Setting the Size of Exported Files

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://path/to/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "max_file_size" = "2048MB"
);
```

Since `"max_file_size" = "2048MB"` is specified, if the final generated file is not larger than 2GB, there will be only one file. If it is larger than 2GB, there will be multiple files.

## Notice

1. Export Data Volume and Export Efficiency

	The `SELECT INTO OUTFILE` function is essentially executing an SQL query command. If concurrent exports are not enabled, the query results are exported by a single BE node in a single thread. Therefore, the entire export time includes the time consumed by the query itself and the time consumed by writing out the final result set. Enabling concurrent exports can reduce the export time.

2. Export Timeout

	The timeout period of the export command is the same as that of the query. If the export data times out due to a large amount of data, you can set the session variable `query_timeout` to appropriately extend the query timeout period.

3. Management of Exported Files

	Doris does not manage the exported files. Whether the files are successfully exported or left over after a failed export, users need to handle them on their own.

	In addition, the `SELECT INTO OUTFILE` command does not check whether files or file paths exist. Whether the `SELECT INTO OUTFILE` command will automatically create paths or overwrite existing files is completely determined by the semantics of the remote storage system.

4. If the Query Result Set Is Empty

	For an export with an empty result set, an empty file will still be generated.

5. File Splitting

	File splitting ensures that a row of data is completely stored in a single file. Therefore, the size of the file is not strictly equal to `max_file_size`.

6. Functions with Non-visible Characters

	For some functions whose output is non-visible characters, such as BITMAP and HLL types, when exported to the CSV file format, the output is `\N`.

## Appendix

### Export to Local File System

The function of exporting to the local file system is turned off by default. This function is only used for local debugging and development, and should not be used in the production environment.

If you want to enable this function, please add `enable_outfile_to_local=true` in `fe.conf` and restart the FE.

Example: Export all the data in the tbl table to the local file system, set the file format of the export job to csv (the default format), and set the column separator to `,`.

```sql
SELECT c1, c2 FROM db.tbl
INTO OUTFILE "file:///path/to/result_"
FORMAT AS CSV
PROPERTIES(
    "column_separator" = ","
);
```

This function will export and write data to the disk of the node where the BE is located. If there are multiple BE nodes, the data will be scattered on different BE nodes according to the concurrency of the export task, and each node will have a part of the data.

As in this example, a set of files similar to `result_c6df5f01bd664dde-a2168b019b6c2b3f_0.csv` will eventually be produced under `/path/to/` of the BE node.

The specific BE node IP will be displayed in the returned results, such as:

```
+------------+-----------+----------+--------------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                      |
+------------+-----------+----------+--------------------------------------------------------------------------+
|          1 |   1195072 |  4780288 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b3f_* |
|          1 |   1202944 |  4811776 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b40_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b43_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b45_* |
+------------+-----------+----------+--------------------------------------------------------------------------+
```

:::caution
This function is not suitable for the production environment, and please ensure the permissions and data security of the export directory on your own.
:::

