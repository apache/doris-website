---
{
    "title": "SELECT INTO OUTFILE",
    "language": "zh-CN",
    "description": "如何使用 SELECT INTO OUTFILE 将 Doris 查询结果同步导出到 S3、HDFS 等存储，含 Parquet/ORC/CSV 示例。",
    "keywords": [
        "SELECT INTO OUTFILE",
        "Doris 导出",
        "查询结果导出",
        "导出到 S3",
        "导出到 HDFS",
        "Parquet 导出",
        "ORC 导出",
        "CSV 导出",
        "并发导出",
        "enable_parallel_outfile",
        "max_file_size",
        "success_file_name"
    ]
}
---

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 数据导出 / 查询结果落盘 / 离线分析数据交付 -->

本文档介绍如何使用 `SELECT INTO OUTFILE` 命令将 Doris 的查询结果以指定文件格式同步导出到对象存储或 HDFS。

`SELECT INTO OUTFILE` 是 Doris 提供的**同步导出命令**，将 `SELECT` 的查询结果以 Parquet、ORC、CSV 等格式写入对象存储（S3/COS/OSS/OBS/GCS）或 HDFS，命令返回即表示导出结束。

- 导出成功：返回导出的文件数量、大小、路径等信息
- 导出失败：返回错误信息

> 关于 `SELECT INTO OUTFILE` 与 `EXPORT` 的选择，请参阅 [导出综述](./export-overview.md)。
> 完整命令参考请见 [SELECT INTO OUTFILE 语法](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE)。

## 适用场景

<!-- 知识类型: 架构选型决策 -->

`SELECT INTO OUTFILE` 适用于以下数据导出场景：

| 场景类型     | 说明                                                      |
| ------------ | --------------------------------------------------------- |
| 复杂计算导出 | 导出数据需要经过复杂计算逻辑，如过滤、聚合、关联（JOIN）等 |
| 同步任务     | 业务流程中需要等待导出完成后再执行后续操作                |

### 使用限制

- 不支持文本压缩格式的导出
- 2.1 版本 pipeline 引擎不支持并发导出

## 支持能力概览

<!-- 知识类型: 配置参数 -->

### 支持的存储位置

| 存储类型 | 具体支持                                |
| -------- | --------------------------------------- |
| 对象存储 | Amazon S3、腾讯云 COS、阿里云 OSS、华为云 OBS、Google GCS |
| 分布式文件系统 | HDFS                          |
| 本地文件系统 | 仅用于调试，需手动开启（见附录）      |

### 支持的文件格式

- Parquet
- ORC
- csv
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

insert into tbl values
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, null, null);
```

### 第二步：导出到 HDFS

将查询结果以 Parquet 格式导出至 `hdfs://path/to/` 目录：

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

### 第三步：导出到对象存储

将查询结果以 ORC 格式导出至 S3 的 `s3://bucket/export/` 目录，需提供 `ak`、`sk` 等访问凭据：

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

## 进阶能力

### 开启并发导出（提升导出效率）

<!-- 适用场景: 大数据量导出 / 性能调优 -->

通过会话变量 `enable_parallel_outfile` 开启并发导出：

```sql
SET enable_parallel_outfile=true;
```

| 维度       | 说明                                                                |
| ---------- | ------------------------------------------------------------------- |
| 工作机制   | 利用多 BE 节点、多线程并发导出结果数据                              |
| 优点       | 显著提升整体导出效率                                                |
| 副作用     | 可能产生更多文件                                                    |
| 失效场景   | 包含全局排序的查询，即使开启该参数也无法并发                        |
| 是否生效判断 | 若导出命令返回行数大于 1 行，则表示并发导出已生效                  |

## 典型场景示例

### 场景一：导出到开启了高可用的 HDFS 集群

<!-- 适用场景: 高可用 HDFS 环境 -->

如果 HDFS 开启了 HA 高可用，需要额外提供 nameservices 与 NameNode 的相关配置：

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

### 场景二：导出到开启 HA 与 Kerberos 认证的 HDFS 集群

<!-- 适用场景: Kerberos 安全认证环境 -->

如果 HDFS 集群同时开启了高可用和 Kerberos 认证，参考如下 SQL：

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

### 场景三：生成导出成功标识文件

<!-- 适用场景: 同步任务完整性校验 / 防止网络断连导致状态未知 -->

**问题背景**：`SELECT INTO OUTFILE` 是同步命令，若 SQL 执行过程中连接中断，无法判断导出是否完整。

**解决方案**：使用 `success_file_name` 参数，导出成功后会在目录下生成一个标识文件（类似 Hive 的 `_SUCCESS`），通过判断该文件是否存在即可确认导出完整性。

下例将查询结果以 CSV 格式导出至 S3，并在完成后生成名为 `SUCCESS` 的标识文件：

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

### 场景四：导出前清空目标目录

<!-- 适用场景: 覆盖式导出 / 周期性全量替换 -->

通过 `delete_existing_files` 参数可在导出前清空目标目录中已有的文件：

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

**生效条件与风险**：

| 项目     | 说明                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| 行为     | 先删除 `s3://bucket/export/` 目录下所有文件及子目录，再导出数据                       |
| 启用条件 | 需要在 `fe.conf` 中添加配置 `enable_delete_existing_files = true` 并重启 FE           |
| 风险提示 | 该操作会删除外部系统的数据，属于高危操作，请自行确保外部系统的权限和数据安全性          |

### 场景五：控制单个导出文件的大小

通过 `max_file_size` 参数控制每个导出文件的最大大小：

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

**说明**：

- 若最终生成数据不大于 2GB，仅产生一个文件
- 若大于 2GB，则切分为多个文件
- 文件切分会保证一行数据完整存储在单一文件中，因此实际文件大小并不严格等于 `max_file_size`

## 注意事项

<!-- 知识类型: 配置参数 / 故障排查 -->

### 性能与超时

| 主题         | 说明                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| 导出耗时构成 | `SELECT INTO OUTFILE` 本质是 SQL 查询，整体耗时 = 查询耗时 + 结果集写出耗时                                   |
| 单线程瓶颈   | 未开启并发导出时，查询结果由单个 BE 节点单线程写出                                                            |
| 性能优化     | 开启 `enable_parallel_outfile` 进行并发导出，可显著降低耗时                                                   |
| 导出超时     | 导出命令的超时与查询超时一致，若数据量较大可设置 `query_timeout` 适当延长                                     |

### 文件管理

- **Doris 不管理导出文件**：无论导出成功还是失败后残留的文件，均需用户自行清理
- **不检查路径与文件**：`SELECT INTO OUTFILE` 不会检查文件及路径是否存在；是否自动创建路径、是否覆盖已存在文件，完全由远端存储系统的语义决定

### 数据与格式

- **空结果集**：即使查询结果集为空，依然会产生一个空文件
- **文件切分规则**：保证一行数据完整存储在单一文件中，文件大小并不严格等于 `max_file_size`
- **非可见字符函数**：`BITMAP`、`HLL` 等输出非可见字符的函数，导出到 CSV 时输出为 `\N`

## 附录

### 导出到本地文件系统（仅调试）

<!-- 适用场景: 本地调试 / 开发验证 -->
<!-- 知识类型: 配置参数 -->

:::caution
此功能仅用于本地调试和开发，**请勿用于生产环境**，并请自行确保导出目录的权限和数据安全性。
:::

**开启方式**：在 `fe.conf` 中添加 `enable_outfile_to_local=true` 并重启 FE。

**示例**：将 `tbl` 表中所有数据以 CSV 格式（默认格式）导出到本地文件系统，列分隔符为 `,`：

```sql
SELECT c1, c2 FROM db.tbl
INTO OUTFILE "file:///path/to/result_"
FORMAT AS CSV
PROPERTIES(
    "column_separator" = ","
);
```

**行为说明**：

- 数据会写入 BE 节点本地磁盘
- 多 BE 节点环境下，数据会根据导出任务的并发度分散到不同 BE 节点上
- 最终在 BE 节点的 `/path/to/` 目录下生成类似 `result_c6df5f01bd664dde-a2168b019b6c2b3f_0.csv` 的文件
- 具体的 BE 节点 IP 会在返回结果中显示

**返回结果示例**：

```text
+------------+-----------+----------+--------------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                      |
+------------+-----------+----------+--------------------------------------------------------------------------+
|          1 |   1195072 |  4780288 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b3f_* |
|          1 |   1202944 |  4811776 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b40_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b43_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b45_* |
+------------+-----------+----------+--------------------------------------------------------------------------+
```
