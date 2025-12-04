---
{
"title": "CREATE STREAMING JOB",
"language": "en"
}

---

## Description

Doris Streaming Job is a continuous import task based on the Job + TVF approach. After the Job is submitted, Doris will continuously run the import job, querying the data in TVF and writing it into the Doris table in real time.

## Syntax


```SQL
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
DO <Insert_Command> 
```


## Required parameters

**1. `<job_name>`**
> The job name is used to uniquely identify an event within a database. The job name must be globally unique; an error will occur if a job with the same name already exists.

**3. `<sql_body>`**
> The DO clause specifies the operation to be executed when the job is triggered, i.e., an SQL statement. Currently, it only supports S3 TVF.

## Optional parameters

**1. `<job_properties>`**
| Parameters | Default Values ​​| Description |
| ------------------ | ------ | ------------------------------------------------------------ |
| session.* | None | Supports configuring all session variables in job_properties |
| s3.max_batch_files | 256 | Triggers an import write when the cumulative number of files reaches this value |
| s3.max_batch_bytes | 10G | Triggers an import write when the cumulative data volume reaches this value |
| max_interval | 10s | The idle scheduling interval when there are no new files or data added upstream.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:
| Privilege | Object | Notes |
|:--------------|:-----------|:------------------------|
| LOAD_PRIV | Database (DB) | Currently, only the **LOAD** privilege is supported to perform this operation |

## Usage Notes

- The TASK only retains the latest 100 records.
- Currently, only the **INSERT internal table Select * From S3(...)** operation is supported; more operations will be supported in the future.

## Examples

- Create a job named my_job that continuously monitors files in a specified directory on S3 and imports data from files ending in .csv into db1.tbl1.

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

| Parameters | Default Values ​​| |
| ------------------------------------ | ------ | ------------------------------------------- |
| max_streaming_job_num | 1024 | Maximum number of Streaming jobs |
| job_streaming_task_exec_thread_num | 10 | Number of threads used to execute StreamingTasks |
| max_streaming_task_show_count | 100 | Maximum number of task execution records that a StreamingTask keeps in memory |