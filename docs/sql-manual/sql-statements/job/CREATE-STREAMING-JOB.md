---
{
    "title": "CREATE STREAMING JOB",
    "language": "en",
    "description": "Use CREATE STREAMING JOB to continuously ingest data from TVFs or synchronize MySQL and PostgreSQL tables into Doris."
}
---

## Description

Doris Streaming Job is a continuous import task based on the Job approach. After the Job is submitted, Doris continuously runs the import job, querying TVF or upstream data sources in real time and writing the data into Doris tables.

Two modes are supported:

- **TVF Mode**: Uses `DO INSERT INTO ... SELECT FROM TVF()` syntax to continuously write TVF data into a specified single Doris table. Supports [S3 TVF](../../sql-functions/table-valued-functions/s3.md) and [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md).
- **Multi-table CDC Mode**: Uses `FROM <sourceType> TO DATABASE` syntax to continuously synchronize full and incremental data from multiple upstream database tables into Doris, automatically creating downstream tables on first sync.

For detailed usage, see [Continuous Load](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md).

## Syntax

### TVF Mode

```SQL
CREATE JOB <job_name>
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
ON STREAMING
[ COMMENT <comment> ]
DO <Insert_Command> 
```

### Multi-table CDC Mode

```SQL
CREATE JOB <job_name>
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
ON STREAMING
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

| Parameter | Applicable sources | Default | Description |
| --- | --- | --- | --- |
| `jdbc_url` | MySQL, PostgreSQL | - | Required. JDBC connection string. |
| `driver_url` | MySQL, PostgreSQL | - | Required. Path to the JDBC driver jar. |
| `driver_class` | MySQL, PostgreSQL | - | Required. JDBC driver class name. |
| `user` | MySQL, PostgreSQL | - | Required. Database user name. |
| `password` | MySQL, PostgreSQL | - | Required. Database password. |
| `database` | MySQL, PostgreSQL | - | Required. Upstream database name. For PostgreSQL, it must match the database name in the JDBC URL. |
| `schema` | PostgreSQL | - | Required. PostgreSQL Schema name. |
| `include_tables` | MySQL, PostgreSQL | - | Names of tables to sync, separated by commas. If not set, all tables in the database or Schema are synced. |
| `exclude_tables` | MySQL, PostgreSQL | - | Names of tables not to sync, separated by commas. This parameter takes effect only when `include_tables` is not set. |
| `table.<table_name>.target_table` | MySQL, PostgreSQL | Source table name | Sets the Doris target table name for a source table. |
| `table.<table_name>.exclude_columns` | MySQL, PostgreSQL | - | Excludes non-key columns from a source table, separated by commas. |
| `offset` | MySQL, PostgreSQL | `latest` | Startup offset. Supports `initial`, `snapshot`, `latest`, and exact JSON offsets. MySQL also supports `earliest`. |
| `snapshot_split_size` | MySQL, PostgreSQL | `8096` | Full-snapshot split size in rows. Must be a positive integer. |
| `snapshot_parallelism` | MySQL, PostgreSQL | `1` | Maximum number of splits scheduled by a Task at one time during the full-sync phase. Must be a positive integer. |
| `ssl_mode` | MySQL, PostgreSQL | `disable` | SSL mode. Valid values are `disable`, `require`, and `verify-ca`. |
| `ssl_rootcert` | MySQL, PostgreSQL | - | CA certificate file in the format `FILE:<file_name>`. Required when `ssl_mode=verify-ca`. |
| `server_id` | MySQL | Automatically generated | Server ID of the MySQL CDC reader. Supports a single value, such as `5400`, or a closed range, such as `5400-5408`. The range width must be greater than or equal to `snapshot_parallelism`. |
| `slot_name` | PostgreSQL | `doris_cdc_<job_id>` | Logical replication slot name. A custom slot must be created in advance and managed by the user. |
| `publication_name` | PostgreSQL | `doris_pub_<job_id>` | Publication name. A custom publication must be created in advance, include all synchronized tables, and be managed by the user. |

> Version note: `table.<table_name>.target_table`, `table.<table_name>.exclude_columns`, `offset=snapshot`, `ssl_mode`, `ssl_rootcert`, `server_id`, `slot_name`, and `publication_name` are supported since version 4.1.0.

If both `include_tables` and `exclude_tables` are set, `include_tables` takes precedence. `slot_name` and `publication_name` can contain only lowercase letters, digits, and underscores, cannot start with a digit, and are limited to 63 characters. For complete source-specific differences, JSON offset formats, and SSL certificate configuration, see [MySQL CDC with Auto Table Creation](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md) and [PostgreSQL CDC with Auto Table Creation](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md).

**5. `<target_db>`** (Multi-table CDC Mode)
> Doris target database name to import into.

**6. `<target_property>`** (Multi-table CDC Mode)

| Parameter | Default | Description |
| --- | --- | --- |
| `table.create.properties.*` | - | Adds table properties when Doris creates a table, for example, `table.create.properties.replication_num`. |
| `load.strict_mode` | `false` | Whether to enable strict mode for Stream Load writes. Valid values are `true` and `false`. |
| `load.max_filter_ratio` | `0` | Maximum allowed filter ratio in the sampling window, in the range `[0, 1]`. The sampling window is `max_interval * 10` seconds. The job is paused when the error-row ratio in the window exceeds this value. |

## Optional Parameters

**1. `<job_property>`**

| Parameter | Default | Description |
| --- | --- | --- |
| `max_interval` | `10` | Idle scheduling interval in seconds when no new upstream file or data is available. Must be an integer greater than or equal to 1. |
| `compute_group` | Current session or user default compute group | Supported only in compute-storage decoupled mode. Specifies the compute group in which the job runs. The user must have the USAGE privilege on the compute group. |
| `session.<variable_name>` | Default value of the corresponding session variable | Supported only in TVF mode. Sets a valid Doris session variable for the INSERT task. |
| `s3.max_batch_files` | `256` | Triggers a load when the accumulated file count reaches this value. Used only by S3 TVF. |
| `s3.max_batch_bytes` | `10737418240` | Triggers a load when the accumulated data size reaches this value. Used only by S3 TVF. The unit is bytes, and the valid range is 104857600 to 10737418240. |
| `offset` | - | Sets the source starting position when creating an S3 Streaming Job. The initial MySQL/PostgreSQL position must be set in source parameters; only an exact JSON offset can reset CDC progress through `ALTER JOB`. |

For all CDC Stream TVF parameters, including `type`, `table`, and `include_delete_sign`, see [CDC Stream](../../sql-functions/table-valued-functions/cdc-stream.md).

## Privilege Control

The user executing this SQL command must have at least the following privileges:

| Privilege   | Object      | Notes                                 |
|:------------|:------------|:--------------------------------------|
| LOAD_PRIV   | Database    | Currently, only the **LOAD** privilege is supported for this operation |

## Notes

- TASK only retains the latest 100 records.

### PROPERTIES Usage

Use `PROPERTIES` to configure Job runtime parameters, such as changing the scheduling interval or setting session variables:

```sql
CREATE JOB my_job
PROPERTIES (
    "max_interval" = "30",
    "session.insert_max_filter_ratio" = "0.5"
)
ON STREAMING
DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/s3/demo/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
    "s3.region" = "ap-southeast-1",
    "s3.access_key" = "",
    "s3.secret_key" = ""
);
```

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
        "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
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
        "table" = "source_table",
        "offset" = "initial"
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
        "table" = "source_table",
        "offset" = "initial"
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
