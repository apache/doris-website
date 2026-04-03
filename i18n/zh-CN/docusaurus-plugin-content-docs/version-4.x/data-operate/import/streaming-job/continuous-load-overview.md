---
{
    "title": "持续导入概览",
    "language": "zh-CN",
    "description": "Doris 支持通过 Streaming Job 的方式，从多种数据源持续导入数据到 Doris 表中。"
}
---

## 概述

Doris 支持通过 Streaming Job 的方式，从多种数据源持续导入数据到 Doris 表中。提交 Job 后，Doris 会持续运行导入作业，实时读取数据源中的数据并写入到 Doris 表中。

持续导入支持以下数据源和导入模式：

| 数据源 | 支持版本 | 单表导入 | 多表导入 | 配置指南 |
|:------|:--------|:--------|:--------|:--------|
| MySQL | 5.6、5.7、8.0.x | [MySQL 单表导入](./continuous-load-mysql-single.md) | [MySQL 多表导入](./continuous-load-mysql-multi.md) | [Amazon RDS MySQL](./prerequisites/amazon-rds-mysql.md) · [Amazon Aurora MySQL](./prerequisites/amazon-aurora-mysql.md) |
| PostgreSQL | 14、15、16、17 | [PostgreSQL 单表导入](./continuous-load-postgresql-single.md) | [PostgreSQL 多表导入](./continuous-load-postgresql-multi.md) | [Amazon RDS PostgreSQL](./prerequisites/amazon-rds-postgresql.md) · [Amazon Aurora PostgreSQL](./prerequisites/amazon-aurora-postgresql.md) |
| S3 | - | [S3 持续导入](./continuous-load-s3.md) | - | - |

:::tip
- **单表导入**：通过 CDC Stream TVF 或 S3 TVF，将数据持续导入到指定的单张 Doris 表中，支持灵活的列映射和数据转换。
- **多表导入**：通过原生多表 CDC 能力，将源端多张表的全量和增量数据持续同步到 Doris 中，首次同步时自动创建下游表。
:::

## 通用操作

### 查看导入状态

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

| 结果列            | 说明                                                         |
| ----------------- | ------------------------------------------------------------ |
| ID                | Job ID                                                       |
| NAME              | Job 名称                                                      |
| Definer           | Job 定义者                                                   |
| ExecuteType       | Job 调度的类型：*ONE_TIME/RECURRING/STREAMING/MANUAL*         |
| RecurringStrategy | 循环策略。普通的 Insert 会用到，ExecuteType=Streaming 时为空    |
| Status            | Job 状态                                                      |
| ExecuteSql        | Job 的 Insert SQL 语句                                          |
| CreateTime        | Job 创建时间                                                 |
| SucceedTaskCount  | 成功任务数量                                                 |
| FailedTaskCount   | 失败任务数量                                                 |
| CanceledTaskCount | 取消任务数量                                                 |
| Comment           | Job 注释                                                      |
| Properties        | Job 的属性                                                    |
| CurrentOffset     | Job 当前处理完成的 Offset。只有 ExecuteType=Streaming 才有值       |
| EndOffset         | Job 获取到数据源端最大的 EndOffset。只有 ExecuteType=Streaming 才有值 |
| LoadStatistic     | Job 的统计信息                                                |
| ErrorMsg          | Job 执行的错误信息                                            |
| JobRuntimeMsg     | Job 运行时的一些提示信息                                         |

### 查看 Task 状态

```sql
select * from tasks("type"="insert") where jobId='<job_id>';
```

| 结果列        | 说明                                                 |
| ------------- | ---------------------------------------------------- |
| TaskId        | 任务 ID                                               |
| JobID         | JobID                                                |
| JobName       | Job 名称                                              |
| Label         | Task 导入的 Label                                        |
| Status        | Task 的状态                                           |
| ErrorMsg      | Task 失败信息                                         |
| CreateTime    | Task 的创建时间                                       |
| StartTime     | Task 的开始时间                                       |
| FinishTime    | Task 的完成时间                                       |
| LoadStatistic | Task 的统计信息                                       |
| User          | Task 的执行者                                         |
| RunningOffset | 当前 Task 同步的 Offset 信息。只有 Job.ExecuteType=Streaming 才有值 |

### 暂停导入作业

```sql
PAUSE JOB WHERE jobname = <job_name>;
```

### 恢复导入作业

```sql
RESUME JOB WHERE jobName = <job_name>;
```

### 删除导入作业

```sql
DROP JOB WHERE jobName = <job_name>;
```

## 通用参数

### FE 配置参数

| 参数                                 | 默认值 | 说明                                   |
| ------------------------------------ | ------ | -------------------------------------- |
| max_streaming_job_num              | 1024   | 最大的 Streaming 作业数量               |
| job_streaming_task_exec_thread_num | 10     | 用于执行 StreamingTask 的线程数         |
| max_streaming_task_show_count      | 100    | StreamingTask 在内存中最多保留的 task 执行记录 |

### Job 通用导入配置参数

| 参数         | 默认值 | 说明                                   |
| ------------ | ------ | -------------------------------------- |
| max_interval | 10s    | 当上游没有新增数据时，空闲的调度间隔。 |

## FAQ

### MySQL 连接报错 Public Key Retrieval is not allowed

**原因：** 配置的 MySQL 用户使用 SHA256 密码认证方式，需要通过 TLS 等协议传输密码。

**解决方案一：** 在 JDBC URL 中添加 `allowPublicKeyRetrieval=true` 参数：

```
jdbc:mysql://127.0.0.1:3306?allowPublicKeyRetrieval=true
```

**解决方案二：** 将 MySQL 用户的认证方式改为 `mysql_native_password`：

```sql
ALTER USER 'username'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```
