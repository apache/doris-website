---
{
    "title": "EXPORT",
    "language": "zh-CN"
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

## EXPORT

### Name

EXPORT

### Description

该语句用于将指定表的数据导出到指定位置。

这是一个异步操作，任务提交成功则返回。执行后可使用 [SHOW EXPORT](../../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT) 命令查看进度。

```sql
EXPORT TABLE table_name
[PARTITION (p1[,p2])]
TO export_path
[opt_properties]
WITH BROKER
[broker_properties];
```

说明：

- `table_name`

  当前要导出的表的表名。仅支持 Doris 本地表数据的导出。

- `partition`

  可以只导出指定表的某些指定分区

- `export_path`

  导出的路径，需为目录。

- `opt_properties`

  用于指定一些导出参数。

  ```sql
  [PROPERTIES ("key"="value", ...)]
  ```

  可以指定如下参数：

  - `column_separator`：指定导出的列分隔符，默认为\t。仅支持单字节。
  - `line_delimiter`：指定导出的行分隔符，默认为\n。仅支持单字节。
  - `exec_mem_limit`：导出在单个 BE 节点的内存使用上限，默认为 2GB，单位为字节。
  - `timeout`：导出作业的超时时间，默认为 2 小时，单位是秒。
  - `tablet_num_per_task`：每个子任务能分配扫描的最大 Tablet 数量。
  - `format`:指定导出的格式，当前只支持 csv、csv_with_names、csv_with_names_and_types。在不指定的情况下，默认为 csv。

- `WITH BROKER`

  导出功能需要通过 Broker 进程写数据到远端存储上。这里需要定义相关的连接信息供 Broker 使用。

  ```sql
  WITH BROKER hdfs|s3 ("key"="value"[,...])
  ```

​       1. 如果导出是到 Amazon S3，需要提供一下属性

```
fs.s3a.access.key：AmazonS3的access key
fs.s3a.secret.key：AmazonS3的secret key
fs.s3a.endpoint：AmazonS3的endpoint
```
​       2. 如果使用 S3 协议直接连接远程存储时需要指定如下属性

    (
        "AWS_ENDPOINT" = "",
        "AWS_ACCESS_KEY" = "",
        "AWS_SECRET_KEY"="",
        "AWS_REGION" = ""
    )

### Example

1. 将 test 表中的所有数据导出到 hdfs 上

```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c" 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

2. 将 testTbl 表中的分区 p1,p2 导出到 hdfs 上

```sql
EXPORT TABLE testTbl PARTITION (p1,p2) TO "hdfs://hdfs_host:port/a/b/c" 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

3. 将 testTbl 表中的所有数据导出到 hdfs 上，以","作为列分隔符，并指定 label

```sql
EXPORT TABLE testTbl TO "hdfs://hdfs_host:port/a/b/c" 
PROPERTIES ("label" = "mylabel", "column_separator"=",") 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

4. 将 testTbl 表中 k1 = 1 的行导出到 hdfs 上。

```sql
EXPORT TABLE testTbl WHERE k1=1 TO "hdfs://hdfs_host:port/a/b/c" 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

5. 将 testTbl 表中的所有数据导出到本地。

```sql
EXPORT TABLE testTbl TO "file:///home/data/a";
```

6. 将 testTbl 表中的所有数据导出到 hdfs 上，以不可见字符 "\x07" 作为列或者行分隔符。

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

7. 将 testTbl 表的 k1, v1 列导出到本地。

```sql
EXPORT TABLE testTbl TO "file:///home/data/a" PROPERTIES ("columns" = "k1,v1");
```

8. 将 testTbl 表中的所有数据导出到 s3 上，以不可见字符 "\x07" 作为列或者行分隔符。

```sql
EXPORT TABLE testTbl TO "s3://hdfs_host:port/a/b/c" 
PROPERTIES (
  "column_separator"="\\x07", 
  "line_delimiter" = "\\x07"
) WITH s3 (
  "AWS_ENDPOINT" = "xxxxx",
  "AWS_ACCESS_KEY" = "xxxxx",
  "AWS_SECRET_KEY"="xxxx",
  "AWS_REGION" = "xxxxx"
)
```

9. 将 testTbl 表中的所有数据导出到 cos(腾讯云) 上。

```sql
EXPORT TABLE testTbl TO "cosn://my_bucket/export/a/b/c"
PROPERTIES (
  "column_separator"=",",
  "line_delimiter" = "\n"
) WITH BROKER "broker_name"
(
  "fs.cosn.userinfo.secretId" = "xxx",
  "fs.cosn.userinfo.secretKey" = "xxxx",
  "fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxxxxx.myqcloud.com"
)
```

### Keywords

    EXPORT

### Best Practice

#### 子任务的拆分

一个 Export 作业会拆分成多个子任务（执行计划）去执行。有多少查询计划需要执行，取决于总共有多少 Tablet，以及一个查询计划最多可以分配多少个 Tablet。

因为多个查询计划是串行执行的，所以如果让一个查询计划处理更多的分片，则可以减少作业的执行时间。

但如果查询计划出错（比如调用 Broker 的 RPC 失败，远端存储出现抖动等），过多的 Tablet 会导致一个查询计划的重试成本变高。

所以需要合理安排查询计划的个数以及每个查询计划所需要扫描的分片数，在执行时间和执行成功率之间做出平衡。

一般建议一个查询计划扫描的数据量在 3-5 GB 内。

#### 内存限制

通常一个 Export 作业的查询计划只有 `扫描-导出` 两部分，不涉及需要太多内存的计算逻辑。所以通常 2GB 的默认内存限制可以满足需求。

但在某些场景下，比如一个查询计划，在同一个 BE 上需要扫描的 Tablet 过多，或者 Tablet 的数据版本过多时，可能会导致内存不足。此时需要通过这个 `exec_mem_limit` 参数设置更大的内存，比如 4GB、8GB 等。

#### 注意事项

- 不建议一次性导出大量数据。一个 Export 作业建议的导出数据量最大在几十 GB。过大的导出会导致更多的垃圾文件和更高的重试成本。如果表数据量过大，建议按照分区导出。
- 如果 Export 作业运行失败，在远端存储中产生的 `__doris_export_tmp_xxx` 临时目录，以及已经生成的文件不会被删除，需要用户手动删除。
- 如果 Export 作业运行成功，在远端存储中产生的 `__doris_export_tmp_xxx` 目录，根据远端存储的文件系统语义，可能会保留，也可能会被清除。比如在 S3 对象存储中，通过 rename 操作将一个目录中的最后一个文件移走后，该目录也会被删除。如果该目录没有被清除，用户可以手动清除。
- Export 作业只会导出 Base 表的数据，不会导出物化视图的数据。
- Export 作业会扫描数据，占用 IO 资源，可能会影响系统的查询延迟。
- 一个集群内同时运行的 Export 作业最大个数为 5。之后提交的作业将会排队。
```

When the exported file size is larger than 5MB, the data will be split into multiple files, with each file containing a maximum of 5MB.

7. set parallelism
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "parallelism" = "5"
);
```

8. set delete_existing_files

```sql
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "delete_existing_files" = "true"
)
```

Before exporting data, all files and directories in the `/home/user/` directory will be deleted, and then the data will be exported to that directory.

#### export with S3

1. Export all data from the `testTbl` table to S3 using invisible character '\x07' as a delimiter for columns and rows.If you want to export data to minio, you also need to specify use_path_style=true.

  ```sql
  EXPORT TABLE testTbl TO "s3://bucket/a/b/c" 
  PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
  ) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
  )
  ```

2. Export all data in the test table to HDFS in the format of parquet, limit the size of a single file to 1024MB, and reserve all files in the specified directory.

#### export with HDFS
1. Export all data from the `test` table to HDFS in `Parquet` format, with a limit of 512MB for the size of a single file in the export job, and retain all files under the specified directory.

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

#### export with Broker
You need to first start the broker process and add it to the FE before proceeding.
1. Export the `test` table to hdfs

  ```sql
  EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c" 
  WITH BROKER "broker_name" 
  (
    "username"="xxx",
    "password"="yyy"
  );
  ```

2. Export partitions 'p1' and 'p2' from the 'testTbl' table to HDFS using ',' as the column delimiter and specifying a label.

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

3. Export all data from the 'testTbl' table to HDFS using the non-visible character '\x07' as the column and row delimiter.

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

### Keywords

    EXPORT

### Best Practice

  #### Concurrent Export

  An Export job can be configured with the `parallelism` parameter to concurrently export data. The `parallelism` parameter specifies the number of threads to execute the `EXPORT Job`. Each thread is responsible for exporting a subset of the total tablets.

  The underlying execution logic of an `Export Job `is actually the `SELECT INTO OUTFILE` statement. Each thread specified by the `parallelism` parameter executes independent `SELECT INTO OUTFILE` statements.

  The specific logic for splitting an `Export Job` into multiple `SELECT INTO OUTFILE` is, to evenly distribute all the tablets of the table among all parallel threads. For example:

  - If num(tablets) = 40 and parallelism = 3, then the three threads will be responsible for 14, 13, and 13 tablets, respectively.
  - If num(tablets) = 2 and parallelism = 3, then Doris automatically sets the parallelism to 2, and each thread is responsible for one tablet.

  When the number of tablets responsible for a thread exceeds the `maximum_tablets_of_outfile_in_export` value (default is 10, and can be modified by adding the `maximum_tablets_of_outfile_in_export` parameter in fe.conf), the thread will split the tablets which are responsibled for this thread into multiple `SELECT INTO OUTFILE` statements. For example:

  - If a thread is responsible for 14 tablets and `maximum_tablets_of_outfile_in_export = 10`, then the thread will be responsible for two `SELECT INTO OUTFILE` statements. The first `SELECT INTO OUTFILE` statement exports 10 tablets, and the second `SELECT INTO OUTFILE` statement exports 4 tablets. The two `SELECT INTO OUTFILE` statements are executed serially by this thread.

  #### memory limit

  The query plan for an `Export Job` typically involves only `scanning and exporting`, and does not involve compute logic that requires a lot of memory. Therefore, the default memory limit of 2GB is usually sufficient to meet the requirements.

  However, in certain scenarios, such as a query plan that requires scanning too many tablets on the same BE, or when there are too many data versions of tablets, it may result in insufficient memory. In these cases, you can adjust the session variable `exec_mem_limit` to increase the memory usage limit.

  #### Precautions

  - Exporting a large amount of data at one time is not recommended. The maximum recommended export data volume for an Export job is several tens of GB. An overly large export results in more junk files and higher retry costs. If the amount of table data is too large, it is recommended to export by partition.

  - If the Export job fails, the generated files will not be deleted, and the user needs to delete it manually.

  - The Export job only exports the data of the Base table / View / External table, not the data of the materialized view.

  - The export job scans data and occupies IO resources, which may affect the query latency of the system.

  - Currently, The `Export Job` is simply check whether the `Tablets version` is the same, it is recommended not to import data during the execution of the `Export Job`.

  - The maximum number of partitions that an `Export job` allows is 2000. You can add a parameter to the fe.conf `maximum_number_of_export_partitions` and restart FE to modify the setting.
