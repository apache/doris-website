---
{
    "title": "TVF Continuous Load",
    "language": "en",
    "description": "Doris allows you to create a continuous import task using a Job + TVF approach. After submitting the Job, Doris continuously runs the import job,"
}
---

## Overview

Doris allows you to create a continuous import task using a Job + TVF approach. After submitting the Job, Doris continuously runs the import job, querying the TVF in real time and writing the data into the Doris table.

## Supported TVFs

[S3](../../../sql-manual/sql-functions/table-valued-functions/s3.md) TVF

## Basic Principles

### S3

Iterates through the files in the specified directory of S3, splitting each file into a list and writing it to the Doris table in small batches.

**Incremental Read Method**

After creating the task, Doris continuously reads data from the specified path and polls for new files at a fixed frequency.

Note: The name of a new file must be lexicographically greater than the name of the last imported file; otherwise, Doris will not treat it as a new file. For example, if files are named file1, file2, and file3, they will be imported sequentially; if a new file named file0 is added later, Doris will not import it because it is lexicographically less than the last imported file, file3.

## Quick Start

### Creating an Import Job

Assume that files ending in CSV are periodically generated in the S3 directory. You can then create a Job.

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

### Check import status

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

### Pause import job

```SQL
PAUSE JOB WHERE jobname = <job_name> ;
```

### Resume import job

```SQL
RESUME JOB where jobName = <job_name> ;
```

### Modify import job

```SQL
-- -- Supports modifying Job properties and insert statements
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

### Delete imported jobs

```SQL
DROP JOB where jobName = <job_name> ;
```

## Reference

### Import command

创建一个 Job + TVF 常驻导入作业语法如下：

```SQL
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
DO <Insert_Command> 
```

The module description is as follows:

| Module | Description |

| -------------- | ------------------------------------------------------------ |
| job_name | Task name |
| job_properties | General import parameters used to specify the Job |
| comment | Remarks used to describe the Job |
| Insert_Command | SQL to execute; currently only Insert into table select * from s3() is supported |

### Importing Parameters

#### FE Configuration Parameters

| Parameter | Default Value | |
| ------------------------------------ | ------ | ------------------------------------------- |
| max_streaming_job_num | 1024 | Maximum number of Streaming jobs |
| job_streaming_task_exec_thread_num | 10 | Number of threads used to execute StreamingTasks |
| max_streaming_task_show_count | 100 | Maximum number of task execution records kept in memory for a StreamingTask |

#### Import Configuration Parameters

| Parameter | Default Value | Description |
| ------------------ | ------ | ------------------------------------------------------------ |
| session.* | None | Supports configuring all session variables in job_properties. For importing variables, please refer to [Insert Into Select](../../../data-operate/import/import-way/insert-into-manual.md#Import Configuration Parameters) |
| s3.max_batch_files | 256 | Triggers an import write when the cumulative number of files reaches this value. |
| s3.max_batch_bytes | 10G | Triggers an import write when the cumulative data volume reaches this value. |
| max_interval | 10s | The idle scheduling interval when there are no new files or data added upstream. |

### Import Status

#### Job

After a job is successfully submitted, you can execute **select \* from job("insert") where ExecuteType = 'Streaming'** to check the current status of the job.

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

The specific parameter results are displayed as follows:

| Result Columns | Description |
| ----------------- | ------------------------------------------------------------ |
| ID | Job ID |
| NAME | Job Name |
| Definer | Job Definer |
| ExecuteType | Job scheduling type: *ONE_TIME/RECURRING/STREAMING/MANUAL* |
| RecurringStrategy | Recurring strategy. Used in normal Insert operations; empty when ExecuteType=Streaming |
| Status | Job status |
| ExecuteSql | Job's Insert SQL statement |
| CreateTime | Job creation time |
| SucceedTaskCount | Number of successful tasks |
| FailedTaskCount | Number of failed tasks |
| CanceledTaskCount | Number of canceled tasks |
| Comment | Job comment |
| Properties | Job properties |
| CurrentOffset | Job's current completion offset. Only `ExecuteType=Streaming` has a value. |
| EndOffset | The maximum EndOffset obtained by the Job from the data source. Only `ExecuteType=Streaming` has a value. |
| LoadStatistic | Job statistics. |
| ErrorMsg | Error messages during Job execution. |
| JobRuntimeMsg | Some runtime information for the Job.

#### Task

You can execute `select \* from tasks(type='insert') where jobId='1758534452459'` to view the running status of each Task.

Note: Only the latest Task information will be retained.

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

| Results Columns | Description |
| ------------- | ---------------------------------------------------- |
| TaskId | Task ID |
| JobID | JobID |
| JobName | Job Name |
| Label | Label of Insert |
| Status | Status of Task |
| ErrorMsg | Task failure information |
| CreateTime | Task creation time |
| StartTime | Task start time |
| FinishTime | Task completion time |
| TrackingUrl | Error URL of Insert |
| LoadStatistic | Task statistics |
| User | Executor of task |
| FirstErrorMsg | Information about the first data quality error in a normal InsertTask |
| RunningOffset | Offset information of the current Task synchronization. Only has a value if Job.ExecuteType=Streaming |