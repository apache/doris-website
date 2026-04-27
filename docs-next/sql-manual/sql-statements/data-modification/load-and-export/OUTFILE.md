---
{
    "title": "OUTFILE",
    "language": "en",
    "description": "The SELECT INTO OUTFILE command is used to export query results to files. Currently supports exporting to remote storage such as HDFS, S3, BOS,"
}
---

## Description

The `SELECT INTO OUTFILE` command is used to export query results to files. Currently supports exporting to remote storage such as HDFS, S3, BOS, COS (Tencent Cloud) through Broker process, S3 protocol or HDFS protocol.

## Syntax:

```sql
<query_stmt>
INTO OUTFILE "<file_path>"
[ FORMAT AS <format_as> ]
[ <properties> ]
```

## Required Parameters

**1. `<query_stmt>`**   

Query statement, must be a valid SQL, refer to [query statement documentation](../../data-query/SELECT.md).  

**2. `<file_path>`**

File storage path and file prefix. Points to the file storage path and file prefix. For example `hdfs://path/to/my_file_`.  
The final filename will consist of `my_file_`, file sequence number, and file format suffix. The file sequence number starts from 0, and the quantity is the number of files split. For example:  
- my_file_abcdefg_0.csv
- my_file_abcdefg_1.csv
- my_file_abcdegf_2.csv  

You can also omit the file prefix and only specify the file directory, such as `hdfs://path/to/`

## Optional Parameters

**1. `<format_as>`**

   Specify export format. Currently supports the following formats:  
   - `CSV` (default)
   - `PARQUET`
   - `CSV_WITH_NAMES`
   - `CSV_WITH_NAMES_AND_TYPES`
   - `ORC`

   >   Note: PARQUET, CSV_WITH_NAMES, CSV_WITH_NAMES_AND_TYPES, ORC are supported starting from version 1.2.

**2. `<properties>`**  

```sql
[ PROPERTIES ("<key>"="<value>" [, ... ]) ]
```  

Currently supports export through Broker process, or through S3/HDFS protocol.

**Properties related to export file itself**
- `column_separator`: Column separator, only used for CSV related formats. Starting from version 1.2, supports multi-byte separators, such as: "\\x01", "abc".
- `line_delimiter`: Line delimiter, only used for CSV related formats. Starting from version 1.2, supports multi-byte separators, such as: "\\x01", "abc".
- `max_file_size`: Single file size limit, if the result exceeds this value, it will be split into multiple files, `max_file_size` value range is [5MB, 2GB], default is `1GB`. (When specifying export as ORC file format, the actual split file size will be a multiple of 64MB, for example: if `max_file_size = 5MB` is specified, it will actually be split by 64 MB; if `max_file_size = 65MB` is specified, it will actually be split by 128 MB)
- `delete_existing_files`: Default is `false`, if specified as `true`, it will first delete all files under the directory specified by `file_path`, then export data to that directory. For example: "file_path" = "/user/tmp", will delete all files and directories under "/user/"; "file_path" = "/user/tmp/", will delete all files and directories under "/user/tmp/".
- `file_suffix`: Specify the suffix of the exported file, if this parameter is not specified, the default suffix of the file format will be used.
- `compress_type`: When specifying the exported file format as Parquet / ORC file, you can specify the compression method used by Parquet / ORC file. Parquet file format can specify compression methods as SNAPPY, GZIP, BROTLI, ZSTD, LZ4 and PLAIN, default value is SNAPPY. ORC file format can specify compression methods as PLAIN, SNAPPY, ZLIB and ZSTD, default value is ZLIB. This parameter is supported starting from version 2.1.5. (PLAIN means no compression). Starting from version 3.1.1, supports specifying compression algorithms for CSV format, currently supports "plain", "gz", "bz2", "snappyblock", "lz4block", "zstd".

**Broker related properties**  _(need to add prefix `broker.`)_  
- `broker.name: broker`: name
- `broker.hadoop.security.authentication`: Specify authentication method as kerberos
- `broker.kerberos_principal`: Specify kerberos principal
- `broker.kerberos_keytab`: Specify kerberos keytab file path. This file must be an absolute path of a file on the server where the Broker process is located. And it can be accessed by the Broker process

**HDFS related properties**
- `fs.defaultFS`: namenode address and port
- `hadoop.username`: hdfs username
- `dfs.nameservices`: name service name, consistent with hdfs-site.xml
- `dfs.ha.namenodes.[nameservice ID]`: namenode id list, consistent with hdfs-site.xml
- `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: Name node rpc address, same number as namenode count, consistent with hdfs-site.xml
- `dfs.client.failover.proxy.provider.[nameservice ID]`: Java class for HDFS client to connect to active namenode, usually "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"

**For Hadoop clusters with kerberos authentication enabled, additional PROPERTIES attributes need to be set:**
- `dfs.namenode.kerberos.principal`: Principal name of HDFS namenode service
- `hadoop.security.authentication`: Set authentication method to kerberos
- `hadoop.kerberos.principal`: Set the Kerberos principal used when Doris connects to HDFS
- `hadoop.kerberos.keytab`: Set keytab local file path

For S3 protocol, directly configure S3 protocol settings:
 - `s3.endpoint`
 - `s3.access_key`
 - `s3.secret_key`
 - `s3.region`
 - `use_path_style`: (Optional) Default is `false`. S3 SDK uses Virtual-hosted Style by default. But some object storage systems may not have enabled or support Virtual-hosted Style access, in this case you can add the `use_path_style` parameter to force the use of Path Style access.

> Note: To use the `delete_existing_files` parameter, you also need to add the configuration `enable_delete_existing_files = true` in `fe.conf` and restart fe, then delete_existing_files will take effect. delete_existing_files = true is a dangerous operation, it is recommended to use only in test environments.

## Return Value

The result returned by the Outfile statement, the meaning of each column is as follows:

| Column Name | Type     | Description                                     |
|-------------|----------|-------------------------------------------------|
| FileNumber  | int      | Number of files finally generated               |
| TotalRows   | int      | Number of rows in result set                    |
| FileSize    | int      | Total size of exported files. Unit: bytes.     |
| URL         | string   | Prefix of exported file path, multiple files will be numbered with suffixes `_0`,`_1` sequentially. |

## Permission Control

Users executing this SQL command must have at least the following permissions:

| Permission  | Object        | Description                    |
|:------------|:-------------|:-------------------------------|
| SELECT_PRIV | Database     | Requires read permissions on database and table. |

## Notes

### Data Type Mapping

- All file types support exporting basic data types, while for complex data types (ARRAY/MAP/STRUCT), currently only `csv`, `orc`, `csv_with_names` and `csv_with_names_and_types` support exporting complex types, and nested complex types are not supported.

- Parquet and ORC file formats have their own data types, Doris's export function can automatically export Doris data types to corresponding data types in Parquet/ORC file formats. The following are the data type mapping tables between Apache Doris data types and Parquet/ORC file formats:

1. **Doris to ORC file format data type mapping table:**
   | Doris Type              | Orc Type  |
   |-------------------------|-----------|
   | boolean                 | boolean   |
   | tinyint                 | tinyint   |
   | smallint                | smallint  |
   | int                     | int       |
   | bigint                  | bigint    |
   | largeInt                | string    |
   | date                    | string    |
   | datev2                  | string    |
   | datetime                | string    |
   | datetimev2              | timestamp |
   | float                   | float     |
   | double                  | double    |
   | char / varchar / string | string    |
   | decimal                 | decimal   |
   | struct                  | struct    |
   | map                     | map       |
   | array                   | array     |

2. **Doris to Parquet file format data type mapping table:**

   When Doris exports to Parquet file format, it first converts Doris memory data to Arrow memory data format, then Arrow writes to Parquet file format. The mapping relationship between Doris data types and Arrow data types is:
   | Doris Type              | Arrow Type |
   |-------------------------|------------|
   | boolean                 | boolean    |
   | tinyint                 | int8       |
   | smallint                | int16      |
   | int                     | int32      |
   | bigint                  | int64      |
   | largeInt                | utf8       |
   | date                    | utf8       |
   | datev2                  | utf8       |
   | datetime                | utf8       |
   | datetimev2              | utf8       |
   | float                   | float32    |
   | double                  | float64    |
   | char / varchar / string | utf8       |
   | decimal                 | decimal128 |
   | struct                  | struct     |
   | map                     | map        |
   | array                   | list       |

### Export Data Volume and Export Efficiency

   This function essentially executes a SQL query command. The final result is output in a single thread. So the total export time includes the query execution time and the final result set write time. If the query is large, you need to set the session variable `query_timeout` to appropriately extend the query timeout.

### Exported File Management

   Doris does not manage exported files. Including successfully exported files or residual files after export failure, all need to be handled by users themselves.

### Export to Local Files
   To export to local files, you need to first configure `enable_outfile_to_local=true` in `fe.conf`  
   ```sql
   select * from tbl1 limit 10 
   INTO OUTFILE "file:///home/work/path/result_";
   ```

   The function of exporting to local files is not suitable for public cloud users, only for users with private deployment. And it defaults that users have complete control over cluster nodes. Doris does not perform validity checks on the export path filled by users. If the Doris process user does not have write permission to the path, or the path does not exist, an error will be reported. Also for security considerations, if a file with the same name already exists at the path, the export will also fail.

   Doris does not manage files exported locally, nor does it check disk space, etc. These files need to be managed by users themselves, such as cleanup.

### Result Integrity Guarantee

   This command is a synchronous command, so it's possible that the task connection is disconnected during execution, making it impossible to know whether the exported data ended normally or is complete. In this case, you can use the `success_file_name` parameter to require the task to generate a success file identifier in the directory after successful completion. Users can use this file to determine whether the export ended normally.

### Concurrent Export

   Set Session variable `set enable_parallel_outfile = true;` to enable Outfile concurrent export.

## Examples

- Export using Broker method, export simple query results to file `hdfs://path/to/result.txt`. Specify export format as CSV. Use `my_broker` and set kerberos authentication information. Specify column separator as `,`, line delimiter as `\n`.

    ```sql
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.hadoop.security.authentication" = "kerberos",
        "broker.kerberos_principal" = "doris@YOUR.COM",
        "broker.kerberos_keytab" = "/home/doris/my.keytab",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "100MB"
    );
    ```

   The final generated file will be: `result_0.csv` if not larger than 100MB.
   If larger than 100MB, it may be `result_0.csv, result_1.csv, ...`.

- Export simple query results to file `hdfs://path/to/result.parquet`. Specify export format as PARQUET. Use `my_broker` and set kerberos authentication information.

    ```sql
    SELECT c1, c2, c3 FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS PARQUET
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.hadoop.security.authentication" = "kerberos",
        "broker.kerberos_principal" = "doris@YOUR.COM",
        "broker.kerberos_keytab" = "/home/doris/my.keytab"
    );
    ```

- Export CTE statement query results to file `hdfs://path/to/result.txt`. Default export format is CSV. Use `my_broker` and set HDFS high availability information. Use default row and column separators.

    ```sql
    WITH
    x1 AS
    (SELECT k1, k2 FROM tbl1),
    x2 AS
    (SELECT k3 FROM tbl2)
    SELEC k1 FROM x1 UNION SELECT k3 FROM x2
    INTO OUTFILE "hdfs://path/to/result_"
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.username"="user",
        "broker.password"="passwd",
        "broker.dfs.nameservices" = "my_ha",
        "broker.dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "broker.dfs.client.failover.proxy.provider" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
    ```

   The final generated file will be: `result_0.csv` if not larger than 1GB.
   If larger than 1GB, it may be `result_0.csv, result_1.csv, ...`.

- Export UNION statement query results to file `bos://bucket/result.txt`. Specify export format as PARQUET. Use `my_broker` and set HDFS high availability information. PARQUET format does not need to specify column separator.
   After export completion, generate an identifier file.

    ```sql
    SELECT k1 FROM tbl1 UNION SELECT k2 FROM tbl1
    INTO OUTFILE "bos://bucket/result_"
    FORMAT AS PARQUET
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.bos_endpoint" = "http://bj.bcebos.com",
        "broker.bos_accesskey" = "xxxxxxxxxxxxxxxxxxxxxxxxxx",
        "broker.bos_secret_accesskey" = "yyyyyyyyyyyyyyyyyyyyyyyyyy"
    );
    ```

- Export Select statement query results to file `s3a://${bucket_name}/path/result.txt`. Specify export format as CSV.
   After export completion, generate an identifier file.

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "s3a://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "hdfs_broker",
        "broker.fs.s3a.access.key" = "xxx",
        "broker.fs.s3a.secret.key" = "xxxx",
        "broker.fs.s3a.endpoint" = "https://cos.xxxxxx.myqcloud.com/",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```

   The final generated file will be: `my_file_0.csv` if not larger than 1GB.
   If larger than 1GB, it may be `my_file_0.csv, result_1.csv, ...`.
   Verification on cos:

        1. Non-existing paths will be automatically created
        2. access.key/secret.key/endpoint need to be confirmed with cos colleagues. Especially the endpoint value, no need to fill in bucket_name.

- Export to bos using S3 protocol, with concurrent export enabled.

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```

   The final generated file prefix will be `my_file_{fragment_instance_id}_`.

- Export to bos using S3 protocol, with concurrent export Session variable enabled.
   Note: But because the query statement has a top-level sort node, this query cannot use concurrent export even if the concurrent export Session variable is enabled.

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 order by k1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```

- Export using HDFS method, export simple query results to file `hdfs://${host}:${fileSystem_port}/path/to/result.txt`. Specify export format as CSV, username as work. Specify column separator as `,`, line delimiter as `\n`.

    ```sql
    -- fileSystem_port default value is 9000
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://${host}:${fileSystem_port}/path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
        "fs.defaultFS" = "hdfs://ip:port",
        "hadoop.username" = "work"
    );
    ```

   If Hadoop cluster has high availability enabled and uses Kerberos authentication, you can refer to the following SQL statement:

    ```sql
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
    'fs.defaultFS'='hdfs://hacluster/',
    'dfs.nameservices'='hacluster',
    'dfs.ha.namenodes.hacluster'='n1,n2',
    'dfs.namenode.rpc-address.hacluster.n1'='192.168.0.1:8020',
    'dfs.namenode.rpc-address.hacluster.n2'='192.168.0.2:8020',
    'dfs.client.failover.proxy.provider.hacluster'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'dfs.namenode.kerberos.principal'='hadoop/_HOST@REALM.COM'
    'hadoop.security.authentication'='kerberos',
    'hadoop.kerberos.principal'='doris_test@REALM.COM',
    'hadoop.kerberos.keytab'='/path/to/doris_test.keytab'
    );
    ```

   The final generated file will be: `result_0.csv` if not larger than 100 MB.
   If larger than 100 MB, it may be `result_0.csv, result_1.csv, ...`.

- Export Select statement query results to Tencent Cloud cos file `cosn://${bucket_name}/path/result.txt`. Specify export format as CSV.
   After export completion, generate an identifier file.

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "cosn://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "broker_name",
        "broker.fs.cosn.userinfo.secretId" = "xxx",
        "broker.fs.cosn.userinfo.secretKey" = "xxxx",
        "broker.fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxx.myqcloud.com",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```