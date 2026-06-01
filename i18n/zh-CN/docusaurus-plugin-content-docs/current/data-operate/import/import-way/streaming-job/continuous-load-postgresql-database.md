---
{
    "title": "PostgreSQL CDC 自动建表同步",
    "language": "zh-CN",
    "sidebar_label": "自动建表同步",
    "description": "通过 Streaming Job 将 PostgreSQL 整库表的全量与增量数据持续同步到 Doris，首次同步自动建表。",
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

自动建表同步通过原生 `FROM POSTGRES (...) TO DATABASE (...)` DDL 实现，**目标是一个 Doris database 容器，由 Doris 自动创建下游表**。可以通过 `include_tables` 控制同步一张、多张或全部表，首次同步时 Doris 会自动创建下游主键表，并保持主键与上游一致。该方式适用于不需要对数据做 SQL 加工、希望下游表结构自动跟随上游的镜像复制场景。

通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 能力，Doris 从 PostgreSQL 读取变更日志，将一组表的全量 + 增量数据通过 Stream Load 持续写入 Doris。若需要在同步过程中做列映射、过滤或数据转换，请参考 [PostgreSQL CDC SQL 映射同步](./continuous-load-postgresql-table.md)。

### 适用场景

-   将 PostgreSQL 整库或多张表镜像复制到 Doris
-   下游表结构希望与上游保持一致，无需手工建表
-   不需要在同步链路中做列裁剪、过滤或转换
-   既需要全量初始化，又需要持续捕获增量变更

### 注意事项

1.  目前只能保证 at-least-once 语义。
2.  目前只支持主键表同步。
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

PostgreSQL 源端参数用于配置 JDBC 连接、同步范围以及全量切片行为。

| 参数                 | 默认值  | 说明                                                                                                                                              |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| jdbc_url             | -       | PostgreSQL JDBC 连接串                                                                                                                            |
| driver_url           | -       | JDBC 驱动 jar 包路径，支持文件名、本地绝对路径和 HTTP 地址三种方式，详见 [JDBC Catalog 概述](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) |
| driver_class         | -       | JDBC 驱动类名                                                                                                                                     |
| user                 | -       | 数据库用户名                                                                                                                                      |
| password             | -       | 数据库密码                                                                                                                                        |
| database             | -       | 数据库名                                                                                                                                          |
| schema               | -       | Schema 名称                                                                                                                                       |
| include_tables       | -       | 需要同步的表名，多个表用逗号分隔，不填默认所有的表                                                                                                |
| offset               | initial | initial: 全量 + 增量同步，latest: 仅增量同步                                                                                                      |
| snapshot_split_size  | 8096    | split 的大小（行数），全量同步时，表会被切分成多个 split 进行同步                                                                                 |
| snapshot_parallelism | 1       | 全量阶段同步的并行度，即单次 Task 最多调度的 split 数量                                                                                           |

### Doris 目标库端配置参数

目标端参数用于控制自动建表的属性以及 Stream Load 写入策略。

| 参数                      | 默认值 | 说明                                                                                                                                                                                                                |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| table.create.properties.* | -      | 支持创建表的时候指定 table 的 properties，比如 replication_num                                                                                                                                                      |
| load.strict_mode          | -      | 是否开启严格模式，默认为关闭                                                                                                                                                                                        |
| load.max_filter_ratio     | -      | 采样窗口内，允许的最大过滤率。必须在大于等于 0 到小于等于 1 之间。默认值是 0，表示零容忍。采样窗口为 max_interval * 10。即如果在采样窗口内，错误行数/总行数大于 max_filter_ratio，则会导致例行作业被暂停，需要人工介入检查数据质量问题。 |

## 参考手册

<!-- 知识类型: 语法参考 -->

### 导入命令语法

创建自动建表同步作业语法如下：

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

各模块说明如下：

| 模块              | 说明                          |
| ----------------- | ----------------------------- |
| job_name          | 任务名                        |
| job_properties    | 用于指定 Job 的通用导入参数   |
| comment           | 用于描述 Job 作业的备注信息   |
| source_properties | PostgreSQL 源端相关参数       |
| target_properties | Doris 目标库相关参数          |

## FAQ

<!-- 知识类型: 常见问题 -->

**Q1：自动建表同步与 SQL 映射同步如何选择？**

-   需要镜像复制、自动建表、且无需列裁剪或转换时，使用自动建表同步。
-   需要在同步链路中做列映射、过滤或数据转换时，使用 [PostgreSQL CDC SQL 映射同步](./continuous-load-postgresql-table.md)。

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
