---
{
    "title": "PostgreSQL CDC with Auto Table Creation",
    "language": "en",
    "sidebar_label": "Auto Table Creation Sync",
    "description": "Use a Streaming Job to continuously sync full and incremental data from an entire PostgreSQL database to Doris, with automatic table creation on first sync.",
    "keywords": [
        "PostgreSQL sync",
        "PostgreSQL CDC",
        "Auto Table Creation Sync",
        "whole-database sync",
        "Streaming Job",
        "Flink CDC",
        "Doris data ingestion",
        "PostgreSQL to Doris",
        "full and incremental sync",
        "automatic table creation"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: Continuously sync an entire PostgreSQL database to Doris -->

Auto Table Creation Sync is implemented through the native `FROM POSTGRES (...) TO DATABASE (...)` DDL. **The target is a Doris database container, and Doris auto-creates the downstream tables.** You can use `include_tables` to control whether one table, multiple tables, or all tables are synced. On the first sync, Doris automatically creates the downstream primary-key tables and keeps their primary keys consistent with the upstream. This approach is suitable for mirror-replication scenarios where no SQL processing of the data is needed and the downstream table schemas should follow the upstream automatically.

By integrating [Flink CDC](https://github.com/apache/flink-cdc) capabilities, Doris reads change logs from PostgreSQL and continuously writes the full + incremental data of a group of tables into Doris through Stream Load. If you need to perform column mapping, filtering, or data transformation during synchronization, see [PostgreSQL CDC with SQL Mapping](./continuous-load-postgresql-table.md).

### Use Cases

-   Mirror-replicating an entire PostgreSQL database or multiple tables to Doris
-   Keeping the downstream table schema consistent with the upstream without manual table creation
-   No need for column pruning, filtering, or transformation in the sync pipeline
-   Need both full initialization and continuous capture of incremental changes

### Notes

1.  Currently only at-least-once semantics is guaranteed.
2.  Currently only primary-key table sync is supported.
3.  The Load privilege is required. If the downstream table does not exist, the Create privilege is also required.
4.  During automatic table creation, if the target table already exists it is skipped, so users can customize tables for different scenarios.

## Quick Start

<!-- Knowledge type: Operating procedure -->

Follow the steps below to create and check the status of a PostgreSQL Auto Table Creation Sync job.

### Step 1: Create a Load Job

Use [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) to create a continuous load job:

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
  "table.create.properties.replication_num" = "1"  -- Set to 1 for single-BE deployments
)
```

### Step 2: Check Load Status

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

For more general operations (pause, resume, delete, view tasks, etc.), see [Continuous Load Overview](./continuous-load-overview.md).

## Parameter Reference

<!-- Knowledge type: Configuration parameters -->

### Source Parameters (PostgreSQL Side)

PostgreSQL source parameters configure the JDBC connection, sync scope, and full-snapshot slicing behavior.

| Parameter            | Default | Description                                                                                                                                                                       |
| -------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| jdbc_url             | -       | PostgreSQL JDBC connection string                                                                                                                                                 |
| driver_url           | -       | Path to the JDBC driver jar. Supports file name, local absolute path, and HTTP URL. See [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) for details |
| driver_class         | -       | JDBC driver class name                                                                                                                                                            |
| user                 | -       | Database user name                                                                                                                                                                |
| password             | -       | Database password                                                                                                                                                                 |
| database             | -       | Database name                                                                                                                                                                     |
| schema               | -       | Schema name                                                                                                                                                                       |
| include_tables       | -       | Tables to sync, separated by commas. If left empty, all tables are synced by default                                                                                              |
| offset               | initial | initial: full + incremental sync; latest: incremental-only sync                                                                                                                   |
| snapshot_split_size  | 8096    | Size of a split (in rows). During full sync, a table is divided into multiple splits for synchronization                                                                          |
| snapshot_parallelism | 1       | Parallelism during the full-sync phase, that is, the maximum number of splits scheduled in a single Task                                                                          |

### Doris Target Database Parameters

Target-side parameters control the properties of automatically created tables and the Stream Load write strategy.

| Parameter                 | Default | Description                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| table.create.properties.* | -       | Supports specifying table properties when creating tables, such as replication_num                                                                                                                                                                                                                                                                         |
| load.strict_mode          | -       | Whether to enable strict mode. Disabled by default                                                                                                                                                                                                                                                                                                         |
| load.max_filter_ratio     | -       | The maximum allowed filter ratio within the sampling window. The value must be between 0 and 1 inclusive. The default value is 0, meaning zero tolerance. The sampling window is max_interval * 10. If, within the sampling window, the ratio of error rows to total rows exceeds max_filter_ratio, the routine job is paused, and manual intervention is required to check data quality issues. |

## Reference

<!-- Knowledge type: Syntax reference -->

### Load Command Syntax

The syntax for creating an Auto Table Creation Sync job is as follows:

```sql
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
FROM POSTGRES (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
)
```

The modules are described below:

| Module            | Description                                       |
| ----------------- | ------------------------------------------------- |
| job_name          | Job name                                          |
| job_properties    | Used to specify general load parameters of the Job |
| comment           | Used to describe the Job with comment information |
| source_properties | PostgreSQL source-related parameters              |
| target_properties | Doris target database-related parameters          |

## FAQ

<!-- Knowledge type: Frequently asked questions -->

**Q1: How to choose between Auto Table Creation Sync and SQL Mapping Sync?**

-   When you need mirror replication, automatic table creation, and no column pruning or transformation, use Auto Table Creation Sync.
-   When you need to perform column mapping, filtering, or data transformation in the sync pipeline, use [PostgreSQL CDC with SQL Mapping](./continuous-load-postgresql-table.md).

**Q2: Are non-primary-key tables supported?**

Currently only primary-key table sync is supported. Non-primary-key tables are not supported for now.

**Q3: What should I do if table creation fails on a single-BE deployment?**

You need to explicitly set `"table.create.properties.replication_num" = "1"` in the `TO DATABASE` clause to avoid a mismatch between the default replica count and the number of available BEs.

**Q4: If the target table already exists, will it be overwritten?**

No. The automatic table creation phase skips target tables that already exist. You can customize the table schema in advance as needed.

**Q5: How can I sync only incremental data and skip the full-sync phase?**

Set `offset` to `latest`. The job will only consume the latest incremental changes and will no longer perform full initialization.

## Related Docs

-   [PostgreSQL CDC with SQL Mapping](./continuous-load-postgresql-table.md)
-   [Continuous Load Overview](./continuous-load-overview.md)
-   [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
-   [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
