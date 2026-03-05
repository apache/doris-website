---
{
    "title": "PAUSE JOB",
    "language": "zh-CN",
    "description": "用户暂停一个正在 RUNNING 状态的 JOB，正在运行的 TASK 会被中断，JOB 状态变更为 PAUSED。被停止的 JOB 可以通过 RESUME 操作恢复运行。"
}
---

## 描述

用户暂停一个正在 RUNNING 状态的 JOB，正在运行的 TASK 会被中断，JOB 状态变更为 PAUSED。被停止的 JOB 可以通过 RESUME 操作恢复运行。

## 语法

```sql
PAUSE JOB WHERE jobname = <job_name> ;
```

## 必选参数

**1. `<job_name>`**
> 暂停任务的作业名称。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | Job 类型（ExecuteType）| 说明（Notes）   |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV    | 数据库（DB）  |  非 Streaming | 目前仅支持 **ADMIN** 权限执行此操作 |
| LOAD_PRIV    | 数据库（DB）  |  Streaming  | 支持 **LOAD** 权限执行此操作 |


## 示例

- 暂停名称为 example 的 JOB。

    ```sql
       PAUSE JOB where jobname='example';
    ```

