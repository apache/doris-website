---
{
    "title": "SHOW ROUTINE LOAD TASK",
    "language": "zh-CN",
    "description": "该语法用于查看一个指定的 Routine Load 作业的当前正在运行的子任务情况。"
}
---

## 描述

该语法用于查看一个指定的 Routine Load 作业的当前正在运行的子任务情况。

## 语法

```sql
SHOW ROUTINE LOAD TASK WHERE JobName = <job_name>;
```

## 必选参数

**1. `<job_name>`**

> 要查看的例行导入作业名称。

## 返回结果

返回结果包含以下字段：

| 字段名                | 说明                                                         |
| :------------------- | :---------------------------------------------------------- |
| TaskId               | 子任务的唯一 ID                                              |
| TxnId                | 子任务对应的导入事务 ID                                      |
| TxnStatus            | 子任务对应的导入事务状态。为 null 时表示子任务还未开始调度    |
| JobId                | 子任务对应的作业 ID                                          |
| CreateTime           | 子任务的创建时间                                             |
| ExecuteStartTime     | 子任务被调度执行的时间，通常晚于创建时间                      |
| Timeout              | 子任务超时时间，通常是作业设置的 `max_batch_interval` 的两倍  |
| BeId                 | 执行这个子任务的 BE 节点 ID                                  |
| DataSourceProperties | 子任务准备消费的 Kafka Partition 的起始 offset。是一个 Json 格式字符串。Key 为 Partition Id，Value 为消费的起始 offset |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV         | 表（Table）    | SHOW ROUTINE LOAD TASK 需要对表有LOAD权限 |

## 注意事项

- TxnStatus 为 null 不代表任务出错，可能是任务还未开始调度
- DataSourceProperties 中的 offset 信息可用于追踪数据消费进度
- Timeout 时间到达后，任务会自动结束，无论是否完成数据消费

## 示例

- 展示名为 test1 的例行导入任务的子任务信息。

    ```sql
    SHOW ROUTINE LOAD TASK WHERE JobName = "test1";
    ```
