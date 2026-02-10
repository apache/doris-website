---
{
    "title": "ALTER JOB",
    "language": "zh-CN",
    "description": "用户修改一个 JOB 作业。只能修改 PAUSE 状态下的 Job，并且只支持修改 Streaming 类型的 Job。"
}
---

## 描述

用户修改一个 JOB 作业。只能修改 PAUSE 状态下的 Job，并且只支持修改 Streaming 类型的 Job。

## 语法

```SQL
Alter Job <job_name>
[job_properties]
DO <Insert_Command> 
```

## 必选参数

**1. `<job_name>`**
> 修改任务的作业名称。

## 可选参数

**1. `<job_properties>`**
> 修改任务的属性。

**1. `<Insert_Command>`**
> 修改任务执行的 SQL。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | Job 类型（ExecuteType）| 说明（Notes）   |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV    | 数据库（DB）  |  Streaming  | 支持 **LOAD** 权限执行此操作 |

## 示例

- 修改 my_job 的 session 变量

   ```SQL
    Alter Job my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    ```
- 修改 my_job 的 SQL 语句

   ```SQL
    Alter Job my_job
    INSERT INTO db1.tbl1 
    SELECT * FROM S3
    (
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    );
    ```  

- 同时修改 my_job 的 Properties 和 SQL 语句

    ```SQL
    Alter Job my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    INSERT INTO db1.tbl1 
    select * from S3(
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    )
    ``` 

- 修改 my_job 同步的进度    

```sql
    Alter JOB my_job
    PROPERTIES(
        'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
    )
```