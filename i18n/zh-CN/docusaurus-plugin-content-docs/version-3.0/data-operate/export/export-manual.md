---
{
    "title": "Export",
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

本文档将介绍如何使用`EXPORT`命令导出 Doris 中存储的数据。

`Export` 是 Doris 提供的一种将数据异步导出的功能。该功能可以将用户指定的表或分区的数据，以指定的文件格式，导出到目标存储系统中，包括对象存储、HDFS 或本地文件系统。

`Export` 是一个异步执行的命令，命令执行成功后，立即返回结果，用户可以通过`Show Export` 命令查看该 Export 任务的详细信息。

有关`EXPORT`命令的详细介绍，请参考：[EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md)

关于如何选择 `SELECT INTO OUTFILE` 和 `EXPORT`，请参阅 [导出综述](../../data-operate/export/export-overview.md)。

--- 

## 基本原理

Export 任务的底层是执行`SELECT INTO OUTFILE` SQL 语句。用户发起一个 Export 任务后，Doris 会根据 Export 要导出的表构造出一个或多个 `SELECT INTO OUTFILE` 执行计划，随后将这些`SELECT INTO OUTFILE` 执行计划提交给 Doris 的 Job Schedule 任务调度器，Job Schedule 任务调度器会自动调度这些任务并执行。

默认情况下，Export 任务是单线程执行的。为了提高导出的效率，Export 命令可以设置 `parallelism` 参数来并发导出数据。设置`parallelism` 大于 1 后，Export 任务会使用多个线程并发的去执行 `SELECT INTO OUTFILE` 查询计划。`parallelism`参数实际就是指定执行 EXPORT 作业的线程数量。

## 使用场景
`Export` 适用于以下场景：

- 大数据量的单表导出、仅需简单的过滤条件。
- 需要异步提交任务的场景。

使用 `Export` 时需要注意以下限制：
-  当前不支持压缩格式的导出。
- 不支持 Select 结果集导出。若需要导出 Select 结果集，请使用[OUTFILE导出](../../data-operate/export/outfile.md)
- 若希望导出到本地文件系统，需要在 fe.conf 中添加配置 `enable_outfile_to_local=true` 并重启FE。

## 快速上手
### 建表与导入数据
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

### 创建导出作业

#### 导出到HDFS
将 tbl 表的所有数据导出到 HDFS 上，设置导出作业的文件格式为 csv（默认格式），并设置列分割符为`,`。

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

如果 HDFS 集群开启了高可用，则需要提供 HA 信息，参考案例：[导出到开启了高可用的 HDFS 集群](#高可用HDFS导出)

如果 HDFS 集群开启了高可用并且启用了 Kerberos 认证，需要提供 Kerberos 认证信息，参考案例：[导出到开启了高可用及kerberos认证的 HDFS 集群](#高可用及kerberos集群导出)

#### 导出到对象存储

将 tbl 表中的所有数据导出到对象存储上，设置导出作业的文件格式为 csv（默认格式），并设置列分割符为`,`。

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

#### 导出到本地文件系统

>
> export 数据导出到本地文件系统，需要在 fe.conf 中添加`enable_outfile_to_local=true`并且重启 FE。

将 tbl 表中的所有数据导出到本地文件系统，设置导出作业的文件格式为 csv（默认格式），并设置列分割符为`,`。

```sql
-- csv 格式
EXPORT TABLE tbl TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv",
  "line_delimiter" = ","
);
```

> 注意：
 导出到本地文件系统的功能不适用于公有云用户，仅适用于私有化部署的用户。并且默认用户对集群节点有完全的控制权限。Doris 对于用户填写的导出路径不会做合法性检查。如果 Doris 的进程用户对该路径无写权限，或路径不存在，则会报错。同时处于安全性考虑，如果该路径已存在同名的文件，则也会导出失败。
 Doris 不会管理导出到本地的文件，也不会检查磁盘空间等。这些文件需要用户自行管理，如清理等。


### 查看导出作业
提交作业后，可以通过 [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT.md) 命令查询导出作业状态，结果举例如下：

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

有关 `show export` 命令的详细用法及其返回结果的各个列的含义可以参看 [SHOW EXPORT](../../sql-manual/sql-statements/Show-Statements/SHOW-EXPORT.md)：

### 取消导出作业

提交 Export 作业后，在 Export 任务成功或失败之前可以通过 [CANCEL EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT.md) 命令取消导出作业。取消命令举例如下：

```sql
CANCEL EXPORT FROM dbName WHERE LABEL like "%export_%";
```

## 导出说明

### 导出数据源

`EXPORT` 当前支持导出以下类型的表或视图

* Doris 内表
* Doris 逻辑视图
* Doris Catalog 表

### 导出数据存储位置

`Export` 目前支持导出到以下存储位置：

- 对象存储：Amazon S3、COS、OSS、OBS、Google GCS
- HDFS
- 本地文件系统

### 导出文件类型

`EXPORT` 目前支持导出为以下文件格式：

* Parquet
* ORC
* csv
* csv\_with\_names
* csv\_with\_names\_and\_types

### 导出文件列类型映射

`Export` 支持导出为 Parquet、ORC 文件格式。Parquet、ORC 文件格式拥有自己的数据类型，Doris 的导出功能能够自动将 Doris 的数据类型导出为 Parquet、ORC 文件格式的对应数据类型。

以下是 Doris 数据类型和 Parquet、ORC 文件格式的数据类型映射关系表：
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

> 注意：Doris 导出到 Parquet 文件格式时，会先将 Doris 内存数据转换为 Arrow 内存数据格式，然后由 Arrow 写出到 Parquet 文件格式。

## 导出示例

- [导出到开启了高可用的 HDFS 集群](#高可用HDFS导出)
- [导出到开启了高可用及kerberos认证的 HDFS 集群](#高可用及kerberos集群导出)
- [指定分区导出](#指定分区导出)
- [导出时过滤数据](#导出时过滤数据)
- [导出外表数据](#导出外表数据)
- [调整导出数据一致性](#调整导出数据一致性)
- [调整导出作业并发度](#调整导出作业并发度)
- [导出前清空导出目录](#导出前清空导出目录)
- [调整导出文件的大小](#调整导出文件的大小)

<span id="高可用HDFS导出"></span>
**导出到开启了高可用的 HDFS 集群**

如果 HDFS 开启了高可用，则需要提供 HA 信息，如：

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

<span id="高可用及kerberos集群导出"></span>
**导出到开启了高可用及kerberos认证的 HDFS 集群**

如果 Hadoop 集群开启了高可用并且启用了 Kerberos 认证，可以参考如下 SQL 语句：

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

<span id="指定分区导出"></span>
**指定分区导出**

导出作业支持仅导出 Doris 内表的部分分区，如仅导出 test 表的 p1 和 p2 分区

```sql
EXPORT TABLE test
PARTITION (p1,p2)
TO "file:///home/user/tmp/" 
PROPERTIES (
    "columns" = "k1,k2"
);
```

<span id="导出时过滤数据"></span>
**导出时过滤数据**

导出作业支持导出时根据谓词条件过滤数据，仅导出符合条件的数据，如仅导出满足 `k1 < 50` 条件的数据

```sql
EXPORT TABLE test
WHERE k1 < 50
TO "file:///home/user/tmp/"
PROPERTIES (
    "columns" = "k1,k2",
    "column_separator"=","
);
```

<span id="导出外表数据"></span>
**导出外表数据**

导出作业支持 Doris Catalog 外表数据：

```sql
-- 创建一个 catalog
CREATE CATALOG `tpch` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpch",
    "trino.tpch.column-naming" = "STANDARD",
    "trino.tpch.splits-per-node" = "32"
);

-- 导出 Catalog 外表数据
EXPORT TABLE tpch.sf1.lineitem TO "file:///path/to/exp_"
PROPERTIES(
    "parallelism" = "5",
    "format" = "csv",
    "max_file_size" = "1024MB"
);
```

:::tip
当前 Export 导出 Catalog 外表数据不支持并发导出，即使指定 parallelism 大于 1，仍然是单线程导出。
:::

<span id="调整导出数据一致性"></span>
**调整导出数据一致性**

`Export`导出支持 partition / tablets 两种粒度。`data_consistency`参数用来指定以何种粒度切分希望导出的表，`none` 代表 Tablets 级别，`partition`代表 Partition 级别。

```sql
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
    "format" = "parquet",
    "data_consistency" = "partition",
    "max_file_size" = "512MB"
);
```

若设置`"data_consistency" = "partition"` ，Export 任务底层构造的多个`SELECT INTO OUTFILE` 语句都会导出不同的 partition。

若设置`"data_consistency" = "none"` ，Export 任务底层构造的多个`SELECT INTO OUTFILE` 语句都会导出不同的 tablets，但是这些不同的 tablets 有可能属于相同的 partition。

关于 Export 底层构造 `SELECT INTO OUTFILE` 的逻辑，可参阅附录部分。

<span id="调整导出作业并发度"></span>
**调整导出作业并发度**

Export 可以设置不同的并发度来并发导出数据。指定并发度为 5：

```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "512MB",
  "parallelism" = "5"
);
```

关于 Export 并发导出的原理，可参阅附录部分。

<span id="导出前清空导出目录"></span>
**导出前清空导出目录**

```sql
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "true"
);
```

如果设置了 `"delete_existing_files" = "true"`，导出作业会先将`/home/user/`目录下所有文件及目录删除，然后导出数据到该目录下。

> 注意：
若要使用 delete_existing_files 参数，还需要在 fe.conf 中添加配置`enable_delete_existing_files = true`并重启 fe，此时 delete_existing_files 才会生效。delete_existing_files = true 是一个危险的操作，建议只在测试环境中使用。

<span id="调整导出文件的大小"></span>
**调整导出文件的大小**

导出作业支持设置导出文件的大小，如果单个文件大小超过设定值，则会按照指定大小分成多个文件导出。

```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB"
);
```

通过设置 `"max_file_size" = "512MB"`，则单个导出文件的最大大小为 512MB。

## 注意事项
* 内存限制

  通常一个 Export 作业的查询计划只有 `扫描-导出` 两部分，不涉及需要太多内存的计算逻辑。所以通常 2GB 的默认内存限制可以满足需求。

  但在某些场景下，比如一个查询计划，在同一个 BE 上需要扫描的 Tablet 过多，或者 Tablet 的数据版本过多时，可能会导致内存不足。可以调整 session 变量`exec_mem_limit`来调大内存使用限制。

* 导出数据量

  不建议一次性导出大量数据。一个 Export 作业建议的导出数据量最大在几十 GB。过大的导出会导致更多的垃圾文件和更高的重试成本。如果表数据量过大，建议按照分区导出。

  另外，Export 作业会扫描数据，占用 IO 资源，可能会影响系统的查询延迟。

* 导出文件的管理

  如果 Export 作业运行失败，已经生成的文件不会被删除，需要用户手动删除。

* 数据一致性

  目前在 export 时只是简单检查 tablets 版本是否一致，建议在执行 export 过程中不要对该表进行导入数据操作。

* 导出超时

  若导出的数据量很大，超过导出的超时时间，则 Export 任务会失败。此时可以在 Export 命令中指定`timeout` 参数来增加超时时间并重试 Export 命令。

* 导出失败

  在 Export 作业运行过程中，如果 FE 发生重启或切主，则 Export 作业会失败，需要用户重新提交。可以通过`show export` 命令查看 Export 任务状态。

* 导出分区数量

  一个 Export Job 允许导出的分区数量最大为 2000，可以在 fe.conf 中添加参数`maximum_number_of_export_partitions`并重启 FE 来修改该设置。

* 并发导出

  在并发导出时，请注意合理地配置线程数量和并行度，以充分利用系统资源并避免性能瓶颈。在导出过程中，可以实时监控进度和性能指标，以便及时发现问题并进行优化调整。

* 数据完整性

  导出操作完成后，建议验证导出的数据是否完整和正确，以确保数据的质量和完整性。

* 一个 Export 任务构造一个或多个 `SELECT INTO OUTFILE` 执行计划的具体逻辑是：

  1. 选择导出的数据的一致性模型

      根据 `data_consistency` 参数来决定导出的一致性，这个只和语义有关，和并发度无关，用户要先根据自己的需求，选择一致性模型。

  2. 确定并发度

      根据 `parallelism` 参数确定由多少个线程来运行这些 `SELECT INTO OUTFILE` 执行计划。parallelism 决定了最大可能的线程数。

      > 注意：即使 Export 命令设置了 `parallelism` 参数，该 Export 任务的实际并发线程数量还与 Job Schedule 有关。Export 任务设置多并发后，每一个并发线程都是 Job Schedule 提供的，所以如果此时 Doris 系统任务较繁忙，Job Schedule 的线程资源较紧张，那么有可能分给 Export 任务的实际线程数量达不到 `parallelism` 个数，影响 Export 的并发导出。此时可以通过减轻系统负载或调整 FE 配置 `async_task_consumer_thread_num` 增加 Job Schedule 的总线程数量来缓解这个问题。

  3. 确定每一个 outfile 语句的任务量

      每一个线程会根据 `maximum_tablets_of_outfile_in_export` 以及数据实际的分区数 / buckets 数来决定要拆分成多少个 outfile。

      > `maximum_tablets_of_outfile_in_export` 是 FE 的配置，默认值为 10。该参数用于指定 Export 任务切分出来的单个 OutFile 语句中允许的最大 partitions / buckets 数量。修改该配置需要重启 FE。

      举例：假设一张表共有 20 个 partition，每个 partition 都有 5 个 buckets，那么该表一共有 100 个 buckets。设置`data_consistency = none` 以及 `maximum_tablets_of_outfile_in_export = 10`。

      1. `parallelism = 5` 情况下

          Export 任务将把该表的 100 个 buckets 分成 5 份，每个线程负责 20 个 buckets。每个线程负责的 20 个 buckets 又将以 10 个为单位分成 2 组，每组 buckets 各由一个 outfile 查询计划负责。所以最终该 Export 任务有 5 个线程并发执行，每个线程负责 2 个 outfile 语句，每个线程负责的 outfile 语句串行的被执行。

      2. `parallelism = 3` 情况下

          Export 任务将把该表的 100 个 buckets 分成 3 份，3 个线程分别负责 34、33、33 个 buckets。每个线程负责的 buckets 又将以 10 个为单位分成 4 组（最后一组不足 10 个 buckets），每组 buckets 各由一个 outfile 查询计划负责。所以该 Export 任务最终有 3 个线程并发执行，每个线程负责 4 个 outfile 语句，每个线程负责的 outfile 语句串行的被执行。

      3. `parallelism = 120` 情况下

          由于该表 buckets 只有 100 个，所以系统会将 `parallelism` 强制设为 100，并以 `parallelism = 100` 去执行。Export 任务将把该表的 100 个 buckets 分成 100 份，每个线程负责 1 个 buckets。每个线程负责的 1 个 buckets 又将以 10 个为单位分成 1 组（该组实际就只有 1 个 buckets），每组 buckets 由一个 outfile 查询计划负责。所以最终该 Export 任务有 100 个线程并发执行，每个线程负责 1 个 outfile 语句，每个 outfile 语句实际只导出 1 个 buckets。

* 当前版本若希望 Export 有一个较好的性能，建议设置以下参数：

  1. 打开 session 变量 `enable_parallel_outfile`。
  2. 设置 Export 的 `parallelism` 参数为较大值，使得每一个线程只负责一个 `SELECT INTO OUTFILE` 查询计划。
  3. 设置 FE 配置 `maximum_tablets_of_outfile_in_export` 为较小值，使得每一个 `SELECT INTO OUTFILE` 查询计划导出的数据量较小。
