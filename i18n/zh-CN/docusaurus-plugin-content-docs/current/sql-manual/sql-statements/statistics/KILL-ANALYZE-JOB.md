---
{
    "title": "KILL ANALYZE JOB",
    "language": "zh-CN",
    "description": "停止正在后台执行的统计信息收集作业。"
}
---

## 描述

停止正在后台执行的统计信息收集作业。

## 语法

```sql
KILL ANALYZE <job_id>
```

## 必选参数

`<job_id>`: 指定作业的 id。可以通过 SHOW ANALYZE 获取作业的 job_id。详细用法，请参阅“SHOW ANALYZE”章节

## 可选参数

无

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| SELECT_PRIV       | 表（Table）    |               |

## 注意事项

已经执行完的作业无法停止

## 示例

停止 id 为 10036 的统计信息作业记录

```sql
kill analyze 10036
```
