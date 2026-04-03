---
{
    "title": "PostgreSQL 多表导入",
    "language": "zh-CN",
    "description": "Doris 可以通过 Streaming Job 的方式，将 PostgreSQL 多张表的全量和增量数据持续同步到 Doris 中。"
}
---

## 概述

支持通过 Job 将 PostgreSQL 数据库的多张表的全量和增量数据，通过 Stream Load 的方式持续同步到 Doris 中。适用于需要实时同步多表数据到 Doris 的场景。

通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 能力，Doris 支持从 PostgreSQL 数据库读取变更日志，实现多表的全量和增量数据同步。首次同步时会自动创建 Doris 下游表（主键表），并保持主键与上游一致。

**注意事项：**

1. 目前只能保证 at-least-once 语义。
2. 目前只支持主键表同步。
3. 需要 Load 权限，若下游表不存在还需有 Create 权限。
4. 自动创建表阶段，如果目标表已存在则会跳过，用户可以根据不同的场景自定义表。

## 快速上手

### 创建导入作业

使用 [CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) 创建持续导入作业：

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

### 查看导入状态

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

更多通用操作（暂停、恢复、删除、查看 Task 等）请参考[持续导入概览](./continuous-load-overview.md)。

## 数据源参数

| 参数           | 默认值  | 说明                                                         |
| -------------- | ------- | ------------------------------------------------------------ |
| jdbc_url       | -       | PostgreSQL JDBC 连接串                                        |
| driver_url     | -       | JDBC 驱动 jar 包路径，支持文件名、本地绝对路径和 HTTP 地址三种方式，详见 [JDBC Catalog 概述](../../../lakehouse/catalogs/jdbc-catalog-overview.md) |
| driver_class   | -       | JDBC 驱动类名                                                |
| user           | -       | 数据库用户名                                                  |
| password       | -       | 数据库密码                                                    |
| database       | -       | 数据库名                                                      |
| schema         | -       | Schema 名称                                                   |
| include_tables | -       | 需要同步的表名，多个表用逗号分隔，不填默认所有的表            |
| offset         | initial | initial: 全量 + 增量同步，latest: 仅增量同步                    |
| snapshot_split_size | 8096 | split 的大小（行数），全量同步时，表会被切分成多个 split 进行同步 |
| snapshot_parallelism | 1   | 全量阶段同步的并行度，即单次 Task 最多调度的 split 数量         |

## 参考手册

### 导入命令

创建多表同步作业语法如下：

```sql
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
FROM POSTGRES (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
)
```

| 模块               | 说明                      |
| ------------------ | ------------------------- |
| job_name           | 任务名                    |
| job_properties     | 用于指定 Job 的通用导入参数 |
| comment            | 用于描述 Job 作业的备注信息 |
| source_properties  | PostgreSQL 源端相关参数    |
| target_properties  | Doris 目标库相关参数       |

### Doris 目标库端配置参数

| 参数           | 默认值  | 说明                                                         |
| -------------- | ------- | ------------------------------------------------------------ |
| table.create.properties.* | - | 支持创建表的时候指定 table 的 properties，比如 replication_num |
| load.strict_mode | - | 是否开启严格模式，默认为关闭 |
| load.max_filter_ratio | - | 采样窗口内，允许的最大过滤率。必须在大于等于 0 到小于等于 1 之间。默认值是 0，表示零容忍。采样窗口为 max_interval * 10。即如果在采样窗口内，错误行数/总行数大于 max_filter_ratio，则会导致例行作业被暂停，需要人工介入检查数据质量问题。 |
