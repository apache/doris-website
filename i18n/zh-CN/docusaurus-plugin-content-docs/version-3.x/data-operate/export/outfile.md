---
{
    "title": "SELECT INTO OUTFILE",
    "language": "zh-CN",
    "description": "本文档将介绍如何使用 SELECT INTO OUTFILE 命令进行查询结果的导出操作。"
}
---

本文档将介绍如何使用 `SELECT INTO OUTFILE` 命令进行查询结果的导出操作。

`SELECT INTO OUTFILE` 命令将 `SELECT` 部分的结果数据，以指定的文件格式导出到目标存储系统中，包括对象存储或 HDFS。

`SELECT INTO OUTFILE` 是一个同步命令，命令返回即表示导出结束。若导出成功，会返回导出的文件数量、大小、路径等信息。若导出失败，会返回错误信息。

关于如何选择 `SELECT INTO OUTFILE` 和 `EXPORT`，请参阅 [导出综述](./export-overview.md)。

有关`SELECT INTO OUTFILE`命令的详细介绍，请参考：[SELECT INTO OUTFILE](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE)

## 适用场景

`SELECT INTO OUTFILE` 适用于以下场景：

-  导出数据需要经过复杂计算逻辑的，如过滤、聚合、关联等。
-  适合需要执行同步任务的场景。

在使用 `SELECT INTO OUTFILE` 时需要注意以下限制：

- 不支持文本压缩格式的导出。
- 2.1 版本 pipeline 引擎不支持并发导出。

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

### 导出到 HDFS

将查询结果导出到文件 `hdfs://path/to/` 目录下，指定导出格式为 Parquet：

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://ip:port/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://ip:port",
    "hadoop.username" = "hadoop"
);
```

### 导出到对象存储 

将查询结果导出到 s3 存储的 `s3://bucket/export/` 目录下，指定导出格式为 ORC，需要提供`sk` `ak`等信息

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

## 导出说明

### 导出数据存储位置

`SELECT INTO OUTFILE` 目前支持导出到以下存储位置：

- 对象存储：Amazon S3、COS、OSS、OBS、Google GCS
- HDFS

### 导出文件类型

`SELECT INTO OUTFILE` 目前支持导出以下文件格式

* Parquet
* ORC
* csv
* csv\_with\_names
* csv\_with\_names\_and\_types

### 导出并发度

可以通过会话参数 `enable_parallel_outfile` 开启并发导出。

`SET enable_parallel_outfile=true;`

并发导出会利用多节点、多线程导出结果数据，以提升整体的导出效率。但并发导出可能会产生更多的文件。

注意，某些查询即使打开此参数，也无法执行并发导出，如包含全局排序的查询。如果导出命令返回的行数大于 1 行，则表示开启了并发导出。

## 导出示例

### 导出到开启了高可用的 HDFS 集群

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

### 导出到开启了高可用及 kerberos 认证的 HDFS 集群

如果 Hdfs 集群开启了高可用并且启用了 Kerberos 认证，可以参考如下 SQL 语句：

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

### 生成导出成功标识文件示例

`SELECT INTO OUTFILE` 命令是一个同步命令，因此有可能在 SQL 执行过程中任务连接断开了，从而无法获悉导出的数据是否正常结束或是否完整。此时可以使用 `success_file_name` 参数要求导出成功后，在目录下生成一个文件标识。

类似 Hive，用户可以通过判断导出目录中是否有`success_file_name` 参数指定的文件，来判断导出是否正常结束以及导出目录中的文件是否完整。

例如：将 select 语句的查询结果导出到对象存储：`s3://bucket/export/`。指定导出格式为 `csv`。指定导出成功标识文件名为 `SUCCESS`。导出完成后，生成一个标识文件。

```sql
SELECT k1,k2,v1 FROM tbl1 LIMIT 100000
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "success_file_name" = "SUCCESS"
);
```

在导出完成后，会多写出一个文件，该文件的文件名为 `SUCCESS`。

### 导出前清空导出目录

```sql
SELECT * FROM tbl1
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "delete_existing_files" = "true"
);
```

如果设置了 `"delete_existing_files" = "true"`，导出作业会先将 `s3://bucket/export/` 目录下所有文件及目录删除，然后导出数据到该目录下。

若要使用 `delete_existing_files` 参数，还需要在 `fe.conf` 中添加配置 `enable_delete_existing_files = true` 并重启 fe，此时 `delete_existing_files` 才会生效。该操作会删除外部系统的数据，属于高危操作，请自行确保外部系统的权限和数据安全性。

### 设置导出文件的大小

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://path/to/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
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

    对于部分输出为非可见字符的函数，如 BITMAP、HLL 类型，导出到 CSV 文件格式时输出为 `\N`。

## 附录
 
### 导出到本地文件系统

导出到本地文件系统功能默认是关闭的。这个功能仅用于本地调试和开发，请勿用于生产环境。

如要开启这个功能请在 `fe.conf` 中添加 `enable_outfile_to_local=true` 并且重启 FE。

示例：将 tbl 表中的所有数据导出到本地文件系统，设置导出作业的文件格式为 csv（默认格式），并设置列分割符为`,`。

```sql
SELECT c1, c2 FROM db.tbl
INTO OUTFILE "file:///path/to/result_"
FORMAT AS CSV
PROPERTIES(
    "column_separator" = ","
);
```

此功能会将数据导出并写入到 BE 所在节点的磁盘上，如果有多个 BE 节点，则数据会根据导出任务的并发度分散在不同 BE 节点上，每个节点有一部分数据。

如在这个示例中，最终会在 BE 节点的 `/path/to/` 下生产一组类似 `result_c6df5f01bd664dde-a2168b019b6c2b3f_0.csv` 的文件。

具体的 BE 节点 IP 会在返回的结果中显示，如：

```
+------------+-----------+----------+--------------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                      |
+------------+-----------+----------+--------------------------------------------------------------------------+
|          1 |   1195072 |  4780288 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b3f_* |
|          1 |   1202944 |  4811776 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b40_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b43_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b45_* |
+------------+-----------+----------+--------------------------------------------------------------------------+
```

:::caution
此功能不适用于生产环境，并且请自行确保导出目录的权限和数据安全性。
:::
