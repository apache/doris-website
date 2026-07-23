---
{
    "title": "MySQL CDC 自动建表同步",
    "language": "zh-CN",
    "sidebar_label": "自动建表同步",
    "description": "介绍如何通过 Doris Streaming Job 将 MySQL 主键表的全量与增量数据持续同步到 Doris，涵盖自动建表、表过滤与重命名、列排除、启动位点、并行快照、SSL 和数据质量参数。",
    "keywords": [
        "MySQL 自动建表同步",
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

自动建表同步通过原生 `FROM MYSQL (...) TO DATABASE (...)` DDL 实现，目标为一个 Doris 数据库，Doris 会根据上游表结构自动创建对应的下游表。可以通过 `include_tables` 控制同步一张、多张或全部表，首次同步时 Doris 会自动创建下游主键表，并保持主键与上游一致。适用于不需要对数据做 SQL 加工、希望下游表结构自动跟随上游的镜像复制场景。

通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 能力，Doris 从 MySQL 读取变更日志，将一组表的全量 + 增量数据通过 Stream Load 持续写入 Doris。自动建表同步支持为单张源表指定目标表名或排除非主键列；若需要 SQL 表达式、行过滤或数据转换，请参考 [MySQL CDC SQL 映射同步](./continuous-load-mysql-table.md)。

### 适用场景

- 需要将 MySQL 中一组表（或整库）镜像复制到 Doris。
- 希望下游表结构和主键自动跟随上游创建，无需手动建表。
- 只需要简单的目标表重命名或列裁剪，无需 SQL 表达式、行过滤或数据转换。
- 既要支持首次全量初始化，又要持续接收增量变更。

### 能力与限制

| 项目             | 说明                                                  |
| ---------------- | ----------------------------------------------------- |
| 一致性语义       | 当前仅保证 at-least-once 语义                         |
| 表类型           | 仅支持同步有主键的上游表；自动创建的下游表为主键模型表（Unique Key） |
| 权限要求         | 需要 Load 权限；下游表不存在时还需 Create 权限        |
| 自动建表行为     | 若目标表已存在则跳过创建，可按需自定义表结构          |
| 数据加工         | 支持目标表重命名和排除非主键列；不支持 SQL 表达式、行过滤或数据转换 |

## 前置准备

在创建自动建表同步作业前，请确认以下事项：

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

MySQL 源端（`FROM MYSQL`）支持以下参数。连接信息、数据库名和驱动信息均为必填项。

| 参数 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `jdbc_url` | 是 | - | MySQL JDBC 连接串。 |
| `driver_url` | 是 | - | JDBC 驱动 jar 包路径，支持文件名、本地绝对路径和 HTTP 地址，详见 [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)。 |
| `driver_class` | 是 | - | JDBC 驱动类名，例如 `com.mysql.cj.jdbc.Driver`。 |
| `user` | 是 | - | 数据库用户名。 |
| `password` | 是 | - | 数据库密码。 |
| `database` | 是 | - | MySQL 数据库名。 |
| `include_tables` | 否 | - | 需要同步的表名，多个表用逗号分隔；不设置时同步数据库中的所有表。 |
| `exclude_tables` | 否 | - | 不同步的表名，多个表用逗号分隔。仅当未设置 `include_tables` 时生效。 |
| `table.<table_name>.target_table` | 否 | 源表名 | 自 4.1.0 版本起支持。为指定源表设置 Doris 目标表名，`<table_name>` 使用源表名。 |
| `table.<table_name>.exclude_columns` | 否 | - | 自 4.1.0 版本起支持。指定源表中不同步的列，多个列用逗号分隔。列必须存在，且不能排除主键列。 |
| `offset` | 否 | `latest` | 启动位点。`initial`：全量 + 增量同步；`earliest`：从当前可用的最早 Binlog 位点开始；`latest`：仅同步作业启动后的增量；也可设置 JSON 精确位点，例如 `{"file":"binlog.000001","pos":"154"}` 或 `{"gtids":"<gtid_set>"}`。自 4.1.0 版本起支持 `snapshot`，表示仅全量同步。 |
| `snapshot_split_size` | 否 | `8096` | split 的大小（行数）。全量同步时，表会被切分成多个 split。必须为正整数。 |
| `snapshot_parallelism` | 否 | `1` | 全量阶段的并行度，即单次 Task 最多调度的 split 数量。必须为正整数。 |
| `server_id` | 否 | 自动生成 | 自 4.1.0 版本起支持。MySQL CDC reader 的 server ID。支持单值（如 `5400`）或闭区间（如 `5400-5408`）；区间宽度必须大于等于 `snapshot_parallelism`。 |
| `ssl_mode` | 否 | `disable` | 自 4.1.0 版本起支持。SSL 模式，可选值为 `disable`、`require`、`verify-ca`。 |
| `ssl_rootcert` | 条件必填 | - | 自 4.1.0 版本起支持。CA 证书文件，格式为 `FILE:<file_name>`。`ssl_mode` 为 `verify-ca` 时必填；文件需先通过 [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) 上传。 |

如果同时设置 `include_tables` 和 `exclude_tables`，以 `include_tables` 为准。以下 `FROM MYSQL` 参数片段同步 `orders` 和 `customers`，将 `orders` 写入 `ods_orders` 并排除非主键列 `internal_note`，同时启用 CA 校验：

```sql
"include_tables" = "orders,customers",
"table.orders.target_table" = "ods_orders",
"table.orders.exclude_columns" = "internal_note",
"server_id" = "5400-5403",
"ssl_mode" = "verify-ca",
"ssl_rootcert" = "FILE:ca.pem"
```

## 参考手册

### 导入命令

<!-- 知识类型: 语法参考 -->

创建自动建表同步作业语法如下：

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
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

`job_properties` 支持 `max_interval` 和 `compute_group`，详见[持续导入概览](./continuous-load-overview.md#job-通用导入配置参数)。自动建表模式不使用 `session.*`。

### Doris 目标库端配置参数

<!-- 知识类型: 配置参数 -->

`TO DATABASE` 支持以下可选参数：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `table.create.properties.*` | - | 创建 Doris 表时附加的表属性，例如 `table.create.properties.replication_num`。 |
| `load.strict_mode` | `false` | 是否为 Stream Load 写入开启严格模式，取值为 `true` 或 `false`。 |
| `load.max_filter_ratio` | `0` | 采样窗口内允许的最大过滤率，取值范围为 `[0, 1]`；`0` 表示不允许过滤错误行。采样窗口为 `max_interval * 10` 秒，窗口内错误行数与总行数之比超过该值时，作业会暂停。 |

## FAQ

<!-- 知识类型: FAQ -->

**Q1：自动建表同步是否支持非主键表？**

不支持。当前自动建表同步只支持主键表（Unique Key），首次同步时 Doris 会按上游主键自动创建下游主键表。

**Q2：目标表已存在，会被覆盖吗？**

不会。自动建表阶段如果目标表已存在则会跳过，用户可以根据不同的场景自定义表结构。

**Q3：如何只同步增量数据，不做全量初始化？**

将参数 `offset` 设置为 `latest`，作业将跳过全量阶段，直接从最新 binlog 位点开始消费。

**Q4：自动建表同步与 SQL 映射同步如何选择？**

- 需要镜像复制、自动建表、保持表结构与上游一致：使用自动建表同步。
- 只需目标表重命名或排除非主键列：使用自动建表同步。
- 需要 SQL 表达式、行过滤或数据转换：使用 [MySQL CDC SQL 映射同步](./continuous-load-mysql-table.md)。

**Q5：单 BE 部署时建表失败怎么办？**

在 `TO DATABASE` 中显式指定副本数为 1：`"table.create.properties.replication_num" = "1"`。

## 相关文档

- [持续导入概览](./continuous-load-overview.md)
- [MySQL CDC SQL 映射同步](./continuous-load-mysql-table.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
- [Flink CDC](https://github.com/apache/flink-cdc)
