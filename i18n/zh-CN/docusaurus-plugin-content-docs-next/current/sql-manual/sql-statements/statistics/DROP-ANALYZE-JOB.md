---
{
    "title": "DROP ANALYZE JOB",
    "language": "zh-CN",
    "description": "删除指定的统计信息收集作业的历史记录。"
}
---

## 描述

删除指定的统计信息收集作业的历史记录。

## 语法

```sql
DROP ANALYZE JOB <job_id>
```

## 必选参数

1. `<job_id>`：指定作业的 id。可以通过 SHOW ANALYZE 获取作业的 job_id。详细用法，请参阅 [SHOW ANALYZE](./SHOW-ANALYZE) 章节

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| SELECT_PRIV       | 表（Table）    |               |

## 示例

删除 id 为 10036 的统计信息作业记录

```sql
DROP ANALYZE JOB 10036
```