---
{
    "title": "Export",
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

This document will introduce how to use the `EXPORT` command to export data stored in Doris.

For a detailed description of the `EXPORT` command, please refer to: [EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md)

## Overview

`Export` is a feature provided by Doris for asynchronously exporting data. This feature allows users to export data from specified tables or partitions in a specified file format to a target storage system, including object storage, HDFS, or the local file system.

`Export` is an asynchronous command. After the command is successfully executed, it immediately returns the result. Users can use the `Show Export` command to view detailed information about the export task.

For guidance on choosing between `SELECT INTO OUTFILE` and `EXPORT`, please see [Export Overview](../../data-operate/export/export-overview.md).

`EXPORT` currently supports exporting the following types of tables or views:

- Doris internal tables
- Doris logical views
- Doris Catalog tables

`EXPORT` currently supports the following export formats:

- Parquet
- ORC
- csv
- csv\_with\_names
- csv\_with\_names\_and\_types

Exporting in compressed formats is not supported.

Example:

```sql
mysql> EXPORT TABLE tpch1.lineitem TO "s3://my_bucket/path/to/exp_"
    -> PROPERTIES(
    ->     "format" = "csv",
    ->     "max_file_size" = "2048MB"
    -> )
    -> WITH s3 (
    ->   "s3.endpoint" = "${endpoint}",
    ->   "s3.region" = "${region}",
    ->   "s3.secret_key"="${sk}",
    ->   "s3.access_key" = "${ak}"
    -> );
```

After submitting a job, you can query the export job status using the [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT.md) command. An example result is as follows:

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

The meaning of each column in the result returned by the `show export` command is as follows:

- JobId: The unique ID of the job
- Label: The label of the export job. If not specified in the export, the system will generate one by default.
- State: Job status:
  - PENDING: Job pending scheduling
  - EXPORTING: Data export in progress
  - FINISHED: Job successful
  - CANCELLED: Job failed
- Progress: Job progress. This progress is based on query plans. For example, if there are a total of 10 threads and 3 have been completed, the progress is 30%.
- TaskInfo: Job information displayed in JSON format:
  - db: Database name
  - tbl: Table name
  - partitions: Specified partitions for export. An empty list indicates all partitions.
  - column\_separator: Column separator for the export file.
  - line\_delimiter: Line delimiter for the export file.
  - tablet num: Total number of tablets involved.
  - broker: Name of the broker used.
  - coord num: Number of query plans.
  - max\_file\_size: Maximum size of an export file.
  - delete\_existing\_files: Whether to delete existing files and directories in the export directory.
  - columns: Specified column names to export, empty value represents exporting all columns.
  - format: File format for export
- Path: Export path on the remote storage.
- `CreateTime/StartTime/FinishTime`: Job creation time, scheduling start time, and end time.
- Timeout: Job timeout time in seconds. This time is calculated from CreateTime.
- ErrorMsg: If there is an error in the job, the error reason will be displayed here.
- OutfileInfo: If the job is successfully exported, specific `SELECT INTO OUTFILE` result information will be displayed here.

After submitting the Export job, you can cancel the export job using the [CANCEL EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT.md) command before the export task succeeds or fails. An example of the cancel command is as follows:

```sql
CANCEL EXPORT FROM tpch1 WHERE LABEL like "%export_%";
```

## Export File Column Type Mapping

`Export` supports exporting data in Parquet and ORC file formats. Parquet and ORC file formats have their own data types. Doris's export function can automatically export Doris's data types to the corresponding data types of Parquet and ORC file formats. For specific mapping relationships, please refer to the "Export File Column Type Mapping" section of the [Export Overview](../../data-operate/export/export-overview.md) document.

## Examples

### Export to HDFS

Export data from the `col1` and `col2` columns in the `p1` and `p2` partitions of the db1.tbl1 table to HDFS, setting the label of the export job to `mylabel`. The export file format is csv (default format), the column delimiter is `,`, and the maximum size limit for a single export file is 512MB.

```sql
EXPORT TABLE db1.tbl1 
PARTITION (p1,p2)
TO "hdfs://host/path/to/export/" 
PROPERTIES
(
    "label" = "mylabel",
    "column_separator"=",",
    "max_file_size" = "512MB",
    "columns" = "col1,col2"
)
with HDFS (
    "fs.defaultFS"="hdfs://hdfs_host:port",
    "hadoop.username" = "hadoop"
);
```

If HDFS is configured for high availability, HA information needs to be provided, as shown below:

```sql
EXPORT TABLE db1.tbl1 
PARTITION (p1,p2)
TO "hdfs://HDFS8000871/path/to/export/" 
PROPERTIES
(
    "label" = "mylabel",
    "column_separator"=",",
    "max_file_size" = "512MB",
    "columns" = "col1,col2"
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

If the Hadoop cluster is configured for high availability and Kerberos authentication is enabled, you can refer to the following SQL statement:

```sql
EXPORT TABLE db1.tbl1 
PARTITION (p1,p2)
TO "hdfs://HDFS8000871/path/to/export/" 
PROPERTIES
(
    "label" = "mylabel",
    "column_separator"=",",
    "max_file_size" = "512MB",
    "columns" = "col1,col2"
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

### Export to S3

Export all data from the s3_test table to S3, with the export format as csv and using the invisible character `\x07` as the row delimiter.

```sql
EXPORT TABLE s3_test TO "s3://bucket/a/b/c" 
PROPERTIES (
    "line_delimiter" = "\\x07"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
)
```

### Export to Local File System

>
> To export data to the local file system, you need to add `enable_outfile_to_local=true` in fe.conf and restart FE.

Export all data from the test table to local storage:

```sql
-- parquet format
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "parquet"
);

-- orc format
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "orc"
);

-- csv_with_names format, using 'AA' as the column separator and 'zz' as the line delimiter
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names",
  "column_separator"="AA",
  "line_delimiter" = "zz"
);

-- csv_with_names_and_types format
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names_and_types"
);
```

> Note:
 The functionality of exporting to the local file system is not applicable to public cloud users, only for users of private deployments. Additionally, by default, users have full control permissions over the cluster nodes. Doris does not perform validity checks on the export path provided by the user. If the Doris process user does not have write permission to the path or the path does not exist, an error will occur. For security reasons, if a file with the same name already exists in the path, the export will also fail.
 Doris does not manage the files exported to the local file system or check disk space, etc. Users need to manage these files themselves, including cleaning them up.

### Export Specific Partitions

Export jobs support exporting only specific partitions of Doris internal tables, such as exporting only the p1 and p2 partitions of the test table.

```sql
EXPORT TABLE test
PARTITION (p1,p2)
TO "file:///home/user/tmp/" 
PROPERTIES (
    "columns" = "k1,k2"
);
```

### Filtering Data during Export

Export jobs support filtering data based on predicate conditions during export, exporting only data that meets certain conditions, such as exporting data that satisfies the condition `k1 < 50`.

```sql
EXPORT TABLE test
WHERE k1 < 50
TO "file:///home/user/tmp/"
PROPERTIES (
    "columns" = "k1,k2",
    "column_separator"=","
);
```

### Export External Table Data

Export jobs support Doris Catalog external table data:

```sql
-- Create a catalog
CREATE CATALOG `tpch` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpch",
    "trino.tpch.column-naming" = "STANDARD",
    "trino.tpch.splits-per-node" = "32"
);

-- Export data from the Catalog external table
EXPORT TABLE tpch.sf1.lineitem TO "file:///path/to/exp_"
PROPERTIES(
    "parallelism" = "5",
    "format" = "csv",
    "max_file_size" = "1024MB"
);
```

:::tip
Exporting Catalog external table data does not support concurrent exports. Even if a parallelism greater than 1 is specified, it will still be a single-threaded export.
:::

## Best Practices

### Export Consistency

`Export` supports two granularities for export: `partition / tablets`. The `data_consistency` parameter is used to specify the granularity at which the table to be exported is split. `none` represents Tablets level, and `partition` represents Partition level.

```sql
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
    "format" = "parquet",
    "data_consistency" = "partition",
    "max_file_size" = "512MB"
);
```

If `"data_consistency" = "partition"` is set, the underlying Export task constructs multiple `SELECT INTO OUTFILE` statements to export different partitions.

If `"data_consistency" = "none"` is set, the underlying Export task constructs multiple `SELECT INTO OUTFILE` statements to export different tablets. However, these different tablets may belong to the same partition.

For the logic behind Export's underlying construction of `SELECT INTO OUTFILE` statements, refer to the appendix.

### Export Job Concurrency

Export allows setting different concurrency levels to export data concurrently. Specify a concurrency level of 5:

```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "512MB",
  "parallelism" = "5"
);
```

For more information on the principles of concurrent export in Export, refer to the appendix section.

### Clear Export Directory Before Exporting

```sql
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "true"
);
```

If `"delete_existing_files" = "true"` is set, the export job will first delete all files and directories under `/home/user/`, and then export data to that directory.

> Note:
To use the `delete_existing_files` parameter, you also need to add the configuration `enable_delete_existing_files = true` in fe.conf and restart the FE. Only then will `delete_existing_files` take effect. `delete_existing_files = true` is a risky operation and is recommended to be used only in a testing environment.

### Set Export File Size

Export jobs support setting the size of export files. If a single file exceeds the set value, it will be split into multiple files for export.

```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB"
);
```

By setting `"max_file_size" = "512MB"`, the maximum size of a single export file will be 512MB.

## Notes
* Memory Limit

  Typically, an Export job's query plan consists of only `scan-export` two parts, without involving complex calculation logic that requires a lot of memory. Therefore, the default memory limit of 2GB usually meets the requirements.

  However, in some scenarios, such as when a query plan needs to scan too many tablets on the same BE, or when there are too many data versions of tablets, it may lead to insufficient memory. You can adjust the session variable `exec_mem_limit` to increase the memory usage limit.

* Export Data Volume

  It is not recommended to export a large amount of data at once. It is suggested that the maximum export data volume for an Export job should be within tens of gigabytes. Exporting excessively large data can result in more garbage files and higher retry costs. If the table data volume is too large, it is recommended to export by partition.

  Additionally, Export jobs scan data, consuming IO resources, which may impact the system's query latency.

* Export File Management

  If an Export job fails during execution, the generated files will not be deleted automatically and will need to be manually deleted by the user.

* Data Consistency

  Currently, during export, only a simple check is performed on tablet versions for consistency. It is recommended not to import data into the table during the export process.

* Export Timeout

  If the exported data volume is very large and exceeds the export timeout, the Export task will fail. In such cases, you can specify the `timeout` parameter in the Export command to increase the timeout and retry the Export command.

* Export Failure

  If the FE restarts or switches masters during the execution of an Export job, the Export job will fail, and the user will need to resubmit it. You can check the status of Export tasks using the `show export` command.

* Number of Export Partitions

  An Export Job allows a maximum of 2000 partitions to be exported. You can modify this setting by adding the parameter `maximum_number_of_export_partitions` in fe.conf and restarting the FE.

* Concurrent Export

  When exporting concurrently, it is important to configure the thread count and parallelism properly to fully utilize system resources and avoid performance bottlenecks. During the export process, monitor progress and performance metrics in real-time to promptly identify issues and optimize adjustments.

* Data Integrity

  After the export operation is completed, it is recommended to verify the exported data for completeness and correctness to ensure data quality and integrity.

## Appendix

### Principles of Concurrent Export

The underlying operation of an Export task is to execute the `SELECT INTO OUTFILE` SQL statement. When a user initiates an Export task, Doris constructs one or more `SELECT INTO OUTFILE` execution plans based on the table to be exported, and then submits these `SELECT INTO OUTFILE` execution plans to Doris's Job Schedule task scheduler, which automatically schedules and executes these tasks.

By default, Export tasks are executed single-threaded. To improve export efficiency, the Export command can set a `parallelism` parameter to export data concurrently. When `parallelism` is set to a value greater than 1, the Export task will use multiple threads to execute the `SELECT INTO OUTFILE` query plans concurrently. The `parallelism` parameter essentially specifies the number of threads to execute the EXPORT job.

The specific logic of constructing one or more `SELECT INTO OUTFILE` execution plans for an Export task is as follows:

1. Select the consistency model for exporting data

    Based on the `data_consistency` parameter to determine the consistency of the export, which is only related to semantics and not concurrency. Users should first choose a consistency model based on their own requirements.

2. Determine the Degree of Parallelism

    Determine how many threads will run the `SELECT INTO OUTFILE` execution plan based on the `parallelism` parameter. The `parallelism` parameter determines the maximum number of threads possible.

    > Note: Even if the Export command sets the `parallelism` parameter, the actual number of concurrent threads for the Export task depends on the Job Schedule. When an Export task sets a higher concurrency, each concurrent thread is provided by the Job Schedule. Therefore, if the Doris system tasks are busy and the Job Schedule's thread resources are tight, the actual number of threads assigned to the Export task may not reach the specified `parallelism` number, affecting the concurrent export of the Export task. To mitigate this issue, you can reduce system load or adjust the FE configuration `async_task_consumer_thread_num` to increase the total thread count of the Job Schedule.

3. Determine the Workload of Each `outfile` Statement

    Each thread will determine how many `outfile` statements to split based on `maximum_tablets_of_outfile_in_export` and the actual number of partitions / buckets in the data.

    > `maximum_tablets_of_outfile_in_export` is a configuration in the FE with a default value of 10. This parameter specifies the maximum number of partitions / buckets allowed in a single OutFile statement generated by an Export task. Modifying this configuration requires restarting the FE.

    Example: Suppose a table has a total of 20 partitions, each partition has 5 buckets, resulting in a total of 100 buckets. Set `data_consistency = none` and `maximum_tablets_of_outfile_in_export = 10`.

    1. Scenario with `parallelism = 5`

        The Export task will divide the 100 buckets of the table into 5 parts, with each thread responsible for 20 buckets. Each thread's 20 buckets will be further divided into 2 groups of 10 buckets each, with each group handled by an outfile query plan. Therefore, the Export task will have 5 threads executing concurrently, with each thread handling 2 outfile statements that are executed serially.

    2. Scenario with `parallelism = 3`

        The Export task will divide the 100 buckets of the table into 3 parts, with 3 threads responsible for 34, 33, and 33 buckets respectively. Each thread's buckets will be further divided into 4 groups of 10 buckets each (the last group may have fewer than 10 buckets), with each group handled by an outfile query plan. Therefore, the Export task will have 3 threads executing concurrently, with each thread handling 4 outfile statements that are executed serially.

    3. Scenario with `parallelism = 120`

        Since the table has only 100 buckets, the system will force `parallelism` to be set to 100 and execute with `parallelism = 100`. The Export task will divide the 100 buckets of the table into 100 parts, with each thread responsible for 1 bucket. Each thread's 1 bucket will be further divided into 1 group of 1 bucket, with each group handled by an outfile query plan. Therefore, the Export task will have 100 threads executing concurrently, with each thread handling 1 outfile statement, where each outfile statement actually exports only 1 bucket.

For optimal performance in the current version of Export, it is recommended to set the following parameters:

1. Enable the session variable `enable_parallel_outfile`.
2. Set the `parallelism` parameter of Export to a large value so that each thread is responsible for only one `SELECT INTO OUTFILE` query plan.
3. Set the FE configuration `maximum_tablets_of_outfile_in_export` to a small value to export a smaller amount of data for each `SELECT INTO OUTFILE` query plan.
