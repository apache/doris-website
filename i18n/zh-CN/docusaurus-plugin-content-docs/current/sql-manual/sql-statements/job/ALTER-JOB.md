---
{
    "title": "ALTER JOB",
    "language": "zh-CN",
    "description": "介绍 ALTER JOB 语句的语法、权限和示例，用于在 PAUSED 状态下修改 Streaming Job 的运行属性、INSERT SQL、S3 读取进度，或通过 JSON 精确位点重置 MySQL 和 PostgreSQL CDC 同步进度。"
}
---

## 描述

修改 Streaming Job 的运行属性、执行 SQL 或自动建表同步配置。只能修改 `PAUSED` 状态下的 Streaming Job，且每次至少需要提供一项实际变化。

## 语法

```sql
ALTER JOB <job_name>
[
    PROPERTIES (<job_property>[, ...])
]
[
    <Insert_Command>
    | FROM <source_type> (<source_property>[, ...])
      TO DATABASE <target_db> (<target_property>[, ...])
]
```

## 必选参数

**1. `<job_name>`**
> 修改任务的作业名称。

## 可选参数

**1. `<job_property>`**
> 修改 Job 属性，例如 `max_interval`、`compute_group`、`session.*`，或使用 JSON `offset` 重置 CDC 位点。

**2. `<Insert_Command>`**
> 修改 TVF 模式任务执行的 INSERT SQL。`ALTER JOB` 中不使用 `DO` 关键字。

**3. `<source_property>` 和 `<target_property>`**
> 修改自动建表同步的数据源或目标端属性。数据源类型和目标数据库不能修改。

:::note
自动建表同步不能修改 `jdbc_url`、`database`、`schema`、`include_tables`、`exclude_tables`、源端 `offset`、`snapshot_split_size`、`snapshot_parallelism`、逐表映射参数、`slot_name` 或 `publication_name`。如需重置 CDC 位点，请使用 Job Property `offset`。

CDC Stream TVF 模式不能修改目标表、TVF 类型、`type`、`jdbc_url`、`database`、`schema`、`table`、`snapshot_split_size`、`snapshot_parallelism`、`slot_name` 或 `publication_name`；可通过修改 INSERT SQL 轮换账号密码、驱动或其他可修改参数。
:::

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | Job 类型（ExecuteType）| 说明（Notes）   |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV    | 数据库（DB）  |  Streaming  | 支持 **LOAD** 权限执行此操作 |

## 示例

- 修改 my_job 的 session 变量

   ```sql
    ALTER JOB my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    );
    ```
- 修改 my_job 的 SQL 语句

   ```sql
    ALTER JOB my_job
    INSERT INTO db1.tbl1 
    SELECT * FROM S3
    (
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    );
    ```  

- 同时修改 my_job 的 Properties 和 SQL 语句

    ```sql
    ALTER JOB my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    INSERT INTO db1.tbl1 
    select * from S3(
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    );
    ``` 

- 修改 S3 作业 my_job 同步的进度

```sql
    ALTER JOB my_job
    PROPERTIES(
        'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
    );
```

- 将 MySQL CDC 作业重置到指定 Binlog 位点

```sql
ALTER JOB mysql_cdc_job
PROPERTIES (
    "offset" = '{"file":"binlog.000001","pos":"154"}'
);
```

- 将 PostgreSQL CDC 作业重置到指定 LSN

```sql
ALTER JOB pg_cdc_job
PROPERTIES (
    "offset" = '{"lsn":"12345678"}'
);
```

CDC 作业只能在 `PAUSED` 状态下修改位点，且 `offset` 仅接受上述 JSON 精确位点，不接受 `initial`、`snapshot`、`earliest` 或 `latest`。
