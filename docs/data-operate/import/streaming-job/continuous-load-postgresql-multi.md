---
{
    "title": "PostgreSQL Multi-table Import",
    "language": "en",
    "description": "Doris can continuously synchronize full and incremental data from multiple PostgreSQL tables into Doris using Streaming Job."
}
---

## Overview

Supports using Job to continuously synchronize full and incremental data from multiple tables in a PostgreSQL database to Doris via Stream Load. Suitable for scenarios requiring real-time multi-table data synchronization to Doris.

By integrating [Flink CDC](https://github.com/apache/flink-cdc), Doris supports reading change logs from PostgreSQL databases, enabling full and incremental multi-table data synchronization. When synchronizing for the first time, Doris automatically creates downstream tables (primary key tables) and keeps the primary key consistent with the upstream.

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

Syntax for creating a multi-table sync job:

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
