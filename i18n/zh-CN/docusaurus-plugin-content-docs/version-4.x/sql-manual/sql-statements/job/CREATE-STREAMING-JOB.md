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
> 支持的数据源类型，支持 `MYSQL`、`POSTGRES` 和 `OCEANBASE`，OceanBase 仅支持 MySQL 兼容模式。

**4. `<source_property>`**（多表 CDC 模式）

| 参数           | 默认值  | 说明                                                         |
| -------------- | ------- | ------------------------------------------------------------ |
| jdbc_url       | -       | JDBC 连接串（MySQL/PostgreSQL）                               |
| driver_url     | -       | JDBC 驱动 jar 包路径                                          |
| driver_class   | -       | JDBC 驱动类名                                                |
| user           | -       | 数据库用户名                                                  |
| password       | -       | 数据库密码                                                    |
| database       | -       | 数据库名                                                      |
| schema         | -       | Schema 名称（PostgreSQL）                                     |
| include_tables | -       | 需要同步的表名，多个表用逗号分隔，不填默认所有的表            |
| offset         | latest  | `latest`: 仅增量同步（默认）；`initial`: 全量 + 增量同步                    |
| `schema_change_behavior` | `evolve` | 仅自动建表同步支持。字符串，取值不区分大小写。`evolve` 自动应用支持的列变更，检测到不支持的列或主键变更时暂停；`ignore` 关闭结构同步，需自行维护兼容的目标表。可暂停后通过 `ALTER JOB` 修改。 |
| snapshot_split_size | 40960（4.1.4 之前为 8096） | split 的大小（行数），全量同步时，表会被切分成多个 split 进行同步 |
| snapshot_parallelism | 1   | 全量阶段同步的并行度，即单次 Task 最多调度的 split 数量         |

**5. `<target_db>`**（多表 CDC 模式）
> 需要导入的 Doris 目标库名称。

**6. `<target_property>`**（多表 CDC 模式）

| 参数           | 默认值  | 说明                                                         |
| -------------- | ------- | ------------------------------------------------------------ |
| table.create.properties.* | - | 支持创建表的时候指定 table 的 properties，比如 replication_num |
| load.strict_mode | - | 是否开启严格模式，默认为关闭 |
| load.max_filter_ratio | - | 采样窗口内，允许的最大过滤率。必须在大于等于 0 到小于等于 1 之间。默认值是 0，表示零容忍。采样窗口为 max_interval * 10。即如果在采样窗口内，错误行数/总行数大于 max_filter_ratio，则会导致例行作业被暂停，需要人工介入检查数据质量问题。 |

## 可选参数

**1. `<job_property>`**

| 参数               | 默认值 | 说明                                                         |
| ------------------ | ------ | ------------------------------------------------------------ |
| session.*          | 无     | 支持在 job_properties 上配置所有的 session 变量（仅 TVF 模式） |
| `s3.ingestion_mode` | `ORDERED_LIST` | 仅 S3 TVF 使用。字符串，不区分大小写：`ORDERED_LIST` 按 key 字典序持续扫描；`NOTIFICATION` 消费 SQS 通知；`ONE_TIME` 分批导入后进入 `FINISHED`。创建后不可修改。 |
| `s3.event.source` | - | `NOTIFICATION` 模式必填，当前仅支持 `SQS`；其他模式不能设置，创建后不可修改。 |
| `s3.sqs.queue_url` | - | `NOTIFICATION` 模式必填，指定独占 SQS 队列的 Queue URL；其他模式不能设置，创建后不可修改。 |
| `s3.max_batch_files` | `256` | 每批文件数量阈值，正整数，仅 S3 TVF 使用；不要求达到阈值才写入。 |
| `s3.max_batch_bytes` | `10737418240` | 每批数据量阈值，仅 S3 TVF 使用；不要求达到阈值才写入。单位为字节，取值范围为 104857600 到 10737418240。 |
| max_interval       | 10     | 当上游没有新增文件或数据时，空闲的调度间隔，单位为秒。只接受整数（秒数），如 `10`；不支持带单位后缀（如 `10s`）。取值需 >= 1 |
| `offset` | - | 创建 S3 `ORDERED_LIST` 作业时设置起始文件 key，例如 `{"fileName":"data/001.csv"}`，从该 key 之后读取；`ONE_TIME` 和 `NOTIFICATION` 禁止设置。MySQL/PostgreSQL 的初始位点应在数据源参数中设置；仅在 `ALTER JOB` 时可用 JSON 精确位点重置 CDC 进度。 |

`NOTIFICATION` 模式要求 `1 <= max_interval < 7200`，仅支持 AWS S3 直接发送到 SQS Standard Queue 的对象创建事件，不扫描历史对象，且可能因重复通知而重复导入。通知模式的批次文件数和字节数是软阈值，已接收消息不会拆分到下一批。完整示例和 IAM 权限见 [S3 通知导入](../../../data-operate/import/import-way/streaming-job/continuous-load-s3-notification.md)；文件集的结束边界见 [S3 一次性导入](../../../data-operate/import/import-way/streaming-job/continuous-load-s3-one-time.md)。

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
