---
{
    "title": "S3",
    "language": "en",
    "description": "Continuously and incrementally load file data from S3 object storage into Doris tables via Job + S3 TVF, with automatic polling, incremental detection, and batched writes.",
    "keywords": [
        "Doris S3 continuous load",
        "S3 incremental load",
        "S3 TVF Streaming Job",
        "object storage incremental sync",
        "CSV continuous load Doris",
        "CREATE STREAMING JOB S3"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Continuous/incremental loading from S3 object storage into Doris -->

Doris supports creating continuous load jobs through **Job + S3 TVF**, which is suitable for scenarios where new files are continuously produced under an S3 directory and need to be incrementally synced to a Doris table.

After a Job is submitted, Doris keeps the load job running, polls the S3 directory at a fixed frequency, and writes new file data returned by the S3 TVF query into the Doris table.

Typical user scenarios:

-   Continuously produced CSV/JSON/Parquet files from logs, tracking events, and similar sources need to be synced to Doris.
-   An upstream ETL keeps writing sharded files into an S3 directory, and the downstream side needs to load them into the warehouse automatically.
-   You want to achieve automatic incremental ingestion from S3 to Doris with minimal operational overhead.

## Basic principles

Doris traverses the files under the specified S3 directory, splits them into a file list, and writes the file list into the Doris table in **small batches**.

### Incremental read mode

After the task is created, Doris keeps reading data from the specified path and polls for new files at a fixed frequency.

The rules for identifying new files are as follows:

-   The name of a new file must be greater than the last loaded file name in **lexicographic order**; otherwise, it will not be recognized as a new file.
-   For example, if `file1`, `file2`, and `file3` are produced in order, they are loaded in sequence. If `file0` is added afterwards, since its lexicographic order is smaller than the already loaded `file3`, **Doris will not load this file**.

:::tip Naming recommendation
To ensure that newly added files can be correctly recognized, use a monotonically increasing naming scheme such as timestamps or auto-incrementing sequence numbers (for example, `2025-09-22-001.csv`).
:::

## Quick start

A complete continuous load typically includes the following steps:

1.  Use `CREATE JOB ... ON STREAMING` to create a continuous load job.
2.  Use the `jobs()` table function to view the load status and progress.
3.  Use `ALTER JOB` to modify the job parameters or SQL as needed.
4.  Use the common operations described in [Continuous Load Overview](./continuous-load-overview.md) for management actions such as pause, resume, and delete.

### Step 1: Create a load job

Use [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) to create a continuous load job.

Assuming that files ending with CSV are periodically produced under the S3 directory, you can create the following Job:

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

### Step 2: View the load status

Use the `jobs()` table function to check the running status of STREAMING type jobs:

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

Meanings of the key fields:

| Field             | Meaning                                                          |
| ----------------- | ---------------------------------------------------------------- |
| Status            | Job status. Common values: `RUNNING`, `PAUSED`, `STOPPED`        |
| CurrentOffset     | The latest file name that has been processed (incremental progress) |
| EndOffset         | The file name at which the current batch ends                    |
| LoadStatistic     | Cumulative scanned rows, bytes, file count, and file size        |
| SucceedTaskCount  | Number of subtasks executed successfully                         |
| FailedTaskCount   | Number of failed subtasks                                        |
| ErrorMsg          | Error message when failures occur                                |

### Step 3: Modify the load job

Modifying both the `PROPERTIES` and the `INSERT` statement of the Job at the same time is supported:

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

For more common operations (pause, resume, delete, view tasks, and so on), see [Continuous Load Overview](./continuous-load-overview.md).

## Reference

<!-- Knowledge type: Configuration parameters -->

### Job creation syntax

The syntax for creating an S3 TVF continuous load job is as follows:

```SQL
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
DO <Insert_Command> 
```

Description of each module:

| Module           | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| job_name         | Task name                                                            |
| job_properties   | Used to specify common load parameters of the Job                    |
| comment          | Used to describe the Job with remarks                                |
| Insert_Command   | The SQL to execute, that is, `INSERT INTO table SELECT * FROM S3()`  |

### Load configuration parameters

The following parameters can be configured in `job_properties`:

| Parameter          | Default | Description                                                                                                                                                                          |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| session.\*         | None    | All session variables can be configured under `job_properties`. For load variables, see [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters) |
| s3.max_batch_files | 256     | Triggers a load write when the cumulative number of files reaches this value                                                                                                         |
| s3.max_batch_bytes | 10G     | Triggers a load write when the cumulative data volume reaches this value                                                                                                             |
| max_interval       | 10s     | The idle scheduling interval when there are no new files or data from upstream                                                                                                       |

:::tip Batch trigger rule
A write is triggered when either `s3.max_batch_files` or `s3.max_batch_bytes` is satisfied. When there are no new files from upstream, idle polling proceeds according to `max_interval`.
:::

## FAQ

<!-- Knowledge type: FAQ -->

### Q1: Why are newly added files not loaded?

The most common reason is that the **lexicographic order** of the file name is smaller than the file name recorded in `CurrentOffset`. Check the following:

-   Whether the new file naming is monotonically increasing (using timestamps or auto-incrementing sequence numbers is recommended).
-   Use `jobs()` to check `CurrentOffset`, and confirm that the new file name is greater than this value.

### Q2: How can I control the number of files and the data volume per batch?

Use `s3.max_batch_files` and `s3.max_batch_bytes` to control the batch size. A write is triggered when either of them is satisfied.

### Q3: How often does the job poll for new files when idle?

This is controlled by `max_interval`, with a default of 10 seconds. It can be adjusted in `job_properties`.

### Q4: Are formats other than CSV supported?

Yes. Specify the format in the `format` parameter of the S3 TVF (such as `csv`, `json`, `parquet`, and so on). The supported set depends on the formats supported by the S3 TVF.

### Q5: How do I modify the load SQL of a running job?

Use `ALTER JOB` to modify both the `PROPERTIES` and the `INSERT` statement at the same time. See [Step 3: Modify the load job](#step-3-modify-the-load-job).

## Troubleshooting

<!-- Knowledge type: Troubleshooting -->

| Symptom                                       | Possible cause                                                  | Solution                                                                                                              |
| --------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| New files are not loaded                      | The lexicographic order of the file name is smaller than `CurrentOffset` | Switch to a monotonically increasing naming scheme (such as timestamps or auto-incrementing sequence numbers)         |
| The job `Status` is `RUNNING` but no progress | There are no new files under the S3 path                        | Check whether the `uri` wildcard matches the new files, and reduce `max_interval` if necessary                         |
| Authentication failure / unable to access S3  | `s3.access_key`, `s3.secret_key`, or other settings are incorrect | Check whether AK/SK, `region`, and `endpoint` match. Confirm that IAM permissions allow reading the corresponding bucket |
| A single batch load is too large or slow      | `s3.max_batch_bytes` or `s3.max_batch_files` is too large       | Reduce the batch threshold so that it matches the downstream write capacity                                            |
| `FailedTaskCount` keeps increasing            | Data format or schema mismatch                                  | Check `ErrorMsg`. You can use `session.insert_max_filter_ratio` to tolerate a portion of abnormal rows, or fix upstream data |

## Related documents

-   [Continuous Load Overview](./continuous-load-overview.md)
-   [CREATE STREAMING JOB syntax](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
-   [Insert Into Select load configuration parameters](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters)
