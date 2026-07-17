---
{
    "title": "MySQL CDC SQL 映射同步",
    "language": "zh-CN",
    "sidebar_label": "SQL 映射同步",
    "description": "介绍如何通过 Doris Streaming Job 和 CDC Stream TVF 将 MySQL 单表数据持续同步到 Doris，涵盖 SQL 列映射、过滤与转换、全量和增量位点、并行快照、SSL 以及删除标记参数。",
    "keywords": [
        "MySQL 同步 Doris",
        "SQL 映射同步",
        "CDC Stream TVF",
        "Streaming Job",
        "Binlog 增量同步",
        "exactly-once",
        "Flink CDC",
        "INSERT INTO SELECT"
    ]
}
---

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: MySQL 单表实时同步到 Doris，需要列映射或数据转换 -->

SQL 映射同步通过 Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) 实现，目标是一张**已存在**的 Doris 表（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`）。借助 Doris SQL 的表达能力，可以在同步链路中进行列映射、过滤和数据转换，适用于对数据需要做加工的实时同步场景。

> SQL 映射同步自 4.1.0 版本起支持。

通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 的读取能力，Doris 从 MySQL 读取变更日志（Binlog），完成源表到目标表的**全量 + 增量**同步。若希望 Doris 自动创建下游表、按库为单位同步一组表，请参考 [MySQL CDC 自动建表同步](./continuous-load-mysql-database.md)。

### 适用场景

- MySQL 单表持续同步到 Doris，目标表已规划好结构
- 同步过程中需要进行列裁剪、列映射、字段重命名或数据转换
- 需要保证端到端 exactly-once 语义的实时数据集成

### 前置条件

| 检查项 | 说明 |
| ------ | ---- |
| Doris 版本 | 4.1.0 及以上 |
| 表类型 | 上游源表必须有主键；Doris 目标表仅支持主键模型表（Unique Key） |
| 用户权限 | 需要 `Load` 权限 |
| MySQL 配置 | 需要在 MySQL 端开启 Binlog，参考[配置指南](./continuous-load-overview.md#支持的数据源与同步模式) |
| 语义保证 | 支持 exactly-once 语义 |

## 快速上手

下面以一个最小可运行示例展示完整流程：创建作业 → 查看状态。

### 步骤 1：创建导入作业

使用 [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) 创建持续导入作业：

```sql
CREATE JOB mysql_single_sync
ON STREAMING
DO
INSERT INTO db1.tbl1
SELECT * FROM cdc_stream(
    "type" = "mysql",
    "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
    "driver_url" = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user" = "root",
    "password" = "123456",
    "database" = "source_db",
    "table" = "source_table",
    "offset" = "initial"
)
```

### 步骤 2：查看导入状态

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

### 步骤 3：作业运维

更多通用操作（暂停、恢复、删除、查看 Task 等）请参考[持续导入概览](./continuous-load-overview.md)。

## 参数说明

### 数据源参数

CDC Stream TVF 支持以下 MySQL 数据源参数。

| 参数 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | 是 | - | 数据源类型，填写 `mysql`。 |
| `jdbc_url` | 是 | - | MySQL JDBC 连接串。 |
| `driver_url` | 是 | - | JDBC 驱动 jar 包路径，支持文件名、本地绝对路径和 HTTP 地址，详见 [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)。 |
| `driver_class` | 是 | - | JDBC 驱动类名，例如 `com.mysql.cj.jdbc.Driver`。 |
| `user` | 是 | - | 数据库用户名。 |
| `password` | 是 | - | 数据库密码。 |
| `database` | 是 | - | MySQL 数据库名。 |
| `table` | 是 | - | 需要同步的表名。SQL Mapping 每个作业只支持一张源表。 |
| `offset` | 是 | - | 启动位点。`initial`：全量 + 增量同步；`snapshot`：仅全量同步；`earliest`：从当前可用的最早 Binlog 位点开始；`latest`：仅同步作业启动后的增量；也可设置 JSON 精确位点，例如 `{"file":"binlog.000001","pos":"154"}` 或 `{"gtids":"<gtid_set>"}`。 |
| `snapshot_split_size` | 否 | `8096` | split 的大小（行数）。全量同步时，表会被切分成多个 split。必须为正整数。 |
| `snapshot_parallelism` | 否 | `1` | 全量阶段的并行度，即单次 Task 最多调度的 split 数量。必须为正整数。 |
| `skip_snapshot_backfill` | 否 | `false` | 是否跳过快照期间的 Binlog 回填。设置为 `true` 时采用 at-least-once 语义。 |
| `server_id` | 否 | 自动生成 | MySQL CDC reader 的 server ID。支持单值（如 `5400`）或闭区间（如 `5400-5408`）；区间宽度必须大于等于 `snapshot_parallelism`。 |
| `ssl_mode` | 否 | `disable` | SSL 模式，可选值为 `disable`、`require`、`verify-ca`。 |
| `ssl_rootcert` | 条件必填 | - | CA 证书文件，格式为 `FILE:<file_name>`。`ssl_mode` 为 `verify-ca` 时必填；文件需先通过 [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) 上传。 |
| `include_delete_sign` | 否 | `false` | 是否让 TVF 额外输出 `__DORIS_DELETE_SIGN__` 列。需要把源端 DELETE 同步为 Doris 主键表删除操作时设置为 `true`。 |

启用 `include_delete_sign` 时，目标表必须为 Merge-on-Write 主键表，并在 INSERT 目标列和 SELECT 列表中显式映射 `__DORIS_DELETE_SIGN__`：

```sql
CREATE JOB mysql_cdc_with_delete
ON STREAMING
DO
INSERT INTO db1.target_table (id, value, __DORIS_DELETE_SIGN__)
SELECT id, value, __DORIS_DELETE_SIGN__
FROM cdc_stream(
    "type" = "mysql",
    "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
    "driver_url" = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user" = "root",
    "password" = "123456",
    "database" = "source_db",
    "table" = "source_table",
    "offset" = "initial",
    "include_delete_sign" = "true"
);
```

### Job 配置参数

以下参数通过 `CREATE JOB ... PROPERTIES (...)` 设置：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `max_interval` | `10` | 上游没有新增数据时的空闲调度间隔，单位为秒；必须为不小于 1 的整数。 |
| `compute_group` | 当前会话或用户默认计算组 | 仅存算分离模式支持。指定作业运行的计算组，用户必须具有该计算组的 USAGE 权限。 |
| `session.<variable_name>` | 对应会话变量的默认值 | 为 INSERT 任务设置会话变量，导入变量可参考 [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#导入配置参数)。 |

通过 `ALTER JOB` 重置 CDC 位点时使用的 Job Property `offset` 及完整限制见[持续导入概览](./continuous-load-overview.md#job-通用导入配置参数)。创建作业的初始位点必须在 `cdc_stream(...)` 中设置。

## FAQ

**Q1：SQL 映射同步与自动建表同步的区别？**

- SQL 映射同步：目标 Doris 表需**预先创建**，支持列映射和数据转换，适合精细化加工场景。
- 自动建表同步：Doris **自动创建**下游表，按库为单位整体同步，详见 [MySQL CDC 自动建表同步](./continuous-load-mysql-database.md)。

**Q2：是否支持非主键表作为目标表？**

上游源表必须有主键，Doris 目标表目前仅支持主键模型表（Unique Key）。

**Q3：如何只同步增量数据，不要历史全量？**

将 `offset` 参数设置为 `latest`，作业将跳过全量阶段，仅同步 Binlog 增量数据。

**Q4：全量同步太慢如何优化？**

可调整以下两个参数提升全量阶段吞吐：

- `snapshot_split_size`：增大单个 split 的行数。
- `snapshot_parallelism`：提高单次 Task 调度的 split 并行度。

调整 `snapshot_parallelism` 时，如果同时设置了 `server_id` 范围，需要确保范围内的 ID 数量不少于并行度。

## 相关文档

- [持续导入概览](./continuous-load-overview.md)
- [MySQL CDC 自动建表同步](./continuous-load-mysql-database.md)
- [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md)
