---
{
    "title": "STOP SYNC JOB",
    "language": "zh-CN",
    "description": "此语句通过 jobname 停止一个数据库内非停止状态的常驻数据同步作业。"
}
---

## 描述

此语句通过 `job_name` 停止一个数据库内非停止状态的常驻数据同步作业。

## 语法

```sql
STOP SYNC JOB [<db>.]<job_name>
```

## 必选参数
**1. `<job_name>`**
> 要暂停的同步作业的名称。

## 可选参数
 **1. `<db>`**
 > 如果使用[<db>.]前缀指定了一个数据库，那么该作业将处于指定的数据库中；否则，将使用当前数据库。

## 权限控制
任意用户或角色都可以执行该操作

## 示例

1. 停止名称为 `job_name` 的数据同步作业

   ```sql
   STOP SYNC JOB `job_name`;
   ```
