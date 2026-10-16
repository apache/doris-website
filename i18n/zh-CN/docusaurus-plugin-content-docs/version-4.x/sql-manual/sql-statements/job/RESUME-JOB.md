---
{
    "title": "RESUME JOB",
    "language": "zh-CN",
    "description": "介绍 RESUME JOB 的语法、权限及示例，用于恢复暂停的作业，并说明 CDC 自动建表同步因不支持的 Schema Change 暂停时，手动恢复所代表的变更确认、目标列名检查及确认有效期。"
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

## 使用说明

自动建表同步作业因 `[SCHEMA_CHANGE_UNSUPPORTED]` 暂停时，不会自动恢复。执行 `RESUME JOB` 表示接受本轮不支持的结构变更；恢复检查只核对必要列名，不验证类型和主键是否兼容。请先按 [MySQL](../../../data-operate/import/import-way/streaming-job/schema-change-mysql.md#不支持变更后的恢复)、[PostgreSQL](../../../data-operate/import/import-way/streaming-job/schema-change-postgresql.md#不支持变更后的恢复) 或 [OceanBase](../../../data-operate/import/import-way/streaming-job/schema-change-oceanbase.md#不支持变更后的恢复) 的恢复步骤检查目标表及确认有效范围，再执行命令。

## 示例

- 恢复运行名称为 example 的 JOB。

   ```sql
   RESUME JOB where jobName= 'example';
   ```
