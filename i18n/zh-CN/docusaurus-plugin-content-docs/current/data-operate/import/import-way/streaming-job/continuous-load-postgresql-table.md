---
{
    "title": "PostgreSQL CDC SQL 映射同步",
    "language": "zh-CN",
    "sidebar_label": "SQL 映射同步",
    "description": "使用 Doris Job + CDC Stream TVF 将 PostgreSQL 表持续同步到 Doris，支持列映射、数据转换与 exactly-once 语义。",
    "keywords": [
        "PostgreSQL CDC",
        "PostgreSQL 实时同步",
        "Doris CDC Stream",
        "WAL 增量同步",
        "Flink CDC",
        "exactly-once",
        "Streaming Job",
        "SQL 映射同步"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: PostgreSQL 实时数据同步 / 单表 SQL 映射 CDC 接入 -->

SQL 映射同步通过 Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) 实现，目标是一张已存在的 Doris 表（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`），借助 Doris SQL 的表达能力支持列映射、过滤和数据转换，保证 exactly-once 语义。适用于对数据需要做加工的实时同步场景。

通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 的读取能力，Doris 从 PostgreSQL 读取变更日志（WAL），实现源表到目标表的全量 + 增量同步。若希望 Doris 自动创建下游表、按库为单位同步一组表，请参考 [PostgreSQL CDC 自动建表同步](./continuous-load-postgresql-database.md)。

### 适用场景

-   单表实时入仓，且需要在写入前做列裁剪、过滤或表达式转换。
-   下游 Doris 表已存在，希望由 SQL 显式控制字段映射关系。
-   对一致性要求较高，需要 exactly-once 语义。

### 使用前提

在创建作业前，请先确认以下条件：

1. 已在 PostgreSQL 端开启逻辑复制，详见[配置指南](./continuous-load-overview.md)。
2. 当前用户具有 `Load` 权限。
3. 源表为主键表（目前仅支持主键表同步）。
4. 已在 Doris 中预先创建好目标表，且表结构与映射 SQL 兼容。

### 注意事项

-   支持 exactly-once 语义。
-   目前只支持主键表同步。
-   需要 `Load` 权限。
-   需要在 PostgreSQL 端开启逻辑复制，请参考[配置指南](./continuous-load-overview.md)。

## 快速上手

整体流程分为两步：创建持续导入作业、查看作业运行状态。

### 步骤 1：创建导入作业

使用 [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) 创建持续导入作业，将 PostgreSQL 中 `public.source_table` 同步到 Doris 的 `db1.tbl1`：

```sql
CREATE JOB pg_single_sync
ON STREAMING
DO
INSERT INTO db1.tbl1
SELECT * FROM cdc_stream(
    "type" = "postgres",
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "database" = "postgres",
    "schema" = "public",
    "table" = "source_table",
    "offset" = "initial"
)
```

### 步骤 2：查看导入状态

通过 `jobs` 表函数查看 Streaming 类型作业的运行状态：

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

更多通用操作（暂停、恢复、删除、查看 Task 等）请参考[持续导入概览](./continuous-load-overview.md)。

## 参数说明

<!-- 知识类型: 配置参数 -->

### 数据源参数

数据源参数通过 `cdc_stream(...)` TVF 配置，用于描述待同步的 PostgreSQL 表与读取行为。

| 参数                 | 默认值  | 说明                                                                                                                              |
| -------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| type                 | -       | 数据源类型，填写 `postgres`                                                                                                       |
| jdbc_url             | -       | PostgreSQL JDBC 连接串                                                                                                            |
| driver_url           | -       | JDBC 驱动 jar 包路径，支持文件名、本地绝对路径和 HTTP 地址三种方式，详见 [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) |
| driver_class         | -       | JDBC 驱动类名                                                                                                                     |
| user                 | -       | 数据库用户名                                                                                                                      |
| password             | -       | 数据库密码                                                                                                                        |
| database             | -       | 数据库名                                                                                                                          |
| schema               | -       | Schema 名称                                                                                                                       |
| table                | -       | 需要同步的表名                                                                                                                    |
| offset               | initial | `initial`：全量 + 增量同步；`latest`：仅增量同步                                                                                  |
| snapshot_split_size  | 8096    | split 的大小（行数）。全量同步时，表会被切分成多个 split 进行同步                                                                 |
| snapshot_parallelism | 1       | 全量阶段同步的并行度，即单次 Task 最多调度的 split 数量                                                                           |

### 导入配置参数

导入配置参数通过 Job 的 `job_properties` 设置，用于控制导入行为与会话变量。

| 参数      | 默认值 | 说明                                                                                                                                                                |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| session.* | 无     | 支持在 `job_properties` 上配置所有的 session 变量，导入变量可参考 [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#导入配置参数) |

更多通用参数（如 `max_interval` 等）请参考[持续导入概览](./continuous-load-overview.md#通用参数)。
