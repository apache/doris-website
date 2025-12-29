---
{
    "title": "DROP JOB",
    "language": "zh-CN",
    "description": "用户删除一个 JOB 作业。作业会被立即停止同时删除。"
}
---

## 描述

用户删除一个 JOB 作业。作业会被立即停止同时删除。

## 语法

```sql
DROP JOB where jobName = <job_name> ;
```

## 必选参数

**1. `<job_name>`**
> 删除任务的作业名称。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | Job 类型（ExecuteType）| 说明（Notes）   |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV    | 数据库（DB）  |  非 Streaming | 目前仅支持 **ADMIN** 权限执行此操作 |
| LOAD_PRIV    | 数据库（DB）  |  Streaming  | 支持 **LOAD** 权限执行此操作 |

## 示例

- 删除名称为 example 的作业。

   ```sql
   DROP JOB where jobName='example';
   ```