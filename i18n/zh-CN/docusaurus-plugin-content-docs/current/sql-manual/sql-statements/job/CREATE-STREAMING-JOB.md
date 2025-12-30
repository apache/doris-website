---
{
    "title": "CREATE STREAMING JOB",
    "language": "zh-CN",
    "description": "Doris Streaming Job 是基于 Job + TVF 的方式，创建一个持续导入任务。在提交 Job 作业后，Doris 会持续运行该导入作业，实时的查询 TVF 中的数据写入到 Doris 表中。"
}
---

## 描述

Doris Streaming Job 是基于 Job + TVF 的方式，创建一个持续导入任务。在提交 Job 作业后，Doris 会持续运行该导入作业，实时的查询 TVF 中的数据写入到 Doris 表中。

## 语法


```SQL
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
DO <Insert_Command> 
```


## 必选参数

**1. `<job_name>`**
> 作业名称，它在一个 db 中标识唯一事件。JOB 名称必须是全局唯一的，如果已经存在同名的 JOB，则会报错。

**3. `<sql_body>`**
> DO 子句，它指定了 Job 作业触发时需要执行的操作，即一条 SQL 语句，目前只支持 S3 TVF

## 可选参数

**1. `<job_properties>`**
| 参数               | 默认值 | 说明                                                         |
| ------------------ | ------ | ------------------------------------------------------------ |
| session.*          | 无     | 支持在 job_properties 上配置所有的 session 变量  |
| s3.max_batch_files | 256    | 当累计文件数达到该值时触发一次导入写入                           |
| s3.max_batch_bytes | 10G    | 当累计数据量达到该值时触发一次导入写入                             |
| max_interval       | 10s    | 当上游没有新增文件或数据时，空闲的调度间隔。                 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）               |
|:--------------|:-----------|:------------------------|
| LOAD_PRIV    | 数据库（DB）    | 目前仅支持 **LOAD** 权限执行此操作 |

## 注意事项

- TASK 只保留最新的 100 条记录。

- 目前仅支持 **INSERT 内表 Select * From S3(...)** 操作，后续会支持更多的操作。

## 示例

- 创建一个名为 my_job 的作业，持续监听 S3 上的指定目录的文件，执行的操作是将 csv 结尾的文件中的数据导入到 db1.tbl1 中。

    ```sql
    CREATE JOB my_job
    ON STREAMING
    DO 
    INSERT INTO db1.`tbl1`
    SELECT * FROM S3
    (
        "uri" = "s3://bucket/s3/demo/*.csv",
        "format" = "csv",
        "column_separator" = ",",
        "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
        "s3.region" = "ap-southeast-1",
        "s3.access_key" = "",
        "s3.secret_key" = ""
    );
    ```

## CONFIG

**fe.conf**

| 参数                                 | 默认值 |                                             |
| ------------------------------------ | ------ | ------------------------------------------- |
| max_streaming_job_num              | 1024   | 最大的 Streaming 作业数量                   |
| job_streaming_task_exec_thread_num | 10     | 用于执行 StreamingTask 的线程数               |
| max_streaming_task_show_count      | 100    | StreamingTask 在内存中最多保留的 task 执行记录 |