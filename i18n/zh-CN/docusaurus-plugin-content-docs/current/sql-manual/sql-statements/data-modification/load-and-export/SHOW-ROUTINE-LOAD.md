---
{
    "title": "SHOW ROUTINE LOAD",
    "language": "zh-CN",
    "description": "该语句用于展示 Routine Load 作业运行状态。可以查看指定作业或所有作业的状态信息。"
}
---

## 描述

该语句用于展示 Routine Load 作业运行状态。可以查看指定作业或所有作业的状态信息。

## 语法

```sql
SHOW [ALL] ROUTINE LOAD [FOR <jobName>];
```

## 可选参数

**1. `[ALL]`**

> 可选参数。如果指定，则会显示所有作业（包括已停止或取消的作业）。否则只显示当前正在运行的作业。

**2. `[FOR <jobName>]`**

> 可选参数。指定要查看的作业名称。如果不指定，则显示当前数据库下的所有作业。
>
> 支持以下形式：
>
> - `job_name`: 显示当前数据库下指定名称的作业
> - `db_name.job_name`: 显示指定数据库下指定名称的作业

## 返回结果

| 字段名                 | 说明                                                         |
| :-------------------- | :---------------------------------------------------------- |
| Id                    | 作业ID                                                       |
| Name                  | 作业名称                                                     |
| CreateTime            | 作业创建时间                                                 |
| PauseTime             | 最近一次作业暂停时间                                         |
| EndTime               | 作业结束时间                                                 |
| DbName                | 对应数据库名称                                               |
| TableName             | 对应表名称（多表情况下显示 multi-table）                      |
| IsMultiTbl            | 是否为多表                                                   |
| State                 | 作业运行状态                                                 |
| DataSourceType        | 数据源类型：KAFKA                                            |
| CurrentTaskNum        | 当前子任务数量                                               |
| JobProperties         | 作业配置详情                                                 |
| DataSourceProperties  | 数据源配置详情                                               |
| CustomProperties      | 自定义配置                                                   |
| Statistic             | 作业运行状态统计信息                                         |
| Progress              | 作业运行进度                                                 |
| Lag                   | 作业延迟状态                                                 |
| ReasonOfStateChanged  | 作业状态变更的原因                                           |
| ErrorLogUrls          | 被过滤的质量不合格的数据的查看地址                           |
| OtherMsg              | 其他错误信息                                                 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV         | 表（Table）    | SHOW ROUTINE LOAD 需要对表有LOAD权限 |

## 注意事项

- State 状态说明：
  - NEED_SCHEDULE：作业等待被调度
  - RUNNING：作业运行中
  - PAUSED：作业被暂停
  - STOPPED：作业已结束
  - CANCELLED：作业已取消

- Progress 说明：
  - 对于 Kafka 数据源，显示每个分区当前已消费的 offset
  - 例如 {"0":"2"} 表示 Kafka 分区 0 的消费进度为 2

- Lag 说明：
  - 对于 Kafka 数据源，显示每个分区的消费延迟
  - 例如 {"0":10} 表示 Kafka 分区 0 的消费延迟为 10

## 示例

- 展示名称为 test1 的所有例行导入作业（包括已停止或取消的作业）

    ```sql
    SHOW ALL ROUTINE LOAD FOR test1;
    ```

- 展示名称为 test1 的当前正在运行的例行导入作业

    ```sql
    SHOW ROUTINE LOAD FOR test1;
    ```

- 显示 example_db 下，所有的例行导入作业（包括已停止或取消的作业）。结果为一行或多行。

    ```sql
    use example_db;
    SHOW ALL ROUTINE LOAD;
    ```

- 显示 example_db 下，所有正在运行的例行导入作业

    ```sql
    use example_db;
    SHOW ROUTINE LOAD;
    ```

- 显示 example_db 下，名称为 test1 的当前正在运行的例行导入作业

    ```sql
    SHOW ROUTINE LOAD FOR example_db.test1;
    ```

- 显示 example_db 下，名称为 test1 的所有例行导入作业（包括已停止或取消的作业）。结果为一行或多行。

    ```sql
    SHOW ALL ROUTINE LOAD FOR example_db.test1;
    ```

