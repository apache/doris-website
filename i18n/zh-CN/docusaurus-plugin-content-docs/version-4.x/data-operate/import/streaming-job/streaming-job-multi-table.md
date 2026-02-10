---
{
        "title": "Postgres/MySQL 持续导入",
        "language": "zh-CN",
        "description": "Doris 可以通过 Streaming Job 的方式，将 MySQL、Postgres 等多张表的全量和增量数据持续同步到 Doris 中。"
}
---

## 概述

支持通过 Job 将 MySQL、Postgres 等数据库的多张表的全量和增量数据，通过 Stream Load 的方式持续同步到 Doris 中。适用于需要实时同步多表数据到 Doris 的场景。

## 支持的数据源

- MySQL
- Postgres

## 基本原理

通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 能力，Doris 支持从 MySQL、Postgres 等数据库读取变更日志，实现多表的全量和增量数据同步。首次同步时会自动创建 Doris 下游表（主键表），并保持主键与上游一致。

**注意事项：**

1. 目前只能保证 at-least-once 语义。
2. 目前只支持主键表同步。
3. 需要 Load 权限，若下游表不存在还需有 Create 权限。

## 快速上手

### 前提条件

#### MySQL 
需要在 MySQL 端开启 Binlog，即 my.cnf 配置文件中增加：
```ini
log-bin=mysql-bin
binlog_format=ROW
server-id=1
```

#### Postgres
需要在 Postgres 端配置逻辑复制，即 postgresql.conf 增加：
```ini
wal_level=logical
```

### 创建导入作业

#### MySQL

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

#### Postgres

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

### 查看导入状态

```sql
select * from jobs(type=insert) where ExecuteType = "STREAMING"
             Id: 1765332859199
             Name: mysql_db_sync
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: FROM MYSQL('include_tables'='user_info','database'='test','driver_class'='com.mysql.cj.jdbc.Driver','driver_url'='mysql-connector-j-8.0.31.jar','offset'='initial','jdbc_url'='jdbc:mysql://127.0.0.1:3306','user'='root' ) TO DATABASE target_test_db ('table.create.properties.replication_num'='1')
       CreateTime: 2025-12-10 10:19:35
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: 
       Properties: \N
    CurrentOffset: {"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","splitId":"binlog-split","row":"1","event":"2","server_id":"1"}
        EndOffset: \N
    LoadStatistic: {"scannedRows":24,"loadBytes":1146,"fileNumber":0,"fileSize":0}
         ErrorMsg: \N
```

### 暂停导入作业

```sql
PAUSE JOB WHERE jobname = <job_name> ;
```

### 恢复导入作业

```sql
RESUME JOB where jobName = <job_name> ;
```

### 修改导入作业

```sql
ALTER JOB <job_name>
FROM MYSQL (
    "user" = "root",
    "password" = "123456"
)
TO DATABASE target_test_db
```

### 删除导入作业

```sql
DROP JOB where jobName = <job_name> ;
```

## 参考手册

### 导入命令

创建一个多表同步作业语法如下：

```sql
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
FROM <MYSQL|POSTGRES> (
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
| source_properties  | 源端（MySQL/PG 等）相关参数   |
| target_properties  | Doris 目标库相关参数       |

### 导入参数

#### FE 配置参数

| 参数                                 | 默认值 | 说明                                   |
| ------------------------------------ | ------ | -------------------------------------- |
| max_streaming_job_num                | 1024   | 最大的 Streaming 作业数量               |
| job_streaming_task_exec_thread_num   | 10     | 用于执行 StreamingTask 的线程数         |
| max_streaming_task_show_count        | 100    | StreamingTask 在内存中最多保留的 task 执行记录 |

#### Job 通用导入配置参数

| 参数         | 默认值 | 说明                                   |
| ------------ | ------ | -------------------------------------- |
| max_interval | 10s    | 当上游没有新增数据时，空闲的调度间隔。 |

#### 数据源配置参数

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

#### Doris 目标库端配置参数

| 参数           | 默认值  | 说明                                                         |
| -------------- | ------- | ------------------------------------------------------------ |
| table.create.properties.*       | -       | 支持创建表的时候指定 table 的 properties，比如 replication_num                                   |
| load.strict_mode       | -       | 是否开启严格模式，默认为关闭 |
| load.max_filter_ratio       | -       | 采样窗口内，允许的最大过滤率。必须在大于等于 0 到小于等于 1 之间。默认值是 0，表示零容忍。采样窗口为 max_interval * 10。即如果在采样窗口内，错误行数/总行数大于 max_filter_ratio，则会导致例行作业被暂停，需要人工介入检查数据质量问题。 |

### 导入状态

#### Job

Job 提交成功后，可以执行如下 SQL 查看 Job 当前状态：

```sql
select * from jobs(type=insert) where ExecuteType = "STREAMING"
*************************** 1. row ***************************
               Id: 1765332859199
             Name: mysql_db_sync
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: FROM MYSQL('include_tables'='user_info','database'='test','driver_class'='com.mysql.cj.jdbc.Driver','driver_url'='mysql-connector-j-8.0.31.jar','offset'='initial','jdbc_url'='jdbc:mysql://127.0.0.1:3306','user'='root' ) TO DATABASE target_test_db ('table.create.properties.replication_num'='1')
       CreateTime: 2025-12-10 10:19:35
 SucceedTaskCount: 2
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: 
       Properties: \N
    CurrentOffset: {"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","splitId":"binlog-split","row":"1","event":"2","server_id":"1"}
        EndOffset: {"ts_sec":"0","file":"binlog.000003","pos":"157","kind":"SPECIFIC","gtids":"","row":"0","event":"0"}
    LoadStatistic: {"scannedRows":3,"loadBytes":232,"fileNumber":0,"fileSize":0}
         ErrorMsg: \N
```

具体显示参数结果如下

| 结果列            | 说明                                                         |
| ----------------- | ------------------------------------------------------------ |
| ID                | Job ID                                                       |
| NAME              | Job 名称                                                      |
| Definer           | job 定义者                                                   |
| ExecuteType       | Job 调度的类型：*ONE_TIME/RECURRING/STREAMING/MANUAL*         |
| RecurringStrategy | 循环策略。普通的 Insert 会用到，ExecuteType=Streaming 时为空    |
| Status            | Job 状态                                                      |
| ExecuteSql        | Job 的 Insert SQL 语句                                          |
| CreateTime        | job 创建时间                                                 |
| SucceedTaskCount  | 成功任务数量                                                 |
| FailedTaskCount   | 失败任务数量                                                 |
| CanceledTaskCount | 取消任务数量                                                 |
| Comment           | job 注释                                                      |
| Properties        | job 的属性                                                    |
| CurrentOffset     | Job 当前处理完成的 Offset。只有 ExecuteType=Streaming 才有值       |
| EndOffset         | Job 获取到数据源端最大的 EndOffset。只有 ExecuteType=Streaming 才有值 |
| LoadStatistic     | Job 的统计信息                                                |
| ErrorMsg          | Job 执行的错误信息                                            |
| JobRuntimeMsg     | Job 运行时的一些提示信息                                         |

#### Task

可以执行如下 SQL 查看每次 Task 的运行状态：

```sql
select * from tasks(type='insert') where jobId='1765336137066'
*************************** 1. row ***************************
       TaskId: 1765336137066
        JobId: 1765332859199
      JobName: mysql_db_sync
        Label: 1765332859199_1765336137066
       Status: SUCCESS
     ErrorMsg: \N
   CreateTime: 2025-12-10 11:09:06
    StartTime: 2025-12-10 11:09:16
   FinishTime: 2025-12-10 11:09:18
  TrackingUrl: \N
LoadStatistic: {"scannedRows":1,"loadBytes":333}
         User: root
FirstErrorMsg: 
RunningOffset: {"endOffset":{"ts_sec":"1765284495","file":"binlog.000002","pos":"9521","kind":"SPECIFIC","row":"1","event":"2","server_id":"1"},"startOffset":{"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","row":"1","splitId":"binlog-split","event":"2","server_id":"1"},"splitId":"binlog-split"}
```



| 结果列        | 说明                                                 |
| ------------- | ---------------------------------------------------- |
| TaskId        | 任务 ID                                               |
| JobID         | JobID                                                |
| JobName       | Job 名称                                              |
| Label         | Task 导入 的 Label                                        |
| Status        | Task 的状态                                           |
| ErrorMsg      | task 失败信息                                         |
| CreateTime    | Task 的创建时间                                       |
| StartTime     | Task 的开始时间                                       |
| FinishTime    | Task 的完成时间                                       |
| LoadStatistic | Task 的统计信息                                       |
| User          | task 的执行者                                         |
| RunningOffset | 当前 Task 同步的 Offset 信息。只有 Job.ExecuteType=Streaming 才有值 |