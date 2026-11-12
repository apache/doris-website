---
{
    "title": "SHOW-ROUTINE-LOAD-TASK",
    "language": "zh-CN"
}
---

## SHOW-ROUTINE-LOAD-TASK

### Name

SHOW ROUTINE LOAD TASK

## 描述

查看一个指定的 Routine Load 作业的当前正在运行的子任务情况。

```sql
SHOW ROUTINE LOAD TASK
WHERE JobName = "job_name";
```

返回结果如下：

```text
              TaskId: d67ce537f1be4b86-abf47530b79ab8e6
               TxnId: 4
           TxnStatus: UNKNOWN
               JobId: 10280
          CreateTime: 2020-12-12 20:29:48
    ExecuteStartTime: 2020-12-12 20:29:48
             Timeout: 20
                BeId: 10002
DataSourceProperties: {"0":19}
```

- `TaskId`：子任务的唯一 ID。
- `TxnId`：子任务对应的导入事务 ID。
- `TxnStatus`：子任务对应的导入事务状态。通常为 UNKNOWN。并无实际意思。
- `JobId`：子任务对应的作业 ID。
- `CreateTime`：子任务的创建时间。
- `ExecuteStartTime`：子任务被调度执行的时间，通常晚于创建时间。
- `Timeout`：子任务超时时间，通常是作业设置的 `MaxIntervalS` 的两倍。
- `BeId`：执行这个子任务的 BE 节点 ID。
- `DataSourceProperties`：子任务准备消费的 Kafka Partition 的起始 offset。是一个 Json 格式字符串。Key 为 Partition Id。Value 为消费的起始 offset。

## 举例

1. 展示名为 test1 的例行导入任务的子任务信息。

    ```sql
    SHOW ROUTINE LOAD TASK WHERE JobName = "test1";
    ```

### Keywords

    SHOW, ROUTINE, LOAD, TASK

### Best Practice

通过这个命令，可以查看一个 Routine Load 作业当前有多少子任务在运行，具体运行在哪个 BE 节点上。
