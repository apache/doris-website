---
{
    "title": "EXPORT | Load And Export",
    "language": "en",
    "description": "The EXPORT command is used to export data from a specified table to files at a specified location.",
    "sidebar_label": "EXPORT"
}
---

# EXPORT

## Description

The `EXPORT` command is used to export data from a specified table to files at a specified location. Currently supports exporting to remote storage such as HDFS, S3, BOS, COS (Tencent Cloud) through Broker processes, S3 protocol, or HDFS protocol.

`EXPORT` is an asynchronous operation. This command submits an `EXPORT JOB` to Doris and returns immediately upon successful submission. You can use the [SHOW EXPORT](./SHOW-EXPORT) command to check the progress after execution.

## Syntax:

  ```sql
  EXPORT TABLE <table_name>
  [ PARTITION ( <partation_name> [ , ... ] ) ]
  [ <where_clause> ]
  TO <export_path>
  [ <properties> ]
  WITH <target_storage>
  [ <broker_properties> ];
  ```

## Required Parameters  

**1. `<table_name>`**

  The name of the table to be exported. Supports exporting data from Doris local tables, views, and catalog external tables.

**2. `<export_path>`**

  The export file path. Can be a directory or a file directory with file prefix, such as `hdfs://path/to/my_file_`

## Optional Parameters  

**1. `<where_clause>`**

  You can specify filter conditions for the exported data.

**2. `<partation_name>`**

  You can export only certain specified partitions of the specified table. Only valid for Doris local tables.

**3. `<properties>`**

  Used to specify some export parameters.

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```

  The following parameters can be specified:  
  - `label`: Optional parameter to specify the Label for this Export task. When not specified, the system will randomly generate a Label.

  - `column_separator`: Specifies the column separator for export, default is `\t`, supports multi-byte. This parameter is only used for CSV file format.

  - `line_delimiter`: Specifies the line delimiter for export, default is `\n`, supports multi-byte. This parameter is only used for CSV file format.

  - `columns`: Specifies certain columns of the export table.

  - `format`: Specifies the file format for the export job, supports: parquet, orc, csv, csv_with_names, csv_with_names_and_types. Default is CSV format.

  - `max_file_size`: Single file size limit for export job. If the result exceeds this value, it will be split into multiple files. `max_file_size` value range is [5MB, 2GB], default is 1GB. (When specifying export to orc file format, the actual split file size will be a multiple of 64MB, e.g.: specifying max_file_size = 5MB will actually split at 64MB; specifying max_file_size = 65MB will actually split at 128MB)

  - `parallelism`: Concurrency of the export job, default is `1`. The export job will start `parallelism` number of threads to execute `select into outfile` statements. (If the number of Parallelism is greater than the number of Tablets in the table, the system will automatically set Parallelism to the size of the number of Tablets, i.e., each `select into outfile` statement is responsible for one Tablet)

  - `delete_existing_files`: Default is `false`. If specified as `true`, all files in the directory specified by `export_path` will be deleted first, then data will be exported to that directory. For example: "export_path" = "/user/tmp", will delete all files and directories under "/user/"; "file_path" = "/user/tmp/", will delete all files and directories under "/user/tmp/".

  - `with_bom`: Default is `false`. If specified as `true`, the exported file encoding will be UTF8 encoding with BOM (only effective for csv-related file formats).

  - `data_consistency`: Can be set to `none` / `partition`, default is `partition`. Indicates at what granularity to split the export table, `none` represents Tablets level, `partition` represents Partition level.

  - `timeout`: Timeout for export job, default is 2 hours, unit is seconds.

  - `compress_type`: (Supported since 2.1.5) When specifying the export file format as Parquet / ORC files, you can specify the compression method used by Parquet / ORC files. Parquet file format can specify compression methods as SNAPPY, GZIP, BROTLI, ZSTD, LZ4, and PLAIN, with default value SNAPPY. ORC file format can specify compression methods as PLAIN, SNAPPY, ZLIB, and ZSTD, with default value ZLIB. This parameter is supported starting from version 2.1.5. (PLAIN means no compression). Starting from version 3.1.1, supports specifying compression algorithms for CSV format, currently supports "plain", "gz", "bz2", "snappyblock", "lz4block", "zstd".

  :::caution Note  
  To use the delete_existing_files parameter, you also need to add the configuration `enable_delete_existing_files = true` in fe.conf and restart fe, then delete_existing_files will take effect. delete_existing_files = true is a dangerous operation, it's recommended to use only in test environments.  
  :::  

**4. `<target_storage>`**  
    Storage medium, optional BROKER, S3, HDFS.  

**5. `<broker_properties>`**  
    Different properties need to be specified according to different storage media of `<target_storage>`.  

- **BROKER**  
  Data can be written to remote storage through Broker processes. Here you need to define relevant connection information for Broker to use.  

  ```sql
  WITH BROKER "broker_name"
  ("<key>"="<value>" [,...])
  ```  

  **Broker related properties:**  
  - `username`: Username
  - `password`: Password
  - `hadoop.security.authentication`: Specify authentication method as kerberos
  - `kerberos_principal`: Specify kerberos principal
  - `kerberos_keytab`: Specify the path to kerberos keytab file. This file must be an absolute path to a file on the server where the Broker process is located and accessible by the Broker process  

- **HDFS**  

  Data can be written directly to remote HDFS.

  ```sql
  WITH HDFS ("<key>"="<value>" [,...])
  ```  

  **HDFS related properties:**  
  - `fs.defaultFS`: namenode address and port
  - `hadoop.username`: HDFS username
  - `dfs.nameservices`: name service name, consistent with hdfs-site.xml
  - `dfs.ha.namenodes.[nameservice ID]`: list of namenode ids, consistent with hdfs-site.xml
  - `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: rpc address of Name node, same number as namenode count, consistent with hdfs-site.xml   

  **For Hadoop clusters with kerberos authentication enabled, the following additional PROPERTIES attributes need to be set:**
  - `dfs.namenode.kerberos.principal`: Principal name of HDFS namenode service
  - `hadoop.security.authentication`: Set authentication method to kerberos
  - `hadoop.kerberos.principal`: Set the Kerberos principal used when Doris connects to HDFS
  - `hadoop.kerberos.keytab`: Set the local file path of keytab  

- **S3**  

  Data can be written directly to remote S3 object storage.

  ```sql
  WITH S3 ("<key>"="<value>" [,...])
  ```  

  **S3 related properties:**
  - `s3.endpoint`
  - `s3.region`
  - `s3.secret_key`
  - `s3.access_key`
  - `use_path_style`: (Optional) Default is `false`. S3 SDK uses Virtual-hosted Style by default. However, some object storage systems may not have enabled or support Virtual-hosted Style access. In this case, you can add the `use_path_style` parameter to force the use of Path Style access.

## Return Values

| Column Name         | Type   | Description                                                          |
|---------------------|--------|----------------------------------------------------------------------|
| jobId               | long   | Unique identifier of the export job.                                |
| label               | string | Label of the export job.                                             |
| dbId                | long   | Identifier of the database.                                          |
| tableId             | long   | Identifier of the table.                                             |
| state               | string | Current state of the job.                                            |
| path                | string | Path of the export files.                                            |
| partitions          | string | List of exported partition names, multiple partition names separated by commas. |
| progress            | int    | Current progress of the export job (percentage).                     |
| createTimeMs        | string | Millisecond value of job creation time, formatted as date time.      |
| exportStartTimeMs   | string | Millisecond value of export job start time, formatted as date time.  |
| exportFinishTimeMs  | string | Millisecond value of export job end time, formatted as date time.    |
| failMsg             | string | Error message when export job fails.                                 |


## Access Control

Users executing this SQL command must have at least the following permissions:

| Permission  | Object       | Description                           |
|:------------|:-------------|:--------------------------------------|
| SELECT_PRIV | Database     | Requires read permission on database and table. |


## Notes

### Concurrent Execution

An Export job can set the `parallelism` parameter to export data concurrently. The `parallelism` parameter actually specifies the number of threads executing the EXPORT job. When `"data_consistency" = "none"` is set, each thread will be responsible for exporting part of the table's Tablets.

The underlying execution logic of an Export job is actually `SELECT INTO OUTFILE` statements. Each thread set by the `parallelism` parameter will execute independent `SELECT INTO OUTFILE` statements.

The specific logic for splitting Export jobs into multiple `SELECT INTO OUTFILE` is: evenly distribute all tablets of the table to all parallel threads, for example:
- num(tablets) = 40, parallelism = 3, then these 3 threads are responsible for 14, 13, 13 tablets respectively.
- num(tablets) = 2, parallelism = 3, then Doris will automatically set parallelism to 2, with each thread responsible for one tablet.

When the tablets a thread is responsible for exceeds the `maximum_tablets_of_outfile_in_export` value (default is 10, can be modified by adding `maximum_tablets_of_outfile_in_export` parameter in fe.conf), that thread will be split into multiple `SELECT INTO OUTFILE` statements, for example:
- A thread is responsible for 14 tablets, `maximum_tablets_of_outfile_in_export = 10`, then this thread is responsible for two `SELECT INTO OUTFILE` statements. The first `SELECT INTO OUTFILE` statement exports 10 tablets, the second `SELECT INTO OUTFILE` statement exports 4 tablets. The two `SELECT INTO OUTFILE` statements are executed serially by this thread.

When the amount of data to be exported is very large, you can consider appropriately increasing the `parallelism` parameter to increase concurrent export. If machine cores are tight and cannot increase `parallelism` while the export table has many Tablets, you can consider increasing `maximum_tablets_of_outfile_in_export` to increase the number of tablets a `SELECT INTO OUTFILE` statement is responsible for, which can also speed up export.

If you want to export Table at Partition granularity, you can set Export property `"data_consistency" = "partition"`. In this case, concurrent threads of Export tasks will be divided into multiple Outfile statements at Partition granularity. Different Outfile statements export different Partitions, while data exported by the same Outfile statement must belong to the same Partition. For example: after setting `"data_consistency" = "partition"`

- num(partition) = 40, parallelism = 3, then these 3 threads are responsible for 14, 13, 13 Partitions respectively.
- num(partition) = 2, parallelism = 3, then Doris will automatically set Parallelism to 2, with each thread responsible for one Partition.


### Memory Limits

Usually an Export job's query plan only has `scan-export` two parts, not involving computation logic that requires too much memory. So usually the default memory limit of 2GB can meet the requirements.

But in some scenarios, such as when a query plan needs to scan too many Tablets on the same BE, or when Tablet data versions are too many, it may cause insufficient memory. You can adjust the Session variable `exec_mem_limit` to increase the memory usage limit.

### Other Matters

- It's not recommended to export large amounts of data at once. The recommended maximum export data volume for one Export job is tens of GB. Too large exports will cause more garbage files and higher retry costs. If table data volume is too large, it's recommended to export by partition.

- If Export job fails, already generated files will not be deleted and need to be manually deleted by users.

- Export jobs will scan data and occupy IO resources, which may affect system query latency.

- Currently during Export, only simple checks are performed on whether Tablets versions are consistent. It's recommended not to perform data import operations on the table during Export execution.

- An Export Job allows exporting a maximum of 2000 partitions. You can add parameter `maximum_number_of_export_partitions` in `fe.conf` and restart FE to modify this setting.


## Examples

### Export Data to Local
> To export data to local file system, you need to add `enable_outfile_to_local=true` in `fe.conf` and restart FE.

- Export all data in Test table to local storage, default export CSV format files
```sql
EXPORT TABLE test TO "file:///home/user/tmp/";
```

- Export k1,k2 columns in Test table to local storage, default export CSV file format, and set Label
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "label" = "label1",
  "columns" = "k1,k2"
);
```

- Export rows where `k1 < 50` in Test table to local storage, default export CSV format files, and use `,` as column separator
```sql
EXPORT TABLE test WHERE k1 < 50 TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "column_separator"=","
);
```

- Export partitions p1,p2 in Test table to local storage, default export csv format files
```sql
EXPORT TABLE test PARTITION (p1,p2) TO "file:///home/user/tmp/" 
PROPERTIES ("columns" = "k1,k2");
```

- Export all data in Test table to local storage, export other format files
```sql
-- parquet
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "parquet"
);

-- orc
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "orc"
);

-- csv(csv_with_names) , Use 'AA' as the column separator and 'zz' as the row separator
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names",
  "column_separator"="AA",
  "line_delimiter" = "zz"
);

-- csv(csv_with_names_and_types) 
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names_and_types"
);
```

- Set `max_file_sizes` property  
   When exported file is larger than 5MB, data will be split into multiple files, each file maximum 5MB.

```sql
-- When the exported file is larger than 5MB, the data will be split into multiple files, with each file having a maximum size of 5MB.
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB"
);
```

- Set `parallelism` property
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "parallelism" = "5"
);
```

- Set `delete_existing_files` property  
    When Export exports data, it will first delete all files and directories under `/home/user/` directory, then export data to this directory.

```sql
-- When exporting data, all files and directories under the `/home/user/` directory will be deleted first, and then the data will be exported to this directory.
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "delete_existing_files" = "true"
);
```

### Export to S3  

- Export all data in s3_test table to S3, using invisible character `\x07` as column or row separator. If you need to export data to minio, you also need to specify `use_path_style`=`true`.

```sql
EXPORT TABLE s3_test TO "s3://bucket/a/b/c" 
PROPERTIES (
  "column_separator"="\\x07", 
  "line_delimiter" = "\\x07"
) WITH S3 (
  "s3.endpoint" = "xxxxx",
  "s3.region" = "xxxxx",
  "s3.access_key" = "xxxxx",
  "s3.secret_key"="xxxx"
  
)
```

### Export to HDFS

- Export all data in Test table to HDFS, export file format is Parquet, export job single file size limit is 512MB, keep all files in the specified directory.

```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c/" 
PROPERTIES(
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "false"
)
with HDFS (
"fs.defaultFS"="hdfs://hdfs_host:port",
"hadoop.username" = "hadoop"
);
```

### Export through Broker Node  
Need to start Broker process first and add this Broker in FE.
- Export all data in Test table to HDFS
```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c" 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

- Export partitions p1,p2 in testTbl table to HDFS, using "," as column separator, and specify Label

```sql
EXPORT TABLE testTbl PARTITION (p1,p2) TO "hdfs://hdfs_host:port/a/b/c" 
PROPERTIES (
  "label" = "mylabel",
  "column_separator"=","
) 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

- Export all data in testTbl table to HDFS, using invisible character `\x07` as column or row separator.

```sql
EXPORT TABLE testTbl TO "hdfs://hdfs_host:port/a/b/c" 
PROPERTIES (
  "column_separator"="\\x07", 
  "line_delimiter" = "\\x07"
) 
WITH BROKER "broker_name" 
(
  "username"="xxx", 
  "password"="yyy"
)
```
