---
{
    "title": "PAUSE ROUTINE LOAD",
    "language": "zh-CN",
    "description": "该语法用于暂停一个或所有 Routine Load 作业。被暂停的作业可以通过 RESUME 命令重新运行。"
}
---

## 描述

该语法用于暂停一个或所有 Routine Load 作业。被暂停的作业可以通过 RESUME 命令重新运行。

## 语法

```sql
PAUSE [ALL] ROUTINE LOAD FOR <job_name>
```

## 必选参数

**1. `<job_name>`**

> 指定要暂停的作业名称。如果指定了 ALL，则无需指定 job_name。

## 可选参数

**1. `[ALL]`**

> 可选参数。如果指定 ALL，则表示暂停所有例行导入作业。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV         | 表（Table）    | SHOW ROUTINE LOAD 需要对表有LOAD权限 |

## 注意事项

- 作业被暂停后，可以通过 RESUME 命令重新启动
- 暂停操作不会影响已经下发到 BE 的任务，这些任务会继续执行完成

## 示例

- 暂停名称为 test1 的例行导入作业。

   ```sql
   PAUSE ROUTINE LOAD FOR test1;
   ```

- 暂停所有例行导入作业。

   ```sql
   PAUSE ALL ROUTINE LOAD;
   ```
