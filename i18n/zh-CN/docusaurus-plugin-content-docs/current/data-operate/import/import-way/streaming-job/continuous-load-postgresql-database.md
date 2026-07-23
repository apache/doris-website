---
{
    "title": "PostgreSQL CDC 自动建表同步",
    "language": "zh-CN",
    "sidebar_label": "自动建表同步",
    "description": "介绍如何通过 Doris Streaming Job 将 PostgreSQL 主键表的全量与增量数据持续同步到 Doris，涵盖自动建表、表过滤与重命名、列排除、逻辑复制槽与发布、SSL 和数据质量参数。",
    "keywords": [
        "PostgreSQL 同步",
        "PostgreSQL CDC",
        "自动建表同步",
        "整库同步",
        "Streaming Job",
        "Flink CDC",
        "Doris 数据导入",
        "PostgreSQL to Doris",
        "全量增量同步",
        "自动建表"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 将 PostgreSQL 整库数据持续同步到 Doris -->

自动建表同步通过原生 `FROM POSTGRES (...) TO DATABASE (...)` DDL 实现，目标为一个 Doris 数据库，Doris 会根据上游表结构自动创建对应的下游表。可以通过 `include_tables` 控制同步一张、多张或全部表，首次同步时 Doris 会自动创建下游主键表，并保持主键与上游一致。该方式适用于不需要对数据做 SQL 加工、希望下游表结构自动跟随上游的镜像复制场景。

通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 能力，Doris 从 PostgreSQL 读取变更日志，将一组表的全量 + 增量数据通过 Stream Load 持续写入 Doris。自动建表同步支持为单张源表指定目标表名或排除非主键列；若需要 SQL 表达式、行过滤或数据转换，请参考 [PostgreSQL CDC SQL 映射同步](./continuous-load-postgresql-table.md)。

### 适用场景

-   将 PostgreSQL 整库或多张表镜像复制到 Doris
-   下游表结构希望与上游保持一致，无需手工建表
-   只需要简单的目标表重命名或列裁剪，无需 SQL 表达式、行过滤或数据转换
-   既需要全量初始化，又需要持续捕获增量变更

### 注意事项

1.  目前只能保证 at-least-once 语义。
2.  仅支持同步有主键的上游表，自动创建的下游表为主键模型表（Unique Key）。
3.  需要 Load 权限，若下游表不存在还需有 Create 权限。
4.  自动创建表阶段，如果目标表已存在则会跳过，用户可以根据不同的场景自定义表。

## 快速上手

<!-- 知识类型: 操作步骤 -->

按以下步骤即可完成一次 PostgreSQL 自动建表同步作业的创建和状态检查。

### 步骤 1：创建导入作业

使用 [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) 创建持续导入作业：

```sql
CREATE JOB test_postgres_job
ON STREAMING
FROM POSTGRES (
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "database" = "postgres",
    "schema" = "public",
    "include_tables" = "test_tbls",
    "offset" = "latest"
)
TO DATABASE target_test_db (
  "table.create.properties.replication_num" = "1"  -- 单BE部署时需要设置为1
)
```

### 步骤 2：查看导入状态

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

更多通用操作（暂停、恢复、删除、查看 Task 等）请参考[持续导入概览](./continuous-load-overview.md)。

## 参数参考

<!-- 知识类型: 配置参数 -->

### 数据源参数（PostgreSQL 端）

PostgreSQL 源端参数用于配置 JDBC 连接、同步范围以及全量切片行为。连接信息、驱动信息、`database` 和 `schema` 均为必填项。

| 参数 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `jdbc_url` | 是 | - | PostgreSQL JDBC 连接串。 |
| `driver_url` | 是 | - | JDBC 驱动 jar 包路径，支持文件名、本地绝对路径和 HTTP 地址，详见 [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)。 |
| `driver_class` | 是 | - | JDBC 驱动类名，例如 `org.postgresql.Driver`。 |
| `user` | 是 | - | 数据库用户名。 |
| `password` | 是 | - | 数据库密码。 |
| `database` | 是 | - | PostgreSQL 数据库名，并应与 JDBC URL 中的数据库名一致。UTF-8 编码后不能超过 63 字节。 |
| `schema` | 是 | - | Schema 名称。 |
| `include_tables` | 否 | - | 需要同步的表名，多个表用逗号分隔；不设置时同步 Schema 中的所有表。 |
| `exclude_tables` | 否 | - | 不同步的表名，多个表用逗号分隔。仅当未设置 `include_tables` 时生效。 |
| `table.<table_name>.target_table` | 否 | 源表名 | 自 4.1.0 版本起支持。为指定源表设置 Doris 目标表名，`<table_name>` 使用源表名。 |
| `table.<table_name>.exclude_columns` | 否 | - | 自 4.1.0 版本起支持。指定源表中不同步的列，多个列用逗号分隔。列必须存在，且不能排除主键列。 |
| `offset` | 否 | `latest` | 启动位点。`initial`：全量 + 增量同步；`latest`：仅同步作业启动后的增量；也可设置 JSON 精确位点，例如 `{"lsn":"12345678"}`。自 4.1.0 版本起支持 `snapshot`，表示仅全量同步。PostgreSQL 不支持 `earliest`。 |
| `snapshot_split_size` | 否 | `8096` | split 的大小（行数）。全量同步时，表会被切分成多个 split。必须为正整数。 |
| `snapshot_parallelism` | 否 | `1` | 全量阶段的并行度，即单次 Task 最多调度的 split 数量。必须为正整数。 |
| `slot_name` | 否 | `doris_cdc_<job_id>` | 自 4.1.0 版本起支持。逻辑复制槽名称。名称只能包含小写字母、数字和下划线，不能以数字开头，最长 63 个字符。自定义复制槽必须预先创建，且不会由 Doris 删除。 |
| `publication_name` | 否 | `doris_pub_<job_id>` | 自 4.1.0 版本起支持。发布名称，命名规则与 `slot_name` 相同。自定义发布必须预先创建并包含所有同步表，且不会由 Doris 删除。 |
| `ssl_mode` | 否 | `disable` | 自 4.1.0 版本起支持。SSL 模式，可选值为 `disable`、`require`、`verify-ca`。 |
| `ssl_rootcert` | 条件必填 | - | 自 4.1.0 版本起支持。CA 证书文件，格式为 `FILE:<file_name>`。`ssl_mode` 为 `verify-ca` 时必填；文件需先通过 [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) 上传。 |

如果同时设置 `include_tables` 和 `exclude_tables`，以 `include_tables` 为准。以下 `FROM POSTGRES` 参数片段同步 `orders` 和 `customers`，将 `orders` 写入 `ods_orders` 并排除非主键列 `internal_note`，同时使用预先创建的逻辑复制资源和 CA 校验：

```sql
"include_tables" = "orders,customers",
"table.orders.target_table" = "ods_orders",
"table.orders.exclude_columns" = "internal_note",
"slot_name" = "orders_slot",
"publication_name" = "orders_publication",
"ssl_mode" = "verify-ca",
"ssl_rootcert" = "FILE:ca.pem"
```

自定义复制槽和发布由用户管理，删除 Streaming Job 时 Doris 会保留它们。省略 `slot_name` 或 `publication_name` 时，Doris 会为作业创建对应资源，并在删除作业时清理自己创建的资源。

### Doris 目标库端配置参数

目标端参数用于控制自动建表的属性以及 Stream Load 写入策略，以下参数均为可选。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `table.create.properties.*` | - | 创建 Doris 表时附加的表属性，例如 `table.create.properties.replication_num`。 |
| `load.strict_mode` | `false` | 是否为 Stream Load 写入开启严格模式，取值为 `true` 或 `false`。 |
| `load.max_filter_ratio` | `0` | 采样窗口内允许的最大过滤率，取值范围为 `[0, 1]`；`0` 表示不允许过滤错误行。采样窗口为 `max_interval * 10` 秒，窗口内错误行数与总行数之比超过该值时，作业会暂停。 |

## 参考手册

<!-- 知识类型: 语法参考 -->

### 导入命令语法

创建自动建表同步作业语法如下：

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
[ COMMENT <comment> ]
FROM POSTGRES (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
)
```

各模块说明如下：

| 模块              | 说明                          |
| ----------------- | ----------------------------- |
| job_name          | 任务名                        |
| job_properties    | 用于指定 Job 的通用导入参数   |
| comment           | 用于描述 Job 作业的备注信息   |
| source_properties | PostgreSQL 源端相关参数       |
| target_properties | Doris 目标库相关参数          |

`job_properties` 支持 `max_interval` 和 `compute_group`，详见[持续导入概览](./continuous-load-overview.md#job-通用导入配置参数)。自动建表模式不使用 `session.*`。

## FAQ

<!-- 知识类型: 常见问题 -->

**Q1：自动建表同步与 SQL 映射同步如何选择？**

-   需要镜像复制、自动建表，或只需目标表重命名、排除非主键列时，使用自动建表同步。
-   需要在同步链路中使用 SQL 表达式、行过滤或数据转换时，使用 [PostgreSQL CDC SQL 映射同步](./continuous-load-postgresql-table.md)。

**Q2：是否支持非主键表同步？**

目前只支持主键表同步，非主键表暂不支持。

**Q3：单 BE 部署时建表失败怎么办？**

需要在 `TO DATABASE` 子句中显式设置 `"table.create.properties.replication_num" = "1"`，避免默认副本数与可用 BE 数量不匹配。

**Q4：目标表已经存在，会被覆盖吗？**

不会。自动建表阶段会跳过已存在的目标表，用户可以根据需要提前自定义表结构。

**Q5：如何只同步增量数据，跳过全量阶段？**

将 `offset` 设置为 `latest`，作业将只消费最新的增量变更，不再执行全量初始化。

## 相关文档

-   [PostgreSQL CDC SQL 映射同步](./continuous-load-postgresql-table.md)
-   [持续导入概览](./continuous-load-overview.md)
-   [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
-   [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
