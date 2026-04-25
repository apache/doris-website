---
{
    "title": "PostgreSQL Database-level Sync",
    "sidebar_label": "Database-level Sync",
    "language": "en",
    "description": "Doris can continuously sync full and incremental data of a group of PostgreSQL tables into Doris at the database level via Streaming Job, auto-creating downstream tables on first sync."
}
---

## Overview

Database-level Sync is implemented via the native `FROM POSTGRES (...) TO DATABASE (...)` DDL, **using a database as the sync unit with a Doris database as the target container**. You can sync one, several, or all tables via `include_tables`; on first sync Doris automatically creates downstream primary-key tables and keeps primary keys consistent with the upstream. Suitable for mirror replication scenarios where downstream schema should track upstream automatically and no SQL processing is needed.

By integrating [Flink CDC](https://github.com/apache/flink-cdc), Doris reads change logs from PostgreSQL and continuously writes full + incremental data of a group of tables into Doris via Stream Load. If you need column mapping, filtering, or data transformation during sync, see [PostgreSQL Table-level Sync](./continuous-load-postgresql-table.md).

**Notes:**

1. Currently only at-least-once semantics are guaranteed.
2. Only primary key tables are supported for synchronization.
3. LOAD privilege is required. If the downstream table does not exist, CREATE privilege is also required.
4. During automatic table creation, if the target table already exists, it will be skipped, and users can customize tables according to different scenarios.

## Quick Start

### Creating an Import Job

Use [CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) to create a continuous import job:

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
  "table.create.properties.replication_num" = "1"  -- Set to 1 for single BE deployment
)
```

### Check Import Status

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

For more common operations (pause, resume, delete, check Task, etc.), see [Continuous Load Overview](./continuous-load-overview.md).

## Source Parameters

| Parameter    | Default | Description                                                  |
| -------------- | ------- | ------------------------------------------------------------ |
| jdbc_url       | -       | PostgreSQL JDBC connection string                            |
| driver_url     | -       | JDBC driver jar path. Supports file name, local absolute path, and HTTP URL. See [JDBC Catalog Overview](../../../lakehouse/catalogs/jdbc-catalog-overview.md) for details. |
| driver_class   | -       | JDBC driver class name                                       |
| user           | -       | Database username                                            |
| password       | -       | Database password                                            |
| database       | -       | Database name                                                |
| schema         | -       | Schema name                                                  |
| include_tables | -       | Tables to synchronize, comma separated. If not specified, all tables will be synchronized by default. |
| offset         | initial | initial: full + incremental sync, latest: incremental only   |
| snapshot_split_size | 8096 | Split size (in rows). During full sync, the table is divided into multiple splits |
| snapshot_parallelism | 1   | Parallelism during full sync phase, i.e., max splits per task |

## Reference

### Import Command

Syntax for creating a database-level sync job:

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

| Module             | Description                    |
| ------------------ | ------------------------------ |
| job_name           | Job name                       |
| job_properties     | General import parameters      |
| comment            | Job comment                    |
| source_properties  | PostgreSQL source parameters   |
| target_properties  | Doris target DB parameters     |

### Doris Target DB Parameters

| Parameter                       | Default | Description                                                  |
| ------------------------------- | ------- | ------------------------------------------------------------ |
| table.create.properties.*       | -       | Table properties when creating, e.g. replication_num         |
| load.strict_mode                | -       | Whether to enable strict mode. Disabled by default.          |
| load.max_filter_ratio           | -       | The maximum allowed filtering ratio within a sampling window. Must be between 0 and 1 (inclusive). The default value is 0, indicating zero tolerance. The sampling window equals max_interval * 10. If, within this window, the ratio of erroneous rows to total rows exceeds max_filter_ratio, the scheduled job will be paused and requires manual intervention to address data quality issues. |
