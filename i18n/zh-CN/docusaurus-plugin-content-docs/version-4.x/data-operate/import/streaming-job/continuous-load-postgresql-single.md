---
{
    "title": "PostgreSQL 单表导入",
    "language": "zh-CN",
    "description": "Doris 可以通过 Job + CDC Stream TVF 的方式，将 PostgreSQL 单张表的全量和增量数据持续同步到 Doris 中。"
}
---

## 概述

Doris 支持通过 Job + [CDC Stream TVF](../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) 的方式，将 PostgreSQL 单张表的全量和增量数据持续同步到指定的 Doris 表中。适用于需要对单张表进行灵活列映射和数据转换的实时同步场景。

通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 的读取能力，Doris 支持从 PostgreSQL 数据库读取变更日志（WAL），实现单表的全量和增量数据同步。

**注意事项：**

1. 支持 exactly-once 语义。
2. 目前只支持主键表同步。
3. 需要 Load 权限。
3. 需要在 PostgreSQL 端开启逻辑复制，请参考[配置指南](./continuous-load-overview.md)。

## 快速上手

### 创建导入作业

使用 [CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) 创建持续导入作业：

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

### 查看导入状态

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

更多通用操作（暂停、恢复、删除、查看 Task 等）请参考[持续导入概览](./continuous-load-overview.md)。

## 数据源参数

| 参数           | 默认值  | 说明                                                         |
| -------------- | ------- | ------------------------------------------------------------ |
| type           | -       | 数据源类型，填写 `postgres`                                   |
| jdbc_url       | -       | PostgreSQL JDBC 连接串                                        |
| driver_url     | -       | JDBC 驱动 jar 包路径，支持文件名、本地绝对路径和 HTTP 地址三种方式，详见 [JDBC Catalog 概述](../../../lakehouse/catalogs/jdbc-catalog-overview.md) |
| driver_class   | -       | JDBC 驱动类名                                                |
| user           | -       | 数据库用户名                                                  |
| password       | -       | 数据库密码                                                    |
| database       | -       | 数据库名                                                      |
| schema         | -       | Schema 名称                                                   |
| table          | -       | 需要同步的表名                                                |
| offset         | initial | initial: 全量 + 增量同步，latest: 仅增量同步                    |
| snapshot_split_size | 8096 | split 的大小（行数），全量同步时，表会被切分成多个 split 进行同步 |
| snapshot_parallelism | 1   | 全量阶段同步的并行度，即单次 Task 最多调度的 split 数量         |

## 导入配置参数

| 参数               | 默认值 | 说明                                                         |
| ------------------ | ------ | ------------------------------------------------------------ |
| session.*          | 无     | 支持在 job_properties 上配置所有的 session 变量，导入变量可参考 [Insert Into Select](../../../data-operate/import/import-way/insert-into-manual.md#导入配置参数) |

更多通用参数（如 `max_interval` 等）请参考[持续导入概览](./continuous-load-overview.md#通用参数)。
