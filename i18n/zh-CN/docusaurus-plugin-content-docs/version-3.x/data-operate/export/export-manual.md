---
{
    "title": "Export",
    "language": "zh-CN",
    "description": "本文档将介绍如何使用EXPORT命令导出 Doris 中存储的数据。"
}
---

本文档将介绍如何使用`EXPORT`命令导出 Doris 中存储的数据。

`Export` 是 Doris 提供的一种将数据异步导出的功能。该功能可以将用户指定的表或分区的数据，以指定的文件格式，导出到目标存储系统中，包括对象存储、HDFS 或本地文件系统。

`Export` 是一个异步执行的命令，命令执行成功后，立即返回结果，用户可以通过`Show Export` 命令查看该 Export 任务的详细信息。

有关`EXPORT`命令的详细介绍，请参考：[EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT)

关于如何选择 `SELECT INTO OUTFILE` 和 `EXPORT`，请参阅 [导出综述](../../data-operate/export/export-overview.md)。

## 适用场景

`Export` 适用于以下场景：

- 大数据量的单表导出、仅需简单的过滤条件。
- 需要异步提交任务的场景。

使用 `Export` 时需要注意以下限制：

- 当前不支持文本文件压缩格式的导出。
- 不支持 Select 结果集导出。若需要导出 Select 结果集，请使用[OUTFILE 导出](../../data-operate/export/outfile.md)

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

#### 导出到 HDFS

将 tbl 表的所有数据导出到 HDFS 上，设置导出作业的文件格式为 csv（默认格式），并设置列分割符为 `,`。

```sql
EXPORT TABLE tbl
TO "hdfs://host/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
with HDFS (
    "fs.defaultFS"="hdfs://hdfs_host:port",
    "hadoop.username" = "hadoop"
);
```

#### 导出到对象存储

将 tbl 表中的所有数据导出到对象存储上，设置导出作业的文件格式为 csv（默认格式），并设置列分割符为`,`。

```sql
EXPORT TABLE tbl TO "s3://bucket/export/export_" 
PROPERTIES (
    "line_delimiter" = ","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### 查看导出作业
提交作业后，可以通过 [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT) 命令查询导出作业状态，结果举例如下：

```sql
mysql> show export\G
*************************** 1. row ***************************
      JobId: 143265
      Label: export_0aa6c944-5a09-4d0b-80e1-cb09ea223f65
      State: FINISHED
   Progress: 100%
   TaskInfo: {"partitions":[],"parallelism":5,"data_consistency":"partition","format":"csv","broker":"S3","column_separator":"\t","line_delimiter":"\n","max_file_size":"2048MB","delete_existing_files":"","with_bom":"false","db":"tpch1","tbl":"lineitem"}
       Path: s3://bucket/export/export_
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
      "fileSize": "747503989",
      "url": "s3://bucket/export/export_6555cd33e7447c1-baa9568b5c4eb0ac_*"
    }
  ]
]
1 row in set (0.00 sec)
```

有关 `show export` 命令的详细用法及其返回结果的各个列的含义可以参看 [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT)：

### 取消导出作业

提交 Export 作业后，在 Export 任务成功或失败之前可以通过 [CANCEL EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT) 命令取消导出作业。取消命令举例如下：

```sql
CANCEL EXPORT FROM dbName WHERE LABEL like "%export_%";
```

## 导出说明

### 导出数据源

`EXPORT` 当前支持导出以下类型的表或视图

* Doris 内表
* Doris 逻辑视图
* External Catalog 中的表

### 导出数据存储位置

`Export` 目前支持导出到以下存储位置：

- 对象存储：Amazon S3、COS、OSS、OBS、Google GCS
- HDFS

### 导出文件类型

`EXPORT` 目前支持导出为以下文件格式：

* Parquet
* ORC
* csv
* csv\_with\_names
* csv\_with\_names\_and\_types

## 导出示例

### 导出到开启了高可用的 HDFS 集群

如果 HDFS 开启了高可用，则需要提供 HA 信息，如：

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
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

### 导出到开启了高可用及 kerberos 认证的 HDFS 集群

如果 Hadoop 集群开启了高可用并且启用了 Kerberos 认证，可以参考如下 SQL 语句：

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
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

### 指定分区导出

导出作业支持仅导出 Doris 内表的部分分区，如仅导出 test 表的 p1 和 p2 分区

```sql
EXPORT TABLE test
PARTITION (p1,p2)
TO "s3://bucket/export/export_" 
PROPERTIES (
    "columns" = "k1,k2"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### 导出时过滤数据

导出作业支持导出时根据谓词条件过滤数据，仅导出符合条件的数据，如仅导出满足 `k1 < 50` 条件的数据

```sql
EXPORT TABLE test
WHERE k1 < 50
TO "s3://bucket/export/export_"
PROPERTIES (
    "columns" = "k1,k2",
    "column_separator"=","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### 导出外表数据

导出作业支持 Export Catalog 外表数据的导出：

```sql
-- Create a hive catalog
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083'
);

-- Export hive table
EXPORT TABLE hive_catalog.sf1.lineitem TO "s3://bucket/export/export_"
PROPERTIES(
    "format" = "csv",
    "max_file_size" = "1024MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### 导出前清空导出目录

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "true"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

如果设置了 `"delete_existing_files" = "true"`，导出作业会先将 `s3://bucket/export/` 目录下所有文件及目录删除，然后导出数据到该目录下。

若要使用 `delete_existing_files` 参数，还需要在 `fe.conf` 中添加配置 `enable_delete_existing_files = true` 并重启 fe，此时 `delete_existing_files` 才会生效。该操作会删除外部系统的数据，属于高危操作，请自行确保外部系统的权限和数据安全性。

### 设置导出文件的大小

导出作业支持设置导出文件的大小，如果单个文件大小超过设定值，则会对导出文件进行切分。

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

通过设置 `"max_file_size" = "512MB"`，则单个导出文件的最大大小为 512MB。

`max_file_size` 不能小于 5MB 且不能大于 2GB。

在 2.1.11 和 3.0.7 版本中，取消了 2GB 的最大限制，仅保留最小 5MB 的限制。

## 注意事项

* 导出数据量

  不建议一次性导出大量数据。一个 Export 作业建议的导出数据量最大在几十 GB。过大的导出会导致更多的垃圾文件和更高的重试成本。如果表数据量过大，建议按照分区导出。

  另外，Export 作业会扫描数据，占用 IO 资源，可能会影响系统的查询延迟。

* 导出文件的管理

  如果 Export 作业运行失败，已经生成的文件不会被删除，需要用户手动删除。

* 导出超时

  若导出的数据量很大，超过导出的超时时间，则 Export 任务会失败。此时可以在 Export 命令中指定 `timeout` 参数来增加超时时间并重试 Export 命令。

* 导出失败

  在 Export 作业运行过程中，如果 FE 发生重启或切主，则 Export 作业会失败，需要用户重新提交。可以通过`show export` 命令查看 Export 任务状态。

* 导出分区数量

  一个 Export Job 允许导出的分区数量最大为 2000，可以在 fe.conf 中添加参数`maximum_number_of_export_partitions`并重启 FE 来修改该设置。

* 数据完整性

  导出操作完成后，建议验证导出的数据是否完整和正确，以确保数据的质量和完整性。

## 附录

### 基本原理

Export 任务的底层是执行`SELECT INTO OUTFILE` SQL 语句。用户发起一个 Export 任务后，Doris 会根据 Export 要导出的表构造出一个或多个 `SELECT INTO OUTFILE` 执行计划，随后将这些`SELECT INTO OUTFILE` 执行计划提交给 Doris 的 Job Schedule 任务调度器，Job Schedule 任务调度器会自动调度这些任务并执行。

### 导出到本地文件系统

导出到本地文件系统功能默认是关闭的。这个功能仅用于本地调试和开发，请勿用于生产环境。

如要开启这个功能请在 `fe.conf` 中添加 `enable_outfile_to_local=true` 并且重启 FE。

示例：将 tbl 表中的所有数据导出到本地文件系统，设置导出作业的文件格式为 csv（默认格式），并设置列分割符为`,`。

```sql
EXPORT TABLE db.tbl TO "file:///path/to/result_"
PROPERTIES (
  "format" = "csv",
  "line_delimiter" = ","
);
```

此功能会将数据导出并写入到 BE 所在节点的磁盘上，如果有多个 BE 节点，则数据会根据导出任务的并发度分散在不同 BE 节点上，每个节点有一部分数据。

如在这个示例中，最终会在 BE 节点的 `/path/to/` 下生产一组类似 `result_7052bac522d840f5-972079771289e392_0.csv` 的文件。

具体的 BE 节点 IP 可以在 `SHOW EXPORT` 结果中的 `OutfileInfo` 列查看，如：

```
[
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.136/path/to/result_7052bac522d840f5-972079771289e392_*"
        }
    ], 
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.137/path/to/result_22aba7ec933b4922-ba81e5eca12bf0c2_*"
        }
    ]
]
```

:::caution
此功能不适用于生产环境，并且请自行确保导出目录的权限和数据安全性。
:::

