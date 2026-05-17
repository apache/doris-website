---
{
    "title": "routine_load_job",
    "language": "zh-CN",
    "description": "用于查看routine load导入作业的信息"
}
---

## 概述

用于查看routine load导入作业的信息

## 所属数据库和表

`information_schema.routine_load_jobs`

## 表信息

| 列名                     | 类型    | 说明                                                                                                                                                    | 样例 |
| :----------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :--- |
| JOB_ID                   | text    | 作业 ID，由 Doris 自动生成。                                                                                                                            | `12025` |
| JOB_NAME                 | text    | Routine Load 作业名称。                                                                                                                                 | `example_routine_load` |
| CREATE_TIME              | text    | 作业创建时间。                                                                                                                                          | `2024-01-15 08:12:42` |
| PAUSE_TIME               | text    | 最近一次作业暂停时间。作业未暂停时为 `NULL`。                                                                                                           | `NULL` |
| END_TIME                 | text    | 作业结束时间。作业未结束时为 `NULL`。                                                                                                                   | `NULL` |
| DB_NAME                  | text    | 作业所属数据库名称。                                                                                                                                    | `default_cluster:testdb` |
| TABLE_NAME               | text    | 作业导入的目标表名称。多表导入时显示为 `multi-table`。                                                                                                  | `test_routineload_tbl` |
| STATE                    | text    | 作业运行状态，包括 `NEED_SCHEDULE`、`RUNNING`、`PAUSED`、`STOPPED`、`CANCELLED`。                                                                        | `RUNNING` |
| CURRENT_TASK_NUM         | text    | 当前正在调度或执行的子任务数量。                                                                                                                        | `1` |
| JOB_PROPERTIES           | text    | 作业属性配置，包含批次大小、并发数、导入格式、列映射、错误容忍度等配置。                                                                                | `{"max_batch_rows":"200000","format":"csv","columnToColumnExpr":"user_id,name,age","max_filter_ratio":"1.0"}` |
| DATA_SOURCE_PROPERTIES   | text    | 数据源属性配置。Kafka 数据源中包含 topic、broker 列表和当前 Kafka 分区等信息。                                                                          | `{"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}` |
| CUSTOM_PROPERTIES        | text    | 创建作业时设置的自定义属性。Kafka 数据源中通常包含消费 offset、group id 以及以 `property.` 前缀传入的 Kafka 客户端参数。                                | `{"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}` |
| STATISTIC                | text    | 作业运行统计信息。常用字段包括 `receivedBytes`、`loadedRows`、`errorRows`、`committedTaskNum`、`abortedTaskNum`、`loadRowsRate`、`taskExecuteTimeMs` 等。 | `{"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}` |
| PROGRESS                 | text    | 作业运行进度。Kafka 数据源中显示每个分区当前已消费的 offset。                                                                                           | `{"0":"2"}` |
| LAG                      | text    | 作业延迟信息。Kafka 数据源中显示每个分区的消费积压量。                                                                                                  | `{"0":0}` |
| REASON_OF_STATE_CHANGED  | text    | 作业状态变更原因。正常运行时通常为空；异常暂停或取消时记录具体原因。                                                                                    | `The number of failed task exceeded max_error_number` |
| ERROR_LOG_URLS           | text    | 错误日志 URL，用于查看被过滤的质量不合格数据。无错误日志时为空。                                                                                        | `http://fe_host:8030/api/_load_error_log?file=error.log` |
| USER_NAME                | text    | 创建或操作该作业的用户。                                                                                                                                | `root` |
| CURRENT_ABORT_TASK_NUM   | int     | 当前失败的子任务数量。                                                                                                                                  | `0` |
| IS_ABNORMAL_PAUSE        | boolean | 是否为非用户手动触发的异常暂停。`true` 表示系统因异常原因暂停作业，`false` 表示没有异常暂停。                                                           | `false` |

## 查询异常作业

如果作业异常暂停、存在失败任务，或处于 `RUNNING` 状态但没有正在执行的子任务，同时 Kafka 仍有消费积压，都可以视为需要进一步排查的异常作业。可以通过以下 SQL 查询这些作业：

```sql
SELECT DB_NAME, JOB_NAME
FROM information_schema.routine_load_jobs
WHERE IS_ABNORMAL_PAUSE = TRUE
   OR (
        STATE = 'RUNNING'
        AND (
             CURRENT_ABORT_TASK_NUM > 0
             OR (
                  CAST(CURRENT_TASK_NUM AS INT) = 0
                  AND `LAG` REGEXP ':[[:space:]]*[1-9][0-9]*'
             )
        )
   );
```

查询到异常作业后，可以切换到对应数据库，通过 `SHOW ROUTINE LOAD` 查看作业详情：

```sql
USE `db_name`;
SHOW ROUTINE LOAD FOR `job_name`;
```

其中 `LAG` 是 Kafka 各分区的消费积压信息。`LAG REGEXP ':[[:space:]]*[1-9][0-9]*'` 用于匹配至少有一个分区存在大于 0 的积压。
