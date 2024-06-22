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

This document provides an overview of using the `EXPORT` command to export data stored in Doris.

For detailed information on the `EXPORT` command, please refer to: [EXPORT](../../sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/EXPORT.md).

## Overview
`Export` is a feature provided by Doris to asynchronously export data. This functionality allows users to export data from specified tables or partitions in a specified file format to a target storage system, including object storage, HDFS, or local file systems.

`Export` is an asynchronous command that returns immediately after execution. Users can view detailed information about the export task using the `Show Export` command.

For guidance on choosing between `SELECT INTO OUTFILE` and `EXPORT`, please refer to the [Export Overview](./export-overview.md).

The `EXPORT` command currently supports exporting the following types of tables or views:

* Doris internal tables
* Doris logical views
* Doris Catalog tables

The `EXPORT` command currently supports the following export formats:

* Parquet
* ORC
* CSV
* CSV_with_names
* CSV_with_names_and_types

Compression formats are not supported.

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
After submitting the job, you can query the export job status using the [SHOW EXPORT](../../sql-manual/sql-statements/Show-Statements/SHOW-EXPORT.md) command. An example result is shown below:

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
The columns in the `show export` command result have the following meanings:

* JobId: The unique ID of the job
* Label: The label of the export job. If not specified, the system generates one by default.
* State: Job status:
  * PENDING: Job is pending scheduling
  * EXPORTING: Data is being exported
  * FINISHED: Job completed successfully
  * CANCELLED: Job failed
* Progress: Job progress. This is measured by the number of query plans. If there are 10 threads in total and 3 have completed, the progress is 30%.
* TaskInfo: Job information displayed in JSON format:
  * db: Database name
  * tbl: Table name
  * partitions: Specified partitions to export. An empty list indicates all partitions.
  * column_separator: Column separator for the export file.
  * line_delimiter: Line separator for the export file.
  * tablet num: Total number of involved tablets.
  * broker: Name of the broker used.
  * coord num: Number of query plans.
  * max_file_size: Maximum size of an export file.
  * delete_existing_files: Whether to delete existing files and directories in the export directory.
  * columns: Columns to export; an empty value means all columns are exported.
  * format: File format of the export.
* Path: Export path in the remote storage.
* CreateTime/StartTime/FinishTime: Job creation time, scheduling start time, and end time.
* Timeout: Job timeout period in seconds, starting from CreateTime.
* ErrorMsg: If there is an error in the job, the reason is displayed here.
* OutfileInfo: If the job is successful, this displays detailed `SELECT INTO OUTFILE` result information.

After submitting an export job, you can cancel it before it succeeds or fails using the [CANCEL EXPORT](../../sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/CANCEL-EXPORT.md) command. An example cancellation command is shown below:

```sql
CANCEL EXPORT FROM tpch1 WHERE LABEL like "%export_%";
```
## Export File Column Type Mapping
`Export` supports exporting data in Parquet and ORC file formats. These formats have their own data types. Doris's export functionality automatically maps Doris's data types to the corresponding data types in Parquet and ORC file formats. For detailed mapping relationships, please refer to the "Export File Column Type Mapping" section in the [Export Overview](./export-overview.md) document.

## Examples
### Export to HDFS
Export the `col1` and `col2` columns from partitions `p1` and `p2` of the `db1.tbl1` table to HDFS, setting the export job label to `mylabel`. The export file format is CSV (default format), the column separator is `,`, and the maximum file size is 512MB.

```sql
EXPORT TABLE db1.tbl1 
PARTITION (p1, p2)
TO "hdfs://host/path/to/export/" 
PROPERTIES
(
    "label" = "mylabel",
    "column_separator" = ",",
    "max_file_size" = "512MB",
    "columns" = "col1, col2"
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://hdfs_host:port",
    "hadoop.username" = "hadoop"
);
```
If HDFS high availability is enabled, provide HA information as follows:

```sql
EXPORT TABLE db1.tbl1 
PARTITION (p1, p2)
TO "hdfs://HDFS8000871/path/to/export/" 
PROPERTIES
(
    "label" = "mylabel",
    "column_separator" = ",",
    "max_file_size" = "512MB",
    "columns" = "col1, col2"
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1, nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```
If the Hadoop cluster has high availability and Kerberos authentication enabled, refer to the following SQL statement:

```sql
EXPORT TABLE db1.tbl1 
PARTITION (p1, p2)
TO "hdfs://HDFS8000871/path/to/export/" 
PROPERTIES
(
    "label" = "mylabel",
    "column_separator" = ",",
    "max_file_size" = "512MB",
    "columns" = "col1, col2"
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://hacluster/",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "hacluster",
    "dfs.ha.namenodes.hacluster" = "n1, n2",
    "dfs.namenode.rpc-address.hacluster.n1" = "192.168.0.1:8020",
    "dfs.namenode.rpc-address.hacluster.n2" = "192.168.0.2:8020",
    "dfs.client.failover.proxy.provider.hacluster" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "dfs.namenode.kerberos.principal" = "hadoop/_HOST@REALM.COM",
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "doris_test@REALM.COM",
    "hadoop.kerberos.keytab" = "/path/to/doris_test.keytab"
);
```
### Export to S3
Export all data from the `s3_test` table to S3 in CSV format, using the invisible character `\\x07` as the line delimiter.

```sql
EXPORT TABLE s3_test TO "s3://bucket/a/b/c" 
PROPERTIES (
    "line_delimiter" = "\\x07"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key" = "xxxx",
    "s3.access_key" = "xxxxx"
);
```
### Export to Local File System
> To export data to the local file system, add `enable_outfile_to_local=true` in `fe.conf` and restart FE.

Export all data from the `test` table to local storage:

```sql
-- Parquet format
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1, k2",
  "format" = "parquet"
);

-- ORC format
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1, k2",
  "format" = "orc"
);

-- CSV_with_names format, using 'AA' as the column separator and 'zz' as the line delimiter
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names",
  "column_separator" = "AA",
  "line_delimiter" = "zz"
);

-- CSV_with_names_and_types format
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names_and_types"
);
```
> Note:
  Exporting to the local file system is not suitable for public cloud users and is only applicable to private deployments. It is assumed that the user has full control over the cluster nodes. Doris does not perform legality checks on the export path. If the Doris process user does not have write permissions for the path, or if the path does not exist, an error will be reported. Additionally, for security reasons, if a file with the same name already exists in the path, the export will fail.
  Doris does not manage files exported to the local file system, nor does it check disk space. Users must manage these files themselves, such as by cleaning up as needed.

### Exporting Specific Partitions
Export tasks support exporting only specific partitions of internal tables in Doris, such as exporting only the `p1` and `p2` partitions of the `test` table.

```sql
EXPORT TABLE test
PARTITION (p1, p2)
TO "file:///home/user/tmp/" 
PROPERTIES (
    "columns" = "k1, k2"
);
```
### Filtering Data During Export
Export tasks support filtering data based on predicate conditions, exporting only data that meets the conditions, such as exporting only data where `k1 < 50`.

```sql
EXPORT TABLE test
WHERE k1 < 50
TO "file:///home/user/tmp/"
PROPERTIES (
    "columns" = "k1, k2",
    "column_separator" = ","
);
```
### Exporting External Table Data
Export tasks support exporting external table data from the Doris Catalog:

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

> Note: Currently, exporting data from Catalog external tables does not support concurrent export. Even if `parallelism` is set to greater than 1, the export is still performed in a single thread.

## Best Practices
### Consistent Export
The `Export` function supports partition/tablet-level granularity. The `data_consistency` parameter specifies the granularity for splitting the table to be exported: `none` represents the tablet level, and `partition` represents the partition level.

```sql
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
    "format" = "parquet",
    "data_consistency" = "partition",
    "max_file_size" = "512MB"
);
```
- Setting `"data_consistency" = "partition"` constructs multiple `SELECT INTO OUTFILE` statements to export different partitions.
- Setting `"data_consistency" = "none"` constructs multiple `SELECT INTO OUTFILE` statements to export different tablets, which may belong to the same partition.

Refer to the appendix for the logic behind constructing `SELECT INTO OUTFILE` statements.

### Export Job Concurrency
Set different levels of concurrency to export data concurrently. Specify a concurrency of 5:

```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "512MB",
  "parallelism" = "5"
);
```
Refer to the appendix for the principles of concurrent export.

### Clear Export Directory Before Exporting
```sql
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "true"
);
```
If `"delete_existing_files" = "true"` is set, the export job will first delete all files and directories under `/home/user/`, then export data to that directory.

> Note:
  To use the `delete_existing_files` parameter, add `enable_delete_existing_files = true` in `fe.conf` and restart FE. The `delete_existing_files` parameter is a dangerous operation and is recommended only for testing environments.

### Set Export File Size
Export jobs support setting the size of export files. If a single file exceeds the set value, it will be split into multiple files.

```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB"
);
```
Setting `"max_file_size" = "512MB"` limits the maximum size of a single export file to 512MB.

## Notes
1. **Memory Limits**
   - An Export job typically involves only `scan-export` operations and does not require complex memory-consuming computations. The default 2GB memory limit usually suffices.
   - In scenarios where the query plan needs to scan too many tablets or versions on the same BE, memory might run out. Adjust the `exec_mem_limit` session variable to increase the memory limit.

2. **Export Data Volume**
   - Avoid exporting a large volume of data at once. The recommended maximum data volume for an Export job is several tens of GBs. Larger exports can lead to more garbage files and higher retry costs. If the table size is too large, consider partition-based export.
   - Export jobs scan data and occupy IO resources, which may affect system query latency.

3. **Managing Export Files**
   - If an Export job fails, the generated files are not deleted and need to be removed manually.

4. **Data Consistency**
   - During export, the system simply checks if the tablet versions are consistent. It is advisable to avoid importing data into the table during the export process.

5. **Export Timeout**
   - If the data volume is large and exceeds the export timeout, the Export job will fail. Use the `timeout` parameter in the Export command to extend the timeout and retry the Export command.

6. **Export Failure**
   - If the FE restarts or switches primary during the Export job, the job will fail and need to be resubmitted. Use the `show export` command to check the Export job status.

7. **Number of Partitions Exported**
   - The maximum number of partitions an Export Job can export is 2000. Modify this limit by adding the `maximum_number_of_export_partitions` parameter in `fe.conf` and restarting FE.

8. **Concurrent Export**
   - When exporting concurrently, configure the thread count and parallelism appropriately to fully utilize system resources and avoid performance bottlenecks. Monitor the progress and performance metrics in real-time to identify and address issues promptly.

9. **Data Integrity**
   - After the export operation is complete, verify that the exported data is complete and correct to ensure data quality and integrity.

## Appendix
### Principles of Concurrent Export

The underlying mechanism of an Export task in Doris is to execute `SELECT INTO OUTFILE` SQL statements. When a user initiates an Export task, Doris constructs one or more `SELECT INTO OUTFILE` execution plans based on the table to be exported. These execution plans are then submitted to Doris's Job Scheduler, which automatically schedules and executes them.

By default, Export tasks run single-threaded. To improve export efficiency, the Export command can include a `parallelism` parameter to enable concurrent data export. Setting `parallelism` greater than 1 allows the Export task to use multiple threads to concurrently execute `SELECT INTO OUTFILE` query plans. The `parallelism` parameter specifies the number of threads to execute the EXPORT job.

The logic for constructing one or more `SELECT INTO OUTFILE` execution plans for an Export task is as follows:

1. **Select Consistency Model**
   Choose the consistency model for export based on the `data_consistency` parameter. This is semantic and unrelated to concurrency. Users should select the consistency model according to their needs.

2. **Determine Concurrency**
   The `parallelism` parameter determines the number of threads to run the `SELECT INTO OUTFILE` execution plans. `Parallelism` specifies the maximum possible number of threads.
   
   > Note: Even if the Export command sets the `parallelism` parameter, the actual number of concurrent threads for the Export task also depends on Job Scheduler resources. If the system is busy and Job Scheduler thread resources are tight, the actual number of threads assigned to the Export task might not reach the specified `parallelism`, affecting the concurrent export. To address this, reduce system load or adjust the FE configuration `async_task_consumer_thread_num` to increase the total number of Job Scheduler threads.

3. **Determine Task Volume for Each Outfile Statement**
   Each thread decides the number of `outfile` based on `maximum_tablets_of_outfile_in_export` and the actual number of partitions/buckets in the data.

   > `maximum_tablets_of_outfile_in_export` is an FE configuration with a default value of 10. It specifies the maximum number of partitions/buckets allowed in a single `outfile` statement for an Export task. Modifying this configuration requires restarting FE.

### Example

Consider a table with 20 partitions, each having 5 buckets, totaling 100 buckets. Set `data_consistency = none` and `maximum_tablets_of_outfile_in_export = 10`.

1. **`parallelism = 5`**
   The Export task splits the 100 buckets into 5 parts, with each thread responsible for 20 buckets. Each thread further splits its 20 buckets into 2 groups of 10 buckets each, with each group handled by one `outfile` query plan. Thus, the Export task has 5 threads running concurrently, each handling 2 `outfile` statements, which are executed serially within each thread.

2. **`parallelism = 3`**
   The Export task splits the 100 buckets into 3 parts, with 3 threads responsible for 34, 33, and 33 buckets respectively. Each thread splits its buckets into 4 groups of 10 buckets (with the last group containing fewer than 10 buckets), each group handled by one `outfile` query plan. Thus, the Export task has 3 threads running concurrently, each handling 4 `outfile` statements, executed serially within each thread.

3. **`parallelism = 120`**
   Since the table has only 100 buckets, the system forces `parallelism` to 100 and executes it accordingly. The Export task splits the 100 buckets into 100 parts, with each thread responsible for 1 bucket. Each thread's single bucket is split into 1 group (actually just 1 bucket), handled by one `outfile` query plan. Thus, the Export task has 100 threads running concurrently, each handling 1 `outfile` statement, with each `outfile` statement exporting just 1 bucket.

### Optimizing Export Performance
For optimal Export performance in the current version, consider the following settings:
1. Enable the session variable `enable_parallel_outfile`.
2. Set the Export's `parallelism` parameter to a high value, so each thread handles only one `SELECT INTO OUTFILE` query plan.
3. Set the FE configuration `maximum_tablets_of_outfile_in_export` to a low value, so each `SELECT INTO OUTFILE` query plan exports a small amount of data.
