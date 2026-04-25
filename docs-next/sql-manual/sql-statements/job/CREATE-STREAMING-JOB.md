---
{
    "title": "CREATE STREAMING JOB",
    "language": "en",
    "description": "Doris Streaming Job is a continuous import task based on the Job approach. After the Job is submitted, Doris continuously runs the import job, querying TVF or upstream data sources in real time and writing the data into Doris tables."
}
---

## Description

Doris Streaming Job is a continuous import task based on the Job approach. After the Job is submitted, Doris continuously runs the import job, querying TVF or upstream data sources in real time and writing the data into Doris tables.

Two modes are supported:

- **TVF Mode**: Uses `DO INSERT INTO ... SELECT FROM TVF()` syntax to continuously write TVF data into a specified single Doris table. Supports [S3 TVF](../../sql-functions/table-valued-functions/s3.md) and [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md).
- **Multi-table CDC Mode**: Uses `FROM <sourceType> TO DATABASE` syntax to continuously synchronize full and incremental data from multiple upstream database tables into Doris, automatically creating downstream tables on first sync.

For detailed usage, see [Continuous Load](../../../data-operate/import/streaming-job/continuous-load-overview.md).

## Syntax

### TVF Mode

```SQL
CREATE JOB <job_name>
ON STREAMING
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
[ COMMENT <comment> ]
DO <Insert_Command> 
```

### Multi-table CDC Mode

```SQL
CREATE JOB <job_name>
ON STREAMING
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
[ COMMENT <comment> ]
FROM <sourceType> (
    <source_property>
    [ , ... ]
)
TO DATABASE <target_db> (
    <target_property>
    [ , ... ]
)
```

## Required Parameters

**1. `<job_name>`**
> The job name, which uniquely identifies an event in a database. The job name must be globally unique; if a job with the same name already exists, an error will be reported.

**2. `<Insert_Command>`** (TVF Mode)
> The DO clause specifies the operation to be executed when the job is triggered, i.e., an INSERT INTO SELECT FROM TVF statement. Supports [S3 TVF](../../sql-functions/table-valued-functions/s3.md) and [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md).

**3. `<sourceType>`** (Multi-table CDC Mode)
> Supported data source types: currently supports `MYSQL` and `POSTGRES`.

**4. `<source_property>`** (Multi-table CDC Mode)

| Parameter      | Default | Description                                                  |
| -------------- | ------- | ------------------------------------------------------------ |
| jdbc_url       | -       | JDBC connection string (MySQL/PostgreSQL)                    |
| driver_url     | -       | JDBC driver jar path                                         |
| driver_class   | -       | JDBC driver class name                                       |
| user           | -       | Database username                                            |
| password       | -       | Database password                                            |
| database       | -       | Database name                                                |
| schema         | -       | Schema name (PostgreSQL)                                     |
| include_tables | -       | Tables to synchronize, comma separated. If not specified, all tables will be synchronized by default. |
| offset         | initial | initial: full + incremental sync, latest: incremental only   |
| snapshot_split_size | 8096 | Split size (in rows). During full sync, the table is divided into multiple splits. |
| snapshot_parallelism | 1   | Parallelism during full sync phase, i.e., max splits per task. |

**5. `<target_db>`** (Multi-table CDC Mode)
> Doris target database name to import into.

**6. `<target_property>`** (Multi-table CDC Mode)

| Parameter                       | Default | Description                                                  |
| ------------------------------- | ------- | ------------------------------------------------------------ |
| table.create.properties.*       | -       | Table properties when creating, e.g. replication_num         |
| load.strict_mode                | -       | Whether to enable strict mode. Disabled by default.          |
| load.max_filter_ratio           | -       | The maximum allowed filtering ratio within a sampling window. Must be between 0 and 1 (inclusive). The default value is 0, indicating zero tolerance. The sampling window equals max_interval * 10. If, within this window, the ratio of erroneous rows to total rows exceeds max_filter_ratio, the scheduled job will be paused and requires manual intervention to address data quality issues. |

## Optional Parameters

**1. `<job_property>`**

| Parameter          | Default | Description                                                  |
| ------------------ | ------- | ------------------------------------------------------------ |
| session.*          | -       | Supports configuring all session variables in job_properties (TVF Mode only) |
| s3.max_batch_files | 256     | Triggers an import write when the accumulated file count reaches this value (S3 TVF only) |
| s3.max_batch_bytes | 10G     | Triggers an import write when the accumulated data size reaches this value (S3 TVF only) |
| max_interval       | 10s     | Idle scheduling interval when there are no new files or data upstream |

## Privilege Control

The user executing this SQL command must have at least the following privileges:

| Privilege   | Object      | Notes                                 |
|:------------|:------------|:--------------------------------------|
| LOAD_PRIV   | Database    | Currently, only the **LOAD** privilege is supported for this operation |

## Notes

- TASK only retains the latest 100 records.

## Examples

### TVF Mode

- Create a job that continuously monitors files in a specified directory on S3 and imports data from CSV files into db1.tbl1.

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

- Create a job that continuously synchronizes a single MySQL table into Doris using CDC Stream TVF.

    ```sql
    CREATE JOB mysql_cdc_job
    ON STREAMING
    DO
    INSERT INTO db1.target_table
    SELECT * FROM cdc_stream(
        "type" = "mysql",
        "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
        "driver_url" = "mysql-connector-java-8.0.25.jar",
        "driver_class" = "com.mysql.cj.jdbc.Driver",
        "user" = "root",
        "password" = "123456",
        "database" = "source_db",
        "table" = "source_table"
    );
    ```

- Create a job that continuously synchronizes a single PostgreSQL table into Doris using CDC Stream TVF.

    ```sql
    CREATE JOB pg_cdc_job
    ON STREAMING
    DO
    INSERT INTO db1.target_table
    SELECT * FROM cdc_stream(
        "type" = "postgres",
        "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
        "driver_url" = "postgresql-42.5.1.jar",
        "driver_class" = "org.postgresql.Driver",
        "user" = "postgres",
        "password" = "postgres",
        "database" = "postgres",
        "schema" = "public",
        "table" = "source_table"
    );
    ```

### Multi-table CDC Mode

- Create a job to synchronize user_info and order_info tables from MySQL upstream to the target_test_db database from the beginning.

    ```sql
    CREATE JOB multi_table_sync
    ON STREAMING
    FROM MYSQL (
            "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
            "driver_url" = "mysql-connector-java-8.0.25.jar",
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

- Create a job to continuously synchronize incremental data from the test_tbls table in PostgreSQL upstream to the target_test_db database.

    ```sql
    CREATE JOB test_postgres_job
    ON STREAMING
    FROM POSTGRES (
        "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
        "driver_url" = "postgresql-42.5.1.jar",
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
