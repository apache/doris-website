---
{
    "title": "S3",
    "language": "en",
    "description": "Doris allows you to create a continuous import task using a Job + S3 TVF approach to incrementally load files from S3 into Doris tables."
}
---

## Overview

Doris allows you to create a continuous import task using a Job + S3 TVF approach. After submitting the Job, Doris continuously runs the import job, querying the S3 TVF in real time and writing the data into the Doris table.

## Basic Principles

Iterates through the files in the specified directory of S3, splitting each file into a list and writing it to the Doris table in small batches.

**Incremental Read Method**

After creating the task, Doris continuously reads data from the specified path and polls for new files at a fixed frequency.

Note: The name of a new file must be lexicographically greater than the name of the last imported file; otherwise, Doris will not treat it as a new file. For example, if files are named file1, file2, and file3, they will be imported sequentially; if a new file named file0 is added later, Doris will not import it because it is lexicographically less than the last imported file, file3.

## Quick Start

### Creating an Import Job

Use [CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) to create a continuous import job.

Assume that files ending in CSV are periodically generated in the S3 directory. You can then create a Job:

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

### Check Import Status

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

### Modify Import Job

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

For more common operations (pause, resume, delete, check Task, etc.), see [Continuous Load Overview](./continuous-load-overview.md).

## Reference

### Import Command

Syntax for creating an S3 TVF continuous import job:

```SQL
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
DO <Insert_Command> 
```

| Module         | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| job_name       | Job name                                                     |
| job_properties | General import parameters for the Job                        |
| comment        | Job comment                                                  |
| Insert_Command | SQL to execute, i.e., INSERT INTO table SELECT * FROM S3()   |

### Import Configuration Parameters

| Parameter          | Default | Description                                                  |
| ------------------ | ------- | ------------------------------------------------------------ |
| session.*          | -       | Supports all session variables in job_properties. See [Insert Into Select](../../../data-operate/import/import-way/insert-into-manual.md) for import variables |
| s3.max_batch_files | 256     | Triggers an import write when the accumulated file count reaches this value |
| s3.max_batch_bytes | 10G     | Triggers an import write when the accumulated data size reaches this value |
| max_interval       | 10s     | Idle scheduling interval when no new files or data upstream   |
