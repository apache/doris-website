---
{
    "title": "持续导入概览",
    "language": "zh-CN",
    "sidebar_label": "概览",
    "description": "了解 Doris Streaming Job 持续导入的完整能力，包括 MySQL、PostgreSQL 和 S3 数据源，SQL 映射与自动建表同步的选型、一致性语义、作业状态机、通用参数及日常运维操作。",
    "keywords": [
        "Doris 持续导入",
        "Streaming Job",
        "MySQL 实时同步",
        "PostgreSQL 实时同步",
        "S3 持续导入",
        "SQL 映射同步",
        "自动建表同步",
        "exactly-once",
        "at-least-once",
        "autoResume"
    ]
}
---

<!-- 知识类型: Feature 概览 + 架构选型决策 -->
<!-- 适用场景: 实时数据接入选型 / 持续导入运维 -->

Doris 支持通过 **Streaming Job** 的方式，从多种数据源持续导入数据到 Doris 表中。提交 Job 后，Doris 会持续运行导入作业，实时读取数据源中的数据并写入到 Doris 表中。

:::tip
该功能自 4.1.0 版本起支持。
:::

本文将帮助你解决以下问题：

- 持续导入支持哪些数据源和同步模式？
- SQL 映射同步与自动建表同步该如何选择？
- 作业的运行状态如何流转、如何自动恢复？
- 日常如何查看、暂停、恢复、删除导入作业？
- 有哪些通用的 FE 与 Job 配置参数？

## 支持的数据源与同步模式

持续导入支持以下数据源和同步模式：

| 数据源     | 支持版本          | SQL 映射同步                                                          | 自动建表同步                                                                | 配置指南                                                                                                                                  |
| :--------- | :---------------- | :-------------------------------------------------------------------- | :-------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| MySQL      | 5.6、5.7、8.0.x   | [MySQL CDC SQL 映射同步](./continuous-load-mysql-table.md)            | [MySQL CDC 自动建表同步](./continuous-load-mysql-database.md)               | [Amazon RDS MySQL](./prerequisites/amazon-rds-mysql.md) · [Amazon Aurora MySQL](./prerequisites/amazon-aurora-mysql.md)                   |
| PostgreSQL | 14、15、16、17    | [PostgreSQL CDC SQL 映射同步](./continuous-load-postgresql-table.md)  | [PostgreSQL CDC 自动建表同步](./continuous-load-postgresql-database.md)     | [Amazon RDS PostgreSQL](./prerequisites/amazon-rds-postgresql.md) · [Amazon Aurora PostgreSQL](./prerequisites/amazon-aurora-postgresql.md) |
| S3         | -                 | [S3 持续导入](./continuous-load-s3.md)                                | -                                                                           | -                                                                                                                                         |

上游列类型如何映射为 Doris 类型，见 [MySQL](./data-type-mapping-mysql.md) / [PostgreSQL](./data-type-mapping-postgresql.md) 数据类型映射。

## 如何选择同步方式

<!-- 知识类型: 架构选型决策 -->

SQL 映射同步和自动建表同步是两种**实现机制完全不同**的持续导入方式，并非"表数量"的区别。**自动建表同步也支持通过 `include_tables` 只同步一张表**，因此选型应以能力需求为准。

### 能力对比

| 能力维度       | SQL 映射同步                                                   | 自动建表同步                                   |
| :------------- | :------------------------------------------------------------- | :--------------------------------------------- |
| 底层机制       | Job + TVF（`INSERT INTO tbl SELECT * FROM tvf()`）              | Job + 原生整库 DDL（`FROM src TO DATABASE db`） |
| 目标层级       | 一张已存在的 Doris 表                                          | 一个 Doris 数据库                              |
| 同步范围       | 单张表                                                         | 一张到多张到整库（由 `include_tables` 控制）    |
| 自动建表       | 需预建                                                         | 首次同步自动创建主键表                         |
| SQL 灵活表达   | 支持列映射、过滤、转换（SELECT 子句）                          | 支持目标表重命名和排除非主键列；不支持 SQL 表达式、行过滤或数据转换 |
| 语义保证       | exactly-once（`skip_snapshot_backfill=false`）                  | at-least-once                                  |
| 所需权限       | Load                                                           | Load + Create（自动建表时）                    |
| 典型适用场景   | 需要 SQL 表达式、类型转换或条件过滤的实时同步                   | 整库或一组表的镜像复制，允许简单的表重命名或列裁剪 |

### 选型建议

- **需要对数据做 SQL 加工，或对精确一次语义有严格要求** → 选 **SQL 映射同步**
- **希望 Doris 自动建表、一次配置同步一组表** → 选 **自动建表同步**
- **数据源是 S3 对象存储** → 只支持 SQL 映射同步（S3 TVF 方式）

## 作业状态流转

<!-- 知识类型: 运行机制 -->

Streaming Job 在运行过程中会在以下状态之间迁移，**SQL 映射同步和自动建表同步遵循同一套状态机**：

![job-state-flow](/images/next/data-operate/streaming-job/job-state-flow.jpg)

### 状态说明

| 状态         | 含义                                                                                                                       |
| :----------- | :------------------------------------------------------------------------------------------------------------------------- |
| **PENDING**  | 作业已创建但尚未调度出子任务；等待下一次调度创建 `StreamingTask`                                                            |
| **RUNNING**  | 已派生子任务并在执行中，从源端读取增量数据并写入 Doris                                                                       |
| **FINISHED** | 源消费完成，作业终止。S3 TVF 文件全部导入完成后会进入该状态                                                                  |
| **PAUSED**   | 子任务执行失败，作业自动暂停并记录 `failReason`；可通过 `select * from jobs(...)` 的 `ErrorMsg` 字段查看原因                 |

### 自动恢复（autoResume）

作业进入 `PAUSED` 后，调度器会按**指数退避策略**定时尝试恢复，恢复时回到 `PENDING` 继续创建子任务。**无需人工介入临时故障（网络抖动、上游短暂不可用等）会被自动消化。**

不同场景下应使用的命令：

- **立即恢复或排查故障后手动启动**：使用 [`RESUME JOB`](#恢复导入作业)
- **彻底停止不再调度**：使用 [`PAUSE JOB`](#暂停导入作业)（手动暂停不会被 autoResume 唤醒）或 [`DROP JOB`](#删除导入作业)

## 通用操作

<!-- 知识类型: 操作步骤 -->

### 查看导入状态

查询所有 Streaming 类型的 Insert Job：

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

返回结果列说明：

| 结果列            | 说明                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| ID                | Job ID                                                                |
| NAME              | Job 名称                                                              |
| Definer           | Job 定义者                                                            |
| ExecuteType       | Job 调度的类型：*ONE_TIME/RECURRING/STREAMING/MANUAL*                  |
| RecurringStrategy | 循环策略。普通的 Insert 会用到，ExecuteType=Streaming 时为空           |
| Status            | Job 状态                                                              |
| ExecuteSql        | Job 的 Insert SQL 语句                                                |
| CreateTime        | Job 创建时间                                                          |
| SucceedTaskCount  | 成功任务数量                                                          |
| FailedTaskCount   | 失败任务数量                                                          |
| CanceledTaskCount | 取消任务数量                                                          |
| Comment           | Job 注释                                                              |
| Properties        | Job 的属性                                                            |
| CurrentOffset     | Job 当前处理完成的 Offset。只有 ExecuteType=Streaming 才有值           |
| EndOffset         | Job 获取到数据源端最大的 EndOffset。只有 ExecuteType=Streaming 才有值  |
| LoadStatistic     | Job 的统计信息                                                        |
| ErrorMsg          | Job 执行的错误信息                                                    |
| JobRuntimeMsg     | Job 运行时的一些提示信息                                              |

### 查看 Task 状态

按 Job ID 查询其下所有子任务：

```sql
select * from tasks("type"="insert") where jobId='<job_id>';
```

返回结果列说明：

| 结果列        | 说明                                                                |
| ------------- | ------------------------------------------------------------------- |
| TaskId        | 任务 ID                                                             |
| JobID         | JobID                                                               |
| JobName       | Job 名称                                                            |
| Label         | Task 导入的 Label                                                   |
| Status        | Task 的状态                                                         |
| ErrorMsg      | Task 失败信息                                                       |
| CreateTime    | Task 的创建时间                                                     |
| StartTime     | Task 的开始时间                                                     |
| FinishTime    | Task 的完成时间                                                     |
| LoadStatistic | Task 的统计信息                                                     |
| User          | Task 的执行者                                                       |
| RunningOffset | 当前 Task 同步的 Offset 信息。只有 Job.ExecuteType=Streaming 才有值  |

### 暂停导入作业

手动暂停指定作业（暂停后不会被 autoResume 自动唤醒）：

```sql
PAUSE JOB WHERE jobname = <job_name>;
```

### 恢复导入作业

恢复处于 `PAUSED` 状态的作业：

```sql
RESUME JOB WHERE jobName = <job_name>;
```

### 删除导入作业

彻底删除指定作业，删除后不再调度：

```sql
DROP JOB WHERE jobName = <job_name>;
```

## 通用参数

<!-- 知识类型: 配置参数 -->

### FE 配置参数

| 参数                                 | 默认值 | 说明                                            |
| ------------------------------------ | ------ | ----------------------------------------------- |
| max_streaming_job_num                | 1024   | 最大的 Streaming 作业数量                        |
| job_streaming_task_exec_thread_num   | 10     | 用于执行 StreamingTask 的线程数                  |
| max_streaming_task_show_count        | 100    | StreamingTask 在内存中最多保留的 task 执行记录   |

### Job 通用导入配置参数

以下参数通过 `CREATE JOB ... PROPERTIES (...)` 配置。除特别说明外，MySQL/PostgreSQL 的 SQL 映射同步和自动建表同步均可使用。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `max_interval` | `10` | 当上游没有新增数据时，空闲的调度间隔，单位为秒。只接受不小于 1 的整数，不支持 `10s` 等单位后缀。 |
| `compute_group` | 当前会话或用户默认计算组 | 仅存算分离模式支持，用于指定作业运行的计算组。显式设置时不能为空，用户必须具有该计算组的 USAGE 权限；未设置且当前会话、用户均没有可用的默认计算组时，创建作业失败。 |
| `session.<variable_name>` | 对应会话变量的默认值 | 仅 TVF 模式支持。为 Job 的 INSERT 任务设置会话变量，例如 `session.insert_max_filter_ratio`。变量名和值必须是 Doris 支持的有效会话变量。 |

`offset` 作为 Job Property 时不用于设置 MySQL/PostgreSQL 作业的初始位点；创建作业时应在 `FROM MYSQL`、`FROM POSTGRES` 或 `cdc_stream(...)` 的数据源参数中设置。暂停 CDC 作业后，可以通过 `ALTER JOB ... PROPERTIES ("offset" = '<json_offset>')` 重置位点；MySQL 使用 `{"file":"binlog.000001","pos":"154"}`，PostgreSQL 使用 `{"lsn":"12345678"}`。`ALTER JOB` 仅接受 JSON 形式的精确位点。

## 使用限制

<!-- 知识类型: 限制 / 不支持的边界 -->

同步范围、自动建表、一致性语义（exactly-once / at-least-once）已在[能力对比](#能力对比)中说明。本节只列出**不支持**的约束与行为。

### 主键表

仅支持同步**带主键**的上游表（两种同步方式均如此）。对应的 Doris 表为 **Unique Key 表**——自动建表同步下由 Doris 自动建成，SQL 映射同步下由你自己创建。无主键的表不支持。

### Schema Change（DDL）

DDL 同步**仅适用于自动建表同步**；SQL 映射（TVF）不同步任何 DDL。

- **PostgreSQL**（4.1 起支持）：仅 `ADD COLUMN` 和 `DROP COLUMN` 会同步。**列类型变更、`RENAME COLUMN`、约束 / 索引 / 分区变更不会同步**——需在 Doris 端手工处理。
- **MySQL**：上游 DDL **暂不同步**——需手工调整 Doris 表结构。

## FAQ

<!-- 知识类型: 常见问题 / 故障排查 -->

### MySQL 连接报错 Public Key Retrieval is not allowed

**原因：** 配置的 MySQL 用户使用 SHA256 密码认证方式，需要通过 TLS 等协议传输密码。

**解决方案一：** 在 JDBC URL 中添加 `allowPublicKeyRetrieval=true` 参数：

```text
jdbc:mysql://127.0.0.1:3306?allowPublicKeyRetrieval=true
```

**解决方案二：** 将 MySQL 用户的认证方式改为 `mysql_native_password`：

```sql
ALTER USER 'username'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```
