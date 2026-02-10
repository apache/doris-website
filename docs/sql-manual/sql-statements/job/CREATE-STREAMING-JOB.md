---
{
    "title": "CREATE STREAMING JOB",
    "language": "en",
    "description": "Doris Streaming Job is a continuous import task based on the Job approach. After the Job is submitted, Doris continuously runs the import job, querying TVF or upstream data sources in real time and writing the data into Doris tables."
}
---

## Description

Doris Streaming Job is a continuous import task based on the Job approach. After the Job is submitted, Doris continuously runs the import job, querying TVF or upstream data sources in real time and writing the data into Doris tables.

## Syntax

```SQL
CREATE JOB <job_name>
ON STREAMING
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
[ COMMENT <comment> ]
(
DO <Insert_Command> 
|
(
    FROM <sourceType> (
        <source_property>
        [ , ... ])
    TO DATABASE <target_db> 
    [ PROPERTIES   (
        <target_property>
        [ , ... ])
    ]
)
```


## Required Parameters

**1. `<job_name>`**
> The job name, which uniquely identifies an event in a database. The job name must be globally unique; if a job with the same name already exists, an error will be reported.

**2. `<Insert_Command>`**
> The DO clause specifies the operation to be executed when the job is triggered, i.e., an SQL statement. Currently, only S3 TVF is supported.

**3. `<sourceType>`**
> Supported data sources: currently only MySQL and Postgres.

**4. `<source_property>`**
| Parameter      | Default | Description                                                  |
| -------------- | ------- | ------------------------------------------------------------ |
| jdbc_url       | -       | JDBC connection string (MySQL/PG)                            |
| driver_url     | -       | JDBC driver jar path                                         |
| driver_class   | -       | JDBC driver class name                                       |
| user           | -       | Database username                                            |
| password       | -       | Database password                                            |
| database       | -       | Database name                                                |
| schema         | -       | Schema name                                                  |
| include_tables | -       | Tables to synchronize, comma separated                       |
| offset         | initial | initial: full + incremental sync, latest: incremental only   |
| snapshot_split_size | 8096 | The size (in number of rows) of each split. During full synchronization, a table will be divided into multiple splits for synchronization. |
| snapshot_parallelism | 1 | The parallelism level during the full synchronization phase, i.e., the maximum number of splits a single task can schedule at once. |


**5. `<target_db>`**
> Doris target database name to import into.

**6. `<target_property>`**
| Parameter                       | Default | Description                                 |
| ------------------------------- | ------- | ------------------------------------------- |
| table.create.properties.*       | -       | Table properties when creating, e.g. replication_num |
| load.strict_mode | - | Whether to enable strict mode. Disabled by default. |
| load.max_filter_ratio | - | The maximum allowed filtering ratio within a sampling window. Must be between 0 and 1 (inclusive). The default value is 0, indicating zero tolerance. The sampling window equals max_interval * 10. If, within this window, the ratio of erroneous rows to total rows exceeds max_filter_ratio, the scheduled job will be paused and requires manual intervention to address data quality issues. |



## Optional Parameters

**1. `<job_property>`**
| Parameter          | Default | Description                                                  |
| ------------------ | ------- | ------------------------------------------------------------ |
| session.*          | None    | Supports configuring all session variables in job_properties |
| s3.max_batch_files | 256     | Triggers an import write when the cumulative number of files reaches this value |
| s3.max_batch_bytes | 10G     | Triggers an import write when the cumulative data volume reaches this value |
| max_interval       | 10s     | Idle scheduling interval when there are no new files or data upstream |

## Privilege Control

The user executing this SQL command must have at least the following privileges:

| Privilege   | Object      | Notes                                 |
|:------------|:------------|:--------------------------------------|
| LOAD_PRIV   | Database    | Currently, only the **LOAD** privilege is supported for this operation |

## Notes

- TASK only retains the latest 100 records.
- Currently, Insert_Command only supports **INSERT internal table Select * From S3(...)**; more operations will be supported in the future.

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

- Create a job named multi_table_sync to synchronize user_info and order_info tables from MySQL upstream to the target_test_db database from the beginning.

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

- Create a job named test_postgres_job to continuously synchronize incremental data from the test_tbls table in Postgres upstream to the target_test_db database.

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

## CONFIG

**fe.conf**

| Parameter                             | Default | Description                                 |
| -------------------------------------- | ------- | ------------------------------------------- |
| max_streaming_job_num                  | 1024    | Maximum number of Streaming jobs            |
| job_streaming_task_exec_thread_num     | 10      | Number of threads for StreamingTask         |
| max_streaming_task_show_count          | 100     | Max number of StreamingTask records in memory|