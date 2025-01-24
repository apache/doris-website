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





## 描述

 `EXPORT` 命令用于将指定表的数据导出为文件到指定位置。目前支持通过 Broker 进程，S3 协议或 HDFS 协议，导出到远端存储，如 HDFS，S3，BOS，COS（腾讯云）上。

`EXPORT`是一个异步操作，该命令会提交一个`EXPORT JOB`到 Doris，任务提交成功立即返回。执行后可使用 [SHOW EXPORT](../../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT) 命令查看进度。

语法：

  ```sql
  EXPORT TABLE table_name
  [PARTITION (p1[,p2])]
  [WHERE]
  TO export_path
  [opt_properties]
  WITH BROKER/S3/HDFS
  [broker_properties];
  ```



**说明**：

- `table_name`

  当前要导出的表的表名。支持 Doris 本地表、视图 View、Catalog 外表数据的导出。

- `partition`

  可以只导出指定表的某些指定分区，只对 Doris 本地表有效。

- `export_path`

  导出的文件路径。可以是目录，也可以是文件目录加文件前缀，如`hdfs://path/to/my_file_`

- `opt_properties`

  用于指定一些导出参数。

  ```sql
  [PROPERTIES ("key"="value", ...)]
  ```

  可以指定如下参数：

  - `label`: 可选参数，指定此次 Export 任务的 Label，当不指定时系统会随机生成一个 Label。

  - `column_separator`：指定导出的列分隔符，默认为 `\t`，支持多字节。该参数只用于 CSV 文件格式。

  - `line_delimiter`：指定导出的行分隔符，默认为 `\n`，支持多字节。该参数只用于 CSV 文件格式。

  - `columns`：指定导出表的某些列。

  - `format`：指定导出作业的文件格式，支持：parquet, orc, csv, csv_with_names、csv_with_names_and_types。默认为 CSV 格式。

  - `max_file_size`：导出作业单个文件大小限制，如果结果超过这个值，将切割成多个文件。`max_file_size`取值范围是[5MB, 2GB], 默认为 1GB。（当指定导出为 orc 文件格式时，实际切分文件的大小将是 64MB 的倍数，如：指定 max_file_size = 5MB, 实际将以 64MB 为切分；指定 max_file_size = 65MB, 实际将以 128MB 为切分）

  - `parallelism`：导出作业的并发度，默认为`1`，导出作业会开启`parallelism`个数的线程去执行`select into outfile`语句。（如果 Parallelism 个数大于表的 Tablets 个数，系统将自动把 Parallelism 设置为 Tablets 个数大小，即每一个`select into outfile`语句负责一个 Tablets）

  - `delete_existing_files`: 默认为 `false`，若指定为 `true`，则会先删除`export_path`所指定目录下的所有文件，然后导出数据到该目录下。例如："export_path" = "/user/tmp", 则会删除"/user/"下所有文件及目录；"file_path" = "/user/tmp/", 则会删除"/user/tmp/"下所有文件及目录。

  - `with_bom`: 默认为 `false`，若指定为 `true`，则导出的文件编码为带有 BOM 的 UTF8 编码（只对 csv 相关的文件格式生效）。

  - `data_consistency`: 可以设置为 `none` / `partition` ，默认为 `partition` 。指示以何种粒度切分导出表，`none` 代表 Tablets 级别，`partition`代表 Partition 级别。

  - `timeout`：导出作业的超时时间，默认为 2 小时，单位是秒。

  - `compress_type`：(自 2.1.5 支持) 当指定导出的文件格式为 Parquet / ORC 文件时，可以指定 Parquet / ORC 文件使用的压缩方式。Parquet 文件格式可指定压缩方式为 SNAPPY，GZIP，BROTLI，ZSTD，LZ4 及 PLAIN，默认值为 SNAPPY。ORC 文件格式可指定压缩方式为 PLAIN，SNAPPY，ZLIB 以及 ZSTD，默认值为 ZLIB。该参数自 2.1.5 版本开始支持。（PLAIN 就是不采用压缩）

  :::caution 注意
  要使用 delete_existing_files 参数，还需要在 fe.conf 中添加配置`enable_delete_existing_files = true`并重启 fe，此时 delete_existing_files 才会生效。delete_existing_files = true 是一个危险的操作，建议只在测试环境中使用。
  :::



- `WITH BROKER`

  可以通过 Broker 进程写数据到远端存储上。这里需要定义相关的连接信息供 Broker 使用。

  ```sql
  语法：
  WITH BROKER "broker_name"
  ("key"="value"[,...])

  Broker 相关属性：
    username: 用户名
    password: 密码
    hadoop.security.authentication: 指定认证方式为 kerberos
    kerberos_principal: 指定 kerberos 的 principal
    kerberos_keytab: 指定 kerberos 的 keytab 文件路径。该文件必须为 Broker 进程所在服务器上的文件的绝对路径。并且可以被 Broker 进程访问
  ```


- `WITH HDFS`

  可以直接将数据写到远端 HDFS 上。

  ```sql
  语法：
  WITH HDFS ("key"="value"[,...])

  HDFS 相关属性：
    fs.defaultFS: namenode 地址和端口
    hadoop.username: hdfs 用户名
    dfs.nameservices: name service 名称，与 hdfs-site.xml 保持一致
    dfs.ha.namenodes.[nameservice ID]: namenode 的 id 列表，与 hdfs-site.xml 保持一致
    dfs.namenode.rpc-address.[nameservice ID].[name node ID]: Name node 的 rpc 地址，数量与 namenode 数量相同，与 hdfs-site.xml 保

    对于开启kerberos认证的Hadoop 集群，还需要额外设置如下 PROPERTIES 属性:
    dfs.namenode.kerberos.principal: HDFS namenode 服务的 principal 名称
    hadoop.security.authentication: 认证方式设置为 kerberos
    hadoop.kerberos.principal: 设置 Doris 连接 HDFS 时使用的 Kerberos 主体
    hadoop.kerberos.keytab: 设置 keytab 本地文件路径
  ```

- `WITH S3`

  可以直接将数据写到远端 S3 对象存储上。

  ```sql
  语法：
  WITH S3 ("key"="value"[,...])

  S3 相关属性：
    AWS_ENDPOINT
    AWS_ACCESS_KEY
    AWS_SECRET_KEY
    AWS_REGION
    use_path_style: (选填) 默认为 `false`。S3 SDK 默认使用 Virtual-hosted Style 方式。但某些对象存储系统可能没开启或不支持 Virtual-hosted Style 方式的访问，此时可以添加 `use_path_style` 参数来强制使用 Path Style 访问方式。
  ```

## 示例

#### Export 数据到本地
> Export 数据到本地文件系统，需要在 `fe.conf` 中添加 `enable_outfile_to_local=true` 并且重启 FE。

1. 将 Test 表中的所有数据导出到本地存储，默认导出 CSV 格式文件
```sql
EXPORT TABLE test TO "file:///home/user/tmp/";
```

2. 将 Test 表中的 k1,k2 列导出到本地存储，默认导出 CSV 文件格式，并设置 Label
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "label" = "label1",
  "columns" = "k1,k2"
);
```

3. 将 Test 表中的 `k1 < 50` 的行导出到本地存储，默认导出 CSV 格式文件，并以 `,` 作为列分割符
```sql
EXPORT TABLE test WHERE k1 < 50 TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "column_separator"=","
);
```

4. 将 Test 表中的分区 p1,p2 导出到本地存储，默认导出 csv 格式文件
```sql
EXPORT TABLE test PARTITION (p1,p2) TO "file:///home/user/tmp/" 
PROPERTIES ("columns" = "k1,k2");
```

5. 将 Test 表中的所有数据导出到本地存储，导出其他格式的文件
```sql
// parquet格式
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "parquet"
);

// orc格式
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "orc"
);

// csv_with_names格式, 以’AA‘为列分割符，‘zz’为行分割符
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names",
  "column_separator"="AA",
  "line_delimiter" = "zz"
);

// csv_with_names_and_types格式
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names_and_types"
);
```

6. 设置 `max_file_sizes` 属性
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB"
);
```
当导出文件大于 5MB 时，将切割数据为多个文件，每个文件最大为 5MB。

7. 设置 `parallelism` 属性
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "parallelism" = "5"
);
```

8. 设置 `delete_existing_files` 属性
```sql
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "delete_existing_files" = "true"
);
```
Export 导出数据时会先将`/home/user/`目录下所有文件及目录删除，然后导出数据到该目录下。

#### export with S3

1. 将 s3_test 表中的所有数据导出到 S3 上，以不可见字符 `\x07` 作为列或者行分隔符。如果需要将数据导出到 minio，还需要指定 `use_path_style`=`true`。

```sql
EXPORT TABLE s3_test TO "s3://bucket/a/b/c" 
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

#### export with HDFS

1. 将 Test 表中的所有数据导出到 HDFS 上，导出文件格式为 Parquet，导出作业单个文件大小限制为 512MB，保留所指定目录下的所有文件。

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
需要先启动 Broker 进程，并在 FE 中添加该 Broker。
1. 将 Test 表中的所有数据导出到 hdfs 上
```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c" 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

2. 将 testTbl 表中的分区 p1,p2 导出到 hdfs 上，以","作为列分隔符，并指定 Label

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

3. 将 testTbl 表中的所有数据导出到 hdfs 上，以不可见字符 `\x07` 作为列或者行分隔符。

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

## 关键词

    EXPORT

### 最佳实践

#### 并发执行

一个 Export 作业可以设置`parallelism`参数来并发导出数据。`parallelism`参数实际就是指定执行 EXPORT 作业的线程数量。当设置`"data_consistency" = "none"`时，每一个线程会负责导出表的部分 Tablets。

一个 Export 作业的底层执行逻辑实际上是`SELECT INTO OUTFILE`语句，`parallelism`参数设置的每一个线程都会去执行独立的`SELECT INTO OUTFILE`语句。

Export 作业拆分成多个`SELECT INTO OUTFILE`的具体逻辑是：将该表的所有 tablets 平均的分给所有 parallel 线程，如：
- num(tablets) = 40, parallelism = 3，则这 3 个线程各自负责的 tablets 数量分别为 14，13，13 个。
- num(tablets) = 2, parallelism = 3，则 Doris 会自动将 parallelism 设置为 2，每一个线程负责一个 tablets。

当一个线程负责的 tablest 超过 `maximum_tablets_of_outfile_in_export` 数值（默认为 10，可在 fe.conf 中添加`maximum_tablets_of_outfile_in_export`参数来修改该值）时，该线程就会拆分为多个`SELECT INTO OUTFILE`语句，如：
- 一个线程负责的 tablets 数量分别为 14，`maximum_tablets_of_outfile_in_export = 10`，则该线程负责两个`SELECT INTO OUTFILE`语句，第一个`SELECT INTO OUTFILE`语句导出 10 个 tablets，第二个`SELECT INTO OUTFILE`语句导出 4 个 tablets，两个`SELECT INTO OUTFILE`语句由该线程串行执行。


当所要导出的数据量很大时，可以考虑适当调大`parallelism`参数来增加并发导出。若机器核数紧张，无法再增加`parallelism` 而导出表的 Tablets 又较多时，可以考虑调大`maximum_tablets_of_outfile_in_export`来增加一个`SELECT INTO OUTFILE`语句负责的 tablets 数量，也可以加快导出速度。

若希望以 Parition 粒度导出 Table，可以设置 Export 属性 `"data_consistency" = "partition"` ，此时 Export 任务并发的线程会以 Parition 粒度来划分为多个 Outfile 语句，不同的 Outfile 语句导出的 Parition 不同，而同一个 Outfile 语句导出的数据一定属于同一个 Partition。如：设置 `"data_consistency" = "partition"` 后

- num(partition) = 40, parallelism = 3，则这 3 个线程各自负责的 Partition 数量分别为 14，13，13 个。
- num(partition) = 2, parallelism = 3，则 Doris 会自动将 Parallelism 设置为 2，每一个线程负责一个 Partition。


#### 内存限制

通常一个 Export 作业的查询计划只有 `扫描-导出` 两部分，不涉及需要太多内存的计算逻辑。所以通常 2GB 的默认内存限制可以满足需求。

但在某些场景下，比如一个查询计划，在同一个 BE 上需要扫描的 Tablet 过多，或者 Tablet 的数据版本过多时，可能会导致内存不足。可以调整 Session 变量 `exec_mem_limit` 来调大内存使用限制。

#### 注意事项

- 不建议一次性导出大量数据。一个 Export 作业建议的导出数据量最大在几十 GB。过大的导出会导致更多的垃圾文件和更高的重试成本。如果表数据量过大，建议按照分区导出。

- 如果 Export 作业运行失败，已经生成的文件不会被删除，需要用户手动删除。

- Export 作业会扫描数据，占用 IO 资源，可能会影响系统的查询延迟。

- 目前在 Export 时只是简单检查 Tablets 版本是否一致，建议在执行 Export 过程中不要对该表进行导入数据操作。

- 一个 Export Job 允许导出的分区数量最大为 2000，可以在 `fe.conf` 中添加参数 `maximum_number_of_export_partitions` 并重启 FE 来修改该设置。
