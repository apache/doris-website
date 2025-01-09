---
{
    "title": "Using SELECT INTO OUTFILE Command",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

This document will introduce how to use the `SELECT INTO OUTFILE` command to export query results.

The `SELECT INTO OUTFILE` command exports the result data of the `SELECT` part to the target storage system in the specified file format, including object storage, HDFS, or the local file system.

The `SELECT INTO OUTFILE` is a synchronous command. When the command returns, it means that the export is completed. If the export is successful, information such as the number, size, and path of the exported files will be returned. If the export fails, an error message will be returned.

For information on how to choose between `SELECT INTO OUTFILE` and `EXPORT`, please refer to [Export Overview](./export-overview.md).

For a detailed introduction to the `SELECT INTO OUTFILE` command, please refer to: [SELECT INTO OUTFILE](../../sql-manual/sql-statements/Data-Manipulation-Statements/OUTFILE.md) 

--------------

## Usage Scenarios

The `SELECT INTO OUTFILE` is applicable to the following scenarios:
- When the exported data needs to go through complex calculation logics, such as filtering, aggregation, and joining.
- For scenarios suitable for executing synchronous tasks.

When using the `SELECT INTO OUTFILE`, the following limitations should be noted:
- It does not support exporting data in compressed formats.
- The pipeline engine in version 2.1 does not support concurrent exports.
- If you want to export data to the local file system, you need to add the configuration `enable_outfile_to_local = true` in the `fe.conf` file and then restart the FE. 


## Basic Principles
The `SELECT INTO OUTFILE` function essentially executes an SQL query command, and its principle is basically the same as that of an ordinary query. The only difference is that an ordinary query outputs the final query result set to the MySQL client, while the `SELECT INTO OUTFILE` outputs the final query result set to an external storage medium.

The principle of concurrent export for `SELECT INTO OUTFILE` is to divide large-scale data sets into small pieces and process them in parallel on multiple nodes. In scenarios where concurrent export is possible, exports are carried out in parallel on multiple BE nodes, with each BE handling a part of the result set. 

## Quick Start
### Create Tables and Import Data

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
INTO OUTFILE "hdfs://${host}:${fileSystem_port}/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://ip:port",
    "hadoop.username" = "hadoop"
);
```

If the HDFS cluster has high availability enabled, HA information needs to be provided. Refer to the example: [Export to an HDFS Cluster with High Availability Enabled](#high-availability-hdfs-export).

If the HDFS cluster has both high availability enabled and Kerberos authentication enabled, Kerberos authentication information needs to be provided. Refer to the example: [Export to an HDFS Cluster with High Availability and Kerberos Authentication Enabled](#high-availability-and-kerberos-cluster-export).

### Export to Object Storage

Export the query results to the directory `s3://path/to/` in the S3 storage, specify the export format as ORC, and information such as `sk` (secret key) and `ak` (access key) needs to be provided. 

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://path/to/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "https://xxx",
    "s3.region" = "ap-beijing",
    "s3.access_key"= "your-ak",
    "s3.secret_key" = "your-sk"
);
```

### Export to the Local File System
> If you need to export to a local file, you must add `enable_outfile_to_local = true` to `fe.conf` and restart the FE.

Export the query results to the directory `file:///path/to/` on the BE, specify the export format as CSV, and specify the column separator as `,`. 

```sql
SELECT c1, c2 FROM tbl FROM tbl1
INTO OUTFILE "file:///path/to/result_"
FORMAT AS CSV
PROPERTIES(
    "column_separator" = ","
);
```

> Note:
The function of exporting to local files is not applicable to public cloud users, but only to users with private deployments. And it is assumed by default that the user has full control rights over the cluster nodes. Doris does not perform legality checks on the export paths filled in by the user. If the process user of Doris does not have write permissions for the path, or the path does not exist, an error will be reported. Also, for security reasons, if there is a file with the same name already existing in the path, the export will fail.
Doris does not manage the files exported to the local system, nor does it check the disk space, etc. These files need to be managed by the user, such as cleaning them up. 

### More Usage
For a detailed introduction to the `SELECT INTO OUTFILE` command, please refer to: [SELECT INTO OUTFILE](../../sql-manual/sql-statements/Data-Manipulation-Statements/OUTFILE.md)

## Export Instructions
### Storage Locations for Exported Data
The `SELECT INTO OUTFILE` currently supports exporting data to the following storage locations:
- Object storage: Amazon S3, COS, OSS, OBS, Google GCS
- HDFS
- Local file system

### Export File Types
The `SELECT INTO OUTFILE` currently supports exporting the following file formats:
- Parquet
- ORC
- csv
- csv_with_names
- csv_with_names_and_types

### Column Type Mapping for Exported Files
The `SELECT INTO OUTFILE` supports exporting data in Parquet and ORC file formats. Parquet and ORC file formats have their own data types. The export function of Doris can automatically convert the data types in Doris to the corresponding data types in Parquet and ORC file formats. 

The following is a mapping table of Doris data types and data types in Parquet and ORC file formats:
| Doris Type | Arrow Type | Orc Type |
| ---------- | ---------- | -------- |
| boolean    | boolean | boolean |
| tinyint    | int8 | tinyint |
| smallint   | int16 | smallint |
| int        | int32 | int |
| bigint     | int64 | bigint |
| largeInt   | utf8 | string |
| date       | utf8 | string |
| datev2     | Date32Type | string |
| datetime   | utf8 | string |
| datetimev2 | TimestampType | timestamp |
| float      | float32 | float |
| double     | float64 | double |
| char / varchar / string| utf8 | string |
| decimal    | decimal128 | decimal |
| struct     | struct | struct |
| map        | map | map |
| array      | list | array |
| json       | utf8 | string |
| variant    | utf8 | string |
| bitmap     | binary | binary |
| quantile_state| binary | binary |
| hll        | binary | binary |

> Note: When Doris exports data to the Parquet file format, it first converts the in-memory data of Doris into the Arrow in-memory data format, and then writes it out to the Parquet file format via Arrow. 

## Export Examples
- [Export to an HDFS Cluster with High Availability Enabled](#high-availability-hdfs-export)
- [Export to an HDFS Cluster with High Availability and Kerberos Authentication Enabled](#high-availability-and-kerberos-cluster-export)
- [Example of Generating a File to Mark a Successful Export](#example-of-generating-a-file-to-mark-a-successful-export)
- [Example of Concurrent Export](#example-of-concurrent-export)
- [Example of Clearing the Export Directory Before Exporting](#example-of-clearing-the-export-directory-before-exporting)
- [Example of Setting the Size of Exported Files](#example-of-setting-the-size-of-exported-files)


<span id="high-availability-hdfs-export"></span>
**Export to an HDFS Cluster with High Availability Enabled**

If the HDFS has high availability enabled, HA information needs to be provided. For example:

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

<span id="high-availability-and-kerberos-cluster-export"></span>
**Export to an HDFS Cluster with High Availability and Kerberos Authentication Enabled**

If the HDFS cluster has both high availability enabled and Kerberos authentication enabled, you can refer to the following SQL statements: 

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
    "dfs.namenode.kerberos.principal"="hadoop/_HOST@REALM.COM"
    "hadoop.security.authentication"="kerberos",
    "hadoop.kerberos.principal"="doris_test@REALM.COM",
    "hadoop.kerberos.keytab"="/path/to/doris_test.keytab"
);
```

<span id="example-of-generating-a-file-to-mark-a-successful-export"></span>
**Example of Generating a File to Mark a Successful Export**

The `SELECT INTO OUTFILE` command is a synchronous command. Therefore, it is possible that the task connection is disconnected during the execution of the SQL, making it impossible to know whether the exported data has ended normally or is complete. At this time, you can use the `success_file_name` parameter to require that a file marker be generated in the directory after a successful export.

Similar to Hive, users can determine whether the export has ended normally and whether the files in the export directory are complete by checking whether there is a file specified by the `success_file_name` parameter in the export directory.

For example: Export the query results of the `select` statement to Tencent Cloud COS: `s3://${bucket_name}/path/my_file_`. Specify the export format as `csv`. Specify the name of the file marking a successful export as `SUCCESS`. After the export is completed, a marker file will be generated. 

```sql
SELECT k1,k2,v1 FROM tbl1 LIMIT 100000
INTO OUTFILE "s3://my_bucket/path/my_file_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "${endpoint}",
    "s3.region" = "ap-beijing",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "success_file_name" = "SUCCESS"
)
```

After the export is completed, an additional file named `SUCCESS` will be written.

<span id="example-of-concurrent-export"></span>
**Example of Concurrent Export**

By default, the query results of the `SELECT` part will first be aggregated to a certain BE node, and this node will export the data in a single thread. However, in some cases, such as for query statements without an `ORDER BY` clause, concurrent exports can be enabled, allowing multiple BE nodes to export data simultaneously to improve export performance.

However, not all SQL query statements can be exported concurrently. Whether a query statement can be exported concurrently can be determined through the following steps:

* Make sure that the session variable is enabled: `set enable_parallel_outfile = true;`
* Check the execution plan via `EXPLAIN` 

```sql
mysql> EXPLAIN SELECT ... INTO OUTFILE "s3://xxx" ...;
+-----------------------------------------------------------------------------+
| Explain String                                                              |
+-----------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                             |
|  OUTPUT EXPRS:<slot 2> | <slot 3> | <slot 4> | <slot 5>                     |
|   PARTITION: UNPARTITIONED                                                  |
|                                                                             |
|   RESULT SINK                                                               |
|                                                                             |
|   1:EXCHANGE                                                                |
|                                                                             |
| PLAN FRAGMENT 1                                                             |
|  OUTPUT EXPRS:`k1` + `k2`                                                   |
|   PARTITION: HASH_PARTITIONED: `default_cluster:test`.`multi_tablet`.`k1`   |
|                                                                             |
|   RESULT FILE SINK                                                          |
|   FILE PATH: s3://ml-bd-repo/bpit_test/outfile_1951_                        |
|   STORAGE TYPE: S3                                                          |
|                                                                             |
|   0:OlapScanNode                                                            |
|      TABLE: multi_tablet                                                    |
+-----------------------------------------------------------------------------+
```

The `EXPLAIN` command will return the query plan of the statement. By observing the query plan, if `RESULT FILE SINK` appears in `PLAN FRAGMENT 1`, it indicates that the query statement can be exported concurrently. If `RESULT FILE SINK` appears in `PLAN FRAGMENT 0`, it means that the current query cannot be exported concurrently.

Next, we will demonstrate how to correctly enable the concurrent export function through an example:

1. Open the concurrent export session variable

```sql
mysql> SET enable_parallel_outfile = true;
```

2. Execute the export command

```sql
mysql> SELECT * FROM demo.tbl
    -> INTO OUTFILE "file:///path/to/ftw/export/exp_"
    -> FORMAT AS PARQUET;
+------------+-----------+----------+-------------------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                           |
+------------+-----------+----------+-------------------------------------------------------------------------------+
|          1 |    104494 |  7998308 | file:///127.0.0.1/path/to/exp_1f850179e684476b-9bf001a6bf96d7d3_ |
|          1 |    104984 |  8052491 | file:///127.0.0.1/path/to/exp_1f850179e684476b-9bf001a6bf96d7d5_ |
|          1 |    104345 |  7981406 | file:///127.0.0.1/path/to/exp_1f850179e684476b-9bf001a6bf96d7d1_ |
|          1 |    104034 |  7977301 | file:///127.0.0.1/path/to/exp_1f850179e684476b-9bf001a6bf96d7d4_ |
|          1 |    104238 |  7979757 | file:///127.0.0.1/path/to/exp_1f850179e684476b-9bf001a6bf96d7d2_ |
|          1 |    159450 | 11870222 | file:///127.0.0.1/path/to/exp_1f850179e684476b-9bf001a6bf96d7d0_ |
|          1 |    209691 | 16082100 | file:///127.0.0.1/path/to/exp_1f850179e684476b-9bf001a6bf96d7ce_ |
|          1 |    208769 | 16004096 | file:///127.0.0.1/path/to/exp_1f850179e684476b-9bf001a6bf96d7cf_ |
+------------+-----------+----------+-------------------------------------------------------------------------------+
```

It can be seen that after enabling and successfully triggering the concurrent export function, the returned result may consist of multiple lines, indicating that there are multiple threads exporting concurrently.

If we modify the above statement, that is, add an `ORDER BY` clause to the query statement. Since the query statement has a top-level sorting node, even if the concurrent export function is enabled, this query cannot be exported concurrently:

```sql
mysql> SELECT * FROM demo.tbl ORDER BY id
    -> INTO OUTFILE "file:///path/to/ftw/export/exp_"
    -> FORMAT AS PARQUET;
+------------+-----------+----------+-------------------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                           |
+------------+-----------+----------+-------------------------------------------------------------------------------+
|          1 |   1100005 | 80664607 | file:///127.0.0.1/mnt/disk2/ftw/export/exp_20c5461055774128-826256c0cfb3d8fc_ |
+------------+-----------+----------+-------------------------------------------------------------------------------+
```

It can be seen that there is only one final result line, and concurrent export has not been triggered.

<span id="example-of-clearing-the-export-directory-before-exporting"></span>
**Example of Clearing the Export Directory Before Exporting**

```sql
SELECT * FROM tbl1
INTO OUTFILE "s3://my_bucket/export/my_file_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "${endpoint}",
    "s3.region" = "region",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "delete_existing_files" = "true"
)
```

If `"delete_existing_files" = "true"` is set, the export job will first delete all files and directories under the `s3://my_bucket/export/` directory, and then export data to this directory.

> Note: To use the `delete_existing_files` parameter, you also need to add the configuration `enable_delete_existing_files = true` in `fe.conf` and restart the `fe`, then `delete_existing_files` will take effect. `delete_existing_files = true` is a dangerous operation and it is recommended to use it only in a test environment.

<span id="example-of-setting-the-size-of-exported-files"></span>
**Example of Setting the Size of Exported Files**

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://path/to/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "https://xxx",
    "s3.region" = "ap-beijing",
    "s3.access_key"= "your-ak",
    "s3.secret_key" = "your-sk",
    "max_file_size" = "2048MB"
);
```

Since `"max_file_size" = "2048MB"` is specified, if the final generated file is not larger than 2GB, there will be only one file. If it is larger than 2GB, there will be multiple files.

## Precautions

- Export Data Volume and Export Efficiency
The `SELECT INTO OUTFILE` function essentially executes an SQL query command. If concurrent export is not enabled, the query result is exported by a single BE node in a single thread. Therefore, the total export time includes the time consumed by the query itself and the time required to write out the final result set. Enabling concurrent export can reduce the export time.

- Export Timeout
The timeout time of the export command is the same as that of the query. If the data volume is large and causes the export data to time out, you can set the session variable `query_timeout` to appropriately extend the query timeout.

- Management of Exported Files
Doris does not manage the exported files. Whether they are successfully exported or residual files after a failed export, users need to handle them by themselves.
In addition, the `SELECT INTO OUTFILE` command does not check whether the file and file path exist. Whether `SELECT INTO OUTFILE` will automatically create a path or overwrite an existing file is completely determined by the semantics of the remote storage system.

- If the Query Result Set Is Empty
For an export with an empty result set, an empty file will still be generated.

- File Splitting
File splitting ensures that a row of data is stored completely in a single file. Therefore, the file size is not strictly equal to `max_file_size`.

- Functions for Non-Visible Characters
For some functions that output non-visible characters, such as BITMAP and HLL types, when exporting to the CSV file format, the output is `\N`.
