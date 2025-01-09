---
{
    "title": "Using EXPORT Command",
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

This document will introduce how to use the `EXPORT` command to export the data stored in Doris.

`Export` is a function provided by Doris for asynchronous data export. This function can export the data of tables or partitions specified by the user in a specified file format to the target storage system, including object storage, HDFS, or the local file system.

`Export` is an asynchronously executed command. After the command is executed successfully, it immediately returns a result, and the user can view the detailed information of the Export task through the `Show Export` command.

For a detailed introduction of the `EXPORT` command, please refer to: [EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md)

Regarding how to choose between `SELECT INTO OUTFILE` and `EXPORT`, please refer to [Export Overview](../../data-operate/export/export-overview.md).

--- 

## Basic Principles

The underlying layer of the Export task is to execute the `SELECT INTO OUTFILE` SQL statement. After a user initiates an Export task, Doris will construct one or more `SELECT INTO OUTFILE` execution plans based on the table to be exported by Export, and then submit these `SELECT INTO OUTFILE` execution plans to Doris's Job Schedule task scheduler. The Job Schedule task scheduler will automatically schedule and execute these tasks.

By default, the Export task is executed in a single thread. To improve the export efficiency, the Export command can set the `parallelism` parameter to concurrently export data. After setting `parallelism` to be greater than 1, the Export task will use multiple threads to concurrently execute the `SELECT INTO OUTFILE` query plans. The `parallelism` parameter actually specifies the number of threads that execute the EXPORT operation.

## Usage Scenarios
`Export` is suitable for the following scenarios:
- Exporting a single table with a large amount of data and only requiring simple filtering conditions.
- Scenarios where tasks need to be submitted asynchronously.

The following limitations should be noted when using `Export`:
- Currently, the export of compressed formats is not supported.
- Exporting the Select result set is not supported. If you need to export the Select result set, please use [OUTFILE Export](../../data-operate/export/outfile.md).
- If you want to export to the local file system, you need to add the configuration `enable_outfile_to_local = true` in `fe.conf` and restart the FE.

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

If the HDFS cluster has high availability enabled, HA information needs to be provided. Refer to the example: [Export to an HDFS Cluster with High Availability Enabled](#high-availability-hdfs-export).

If the HDFS cluster has both high availability enabled and Kerberos authentication enabled, Kerberos authentication information needs to be provided. Refer to the example: [Export to an HDFS Cluster with High Availability and Kerberos Authentication Enabled](#high-availability-and-kerberos-cluster-export).

#### Export to Object Storage

Export the query results to the directory `s3://path/to/` in the S3 storage, specify the export format as ORC, and information such as `sk` (secret key) and `ak` (access key) needs to be provided. 

```sql
EXPORT TABLE tbl TO "s3://bucket/a/b/c" 
PROPERTIES (
    "line_delimiter" = ","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
)
```

#### Export to the Local File System
> If you need to export to a local file, you must add `enable_outfile_to_local = true` to `fe.conf` and restart the FE.

Export the query results to the directory `file:///path/to/` on the BE, specify the export format as CSV, and specify the column separator as `,`. 

```sql
-- csv format
EXPORT TABLE tbl TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv",
  "line_delimiter" = ","
);
```

> Note:
The function of exporting to local files is not applicable to public cloud users, but only to users with private deployments. And it is assumed by default that the user has full control rights over the cluster nodes. Doris does not perform legality checks on the export paths filled in by the user. If the process user of Doris does not have write permissions for the path, or the path does not exist, an error will be reported. Also, for security reasons, if there is a file with the same name already existing in the path, the export will fail.
Doris does not manage the files exported to the local system, nor does it check the disk space, etc. These files need to be managed by the user, such as cleaning them up. 

### View Export Jobs
After submitting a job, you can query the status of the export job via the [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT.md) command. An example of the result is as follows: 

```sql
mysql> show export\G
*************************** 1. row ***************************
      JobId: 143265
      Label: export_0aa6c944-5a09-4d0b-80e1-cb09ea223f65
      State: FINISHED
   Progress: 100%
   TaskInfo: {"partitions":[],"parallelism":5,"data_consistency":"partition","format":"csv","broker":"S3","column_separator":"\t","line_delimiter":"\n","max_file_size":"2048MB","delete_existing_files":"","with_bom":"false","db":"tpch1","tbl":"lineitem"}
       Path: s3://ftw-datalake-test-1308700295/test_ycs_activeDefense_v10/test_csv/exp_
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
      "fileSize": "747503989bytes",
      "url": "s3://my_bucket/path/to/exp_6555cd33e7447c1-baa9568b5c4eb0ac_*"
    }
  ]
]
1 row in set (0.00 sec)
```

For the detailed usage of the `show export` command and the meaning of each column in the returned results, please refer to [SHOW EXPORT](../../sql-manual/sql-statements/Show-Statements/SHOW-EXPORT.md).

### Cancel Export Jobs
After submitting an Export job, the export job can be cancelled via the [CANCEL EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT.md) command before the Export task succeeds or fails. An example of the cancellation command is as follows: 

```sql
CANCEL EXPORT FROM dbName WHERE LABEL like "%export_%";
```

## Export Instructions

### Export Data Sources
`EXPORT` currently supports exporting the following types of tables or views:
- Internal tables in Doris
- Logical views in Doris
- Tables in Doris Catalog

### Export Data Storage Locations
`Export` currently supports exporting to the following storage locations:
- Object storage: Amazon S3, COS, OSS, OBS, Google GCS
- HDFS
- Local file system

### Export File Types
`EXPORT` currently supports exporting to the following file formats:
- Parquet
- ORC
- csv
- csv_with_names
- csv_with_names_and_types

### Column Type Mapping for Exported Files
`Export` supports exporting to Parquet and ORC file formats. Parquet and ORC file formats have their own data types, and the export function of Doris can automatically convert the data types of Doris to the corresponding data types of Parquet and ORC file formats.

The following is a mapping table of Doris data types to the data types of Parquet and ORC file formats: 
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
- [Specify Partition for Export](#specify-partition-for-export)
- [Filter Data During Export](#filter-data-during-export)
- [Export External Table Data](#export-external-table-data)
- [Adjust Export Data Consistency](#adjust-export-data-consistency)
- [Adjust Concurrency of Export Jobs](#adjust-concurrency-of-export-jobs)
- [Example of Clearing the Export Directory Before Exporting](#example-of-clearing-the-export-directory-before-exporting)
- [Example of Setting the Size of Exported Files](#example-of-setting-the-size-of-exported-files)



<span id="high-availability-hdfs-export"></span>
**Export to an HDFS Cluster with High Availability Enabled**

If the HDFS has high availability enabled, HA information needs to be provided. For example:

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export/" 
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

<span id="high-availability-and-kerberos-cluster-export"></span>
**Export to an HDFS Cluster with High Availability and Kerberos Authentication Enabled**

If the HDFS cluster has both high availability enabled and Kerberos authentication enabled, you can refer to the following SQL statements: 

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export/" 
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

<span id="specify-partition-for-export"></span>
**Specify Partition for Export**

The export job supports exporting only some partitions of the internal tables in Doris. For example, only export partitions p1 and p2 of the `test` table. 

```sql
EXPORT TABLE test
PARTITION (p1,p2)
TO "file:///home/user/tmp/" 
PROPERTIES (
    "columns" = "k1,k2"
);
```

<span id="filter-data-during-export"></span>
**Filter Data During Export**

The export job supports filtering data according to predicate conditions during the export process, exporting only the data that meets the conditions. For example, only export the data that satisfies the condition `k1 < 50`. 

```sql
EXPORT TABLE test
WHERE k1 < 50
TO "file:///home/user/tmp/"
PROPERTIES (
    "columns" = "k1,k2",
    "column_separator"=","
);
```

<span id="export-external-table-data"></span>
**Export External Table Data**

The export job supports the data of external tables in Doris Catalog.

```sql
-- create a catalog
CREATE CATALOG `tpch` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpch",
    "trino.tpch.column-naming" = "STANDARD",
    "trino.tpch.splits-per-node" = "32"
);

-- export Catalog data
EXPORT TABLE tpch.sf1.lineitem TO "file:///path/to/exp_"
PROPERTIES(
    "parallelism" = "5",
    "format" = "csv",
    "max_file_size" = "1024MB"
);
```

:::tip
Currently, when exporting data from external tables in the Catalog using Export, concurrent exports are not supported. Even if the parallelism is specified to be greater than 1, the export will still be performed in a single thread. 
:::

<span id="adjust-export-data-consistency"></span>
**Adjust Export Data Consistency**

`Export` supports two granularities: partition and tablets. The `data_consistency` parameter is used to specify the granularity at which the table to be exported is sliced. `none` represents the Tablets level, and `partition` represents the Partition level. 

```sql
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
    "format" = "parquet",
    "data_consistency" = "partition",
    "max_file_size" = "512MB"
);
```

If `"data_consistency" = "partition"` is set, multiple `SELECT INTO OUTFILE` statements constructed at the underlying layer of the Export task will export different partitions.

If `"data_consistency" = "none"` is set, multiple `SELECT INTO OUTFILE` statements constructed at the underlying layer of the Export task will export different tablets. However, these different tablets may belong to the same partition.

For the logic of constructing `SELECT INTO OUTFILE` at the underlying layer of Export, please refer to the appendix section. 

<span id="adjust-concurrency-of-export-jobs"></span>
**Adjust Concurrency of Export Jobs**

Export can set different degrees of concurrency to export data concurrently. Specify the concurrency degree as 5: 

```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "512MB",
  "parallelism" = "5"
);
```

For the principle of concurrent export of Export, please refer to the appendix section.

<span id="example-of-clearing-the-export-directory-before-exporting"></span>
**Example of Clearing the Export Directory Before Exporting**

```sql
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "true"
);
```

If `"delete_existing_files" = "true"` is set, the export job will first delete all files and directories under the `/home/user/` directory, and then export data to that directory.

> Note:
If you want to use the delete_existing_files parameter, you also need to add the configuration `enable_delete_existing_files = true` in fe.conf and restart fe, then delete_existing_files will take effect. delete_existing_files = true is a dangerous operation and it is recommended to use it only in the test environment.

<span id="example-of-setting-the-size-of-exported-files"></span>
**Example of Setting the Size of Exported Files**

The export job supports setting the size of the export file. If the size of a single file exceeds the set value, it will be divided into multiple files for export according to the specified size.

```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB"
);
```

By setting `"max_file_size" = "512MB"`, the maximum size of a single exported file is 512MB.

## Precautions
* Memory Limitation

  Usually, the query plan of an Export job only consists of two parts: scanning and exporting, and does not involve computational logic that requires too much memory. Therefore, the default memory limit of 2GB usually meets the requirements.

  However, in some scenarios, for example, when a query plan needs to scan too many Tablets on the same BE or there are too many data versions of Tablets, it may lead to insufficient memory. You can adjust the session variable `exec_mem_limit` to increase the memory usage limit.

* Export Data Volume

  It is not recommended to export a large amount of data at one time. The recommended maximum export data volume for an Export job is several tens of gigabytes. Excessive exports will lead to more junk files and higher retry costs. If the table data volume is too large, it is recommended to export by partitions.

  In addition, the Export job will scan data and occupy IO resources, which may affect the query latency of the system.

* Export File Management

  If the Export job fails, the files that have already been generated will not be deleted, and users need to delete them manually.

* Data Consistency

  Currently, only a simple check is performed on whether the tablet versions are consistent during export. It is recommended not to perform data import operations on the table during the export process.

* Export Timeout

  If the amount of exported data is very large and exceeds the export timeout period, the Export task will fail. At this time, you can specify the `timeout` parameter in the Export command to increase the timeout period and retry the Export command.

* Export Failure

  During the operation of the Export job, if the FE restarts or switches the master, the Export job will fail, and the user needs to resubmit it. You can check the status of the Export task through the `show export` command.

* Number of Exported Partitions

  The maximum number of partitions allowed to be exported by an Export Job is 2000. You can add the parameter `maximum_number_of_export_partitions` in fe.conf and restart the FE to modify this setting.

* Concurrent Export

  During concurrent export, please configure the number of threads and parallelism reasonably to make full use of system resources and avoid performance bottlenecks. During the export process, you can monitor the progress and performance indicators in real time to discover problems in time and make optimization adjustments.

* Data Integrity

  After the export operation is completed, it is recommended to verify whether the exported data is complete and correct to ensure the quality and integrity of the data.

* The specific logic for an Export task to construct one or more `SELECT INTO OUTFILE` execution plans is as follows:

  1. Select the Consistency Model of Exported Data

      The consistency of export is determined according to the `data_consistency` parameter. This is only related to semantics and has nothing to do with the degree of concurrency. Users should first select a consistency model according to their own requirements.

  2. Determine the Degree of Concurrency

      Determine the number of threads to run these `SELECT INTO OUTFILE` execution plans according to the `parallelism` parameter. The `parallelism` parameter determines the maximum possible number of threads.

      > Note: Even if the Export command sets the `parallelism` parameter, the actual number of concurrent threads of the Export task is also related to Job Schedule. After setting multiple concurrency for the Export task, each concurrent thread is provided by Job Schedule. Therefore, if the Doris system tasks are busy at this time and the thread resources of Job Schedule are tight, the actual number of threads allocated to the Export task may not reach the `parallelism` number, which will affect the concurrent export of Export. At this time, you can alleviate this problem by reducing the system load or adjusting the FE configuration `async_task_consumer_thread_num` to increase the total number of threads of Job Schedule.

  3. Determine the Task Amount of Each Outfile Statement

      Each thread will decide how many outfiles to split into according to `maximum_tablets_of_outfile_in_export` and the actual number of partitions/buckets of the data.

      > `maximum_tablets_of_outfile_in_export` is an FE configuration with a default value of 10. This parameter is used to specify the maximum number of partitions/buckets allowed in a single OutFile statement split by the Export task. You need to restart the FE to modify this configuration.

      Example: Suppose a table has a total of 20 partitions, and each partition has 5 buckets, then the table has a total of 100 buckets. Set `data_consistency = none` and `maximum_tablets_of_outfile_in_export = 10`.

      1. In the case of `parallelism = 5`

          The Export task will divide the 100 buckets of the table into 5 parts, and each thread is responsible for 20 buckets. The 20 buckets responsible by each thread will be divided into 2 groups of 10 buckets each, and each group of buckets is responsible by one outfile query plan. So, finally, the Export task has 5 threads executing concurrently, each thread is responsible for 2 outfile statements, and the outfile statements responsible by each thread are executed serially.

      2. In the case of `parallelism = 3`

          The Export task will divide the 100 buckets of the table into 3 parts, and the 3 threads are responsible for 34, 33, and 33 buckets respectively. The buckets responsible by each thread will be divided into 4 groups of 10 buckets each (the last group has less than 10 buckets), and each group of buckets is responsible by one outfile query plan. So, finally, the Export task has 3 threads executing concurrently, each thread is responsible for 4 outfile statements, and the outfile statements responsible by each thread are executed serially.

      3. In the case of `parallelism = 120`

          Since there are only 100 buckets in the table, the system will force `parallelism` to be set to 100 and execute with `parallelism = 100`. The Export task will divide the 100 buckets of the table into 100 parts, and each thread is responsible for 1 bucket. The 1 bucket responsible by each thread will be divided into 1 group of 10 buckets (this group actually has only 1 bucket), and each group of buckets is responsible by one outfile query plan. So, finally, the Export task has 100 threads executing concurrently, each thread is responsible for 1 outfile statement, and each outfile statement actually exports only 1 bucket.

* For a better performance of Export in the current version, it is recommended to set the following parameters:

  1. Open the session variable `enable_parallel_outfile`.
  2. Set the `parallelism` parameter of Export to a larger value so that each thread is only responsible for one `SELECT INTO OUTFILE` query plan.
  3. Set the FE configuration `maximum_tablets_of_outfile_in_export` to a smaller value so that the amount of data exported by each `SELECT INTO OUTFILE` query plan is smaller.
