---
{
    "title": "持续导入",
    "language": "zh-CN",
    "description": "Doris 可以通过 Job + TVF 的方式，创建一个持续导入任务。在提交 Job 作业后，Doris 会持续运行该导入作业，实时的查询 TVF 中的数据写入到 Doris 表中。"
}
---

## 概述

Doris 可以通过 Job + TVF 的方式，创建一个持续导入任务。在提交 Job 作业后，Doris 会持续运行该导入作业，实时的查询 TVF 中的数据写入到 Doris 表中。

## 支持的 TVF

[S3](../../sql-manual/sql-functions/table-valued-functions/s3.md) TVF

## 基本原理

### S3

遍历 S3 指定目录的文件，对文件进行拆分成文件列表，以小批次的文件列表的方式写入到 Doris 表中。

**增量读取方式**

创建任务后，Doris 会持续从指定路径中读取数据，并以固定频率轮询是否有新文件。

注意：新文件的名称必须按字典序大于上一次已导入的文件名，否则 Doris 不会将其作为新文件处理。比如，文件命名为 file1、file2、file3 时会按顺序导入；如果随后新增一个 file0，由于它在字典序上小于最后已导入的文件 file3，Doris 将不会导入该文件。

## 快速上手

### 创建导入作业

假设 S3 的目录下，会定期的产生以 CSV 结尾的文件。此时可以创建 Job

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
select * from job(type=insert) where ExecuteType = "streaming"
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

### 暂停导入作业

```SQL
PAUSE JOB WHERE jobname = <job_name> ;
```

### 恢复导入作业

```SQL
RESUME JOB where jobName = <job_name> ;
```

### 修改导入作业

```SQL
-- 支持修改Job的properties和insert语句
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

### 删除导入作业

```SQL
DROP JOB where jobName = <job_name> ;
```

## 参考手册

### 导入命令

创建一个 Job + TVF 常驻导入作业语法如下：

```SQL
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
DO <Insert_Command> 
```

创建的模块说明如下：

| 模块           | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| job_name       | 任务名                                                       |
| job_properties | 用于指定 Job 的通用导入参数                                    |
| comment      | 用于描述 Job 作业的备注信息                                    |
| Insert_Command | 用于执行的 SQL，目前只支持 Insert into table select * from s3() |

### 导入参数

#### FE 配置参数

| 参数                                 | 默认值 |                                             |
| ------------------------------------ | ------ | ------------------------------------------- |
| max_streaming_job_num              | 1024   | 最大的 Streaming 作业数量                   |
| job_streaming_task_exec_thread_num | 10     | 用于执行 StreamingTask 的线程数               |
| max_streaming_task_show_count      | 100    | StreamingTask 在内存中最多保留的 task 执行记录 |

#### 导入配置参数

| 参数               | 默认值 | 说明                                                         |
| ------------------ | ------ | ------------------------------------------------------------ |
| session.*          | 无     | 支持在 job_properties 上配置所有的 session 变量，导入变量可参考 [Insert Into Select](../../data-operate/import/import-way/insert-into-manual.md#导入配置参数) |
| s3.max_batch_files | 256    | 当累计文件数达到该值时触发一次导入写入                           |
| s3.max_batch_bytes | 10G    | 当累计数据量达到该值时触发一次导入写入                             |
| max_interval       | 10s    | 当上游没有新增文件或数据时，空闲的调度间隔。                 |

### 导入状态

#### Job

Job 提交成功后，可以执行 **select \* from job("insert") where ExecuteType = 'Streaming'** 来查看 Job 当前的状态

```SQL
select * from job(type=insert) where ExecuteType = "streaming"
               Id: 1758538737484
             Name: my_job1
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: INSERT INTO test.`student1`
SELECT * FROM S3
(
    "uri" = "s3://wd-test123/s3/demo/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
    "s3.region" = "ap-southeast-1",
    "s3.access_key" = "",
    "s3.secret_key" = ""
)
       CreateTime: 2025-09-22 19:24:51
 SucceedTaskCount: 5
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: 
       Properties: {"s3.max_batch_files":"2","session.insert_max_filter_ratio":"0.5"}
    CurrentOffset: {"fileName":"s3/demo/test/1.csv"}
        EndOffset: {"fileName":"s3/demo/test/1.csv"}
    LoadStatistic: {"scannedRows":0,"loadBytes":0,"fileNumber":0,"fileSize":0}
         ErrorMsg: \N
```

具体显示参数结果如下

| 结果列            | 说明                                                         |
| ----------------- | ------------------------------------------------------------ |
| ID                | Job ID                                                       |
| NAME              | Job 名称                                                      |
| Definer           | job 定义者                                                   |
| ExecuteType       | Job 调度的类型：*ONE_TIME/RECURRING/STREAMING/MANUAL*         |
| RecurringStrategy | 循环策略。普通的 Insert 会用到，ExecuteType=Streaming 时为空    |
| Status            | Job 状态                                                      |
| ExecuteSql        | Job 的 Insert SQL 语句                                          |
| CreateTime        | job 创建时间                                                 |
| SucceedTaskCount  | 成功任务数量                                                 |
| FailedTaskCount   | 失败任务数量                                                 |
| CanceledTaskCount | 取消任务数量                                                 |
| Comment           | job 注释                                                      |
| Properties        | job 的属性                                                    |
| CurrentOffset     | Job 当前处理完成的 Offset。只有 ExecuteType=Streaming 才有值       |
| EndOffset         | Job 获取到数据源端最大的 EndOffset。只有 ExecuteType=Streaming 才有值 |
| LoadStatistic     | Job 的统计信息                                                |
| ErrorMsg          | Job 执行的错误信息                                            |
| JobRuntimeMsg     | Job 运行时的一些提示信息                                         |

#### Task

可以执行**select \* from tasks(type='insert') where jobId='1758534452459'** 来查看每次 Task 的运行状态。

注：只会保留当前最新的一次 Task 信息。

```SQL
mysql> select * from tasks(type='insert') where jobId='1758534452459'\G
*************************** 1. row ***************************
       TaskId: 1758534723330
        JobId: 1758534452459
      JobName: test_streaming_insert_job_name
        Label: 1758534452459_1758534723330
       Status: SUCCESS
     ErrorMsg: \N
   CreateTime: 2025-09-22 17:52:55
    StartTime: \N
   FinishTime: \N
  TrackingUrl: \N
LoadStatistic: {"scannedRows":20,"loadBytes":425,"fileNumber":2,"fileSize":256}
         User: root
FirstErrorMsg: \N
RunningOffset: {"startFileName":"s3/demo/1.csv","endFileName":"s3/demo/8.csv"}
```

| 结果列        | 说明                                                 |
| ------------- | ---------------------------------------------------- |
| TaskId        | 任务 ID                                               |
| JobID         | JobID                                                |
| JobName       | Job 名称                                              |
| Label         | Insert 的 Label                                        |
| Status        | Task 的状态                                           |
| ErrorMsg      | task 失败信息                                         |
| CreateTime    | Task 的创建时间                                       |
| StartTime     | Task 的开始时间                                       |
| FinishTime    | Task 的完成时间                                       |
| TrackingUrl   | Insert 的错误 URL                                      |
| LoadStatistic | Task 的统计信息                                       |
| User          | task 的执行者                                         |
| FirstErrorMsg | 普通的 InsertTask 第一次数据质量错误的信息             |
| RunningOffset | 当前 Task 同步的 Offset 信息。只有 Job.ExecuteType=Streaming 才有值 |