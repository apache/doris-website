---
{
    "title": "RESUME JOB",
    "language": "zh-CN",
    "description": "将处于 PAUSED 状态的 JOB 恢复为 RUNNING 状态。RUNNING 状态的 JOB 将会根据既定的调度周期去执行。"
}
---

## 描述

将处于 PAUSED 状态的 JOB 恢复为 RUNNING 状态。RUNNING 状态的 JOB 将会根据既定的调度周期去执行。

## 语法

```sql
RESUME JOB where jobName = <job_name> ;
```
## 必选参数

**1. `<job_name>`**
> 恢复任务的作业名称。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | Job 类型（ExecuteType）| 说明（Notes）   |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV    | 数据库（DB）  |  非 Streaming | 目前仅支持 **ADMIN** 权限执行此操作 |
| LOAD_PRIV    | 数据库（DB）  |  Streaming  | 支持 **LOAD** 权限执行此操作 |

## 示例

- 恢复运行名称为 example 的 JOB。

   ```sql
   RESUME JOB where jobName= 'example';
   ```