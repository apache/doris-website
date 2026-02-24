---
{
    "title": "CREATE STREAMING JOB",
    "language": "zh-CN",
    "description": "Doris Streaming Job 是基于 Job 的方式，创建一个持续导入任务。在提交 Job 作业后，Doris 会持续运行该导入作业，实时的查询 TVF 或上游数据源中的数据写入到 Doris 表中。"
}
---

## 描述

Doris Streaming Job 是基于 Job 的方式，创建一个持续导入任务。在提交 Job 作业后，Doris 会持续运行该导入作业，实时的查询 TVF 或上游数据源中的数据写入到 Doris 表中。

## 语法


```SQL
CREATE JOB <job_name>
ON STREAMING
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
[ COMMENT <comment> ]
(
DO <Insert_Command> 
|
(
    FROM <sourceType> (
        <source_property>
        [ , ... ])
    TO DATABASE <target_db> 
    [ PROPERTIES   (
        <target_property>
        -- Other属性
        [ , ... ])
    ]
)
```


## 必选参数

**1. `<job_name>`**
> 作业名称，它在一个 db 中标识唯一事件。JOB 名称必须是全局唯一的，如果已经存在同名的 JOB，则会报错。

**2. `<Insert_Command>`**
> DO 子句，它指定了 Job 作业触发时需要执行的操作，即一条 SQL 语句，目前只支持 S3 TVF。

**3. `<sourceType>`**
> 支持的数据源，目前只支持 MySQL 和 Postgres。

**4. `<source_property>`**
| 参数           | 默认值  | 说明                                                         |
| -------------- | ------- | ------------------------------------------------------------ |
| jdbc_url       | -       | JDBC 连接串（MySQL/PG）                                       |
| driver_url     | -       | JDBC 驱动 jar 包路径                                          |
| driver_class   | -       | JDBC 驱动类名                                                |
| user           | -       | 数据库用户名                                                  |
| password       | -       | 数据库密码                                                    |
| database       | -       | 数据库名                                                      |
| schema       | -       | schema 名称                                                      |
| include_tables | -       | 需要同步的表名，多个表用逗号分隔                              |
| offset         | initial | initial: 全量 + 增量同步，latest: 仅增量同步                    |
| snapshot_split_size         | 8096 | split 的大小 (行数)，全量同步时，表会被切分成多个 split 进行同步   |
| snapshot_parallelism         | 1 | 全量阶段同步的并行度，即单次 Task 最多调度的 split 数量   |


**5. `<target_db>`**
> 需要导入的 Doris 目标库名称。

**6. `<target_property>`**
| 参数           | 默认值  | 说明                                                         |
| -------------- | ------- | ------------------------------------------------------------ |
| table.create.properties.*       | -       | 支持创建表的时候指定 table 的 properties，比如 replication_num |
| load.strict_mode       | -       | 是否开启严格模式，默认为关闭 |
| load.max_filter_ratio       | -       | 采样窗口内，允许的最大过滤率。必须在大于等于 0 到小于等于 1 之间。默认值是 0，表示零容忍。采样窗口为 max_interval * 10。即如果在采样窗口内，错误行数/总行数大于 max_filter_ratio，则会导致例行作业被暂停，需要人工介入检查数据质量问题。 |



## 可选参数

**1. `<job_property>`**
| 参数               | 默认值 | 说明                                                         |
| ------------------ | ------ | ------------------------------------------------------------ |
| session.*          | 无     | 支持在 job_properties 上配置所有的 session 变量 |
| s3.max_batch_files | 256    | 当累计文件数达到该值时触发一次导入写入                           |
| s3.max_batch_bytes | 10G    | 当累计数据量达到该值时触发一次导入写入                             |
| max_interval       | 10s    | 当上游没有新增文件或数据时，空闲的调度间隔。                 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）               |
|:--------------|:-----------|:------------------------|
| LOAD_PRIV    | 数据库（DB）    | 目前仅支持 **LOAD** 权限执行此操作 |

## 注意事项

- TASK 只保留最新的 100 条记录。

- 目前 Insert_Command 仅支持 **INSERT 内表 Select * From S3(...)** 操作，后续会支持更多的操作。

## 示例

- 创建一个名为 my_job 的作业，持续监听 S3 上的指定目录的文件，执行的操作是将 csv 结尾的文件中的数据导入到 db1.tbl1 中。

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
        "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
        "s3.region" = "ap-southeast-1",
        "s3.access_key" = "",
        "s3.secret_key" = ""
    );
    ```

- 创建一个名为 my_job 的作业，从头开始同步 MySQL 上游的 user_info,order_info 表的数据，到 target_test_db 库下面。

    ```sql
    CREATE JOB multi_table_sync
    ON STREAMING
    FROM MYSQL (
            "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
            "driver_url" = "mysql-connector-j-8.0.31.jar",
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

- 创建一个名为 my_job 的作业，持续同步 Postgres 上游的 test_tbls 表的增量的数据，到 target_test_db 库下面。

    ```sql
    CREATE JOB test_postgres_job
    ON STREAMING
    FROM POSTGRES (
        "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
        "driver_url" = "postgresql-42.5.0.jar",
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

| 参数                                 | 默认值 |                                             |
| ------------------------------------ | ------ | ------------------------------------------- |
| max_streaming_job_num              | 1024   | 最大的 Streaming 作业数量                   |
| job_streaming_task_exec_thread_num | 10     | 用于执行 StreamingTask 的线程数               |
| max_streaming_task_show_count      | 100    | StreamingTask 在内存中最多保留的 task 执行记录 |