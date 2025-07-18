---
{
    "title": "RESUME SYNC JOB",
    "language": "zh-CN"
}
---

## 描述

通过 `job_name` 恢复当前数据库中已暂停的常驻数据同步作业。恢复后，作业将从上一次暂停前保存的最新位置继续同步数据。

## 语法

```sql
RESUME SYNC JOB [<db>.]<job_name>
```

## 必选参数
**1. `<job_name>`**
> 指定要恢复的数据同步作业的名称。  

## 可选参数
 **1. `<db>`**
 > 如果使用[<db>.]前缀指定了一个数据库，那么该作业将处于指定的数据库中；否则，将使用当前数据库。


## 权限控制

任意用户或角色都可以执行该操作

## 示例

1. 恢复名称为 `job_name` 的数据同步作业。

   ```sql
   RESUME SYNC JOB `job_name`;
   ```
