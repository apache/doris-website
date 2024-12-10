---
{
    "title": "Select Into Outfile",
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

本文档将介绍如何使用 `SELECT INTO OUTFILE` 命令进行查询结果的导出操作。

有关`SELECT INTO OUTFILE`命令的详细介绍，请参考：[SELECT INTO OUTFILE](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE.md)

## 概述

`SELECT INTO OUTFILE` 命令将 `SELECT` 部分的结果数据，以指定的文件格式导出到目标存储系统中，包括对象存储、HDFS 或本地文件系统。

`SELECT INTO OUTFILE` 是一个同步命令，命令返回即表示导出结束。若导出成功，会返回导出的文件数量、大小、路径等信息。若导出失败，会返回错误信息。

关于如何选择 `SELECT INTO OUTFILE` 和 `EXPORT`，请参阅 [导出综述](./export-overview.md)。

`SELECT INTO OUTFILE` 目前支持以下导出格式

* Parquet
* ORC
* csv
* csv\_with\_names
* csv\_with\_names\_and\_types

不支持压缩格式的导出。

示例：

```sql
mysql> SELECT * FROM tbl1 LIMIT 10 INTO OUTFILE "file:///home/work/path/result_";
+------------+-----------+----------+--------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                |
+------------+-----------+----------+--------------------------------------------------------------------+
|          1 |         2 |        8 | file:///192.168.1.10/home/work/path/result_{fragment_instance_id}_ |
+------------+-----------+----------+--------------------------------------------------------------------+
```

返回结果说明：

* FileNumber：最终生成的文件个数。
* TotalRows：结果集行数。
* FileSize：导出文件总大小。单位字节。
* URL：导出的文件路径的前缀，多个文件会以后缀 `_0`,`_1` 依次编号。

## 导出文件列类型映射

`SELECT INTO OUTFILE` 支持导出为 Parquet、ORC 文件格式。Parquet、ORC 文件格式拥有自己的数据类型，Doris 的导出功能能够自动将 Doris 的数据类型导出为 Parquet、ORC 文件格式的对应数据类型，具体映射关系请参阅[导出综述](../../data-operate/export/export-overview.md)文档的 "导出文件列类型映射" 部分。

## 示例

### 导出到 HDFS

将查询结果导出到文件 `hdfs://path/to/` 目录下，指定导出格式为 PARQUET：

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

如果 HDFS 开启了高可用，则需要提供 HA 信息，如：

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

如果 Hadoop 集群开启了高可用并且启用了 Kerberos 认证，可以参考如下 SQL 语句：

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

### 导出到 S3

将查询结果导出到 s3 存储的 `s3://path/to/` 目录下，指定导出格式为 ORC，需要提供`sk` `ak`等信息

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

### 导出到本地
>
> 如需导出到本地文件，需在 `fe.conf` 中添加 `enable_outfile_to_local=true`并重启 FE。

将查询结果导出到 BE 的`file:///path/to/` 目录下，指定导出格式为 CSV，指定列分割符为`,`。

```sql
SELECT k1 FROM tbl1 UNION SELECT k2 FROM tbl1
INTO OUTFILE "file:///path/to/result_"
FORMAT AS CSV
PROPERTIES(
    "column_separator" = ","
);
```

> 注意：
 导出到本地文件的功能不适用于公有云用户，仅适用于私有化部署的用户。并且默认用户对集群节点有完全的控制权限。Doris 对于用户填写的导出路径不会做合法性检查。如果 Doris 的进程用户对该路径无写权限，或路径不存在，则会报错。同时处于安全性考虑，如果该路径已存在同名的文件，则也会导出失败。
 Doris 不会管理导出到本地的文件，也不会检查磁盘空间等。这些文件需要用户自行管理，如清理等。

## 最佳实践

### 生成导出成功标识文件

`SELECT INTO OUTFILE`命令是一个同步命令，因此有可能在 SQL 执行过程中任务连接断开了，从而无法获悉导出的数据是否正常结束或是否完整。此时可以使用 `success_file_name` 参数要求导出成功后，在目录下生成一个文件标识。

类似 Hive，用户可以通过判断导出目录中是否有`success_file_name` 参数指定的文件，来判断导出是否正常结束以及导出目录中的文件是否完整。

例如：将 select 语句的查询结果导出到腾讯云 COS：`s3://${bucket_name}/path/my_file_`。指定导出格式为 csv。指定导出成功标识文件名为`SUCCESS`。导出完成后，生成一个标识文件。

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

在导出完成后，会多写出一个文件，该文件的文件名为 `SUCCESS`。

### 并发导出

默认情况下，`SELECT` 部分的查询结果会先汇聚到某一个 BE 节点，由该节点单线程导出数据。然而，在某些情况下，如没有 `ORDER BY` 子句的查询语句，则可以开启并发导出，多个 BE 节点同时导出数据，以提升导出性能。

下面我们通过一个示例演示如何正确开启并发导出功能：

1. 打开并发导出会话变量

```sql
mysql> SET enable_parallel_outfile = true;
```

2. 执行导出命令

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

可以看到，开启并成功触发并发导出功能后，返回的结果可能是多行，表示有多个线程并发导出。

如果我们修改上述语句，即在查询语句中加入 `ORDER BY` 子句。由于查询语句带了一个顶层的排序节点，所以这个查询即使开启并发导出功能，也是无法并发导出的：

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

可以看到，最终结果只有一行，并没有触发并发导出。

关于更多并发导出的原理说明，可参阅附录部分。

### 导出前清空导出目录

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

如果设置了 `"delete_existing_files" = "true"`，导出作业会先将 `s3://my_bucket/export/`目录下所有文件及目录删除，然后导出数据到该目录下。

> 注意：

> 若要使用 delete_existing_files 参数，还需要在 fe.conf 中添加配置`enable_delete_existing_files = true`并重启 fe，此时 delete_existing_files 才会生效。delete_existing_files = true 是一个危险的操作，建议只在测试环境中使用。

### 设置导出文件的大小

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

由于指定了 `"max_file_size" = "2048MB"` 最终生成文件如如果不大于 2GB，则只有一个文件。如果大于 2GB，则有多个文件。

## 注意事项

- 导出数据量和导出效率

    `SELECT INTO OUTFILE`功能本质上是执行一个 SQL 查询命令。如果不开启并发导出，查询结果是由单个 BE 节点，单线程导出的，因此整个导出的耗时包括查询本身的耗时和最终结果集写出的耗时。开启并发导出可以降低导出的时间。

- 导出超时

    导出命令的超时时间与查询的超时时间相同，如果数据量较大导致导出数据超时，可以设置会话变量 `query_timeout` 适当的延长查询超时时间。

- 导出文件的管理

    Doris 不会管理导出的文件，无论是导出成功的还是导出失败后残留的文件，都需要用户自行处理。

    另外，`SELECT INTO OUTFILE` 命令不会检查文件及文件路径是否存在。`SELECT INTO OUTFILE` 是否会自动创建路径、或是否会覆盖已存在文件，完全由远端存储系统的语义决定。

- 如果查询的结果集为空

    对于结果集为空的导出，依然会产生一个空文件。

- 文件切分

    文件切分会保证一行数据完整的存储在单一文件中。因此文件的大小并不严格等于 `max_file_size`。

- 非可见字符的函数

    对于部分输出为非可见字符的函数，如 BITMAP、HLL 类型，CSV 输出为 `\N`，Parquet、ORC 输出为 NULL。

    目前部分地理信息函数，如 `ST_Point` 的输出类型为 VARCHAR，但实际输出值为经过编码的二进制字符。当前这些函数会输出乱码。对于地理函数，请使用 `ST_AsText` 进行输出。

## 附录

### 并发导出原理

- 原理介绍

    Doris 是典型的基于 MPP 架构的高性能、实时的分析型数据库。MPP 架构的一大特征是使用分布式架构，将大规模数据集划分为小块，并在多个节点上并行处理。

    `SELECT INTO OUTFILE`的并发导出就是基于上述 MPP 架构的并行处理能力，在可以并发导出的场景下（后面会详细说明哪些场景可以并发导出），并行的在多个 BE 节点上导出，每个 BE 处理结果集的一部分。

- 如何判断可以执行并发导出

    * 确定会话变量已开启：`set enable_parallel_outfile = true;`
    * 通过 `EXPLAIN` 查看执行计划

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

    `EXPLAIN` 命令会返回该语句的查询计划。观察该查询计划，如果发现 `RESULT FILE SINK` 出现在 `PLAN FRAGMENT 1` 中，就说明该查询语句可以并发导出。如果 `RESULT FILE SINK` 出现在 `PLAN FRAGMENT 0` 中，则说明当前查询不能进行并发导出。

- 导出并发度

    当满足并发导出的条件后，导出任务的并发度为：`BE 节点数 * parallel_fragment_exec_instance_num`。
