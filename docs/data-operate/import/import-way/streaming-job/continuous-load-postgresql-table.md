---
{
    "title": "PostgreSQL CDC with SQL Mapping",
    "language": "en",
    "sidebar_label": "SQL Mapping Sync",
    "description": "Use Doris Job + CDC Stream TVF to continuously sync a PostgreSQL table to Doris, with column mapping, data transformation, and exactly-once semantics.",
    "keywords": [
        "PostgreSQL CDC",
        "PostgreSQL real-time sync",
        "Doris CDC Stream",
        "WAL incremental sync",
        "Flink CDC",
        "exactly-once",
        "Streaming Job",
        "SQL Mapping Sync"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: PostgreSQL real-time data sync / single-table CDC ingestion with SQL mapping -->

SQL Mapping Sync is implemented through Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md). The target is an existing Doris table (`INSERT INTO tbl SELECT * FROM cdc_stream(...)`). Doris SQL provides the expressiveness to support column mapping, filtering, and data transformation, while guaranteeing exactly-once semantics. This approach is suitable for real-time sync scenarios where data needs to be processed before writing.

By integrating the read capability of [Flink CDC](https://github.com/apache/flink-cdc), Doris reads change logs (WAL) from PostgreSQL to perform full + incremental sync from the source table to the target table. If you want Doris to automatically create downstream tables and sync a group of tables on a per-database basis, see [PostgreSQL CDC with Auto Table Creation](./continuous-load-postgresql-database.md).

### Use Cases

-   Real-time ingestion of a single table into the warehouse, with column pruning, filtering, or expression-based transformation required before write.
-   The downstream Doris table already exists, and you want SQL to explicitly control field mapping.
-   High consistency requirements that demand exactly-once semantics.

### Prerequisites

Before creating a job, confirm the following:

1. Logical replication is enabled on the PostgreSQL side. See the [Configuration Guide](./continuous-load-overview.md) for details.
2. The current user has the `Load` privilege.
3. The source table is a primary key table (only primary key tables are currently supported for sync).
4. The target table has been created in Doris in advance, and its schema is compatible with the mapping SQL.

### Notes

-   Exactly-once semantics is supported.
-   Only primary key table sync is currently supported.
-   The `Load` privilege is required.
-   Logical replication must be enabled on the PostgreSQL side. See the [Configuration Guide](./continuous-load-overview.md).

## Quick Start

The overall workflow has two steps: create the continuous load job, then check the job status.

### Step 1: Create the Load Job

Use [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) to create a continuous load job that syncs `public.source_table` from PostgreSQL to `db1.tbl1` in Doris:

```sql
CREATE JOB pg_single_sync
ON STREAMING
DO
INSERT INTO db1.tbl1
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
)
```

### Step 2: Check the Load Status

Use the `jobs` table function to check the running status of Streaming-type jobs:

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

For other common operations (pause, resume, delete, view tasks, and so on), see the [Continuous Load Overview](./continuous-load-overview.md).

## Parameter Reference

<!-- Knowledge type: Configuration parameters -->

### Data Source Parameters

Data source parameters are configured through the `cdc_stream(...)` TVF. They describe the PostgreSQL table to be synced and the read behavior.

| Parameter            | Default | Description                                                                                                                                                       |
| -------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type                 | -       | Data source type. Set to `postgres`.                                                                                                                              |
| jdbc_url             | -       | PostgreSQL JDBC connection string.                                                                                                                                |
| driver_url           | -       | Path to the JDBC driver jar. Supports a file name, a local absolute path, or an HTTP URL. See the [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) for details. |
| driver_class         | -       | JDBC driver class name.                                                                                                                                           |
| user                 | -       | Database username.                                                                                                                                                |
| password             | -       | Database password.                                                                                                                                                |
| database             | -       | Database name.                                                                                                                                                    |
| schema               | -       | Schema name.                                                                                                                                                      |
| table                | -       | Name of the table to sync.                                                                                                                                        |
| offset               | initial | `initial`: full + incremental sync. `latest`: incremental sync only.                                                                                              |
| snapshot_split_size  | 8096    | Split size in rows. During full sync, the table is divided into multiple splits for syncing.                                                                      |
| snapshot_parallelism | 1       | Parallelism for the full sync stage, that is, the maximum number of splits scheduled per Task.                                                                    |

### Load Configuration Parameters

Load configuration parameters are set through the job's `job_properties`. They control load behavior and session variables.

| Parameter | Default | Description                                                                                                                                                                       |
| --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| session.* | None    | All session variables can be configured in `job_properties`. For load-related variables, see [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#load-configuration-parameters). |

For more common parameters (such as `max_interval`), see the [Common Parameters](./continuous-load-overview.md#common-parameters) section in the Continuous Load Overview.
