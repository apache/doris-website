---
{
    "title": "CREATE STREAMING JOB",
    "language": "zh-CN",
    "description": "Doris Streaming Job 是基于 Job 的方式，创建一个持续导入任务。在提交 Job 作业后，Doris 会持续运行该导入作业，实时的查询 TVF 或上游数据源中的数据写入到 Doris 表中。"
}
---

## 描述

Doris Streaming Job 是基于 Job 的方式，创建一个持续导入任务。在提交 Job 作业后，Doris 会持续运行该导入作业，实时的查询 TVF 或上游数据源中的数据写入到 Doris 表中。

支持两种模式：

- **TVF 模式**：通过 `DO INSERT INTO ... SELECT FROM TVF()` 语法，将 TVF 的数据持续写入指定的单张 Doris 表。支持 [S3 TVF](../../sql-functions/table-valued-functions/s3.md) 和 [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md)。
- **多表 CDC 模式**：通过 `FROM <sourceType> TO DATABASE` 语法，将上游数据库的多张表全量和增量数据持续同步到 Doris 中，首次同步时自动创建下游表。

详细使用方式请参考[持续导入](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md)。

## 语法

### TVF 模式

```SQL
CREATE JOB <job_name>
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
ON STREAMING
[ COMMENT <comment> ]
DO <Insert_Command> 
```

### 多表 CDC 模式

```SQL
CREATE JOB <job_name>
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
ON STREAMING
[ COMMENT <comment> ]
FROM <sourceType> (
    <source_property>
    [ , ... ]
)
TO DATABASE <target_db> (
    <target_property>
    [ , ... ]
)
```

## 必选参数

**1. `<job_name>`**
> 作业名称，它在一个 db 中标识唯一事件。JOB 名称必须是全局唯一的，如果已经存在同名的 JOB，则会报错。

**2. `<Insert_Command>`**（TVF 模式）
> DO 子句，它指定了 Job 作业触发时需要执行的操作，即一条 INSERT INTO SELECT FROM TVF 语句。支持 [S3 TVF](../../sql-functions/table-valued-functions/s3.md) 和 [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md)。

**3. `<sourceType>`**（多表 CDC 模式）
> 支持的数据源类型，目前支持 `MYSQL` 和 `POSTGRES`。

**4. `<source_property>`**（多表 CDC 模式）

| 参数 | 适用数据源 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `jdbc_url` | MySQL、PostgreSQL | - | 必填。JDBC 连接串。 |
| `driver_url` | MySQL、PostgreSQL | - | 必填。JDBC 驱动 jar 包路径。 |
| `driver_class` | MySQL、PostgreSQL | - | 必填。JDBC 驱动类名。 |
| `user` | MySQL、PostgreSQL | - | 必填。数据库用户名。 |
| `password` | MySQL、PostgreSQL | - | 必填。数据库密码。 |
| `database` | MySQL、PostgreSQL | - | 必填。上游数据库名；PostgreSQL 中应与 JDBC URL 的数据库名一致。 |
| `schema` | PostgreSQL | - | 必填。PostgreSQL Schema 名称。 |
| `include_tables` | MySQL、PostgreSQL | - | 需要同步的表名，多个表用逗号分隔；不设置时同步数据库或 Schema 中的所有表。 |
| `exclude_tables` | MySQL、PostgreSQL | - | 不同步的表名，多个表用逗号分隔。仅当未设置 `include_tables` 时生效。 |
| `table.<table_name>.target_table` | MySQL、PostgreSQL | 源表名 | 为指定源表设置 Doris 目标表名。 |
| `table.<table_name>.exclude_columns` | MySQL、PostgreSQL | - | 排除指定源表中的非主键列，多个列用逗号分隔。 |
| `offset` | MySQL、PostgreSQL | `latest` | 启动位点。支持 `initial`、`snapshot`、`latest` 和 JSON 精确位点；MySQL 还支持 `earliest`。 |
| `snapshot_split_size` | MySQL、PostgreSQL | `8096` | 全量切片的大小（行数），必须为正整数。 |
| `snapshot_parallelism` | MySQL、PostgreSQL | `1` | 全量阶段单次 Task 最多调度的 split 数量，必须为正整数。 |
| `ssl_mode` | MySQL、PostgreSQL | `disable` | SSL 模式，可选值为 `disable`、`require`、`verify-ca`。 |
| `ssl_rootcert` | MySQL、PostgreSQL | - | CA 证书文件，格式为 `FILE:<file_name>`；`ssl_mode=verify-ca` 时必填。 |
| `server_id` | MySQL | 自动生成 | MySQL CDC reader 的 server ID，支持单值（如 `5400`）或闭区间（如 `5400-5408`）；区间宽度必须大于等于 `snapshot_parallelism`。 |
| `slot_name` | PostgreSQL | `doris_cdc_<job_id>` | 逻辑复制槽名称。自定义复制槽必须预先创建，由用户管理。 |
| `publication_name` | PostgreSQL | `doris_pub_<job_id>` | 发布名称。自定义发布必须预先创建、覆盖所有同步表，并由用户管理。 |

> 版本说明：`table.<table_name>.target_table`、`table.<table_name>.exclude_columns`、`offset=snapshot`、`ssl_mode`、`ssl_rootcert`、`server_id`、`slot_name` 和 `publication_name` 自 4.1.0 版本起支持。

同时设置 `include_tables` 和 `exclude_tables` 时，以 `include_tables` 为准。`slot_name` 和 `publication_name` 只能包含小写字母、数字和下划线，不能以数字开头，最长 63 个字符。完整的数据源差异、JSON 位点格式和 SSL 证书配置见 [MySQL 自动建表同步](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md)和 [PostgreSQL 自动建表同步](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md)。

**5. `<target_db>`**（多表 CDC 模式）
> 需要导入的 Doris 目标库名称。

**6. `<target_property>`**（多表 CDC 模式）

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `table.create.properties.*` | - | 创建 Doris 表时附加的表属性，例如 `table.create.properties.replication_num`。 |
| `load.strict_mode` | `false` | 是否为 Stream Load 写入开启严格模式，取值为 `true` 或 `false`。 |
| `load.max_filter_ratio` | `0` | 采样窗口内允许的最大过滤率，取值范围为 `[0, 1]`。采样窗口为 `max_interval * 10` 秒，窗口内错误行比例超过该值时作业暂停。 |

## 可选参数

**1. `<job_property>`**

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `max_interval` | `10` | 上游没有新增文件或数据时的空闲调度间隔，单位为秒；必须为不小于 1 的整数。 |
| `compute_group` | 当前会话或用户默认计算组 | 仅存算分离模式支持。指定作业运行的计算组，用户必须具有该计算组的 USAGE 权限。 |
| `session.<variable_name>` | 对应会话变量的默认值 | 仅 TVF 模式支持。为 INSERT 任务设置有效的 Doris 会话变量。 |
| `s3.max_batch_files` | `256` | 当累计文件数达到该值时触发一次导入写入，仅 S3 TVF 使用。 |
| `s3.max_batch_bytes` | `10737418240` | 当累计数据量达到该值时触发一次导入写入，仅 S3 TVF 使用。单位为字节，取值范围为 104857600 到 10737418240。 |
| `offset` | - | 创建 S3 Streaming Job 时设置源端起始位置。MySQL/PostgreSQL 的初始位点应在数据源参数中设置；仅在 `ALTER JOB` 时可用 JSON 精确位点重置 CDC 进度。 |

CDC Stream TVF 的 `type`、`table`、`include_delete_sign` 等全部参数见 [CDC Stream](../../sql-functions/table-valued-functions/cdc-stream.md)。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）               |
|:--------------|:-----------|:------------------------|
| LOAD_PRIV    | 数据库（DB）    | 目前仅支持 **LOAD** 权限执行此操作 |

## 注意事项

- TASK 只保留最新的 100 条记录。

### PROPERTIES 用法

通过 `PROPERTIES` 可以配置 Job 的运行参数，例如修改调度间隔、设置 session 变量等：

```sql
CREATE JOB my_job
PROPERTIES (
    "max_interval" = "30",
    "session.insert_max_filter_ratio" = "0.5"
)
ON STREAMING
DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/s3/demo/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
    "s3.region" = "ap-southeast-1",
    "s3.access_key" = "",
    "s3.secret_key" = ""
);
```

## 示例

### TVF 模式

- 创建作业，持续监听 S3 上指定目录的文件，将 CSV 文件中的数据导入到 db1.tbl1 中。

    ```sql
    CREATE JOB my_job
    ON STREAMING
    DO 
    INSERT INTO db1.`tbl1`
    SELECT * FROM S3
    (
        "uri" = "s3://bucket/s3/demo/*.csv",
        "format" = "csv",
        "column_separator" = ",",
        "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
        "s3.region" = "ap-southeast-1",
        "s3.access_key" = "",
        "s3.secret_key" = ""
    );
    ```

- 创建作业，通过 CDC Stream TVF 持续同步 MySQL 单表数据到 Doris 中。

    ```sql
    CREATE JOB mysql_cdc_job
    ON STREAMING
    DO
    INSERT INTO db1.target_table
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
    );
    ```

- 创建作业，通过 CDC Stream TVF 持续同步 PostgreSQL 单表数据到 Doris 中。

    ```sql
    CREATE JOB pg_cdc_job
    ON STREAMING
    DO
    INSERT INTO db1.target_table
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
    );
    ```

### 多表 CDC 模式

- 创建作业，从头开始同步 MySQL 上游的 user_info、order_info 表的数据到 target_test_db 库下。

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
        "table.create.properties.replication_num" = "1"
    )
    ```

- 创建作业，持续同步 PostgreSQL 上游的 test_tbls 表的增量数据到 target_test_db 库下。

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
        "table.create.properties.replication_num" = "1"
    )
    ```

## CONFIG

**fe.conf**

| 参数                                 | 默认值 | 说明                                        |
| ------------------------------------ | ------ | ------------------------------------------- |
| max_streaming_job_num              | 1024   | 最大的 Streaming 作业数量                   |
| job_streaming_task_exec_thread_num | 10     | 用于执行 StreamingTask 的线程数               |
| max_streaming_task_show_count      | 100    | StreamingTask 在内存中最多保留的 task 执行记录 |
