---
{
    "title": "S3",
    "language": "zh-CN",
    "description": "Doris 可以通过 Job + S3 TVF 的方式，从 S3 对象存储持续增量导入文件数据到 Doris 表中。"
}
---

## 概述

Doris 可以通过 Job + S3 TVF 的方式，创建一个持续导入任务。在提交 Job 作业后，Doris 会持续运行该导入作业，实时查询 S3 TVF 中的数据写入到 Doris 表中。

## 基本原理

遍历 S3 指定目录的文件，对文件进行拆分成文件列表，以小批次的文件列表的方式写入到 Doris 表中。

**增量读取方式**

创建任务后，Doris 会持续从指定路径中读取数据，并以固定频率轮询是否有新文件。

注意：新文件的名称必须按字典序大于上一次已导入的文件名，否则 Doris 不会将其作为新文件处理。比如，文件命名为 file1、file2、file3 时会按顺序导入；如果随后新增一个 file0，由于它在字典序上小于最后已导入的文件 file3，Doris 将不会导入该文件。

## 快速上手

### 创建导入作业

使用 [CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) 创建持续导入作业。

假设 S3 的目录下，会定期的产生以 CSV 结尾的文件。此时可以创建 Job：

```SQL
CREATE JOB my_job 
ON STREAMING
DO 
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

### 查看导入状态

```SQL
select * from jobs("type"="insert") where ExecuteType = "STREAMING"
               Id: 1758538737484
             Name: my_job1
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: INSERT INTO test.`student1`
SELECT * FROM S3
(
    "uri" = "s3://bucket/s3/demo/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
    "s3.region" = "ap-southeast-1",
    "s3.access_key" = "",
    "s3.secret_key" = ""
)
       CreateTime: 2025-09-22 19:24:51
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: \N
       Properties: \N
    CurrentOffset: {"fileName":"s3/demo/test/1.csv"}
        EndOffset: {"fileName":"s3/demo/test/1.csv"}
    LoadStatistic: {"scannedRows":20,"loadBytes":425,"fileNumber":2,"fileSize":256}
         ErrorMsg: \N
    JobRuntimeMsg: \N
```

### 修改导入作业

```SQL
-- Support modifying Job properties and insert statement
Alter Job jobName
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

更多通用操作（暂停、恢复、删除、查看 Task 等）请参考[持续导入概览](./continuous-load-overview.md)。

## 参考手册

### 导入命令

创建一个 S3 TVF 持续导入作业语法如下：

```SQL
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
DO <Insert_Command> 
```

| 模块           | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| job_name       | 任务名                                                       |
| job_properties | 用于指定 Job 的通用导入参数                                    |
| comment        | 用于描述 Job 作业的备注信息                                    |
| Insert_Command | 用于执行的 SQL，即 INSERT INTO table SELECT * FROM S3()       |

### 导入配置参数

| 参数               | 默认值 | 说明                                                         |
| ------------------ | ------ | ------------------------------------------------------------ |
| session.*          | 无     | 支持在 job_properties 上配置所有的 session 变量，导入变量可参考 [Insert Into Select](../../../data-operate/import/import-way/insert-into-manual.md#导入配置参数) |
| s3.max_batch_files | 256    | 当累计文件数达到该值时触发一次导入写入                           |
| s3.max_batch_bytes | 10G    | 当累计数据量达到该值时触发一次导入写入                             |
| max_interval       | 10s    | 当上游没有新增文件或数据时，空闲的调度间隔。                 |
