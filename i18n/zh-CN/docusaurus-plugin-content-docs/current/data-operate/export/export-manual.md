---
{
    "title": "Export 异步导出",
    "language": "zh-CN",
    "description": "使用 EXPORT 命令异步导出 Doris 表或分区数据到 HDFS、S3、对象存储，支持 Parquet/ORC/CSV 格式。",
    "keywords": [
        "Doris EXPORT",
        "异步导出",
        "导出到 S3",
        "导出到 HDFS",
        "Parquet 导出",
        "ORC 导出",
        "CSV 导出",
        "SHOW EXPORT",
        "CANCEL EXPORT",
        "SELECT INTO OUTFILE"
    ]
}
---

<!-- 知识类型: 操作步骤 / 配置参数 / 架构选型决策 -->
<!-- 适用场景: 数据导出 / 数据归档 / 跨系统数据流转 -->

本文档介绍如何使用 `EXPORT` 命令将 Doris 中存储的数据异步导出到外部存储系统。

`EXPORT` 是 Doris 提供的**异步数据导出**功能，可将指定表或分区的数据，以指定文件格式导出到对象存储、HDFS 或本地文件系统。

命令执行后立即返回，可通过 `SHOW EXPORT` 查询任务状态。

## 适用场景

| 场景类型           | 是否推荐使用 EXPORT | 说明                                                |
| ------------------ | ------------------- | --------------------------------------------------- |
| 大数据量单表导出   | 推荐                | 仅需简单过滤条件即可                                |
| 异步任务提交       | 推荐                | 命令立即返回，不阻塞客户端                          |
| 导出 SELECT 结果集 | 不支持              | 请改用 [OUTFILE 导出](../../data-operate/export/outfile.md) |
| 文本文件压缩导出   | 不支持              | 当前版本不支持文本文件压缩格式                      |

关于 `SELECT INTO OUTFILE` 与 `EXPORT` 的选型，请参阅 [导出综述](../../data-operate/export/export-overview.md)。

`EXPORT` 命令的完整语法详见 [EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT)。

## 能力概览

### 支持的数据源

`EXPORT` 支持导出以下类型的表或视图：

- Doris 内表
- Doris 逻辑视图
- External Catalog 中的表（如 Hive 外表）

### 支持的存储位置

| 存储类型 | 具体支持                                |
| -------- | --------------------------------------- |
| 对象存储 | Amazon S3、腾讯云 COS、阿里云 OSS、华为云 OBS、Google GCS |
| 分布式文件系统 | HDFS                              |
| 本地文件系统 | 仅用于本地调试和开发，需手动开启      |

### 支持的文件格式

- Parquet
- ORC
- CSV
- csv\_with\_names
- csv\_with\_names\_and\_types

## 快速上手

<!-- 知识类型: 操作步骤 -->

### 第一步：建表与导入数据

```sql
CREATE TABLE IF NOT EXISTS tbl (
    `c1` int(11) NULL,
    `c2` string NULL,
    `c3` bigint NULL
)
DISTRIBUTED BY HASH(c1) BUCKETS 20
PROPERTIES("replication_num" = "1");

INSERT INTO tbl VALUES
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, NULL, NULL);
```

### 第二步：创建导出作业

#### 导出到 HDFS

将 `tbl` 表所有数据导出到 HDFS，使用默认 CSV 格式，列分隔符为 `,`：

```sql
EXPORT TABLE tbl
TO "hdfs://host/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS"="hdfs://hdfs_host:port",
    "hadoop.username" = "hadoop"
);
```

#### 导出到对象存储（S3）

将 `tbl` 表所有数据导出到 S3 对象存储，使用默认 CSV 格式，列分隔符为 `,`：

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

### 第三步：查看导出作业状态

通过 [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT) 命令查询导出任务的执行进度与结果：

```sql
mysql> SHOW EXPORT\G
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

返回结果中各列的详细含义，请参考 [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT)。

### 第四步：取消导出作业（可选）

在 Export 任务成功或失败之前，可通过 [CANCEL EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT) 命令取消任务：

```sql
CANCEL EXPORT FROM dbName WHERE LABEL like "%export_%";
```

## 进阶使用示例

<!-- 知识类型: 操作步骤 -->

### 导出到高可用 HDFS 集群

如果 HDFS 启用了高可用（HA），需要额外提供 HA 相关参数：

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

### 导出到 HA + Kerberos 认证的 HDFS 集群

如果 Hadoop 集群同时启用了高可用和 Kerberos 认证，可参考以下 SQL：

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
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

### 仅导出指定分区

仅导出 Doris 内表的部分分区数据，例如仅导出 `test` 表的 `p1` 和 `p2` 分区：

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

### 按谓词条件过滤后导出

通过 `WHERE` 子句过滤数据，仅导出满足条件的行，例如仅导出 `k1 < 50` 的数据：

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

### 导出 External Catalog 外表数据

`EXPORT` 支持导出 External Catalog 外表（如 Hive 外表）的数据：

```sql
-- 创建 Hive Catalog
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083'
);

-- 导出 Hive 表
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

### 导出前清空目标目录

通过 `delete_existing_files` 参数，可在导出前清空目标目录：

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

启用条件与行为说明：

- 设置 `"delete_existing_files" = "true"` 后，导出作业会**先删除** `s3://bucket/export/` 目录下的所有文件及子目录，再导出数据。
- 该参数生效需要在 `fe.conf` 中添加 `enable_delete_existing_files = true` 并重启 FE。

:::caution
该操作会删除外部系统的数据，属于**高危操作**，请自行确保外部系统的权限和数据安全性。
:::

### 控制单个导出文件大小

通过 `max_file_size` 控制单个导出文件大小，超过设定值会自动切分：

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

`max_file_size` 取值规则如下：

| 版本范围                  | 最小值 | 最大值 |
| ------------------------- | ------ | ------ |
| 2.1.11 之前 / 3.0.7 之前  | 5MB    | 2GB    |
| 2.1.11 及以后 / 3.0.7 及以后 | 5MB | 无限制 |

## 注意事项与最佳实践

<!-- 知识类型: 最佳实践 / 故障排查 -->
<!-- 适用场景: 生产环境使用 / 故障定位 -->

| 关注点         | 建议与说明                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| 单作业数据量   | 单个 Export 作业建议不超过几十 GB；表数据量大时建议按分区分批导出，避免产生更多垃圾文件和重试成本       |
| 系统资源影响   | Export 作业会扫描数据，占用 IO 资源，可能影响查询延迟                                                   |
| 失败文件管理   | 作业运行失败时，已生成的文件不会被自动删除，需要用户手动清理                                            |
| 导出超时       | 数据量过大可能触发超时；可在 Export 命令中通过 `timeout` 参数延长超时时间后重试                         |
| FE 重启或切主  | 运行过程中 FE 重启或切主会导致作业失败；可通过 `SHOW EXPORT` 查看状态，需重新提交                       |
| 分区数量上限   | 单个 Export Job 最多导出 2000 个分区；可在 `fe.conf` 中调整 `maximum_number_of_export_partitions` 并重启 FE |
| 数据完整性校验 | 导出完成后建议校验数据条数与正确性，确保数据质量                                                        |

## 附录

### 基本原理

<!-- 知识类型: 架构原理 -->

`EXPORT` 任务底层基于 `SELECT INTO OUTFILE` SQL 语句执行，整体流程如下：

1. 用户提交 `EXPORT` 任务。
2. Doris 根据要导出的表，构造一个或多个 `SELECT INTO OUTFILE` 执行计划。
3. 将这些执行计划提交给 Doris 的 Job Schedule 任务调度器。
4. Job Schedule 自动调度并执行这些任务，最终生成导出文件。

### 导出到本地文件系统

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 本地调试 / 开发环境 -->

:::caution
导出到本地文件系统**仅用于本地调试和开发，请勿用于生产环境**，并请自行确保导出目录的权限和数据安全性。
:::

#### 启用方式

该功能默认关闭，启用步骤：

1. 在 `fe.conf` 中添加 `enable_outfile_to_local=true`。
2. 重启 FE 使配置生效。

#### 使用示例

将 `tbl` 表所有数据导出到本地文件系统，使用默认 CSV 格式，列分隔符为 `,`：

```sql
EXPORT TABLE db.tbl TO "file:///path/to/result_"
PROPERTIES (
  "format" = "csv",
  "line_delimiter" = ","
);
```

#### 数据分布说明

- 数据会被写入到 BE 节点本地磁盘。
- 多 BE 节点环境下，数据会按导出任务的并发度分散到不同 BE 节点上，每个节点保存一部分数据。
- 上例中，最终会在 BE 节点的 `/path/to/` 目录下生成形如 `result_7052bac522d840f5-972079771289e392_0.csv` 的文件。

#### 查看具体 BE 节点

具体的 BE 节点 IP 可在 `SHOW EXPORT` 结果的 `OutfileInfo` 列查看：

```text
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
