---
{
    "title": "MySQL 库级同步",
    "language": "zh-CN",
    "sidebar_label": "库级同步",
    "description": "通过 Streaming Job 以库为单位将 MySQL 全量与增量数据持续同步到 Doris，首次同步自动建表。",
    "keywords": [
        "MySQL 库级同步",
        "MySQL 整库同步",
        "Doris Streaming Job",
        "Flink CDC",
        "MySQL CDC 实时同步",
        "持续导入",
        "全量加增量同步",
        "自动建表"
    ]
}
---

<!-- 知识类型: 操作步骤 + 配置参数 -->
<!-- 适用场景: MySQL 整库镜像同步到 Doris -->

库级同步通过原生 `FROM MYSQL (...) TO DATABASE (...)` DDL 实现，**以库为同步单位，目标是一个 Doris database 容器**。可以通过 `include_tables` 控制同步一张、多张或全部表，首次同步时 Doris 会自动创建下游主键表，并保持主键与上游一致。适用于不需要对数据做 SQL 加工、希望下游表结构自动跟随上游的镜像复制场景。

通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 能力，Doris 从 MySQL 读取变更日志，将一组表的全量 + 增量数据通过 Stream Load 持续写入 Doris。若需要在同步过程中做列映射、过滤或数据转换，请参考 [MySQL 表级同步](./continuous-load-mysql-table.md)。

### 适用场景

- 需要将 MySQL 中一组表（或整库）镜像复制到 Doris。
- 希望下游表结构和主键自动跟随上游创建，无需手动建表。
- 同步过程中无需做列映射、过滤或数据转换。
- 既要支持首次全量初始化，又要持续接收增量变更。

### 能力与限制

| 项目             | 说明                                                  |
| ---------------- | ----------------------------------------------------- |
| 一致性语义       | 当前仅保证 at-least-once 语义                         |
| 表类型           | 仅支持主键表（Unique Key）同步                        |
| 权限要求         | 需要 Load 权限；下游表不存在时还需 Create 权限        |
| 自动建表行为     | 若目标表已存在则跳过创建，可按需自定义表结构          |
| 数据加工         | 不支持列映射、过滤、转换；如需请改用表级同步          |

## 前置准备

在创建库级同步作业前，请确认以下事项：

1. 已部署 Doris 集群，并具备 Load 权限（自动建表场景还需 Create 权限）。
2. 已上传与 MySQL 版本兼容的 JDBC 驱动 jar 包，并可通过文件名、本地绝对路径或 HTTP 地址引用，详见 [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)。
3. MySQL 已开启 binlog，且账号具有读取 binlog 的权限。
4. 明确同步范围：是同步整库还是 `include_tables` 中指定的若干张表。

## 快速上手

<!-- 知识类型: 操作步骤 -->

### 第一步：创建导入作业

使用 [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) 创建持续导入作业：

```sql
CREATE JOB multi_table_sync
ON STREAMING
FROM MYSQL (
        "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
        "driver_url" = "mysql-connector-java-8.0.25.jar",
        "driver_class" = "com.mysql.cj.jdbc.Driver",
        "user" = "root",
        "password" = "123456",
        "database" = "test",
        "include_tables" = "user_info,order_info",
        "offset" = "initial"
)
TO DATABASE target_test_db (
    "table.create.properties.replication_num" = "1"  -- 单 BE 部署时需要设置为 1
)
```

上述示例的关键点：

- `database` 指定上游 MySQL 数据库；`include_tables` 用于限定要同步的表，多个表用逗号分隔，留空表示同步整库。
- `offset = "initial"` 表示先做全量初始化再切换到增量；如果只需要增量，可改为 `latest`。
- `TO DATABASE target_test_db` 指定下游 Doris 数据库；通过 `table.create.properties.*` 控制自动建表的表属性（如副本数）。

### 第二步：查看导入状态

通过 `jobs("type"="insert")` 表函数查询 Streaming Job 的运行状态：

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING"
             Id: 1765332859199
             Name: mysql_db_sync
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: FROM MYSQL('include_tables'='user_info','database'='test','driver_class'='com.mysql.cj.jdbc.Driver','driver_url'='mysql-connector-java-8.0.25.jar','offset'='initial','jdbc_url'='jdbc:mysql://127.0.0.1:3306','user'='root' ) TO DATABASE target_test_db ('table.create.properties.replication_num'='1')
       CreateTime: 2025-12-10 10:19:35
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: 
       Properties: \N
    CurrentOffset: {"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","splitId":"binlog-split","row":"1","event":"2","server_id":"1"}
        EndOffset: \N
    LoadStatistic: {"scannedRows":24,"loadBytes":1146,"fileNumber":0,"fileSize":0}
         ErrorMsg: \N
```

关注字段说明：

- `Status`：作业整体状态（如 `RUNNING`）。
- `CurrentOffset`：当前消费到的 binlog 位点，可用于排查同步进度。
- `LoadStatistic`：扫描行数、写入字节数等导入统计信息。
- `ErrorMsg`：错误信息，作业异常时排障的首要依据。

### 第三步：修改导入作业

如需更新数据源连接信息（例如账号密码轮换），可通过 `ALTER JOB` 修改：

```sql
ALTER JOB <job_name>
FROM MYSQL (
    "user" = "root",
    "password" = "123456"
)
TO DATABASE target_test_db
```

更多通用操作（暂停、恢复、删除、查看 Task 等）请参考[持续导入概览](./continuous-load-overview.md)。

## 数据源参数

<!-- 知识类型: 配置参数 -->

MySQL 源端 (`FROM MYSQL`) 支持的参数如下：

| 参数                 | 默认值  | 说明                                                                                                                |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| jdbc_url             | -       | MySQL JDBC 连接串                                                                                                   |
| driver_url           | -       | JDBC 驱动 jar 包路径，支持文件名、本地绝对路径和 HTTP 地址三种方式，详见 [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) |
| driver_class         | -       | JDBC 驱动类名                                                                                                       |
| user                 | -       | 数据库用户名                                                                                                        |
| password             | -       | 数据库密码                                                                                                          |
| database             | -       | 数据库名                                                                                                            |
| include_tables       | -       | 需要同步的表名，多个表用逗号分隔，不填默认所有的表                                                                  |
| offset               | initial | `initial`：全量 + 增量同步；`latest`：仅增量同步                                                                    |
| snapshot_split_size  | 8096    | split 的大小（行数），全量同步时，表会被切分成多个 split 进行同步                                                   |
| snapshot_parallelism | 1       | 全量阶段同步的并行度，即单次 Task 最多调度的 split 数量                                                             |

## 参考手册

### 导入命令

<!-- 知识类型: 语法参考 -->

创建库级同步作业语法如下：

```sql
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
FROM MYSQL (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
)
```

各模块说明：

| 模块              | 说明                          |
| ----------------- | ----------------------------- |
| job_name          | 任务名                        |
| job_properties    | 用于指定 Job 的通用导入参数   |
| comment           | 用于描述 Job 作业的备注信息   |
| source_properties | MySQL 源端相关参数            |
| target_properties | Doris 目标库相关参数          |

### Doris 目标库端配置参数

<!-- 知识类型: 配置参数 -->

`TO DATABASE` 支持以下参数：

| 参数                      | 默认值 | 说明                                                                                                                                                                                                              |
| ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| table.create.properties.* | -      | 支持创建表的时候指定 table 的 properties，比如 `replication_num`                                                                                                                                                  |
| load.strict_mode          | -      | 是否开启严格模式，默认为关闭                                                                                                                                                                                      |
| load.max_filter_ratio     | -      | 采样窗口内，允许的最大过滤率。必须在大于等于 0 到小于等于 1 之间。默认值是 0，表示零容忍。采样窗口为 `max_interval * 10`。即如果在采样窗口内，错误行数/总行数大于 `max_filter_ratio`，则会导致例行作业被暂停，需要人工介入检查数据质量问题。 |

## FAQ

<!-- 知识类型: FAQ -->

**Q1：库级同步是否支持非主键表？**

不支持。当前库级同步只支持主键表（Unique Key），首次同步时 Doris 会按上游主键自动创建下游主键表。

**Q2：目标表已存在，会被覆盖吗？**

不会。自动建表阶段如果目标表已存在则会跳过，用户可以根据不同的场景自定义表结构。

**Q3：如何只同步增量数据，不做全量初始化？**

将参数 `offset` 设置为 `latest`，作业将跳过全量阶段，直接从最新 binlog 位点开始消费。

**Q4：库级同步与表级同步如何选择？**

- 需要镜像复制、自动建表、保持表结构与上游一致：使用库级同步。
- 需要列映射、过滤或数据转换：使用 [MySQL 表级同步](./continuous-load-mysql-table.md)。

**Q5：单 BE 部署时建表失败怎么办？**

在 `TO DATABASE` 中显式指定副本数为 1：`"table.create.properties.replication_num" = "1"`。

## Troubleshooting

<!-- 知识类型: 故障排查 -->

| 现象                       | 可能原因                                          | 排查与解决                                                                              |
| -------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 作业创建失败，提示无权限   | 当前用户缺少 Load 或 Create 权限                  | 给执行账号授予 Load 权限；自动建表场景需要额外的 Create 权限                            |
| 全量同步速度慢             | `snapshot_parallelism` 过小，或 split 切分过大    | 适当调大 `snapshot_parallelism`；按表行数调整 `snapshot_split_size`                     |
| 作业被暂停，数据质量问题   | 错误行占比超过 `load.max_filter_ratio`            | 查看 `ErrorMsg` 字段定位脏数据；调整 `load.strict_mode` 或 `load.max_filter_ratio`      |
| 自动建表副本数报错         | 单 BE 部署但默认副本数为 3                        | 设置 `table.create.properties.replication_num = 1`                                      |
| 增量数据未到达 Doris       | MySQL binlog 未开启或账号无 binlog 权限           | 在 MySQL 端开启 binlog，并为同步账号授予 `REPLICATION SLAVE`、`REPLICATION CLIENT` 权限 |

## 相关文档

- [持续导入概览](./continuous-load-overview.md)
- [MySQL 表级同步](./continuous-load-mysql-table.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
- [Flink CDC](https://github.com/apache/flink-cdc)
