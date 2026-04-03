---
{
    "title": "Continuous Load Overview",
    "language": "en",
    "description": "Doris supports continuously loading data from multiple data sources into Doris tables via Streaming Job."
}
---

## Overview

Doris supports continuously loading data from multiple data sources into Doris tables via Streaming Job. After submitting a Job, Doris continuously runs the import job, reading data from the source in real time and writing it into Doris tables.

Continuous Load supports the following data sources and import modes:

| Data Source | Supported Versions | Single-table Import | Multi-table Import | Setup Guide |
|:------|:--------|:--------|:--------|:--------|
| MySQL | 5.6, 5.7, 8.0.x | [MySQL Single-table](./continuous-load-mysql-single.md) | [MySQL Multi-table](./continuous-load-mysql-multi.md) | [Amazon RDS MySQL](./prerequisites/amazon-rds-mysql.md) · [Amazon Aurora MySQL](./prerequisites/amazon-aurora-mysql.md) |
| PostgreSQL | 14, 15, 16, 17 | [PostgreSQL Single-table](./continuous-load-postgresql-single.md) | [PostgreSQL Multi-table](./continuous-load-postgresql-multi.md) | [Amazon RDS PostgreSQL](./prerequisites/amazon-rds-postgresql.md) · [Amazon Aurora PostgreSQL](./prerequisites/amazon-aurora-postgresql.md) |
| S3 | - | [S3 Continuous Load](./continuous-load-s3.md) | - | - |

:::tip
- **Single-table Import**: Uses CDC Stream TVF or S3 TVF to continuously load data into a specific Doris table, supporting flexible column mapping and data transformation.
- **Multi-table Import**: Uses native multi-table CDC capability to continuously synchronize full and incremental data from multiple source tables into Doris, automatically creating downstream tables on first sync.
:::

## Common Operations

### Check Import Status

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

| Column            | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| ID                | Job ID                                                       |
| NAME              | Job name                                                     |
| Definer           | Job definer                                                  |
| ExecuteType       | Job type: *ONE_TIME/RECURRING/STREAMING/MANUAL*              |
| RecurringStrategy | Recurring strategy, empty for Streaming                      |
| Status            | Job status                                                   |
| ExecuteSql        | Job's Insert SQL statement                                   |
| CreateTime        | Job creation time                                            |
| SucceedTaskCount  | Number of successful tasks                                   |
| FailedTaskCount   | Number of failed tasks                                       |
| CanceledTaskCount | Number of canceled tasks                                     |
| Comment           | Job comment                                                  |
| Properties        | Job properties                                               |
| CurrentOffset     | Current offset, only for Streaming jobs                      |
| EndOffset         | Max end offset from source, only for Streaming jobs          |
| LoadStatistic     | Job statistics                                               |
| ErrorMsg          | Job error message                                            |
| JobRuntimeMsg     | Job runtime info                                             |

### Check Task Status

```sql
select * from tasks("type"="insert") where jobId='<job_id>';
```

| Column        | Description                                          |
| ------------- | ---------------------------------------------------- |
| TaskId        | Task ID                                              |
| JobID         | Job ID                                               |
| JobName       | Job name                                             |
| Label         | Task label                                           |
| Status        | Task status                                          |
| ErrorMsg      | Task error message                                   |
| CreateTime    | Task creation time                                   |
| StartTime     | Task start time                                      |
| FinishTime    | Task finish time                                     |
| LoadStatistic | Task statistics                                      |
| User          | Task executor                                        |
| RunningOffset | Current offset, only for Streaming jobs              |

### Pause Import Job

```sql
PAUSE JOB WHERE jobname = <job_name>;
```

### Resume Import Job

```sql
RESUME JOB WHERE jobName = <job_name>;
```

### Delete Import Job

```sql
DROP JOB WHERE jobName = <job_name>;
```

## Common Parameters

### FE Configuration Parameters

| Parameter                            | Default | Description                                |
| ------------------------------------ | ------- | ------------------------------------------ |
| max_streaming_job_num              | 1024    | Maximum number of Streaming jobs           |
| job_streaming_task_exec_thread_num | 10      | Number of threads for StreamingTask        |
| max_streaming_task_show_count      | 100     | Max number of StreamingTask records in memory |

### General Job Import Parameters

| Parameter    | Default | Description                                    |
| ------------ | ------- | ---------------------------------------------- |
| max_interval | 10s     | Idle scheduling interval when no new data      |

## FAQ

### MySQL connection error: Public Key Retrieval is not allowed

**Cause:** The MySQL user uses SHA256 password authentication, which requires TLS or other protocols to transmit the password.

**Solution 1:** Add `allowPublicKeyRetrieval=true` to the JDBC URL:

```
jdbc:mysql://127.0.0.1:3306?allowPublicKeyRetrieval=true
```

**Solution 2:** Change the MySQL user's authentication method to `mysql_native_password`:

```sql
ALTER USER 'username'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```
