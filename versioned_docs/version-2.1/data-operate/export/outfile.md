---
{
    "title": "Select Info Outfile",
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

This document introduces how to use the `SELECT INTO OUTFILE` command to export query results.

For a detailed introduction to the `SELECT INTO OUTFILE` command, refer to: [SELECT INTO OUTFILE](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE.md).

## Overview

The `SELECT INTO OUTFILE` command exports the result data of the `SELECT` statement to a target storage system, such as object storage, HDFS, or the local file system, in a specified file format.

`SELECT INTO OUTFILE` is a synchronous command, meaning it completes when the command returns. If successful, it returns information about the number, size, and paths of the exported files. If it fails, it returns error information.

For guidance on choosing between `SELECT INTO OUTFILE` and `EXPORT`, see the [Export Overview](./export-overview.md).

### Supported Export Formats

`SELECT INTO OUTFILE` currently supports the following export formats:

- Parquet
- ORC
- CSV
- CSV with column names (`csv_with_names`)
- CSV with column names and types (`csv_with_names_and_types`)

Compressed formats are not supported.

### Example

```sql
mysql> SELECT * FROM tbl1 LIMIT 10 INTO OUTFILE "file:///home/work/path/result_";
+------------+-----------+----------+--------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                |
+------------+-----------+----------+--------------------------------------------------------------------+
|          1 |         2 |        8 | file:///192.168.1.10/home/work/path/result_{fragment_instance_id}_ |
+------------+-----------+----------+--------------------------------------------------------------------+
```

Explanation of the returned results:

- **FileNumber**: The number of generated files.
- **TotalRows**: The number of rows in the result set.
- **FileSize**: The total size of the exported files in bytes.
- **URL**: The prefix of the exported file paths. Multiple files will be numbered sequentially with suffixes `_0`, `_1`, etc.

## Export File Column Type Mapping

`SELECT INTO OUTFILE` supports exporting to Parquet and ORC file formats. Parquet and ORC have their own data types, and Doris can automatically map its data types to corresponding Parquet and ORC data types. Refer to the "Export File Column Type Mapping" section in the [Export Overview](./export-overview.md) document for the specific mapping relationships.

## Examples

### Export to HDFS

Export query results to the `hdfs://path/to/` directory, specifying the export format as PARQUET:

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

If HDFS is configured for high availability, provide HA information, such as:

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

If the Hadoop cluster is configured for high availability and Kerberos authentication is enabled, you can refer to the following SQL statement:

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

### Export to S3

Export query results to the S3 storage at `s3://path/to/` directory, specifying the export format as ORC. Provide `sk`, `ak`, and other necessary information:

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

### Export to Local File System
>
> To export to the local file system, add `enable_outfile_to_local=true` in `fe.conf` and restart FE.

Export query results to the BE's `file:///path/to/` directory, specifying the export format as CSV, with a comma as the column separator:

```sql
SELECT k1 FROM tbl1 UNION SELECT k2 FROM tbl1
INTO OUTFILE "file:///path/to/result_"
FORMAT AS CSV
PROPERTIES(
    "column_separator" = ","
);
```

> Note:
Exporting to local files is not suitable for public cloud users and is intended for private deployment users only. By default, users have full control over cluster nodes. Doris does not check the validity of the export path provided by the user. If the Doris process user does not have write permissions for the path, or the path does not exist, an error will be reported. Additionally, for security reasons, if a file with the same name already exists at the path, the export will fail. Doris does not manage exported local files or check disk space. Users need to manage these files themselves, including cleanup and other tasks.

## Best Practices

### Generate Export Success Indicator File

The `SELECT INTO OUTFILE` command is synchronous, meaning that the task connection could be interrupted during SQL execution, leaving uncertainty about whether the export completed successfully or whether the data is complete. You can use the `success_file_name` parameter to generate an indicator file upon successful export.

Similar to Hive, users can determine whether the export completed successfully and whether the files in the export directory are complete by checking for the presence of the file specified by the `success_file_name` parameter.

For example, exporting the results of a `SELECT` statement to Tencent Cloud COS `s3://${bucket_name}/path/my_file_`, specifying the export format as CSV, and setting the success indicator file name to `SUCCESS`:

```sql
SELECT k1, k2, v1 FROM tbl1 LIMIT 100000
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

Upon completion, an additional file named `SUCCESS` will be generated.

### Concurrent Export

By default, the query results in the `SELECT` section are aggregated to a single BE node, which exports data single-threadedly. However, in some cases (e.g., queries without an `ORDER BY` clause), concurrent export can be enabled to have multiple BE nodes export data simultaneously, improving export performance.

Here’s an example demonstrating how to enable concurrent export:

1. Enable the concurrent export session variable:

```sql
mysql> SET enable_parallel_outfile = true;
```

2. Execute the export command:

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

With concurrent export successfully enabled, the result may consist of multiple rows, indicating that multiple threads exported data concurrently.

Adding an `ORDER BY` clause to the query prevents concurrent export, as the top-level sorting node necessitates single-threaded export:

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

Here, the result is a single row, indicating no concurrent export was triggered.

Refer to the appendix for more details on concurrent export principles.

### Clear Export Directory Before Exporting

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

If `"delete_existing_files" = "true"` is set, the export job will first delete all files and directories under `s3://my_bucket/export/`, then export data to that directory.

> Note:
To use the `delete_existing_files` parameter, add `enable_delete_existing_files = true` to `fe.conf` and restart FE. This parameter is potentially dangerous and should only be used in a testing environment.

### Set Export File Size

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

Specifying `"max_file_size" = "2048MB"` ensures that the final file size does not exceed 2GB. If the total size exceeds 2GB, multiple files will be generated.

## Considerations

- Export Data Volume and Efficiency
    The `SELECT INTO OUTFILE` function executes a SQL query. Without concurrent export, a single BE node and thread export the query results. The total export time includes both the query execution time and the result set write-out time. Enabling concurrent export can reduce the export time.
- Export Timeout
    The export command shares the same timeout as the query. If the data volume is large and causes the export to timeout, you can extend the query timeout by setting the session variable `query_timeout`.
- Export File Management
    Doris does not manage exported files, whether successfully exported or remaining from failed exports. Users must handle these files themselves.
    Additionally, `SELECT INTO OUTFILE` does not check for the existence of files or file paths. Whether `SELECT INTO OUTFILE` automatically creates paths or overwrites existing files depends entirely on the semantics of the remote storage system.
- Empty Result Sets
    Exporting an empty result set still generates an empty file.
- File Splitting
    File splitting ensures that a single row of data is stored completely in one file. Thus, the file size may not exactly equal `max_file_size`.
- Non-visible Character Functions
    For functions outputting non-visible characters (e.g., BITMAP, HLL types), CSV output is `\N`, and Parquet/ORC output is NULL.
    Currently, some geographic functions like `ST_Point` output VARCHAR but with encoded binary characters, causing garbled output. Use `ST_AsText` for geographic functions.

## Appendix

### Concurrent Export Principles

- Principle Overview

   Doris is a high-performance, real-time analytical database based on the MPP (Massively Parallel Processing) architecture. MPP divides large datasets into small chunks and processes them in parallel across multiple nodes.
   Concurrent export in `SELECT INTO OUTFILE` leverages this parallel processing capability, allowing multiple BE nodes to export parts of the result set simultaneously.

- How to Determine Concurrent Export Eligibility

    - Ensure Session Variable is Enabled: `set enable_parallel_outfile = true;`
    - Check Execution Plan with `EXPLAIN`:

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
    |  OUTPUT EXPRS:`k1`

    + `k2`                                                   |
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

    The `EXPLAIN` command returns the query plan. If `RESULT FILE SINK` appears in `PLAN FRAGMENT 1`, the query can be exported concurrently. If it appears in `PLAN FRAGMENT 0`, concurrent export is not possible.

- Export Concurrency
   
    When concurrent export conditions are met, the export task's concurrency is determined by: `BE nodes * parallel_fragment_exec_instance_num`.
