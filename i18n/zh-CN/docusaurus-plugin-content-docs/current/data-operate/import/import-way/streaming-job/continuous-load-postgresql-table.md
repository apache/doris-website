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

SQL 映射同步通过 Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) 实现，目标是一张已存在的 Doris 表（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`），借助 Doris SQL 的表达能力支持列映射、过滤和数据转换，适用于对数据需要做加工的实时同步场景。

> SQL 映射同步自 4.1.0 版本起支持。

通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 的读取能力，Doris 从 PostgreSQL 读取变更日志（WAL），实现源表到目标表的全量 + 增量同步。若希望 Doris 自动创建下游表、按库为单位同步一组表，请参考 [PostgreSQL CDC 自动建表同步](./continuous-load-postgresql-database.md)。

### 适用场景

-   单表实时入仓，且需要在写入前做列裁剪、过滤或表达式转换。
-   下游 Doris 表已存在，希望由 SQL 显式控制字段映射关系。
-   对一致性要求较高，需要 exactly-once 语义。

### 使用前提

在创建作业前，请先确认以下条件：

1. 已在 PostgreSQL 端开启逻辑复制，详见[配置指南](./continuous-load-overview.md#支持的数据源与同步模式)。
2. 当前用户具有 `Load` 权限。
3. 源表为主键表（目前仅支持主键表同步）。
4. 已在 Doris 中预先创建好主键模型目标表（Unique Key），且表结构与映射 SQL 兼容。

### 注意事项

-   支持 exactly-once 语义。
-   目前只支持主键表同步。
-   需要 `Load` 权限。
-   需要在 PostgreSQL 端开启逻辑复制，请参考[配置指南](./continuous-load-overview.md#支持的数据源与同步模式)。

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

| 参数 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | 是 | - | 数据源类型，填写 `postgres`。 |
| `jdbc_url` | 是 | - | PostgreSQL JDBC 连接串。 |
| `driver_url` | 是 | - | JDBC 驱动 jar 包路径，支持文件名、本地绝对路径和 HTTP 地址，详见 [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)。 |
| `driver_class` | 是 | - | JDBC 驱动类名，例如 `org.postgresql.Driver`。 |
| `user` | 是 | - | 数据库用户名。 |
| `password` | 是 | - | 数据库密码。 |
| `database` | 否 | JDBC URL 中的数据库名 | PostgreSQL 数据库名。显式设置时覆盖 JDBC URL 中的数据库名；UTF-8 编码后不能超过 63 字节。 |
| `schema` | 是 | - | Schema 名称。 |
| `table` | 是 | - | 需要同步的表名。SQL Mapping 每个作业只支持一张源表。 |
| `offset` | 是 | - | 启动位点。`initial`：全量 + 增量同步；`snapshot`：仅全量同步；`latest`：仅同步作业启动后的增量；也可设置 JSON 精确位点，例如 `{"lsn":"12345678"}`。PostgreSQL 不支持 `earliest`。 |
| `snapshot_split_size` | 否 | `8096` | split 的大小（行数）。全量同步时，表会被切分成多个 split。必须为正整数。 |
| `snapshot_parallelism` | 否 | `1` | 全量阶段的并行度，即单次 Task 最多调度的 split 数量。必须为正整数。 |
| `skip_snapshot_backfill` | 否 | `false` | 是否跳过快照期间的 WAL 回填。设置为 `true` 时采用 at-least-once 语义。 |
| `slot_name` | 否 | `doris_cdc_<job_id>` | 逻辑复制槽名称。名称只能包含小写字母、数字和下划线，不能以数字开头，最长 63 个字符。自定义复制槽必须预先创建，且不会由 Doris 删除。 |
| `publication_name` | 否 | `doris_pub_<job_id>` | 发布名称，命名规则与 `slot_name` 相同。自定义发布必须预先创建并包含当前源表，且不会由 Doris 删除。 |
| `ssl_mode` | 否 | `disable` | SSL 模式，可选值为 `disable`、`require`、`verify-ca`。 |
| `ssl_rootcert` | 条件必填 | - | CA 证书文件，格式为 `FILE:<file_name>`。`ssl_mode` 为 `verify-ca` 时必填；文件需先通过 [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) 上传。 |
| `include_delete_sign` | 否 | `false` | 是否让 TVF 额外输出 `__DORIS_DELETE_SIGN__` 列。需要把源端 DELETE 同步为 Doris 主键表删除操作时设置为 `true`。 |

启用 `include_delete_sign` 时，目标表必须为 Merge-on-Write 主键表，并在 INSERT 目标列和 SELECT 列表中显式映射 `__DORIS_DELETE_SIGN__`：

```sql
CREATE JOB pg_cdc_with_delete
ON STREAMING
DO
INSERT INTO db1.target_table (id, value, __DORIS_DELETE_SIGN__)
SELECT id, value, __DORIS_DELETE_SIGN__
FROM cdc_stream(
    "type" = "postgres",
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "schema" = "public",
    "table" = "source_table",
    "offset" = "initial",
    "include_delete_sign" = "true"
);
```

自定义 `slot_name` 或 `publication_name` 时，需要在创建 Job 前准备好相应资源；删除 Job 时 Doris 会保留用户提供的资源。

### Job 配置参数

以下参数通过 `CREATE JOB ... PROPERTIES (...)` 设置：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `max_interval` | `10` | 上游没有新增数据时的空闲调度间隔，单位为秒；必须为不小于 1 的整数。 |
| `compute_group` | 当前会话或用户默认计算组 | 仅存算分离模式支持。指定作业运行的计算组，用户必须具有该计算组的 USAGE 权限。 |
| `session.<variable_name>` | 对应会话变量的默认值 | 为 INSERT 任务设置会话变量，导入变量可参考 [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#导入配置参数)。 |

通过 `ALTER JOB` 重置 CDC 位点时使用的 Job Property `offset` 及完整限制见[持续导入概览](./continuous-load-overview.md#job-通用导入配置参数)。创建作业的初始位点必须在 `cdc_stream(...)` 中设置。
