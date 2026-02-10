---
{
  "title": "Postgres/MySQL Continuous Load",
  "language": "en",
  "description": "Doris can continuously synchronize full and incremental data from multiple tables in MySQL, Postgres, etc. to Doris using Streaming Job."
}
---

## Overview

Supports using Job to continuously synchronize full and incremental data from multiple tables in MySQL, Postgres, etc. to Doris via Streaming Job. Suitable for scenarios requiring real-time multi-table data synchronization to Doris.

## Supported Data Sources

- MySQL
- Postgres

## Basic Principles

By integrating [Flink CDC](https://github.com/apache/flink-cdc), Doris supports reading change logs from MySQL, Postgres, etc., enabling full and incremental multi-table data synchronization. When synchronizing for the first time, Doris automatically creates downstream tables (primary key tables) and keeps the primary key consistent with the upstream.

**Notes:**

1. Currently only at-least-once semantics are guaranteed.
2. Only primary key tables are supported for synchronization.
3. LOAD privilege is required. If the downstream table does not exist, CREATE privilege is also required.

## Quick Start

### Prerequisites

#### MySQL
Enable Binlog on MySQL by adding the following to my.cnf:
```ini
log-bin=mysql-bin
binlog_format=ROW
server-id=1
```

#### Postgres
Enable logical replication on Postgres by adding the following to postgresql.conf:
```ini
wal_level=logical
```

### Creating an Import Job

#### MySQL

```sql
CREATE JOB multi_table_sync
ON STREAMING
FROM MYSQL (
        "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
        "driver_url" = "mysql-connector-j-8.0.31.jar",
        "driver_class" = "com.mysql.cj.jdbc.Driver",
        "user" = "root",
        "password" = "123456",
        "database" = "test",
        "include_tables" = "user_info,order_info",
        "offset" = "initial"
)
TO DATABASE target_test_db (
    "table.create.properties.replication_num" = "1"
)
```

#### Postgres

```sql
CREATE JOB test_postgres_job
ON STREAMING
FROM POSTGRES (
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.0.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "database" = "postgres",
    "schema" = "public",
    "include_tables" = "test_tbls",
    "offset" = "latest"
)
TO DATABASE target_test_db (
  "table.create.properties.replication_num" = "1"
)
```

### Check Import Status

```sql
select * from jobs(type=insert) where ExecuteType = "STREAMING"
       Id: 1765332859199
       Name: mysql_db_sync
      Definer: root
    ExecuteType: STREAMING
RecurringStrategy: \N
       Status: RUNNING
     ExecuteSql: FROM MYSQL('include_tables'='user_info','database'='test','driver_class'='com.mysql.cj.jdbc.Driver','driver_url'='mysql-connector-j-8.0.31.jar','offset'='initial','jdbc_url'='jdbc:mysql://127.0.0.1:3306','user'='root' ) TO DATABASE target_test_db ('table.create.properties.replication_num'='1')
     CreateTime: 2025-12-10 10:19:35
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
      Comment: 
     Properties: \N
  CurrentOffset: {"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","splitId":"binlog-split","row":"1","event":"2","server_id":"1"}
    EndOffset: \N
  LoadStatistic: {"scannedRows":24,"loadBytes":1146,"fileNumber":0,"fileSize":0}
     ErrorMsg: \N
```

### Pause Import Job

```sql
PAUSE JOB WHERE jobname = <job_name> ;
```

### Resume Import Job

```sql
RESUME JOB where jobName = <job_name> ;
```

### Modify Import Job

```sql
ALTER JOB <job_name>
FROM MYSQL (
  "user" = "root",
  "password" = "123456"
)
TO DATABASE target_test_db
```

### Delete Import Job

```sql
DROP JOB where jobName = <job_name> ;
```

## Reference Manual

### Import Command

Syntax for creating a multi-table synchronization job:

```sql
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
FROM <MYSQL|POSTGRES> (
  [source_properties]
)
TO DATABASE <target_db> (
  [target_properties]
)
```

| Module               | Description                  |
| ------------------   | --------------------------- |
| job_name             | Job name                    |
| job_properties       | General import parameters   |
| comment              | Job comment                 |
| source_properties    | Source (MySQL/PG) parameters|
| target_properties    | Doris target DB parameters  |

### Import Parameters

#### FE Configuration Parameters

| Parameter                             | Default | Description                                 |
| -------------------------------------- | ------- | ------------------------------------------- |
| max_streaming_job_num                  | 1024    | Maximum number of Streaming jobs            |
| job_streaming_task_exec_thread_num     | 10      | Number of threads for StreamingTask         |
| max_streaming_task_show_count          | 100     | Max number of StreamingTask records in memory|

#### General Job Import Parameters

| Parameter     | Default | Description                                 |
| ------------- | ------- | ------------------------------------------- |
| max_interval  | 10s     | Idle scheduling interval when no new data   |

#### Source Configuration Parameters

| Parameter     | Default | Description                                 |
| ------------- | ------- | ------------------------------------------- |
| jdbc_url      | -       | JDBC connection string (MySQL/PG)           |
| driver_url    | -       | JDBC driver jar path                        |
| driver_class  | -       | JDBC driver class name                      |
| user          | -       | Database username                           |
| password      | -       | Database password                           |
| database      | -       | Database name                               |
| schema        | -       | Schema name                                 |
| include_tables| -       | Tables to synchronize, comma separated      |
| offset        | initial | initial: full + incremental, latest: incremental only |
| snapshot_split_size | 8096 | The size (in number of rows) of each split. During full synchronization, a table will be divided into multiple splits for synchronization. |
| snapshot_parallelism | 1 | The parallelism level during the full synchronization phase, i.e., the maximum number of splits a single task can schedule at once. |

#### Doris Target DB Parameters

| Parameter                       | Default | Description                                 |
| ------------------------------- | ------- | ------------------------------------------- |
| table.create.properties.*       | -       | Table properties when creating, e.g. replication_num |
| load.strict_mode | - | Whether to enable strict mode. Disabled by default. |
| load.max_filter_ratio | - | The maximum allowed filtering ratio within a sampling window. Must be between 0 and 1 (inclusive). The default value is 0, indicating zero tolerance. The sampling window equals max_interval * 10. If, within this window, the ratio of erroneous rows to total rows exceeds max_filter_ratio, the scheduled job will be paused and requires manual intervention to address data quality issues. |

### Import Status

#### Job

After submitting a job, you can run the following SQL to check the job status:

```sql
select * from jobs(type=insert) where ExecuteType = "STREAMING"
*************************** 1. row ***************************
               Id: 1765332859199
             Name: mysql_db_sync
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: FROM MYSQL('include_tables'='user_info','database'='test','driver_class'='com.mysql.cj.jdbc.Driver','driver_url'='mysql-connector-j-8.0.31.jar','offset'='initial','jdbc_url'='jdbc:mysql://127.0.0.1:3306','user'='root' ) TO DATABASE target_test_db ('table.create.properties.replication_num'='1')
       CreateTime: 2025-12-10 10:19:35
 SucceedTaskCount: 2
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: 
       Properties: \N
    CurrentOffset: {"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","splitId":"binlog-split","row":"1","event":"2","server_id":"1"}
        EndOffset: {"ts_sec":"0","file":"binlog.000003","pos":"157","kind":"SPECIFIC","gtids":"","row":"0","event":"0"}
    LoadStatistic: {"scannedRows":3,"loadBytes":232,"fileNumber":0,"fileSize":0}
         ErrorMsg: \N
```

| Result Column      | Description                                 |
| ------------------ | ------------------------------------------- |
| ID                 | Job ID                                      |
| NAME               | Job name                                    |
| Definer            | Job definer                                 |
| ExecuteType        | Job type: ONE_TIME/RECURRING/STREAMING/MANUAL|
| RecurringStrategy  | Recurring strategy, empty for Streaming     |
| Status             | Job status                                  |
| ExecuteSql         | Job's Insert SQL statement                  |
| CreateTime         | Job creation time                           |
| SucceedTaskCount   | Number of successful tasks                  |
| FailedTaskCount    | Number of failed tasks                      |
| CanceledTaskCount  | Number of canceled tasks                    |
| Comment            | Job comment                                 |
| Properties         | Job properties                              |
| CurrentOffset      | Current offset, only for Streaming jobs     |
| EndOffset          | Max end offset from source, only for Streaming|
| LoadStatistic      | Job statistics                              |
| ErrorMsg           | Job error message                           |
| JobRuntimeMsg      | Job runtime info                            |

#### Task

You can run the following SQL to check the status of each Task:

```sql
select * from tasks(type='insert') where jobId='1765336137066'
*************************** 1. row ***************************
       TaskId: 1765336137066
        JobId: 1765332859199
      JobName: mysql_db_sync
        Label: 1765332859199_1765336137066
       Status: SUCCESS
     ErrorMsg: \N
   CreateTime: 2025-12-10 11:09:06
    StartTime: 2025-12-10 11:09:16
   FinishTime: 2025-12-10 11:09:18
  TrackingUrl: \N
LoadStatistic: {"scannedRows":1,"loadBytes":333}
         User: root
FirstErrorMsg: 
RunningOffset: {"endOffset":{"ts_sec":"1765284495","file":"binlog.000002","pos":"9521","kind":"SPECIFIC","row":"1","event":"2","server_id":"1"},"startOffset":{"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","row":"1","splitId":"binlog-split","event":"2","server_id":"1"},"splitId":"binlog-split"}
```

| Result Column      | Description                                 |
| ------------------ | ------------------------------------------- |
| TaskId             | Task ID                                     |
| JobID              | Job ID                                      |
| JobName            | Job name                                    |
| Label              | Task label                                  |
| Status             | Task status                                 |
| ErrorMsg           | Task error message                          |
| CreateTime         | Task creation time                          |
| StartTime          | Task start time                             |
| FinishTime         | Task finish time                            |
| LoadStatistic      | Task statistics                             |
| User               | Task executor                               |
| RunningOffset      | Current offset, only for Streaming jobs     |