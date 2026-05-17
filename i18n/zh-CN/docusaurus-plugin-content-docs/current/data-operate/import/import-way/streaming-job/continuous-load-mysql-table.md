---
{
    "title": "MySQL 表级同步",
    "language": "zh-CN",
    "sidebar_label": "表级同步",
    "description": "如何将 MySQL 单表数据持续同步到 Doris？通过 Job + CDC Stream TVF 实现表级实时同步，支持列映射与数据转换。",
    "keywords": [
        "MySQL 同步 Doris",
        "表级 CDC",
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

表级同步通过 Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) 实现，目标是一张**已存在**的 Doris 表（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`）。借助 Doris SQL 的表达能力，可以在同步链路中进行列映射、过滤和数据转换，并保证 exactly-once 语义。适用于对数据需要做加工的实时同步场景。

通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 的读取能力，Doris 从 MySQL 读取变更日志（Binlog），完成源表到目标表的**全量 + 增量**同步。若希望 Doris 自动创建下游表、按库为单位同步一组表，请参考 [MySQL 库级同步](./continuous-load-mysql-database.md)。

### 适用场景

- MySQL 单表持续同步到 Doris，目标表已规划好结构
- 同步过程中需要进行列裁剪、列映射、字段重命名或数据转换
- 需要保证端到端 exactly-once 语义的实时数据集成

### 前置条件

| 检查项 | 说明 |
| ------ | ---- |
| Doris 版本 | 4.1.0 及以上 |
| 表类型 | 目前仅支持**主键表**作为目标表 |
| 用户权限 | 需要 `Load` 权限 |
| MySQL 配置 | 需要在 MySQL 端开启 Binlog，参考[配置指南](./continuous-load-overview.md) |
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

CDC Stream TVF 支持的 MySQL 数据源参数如下：

| 参数                  | 默认值  | 说明                                                                                                                                            |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| type                  | -       | 数据源类型，填写 `mysql`                                                                                                                        |
| jdbc_url              | -       | MySQL JDBC 连接串                                                                                                                               |
| driver_url            | -       | JDBC 驱动 jar 包路径，支持文件名、本地绝对路径和 HTTP 地址三种方式，详见 [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) |
| driver_class          | -       | JDBC 驱动类名                                                                                                                                   |
| user                  | -       | 数据库用户名                                                                                                                                    |
| password              | -       | 数据库密码                                                                                                                                      |
| database              | -       | 数据库名                                                                                                                                        |
| table                 | -       | 需要同步的表名                                                                                                                                  |
| offset                | initial | `initial`：全量 + 增量同步；`latest`：仅增量同步                                                                                                |
| snapshot_split_size   | 8096    | split 的大小（行数）。全量同步时，表会被切分成多个 split 进行同步                                                                               |
| snapshot_parallelism  | 1       | 全量阶段同步的并行度，即单次 Task 最多调度的 split 数量                                                                                         |

### 导入配置参数

| 参数      | 默认值 | 说明                                                                                                                                                                  |
| --------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| session.* | 无     | 支持在 `job_properties` 上配置所有的 session 变量，导入变量可参考 [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#导入配置参数) |

更多通用参数（如 `max_interval` 等）请参考[持续导入概览](./continuous-load-overview.md#通用参数)。

## FAQ

**Q1：表级同步与库级同步的区别？**

- 表级同步：目标 Doris 表需**预先创建**，支持列映射和数据转换，适合精细化加工场景。
- 库级同步：Doris **自动创建**下游表，按库为单位整体同步，详见 [MySQL 库级同步](./continuous-load-mysql-database.md)。

**Q2：是否支持非主键表作为目标表？**

目前**仅支持主键表**作为目标表。

**Q3：如何只同步增量数据，不要历史全量？**

将 `offset` 参数设置为 `latest`，作业将跳过全量阶段，仅同步 Binlog 增量数据。

**Q4：全量同步太慢如何优化？**

可调整以下两个参数提升全量阶段吞吐：

- `snapshot_split_size`：增大单个 split 的行数。
- `snapshot_parallelism`：提高单次 Task 调度的 split 并行度。

## 相关文档

- [持续导入概览](./continuous-load-overview.md)
- [MySQL 库级同步](./continuous-load-mysql-database.md)
- [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md)
