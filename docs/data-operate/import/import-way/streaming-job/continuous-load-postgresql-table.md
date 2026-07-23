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

SQL Mapping Sync is implemented through Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md). The target is an existing Doris table (`INSERT INTO tbl SELECT * FROM cdc_stream(...)`). Doris SQL provides the expressiveness to support column mapping, filtering, and data transformation. This approach is suitable for real-time sync scenarios where data needs to be processed before writing.

> SQL Mapping Sync is supported since version 4.1.0.

By integrating the read capability of [Flink CDC](https://github.com/apache/flink-cdc), Doris reads change logs (WAL) from PostgreSQL to perform full + incremental sync from the source table to the target table. If you want Doris to automatically create downstream tables and sync a group of tables on a per-database basis, see [PostgreSQL CDC with Auto Table Creation](./continuous-load-postgresql-database.md).

### Use Cases

-   Real-time ingestion of a single table into the warehouse, with column pruning, filtering, or expression-based transformation required before write.
-   The downstream Doris table already exists, and you want SQL to explicitly control field mapping.
-   High consistency requirements that demand exactly-once semantics.

### Prerequisites

Before creating a job, confirm the following:

1. Logical replication is enabled on the PostgreSQL side. See the [Configuration Guide](./continuous-load-overview.md#supported-data-sources-and-sync-modes) for details.
2. The current user has the `Load` privilege.
3. The source table is a primary key table (only primary key tables are currently supported for sync).
4. The target Unique Key table has been created in Doris in advance, and its schema is compatible with the mapping SQL.

### Notes

-   Exactly-once semantics is supported.
-   Only primary key table sync is currently supported.
-   The `Load` privilege is required.
-   Logical replication must be enabled on the PostgreSQL side. See the [Configuration Guide](./continuous-load-overview.md#supported-data-sources-and-sync-modes).

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

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `type` | Yes | - | Data source type. Set to `postgres`. |
| `jdbc_url` | Yes | - | PostgreSQL JDBC connection string. |
| `driver_url` | Yes | - | Path to the JDBC driver jar. Supports a file name, local absolute path, or HTTP URL. For details, see [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md). |
| `driver_class` | Yes | - | JDBC driver class name, for example, `org.postgresql.Driver`. |
| `user` | Yes | - | Database user name. |
| `password` | Yes | - | Database password. |
| `database` | No | Database name in the JDBC URL | PostgreSQL database name. When explicitly set, it overrides the database name in the JDBC URL. It cannot exceed 63 bytes after UTF-8 encoding. |
| `schema` | Yes | - | Schema name. |
| `table` | Yes | - | Name of the table to sync. Each SQL Mapping job supports one source table. |
| `offset` | Yes | - | Startup offset. `initial`: full and incremental sync; `snapshot`: full sync only; `latest`: sync only changes after the job starts. You can also specify an exact JSON offset, such as `{"lsn":"12345678"}`. PostgreSQL does not support `earliest`. |
| `snapshot_split_size` | No | `8096` | Split size in rows. During full sync, the table is divided into multiple splits. Must be a positive integer. |
| `snapshot_parallelism` | No | `1` | Parallelism of the full-sync phase, that is, the maximum number of splits scheduled by a Task at one time. Must be a positive integer. |
| `skip_snapshot_backfill` | No | `false` | Whether to skip WAL backfill during the snapshot. When set to `true`, at-least-once semantics are used. |
| `slot_name` | No | `doris_cdc_<job_id>` | Logical replication slot name. The name can contain only lowercase letters, digits, and underscores, cannot start with a digit, and is limited to 63 characters. A custom slot must be created in advance and is not deleted by Doris. |
| `publication_name` | No | `doris_pub_<job_id>` | Publication name. The naming rules are the same as for `slot_name`. A custom publication must be created in advance, include the current source table, and is not deleted by Doris. |
| `ssl_mode` | No | `disable` | SSL mode. Valid values are `disable`, `require`, and `verify-ca`. |
| `ssl_rootcert` | Conditionally required | - | CA certificate file in the format `FILE:<file_name>`. Required when `ssl_mode` is `verify-ca`. Upload the file first using [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md). |
| `include_delete_sign` | No | `false` | Whether the TVF additionally outputs the `__DORIS_DELETE_SIGN__` column. Set to `true` to sync upstream DELETE operations as deletes in a Doris primary key table. |

When `include_delete_sign` is enabled, the target table must be a Merge-on-Write Unique Key table, and `__DORIS_DELETE_SIGN__` must be explicitly mapped in both the INSERT target column list and the SELECT list:

```sql
CREATE JOB pg_cdc_with_delete
ON STREAMING
DO
INSERT INTO db1.target_table (id, value, __DORIS_DELETE_SIGN__)
SELECT id, value, __DORIS_DELETE_SIGN__
FROM cdc_stream(
    "type" = "postgres",
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "schema" = "public",
    "table" = "source_table",
    "offset" = "initial",
    "include_delete_sign" = "true"
);
```

When you customize `slot_name` or `publication_name`, prepare the corresponding resource before creating the Job. Doris retains user-provided resources when the Job is deleted.

### Job Configuration Parameters

Set the following parameters through `CREATE JOB ... PROPERTIES (...)`:

| Parameter | Default | Description |
| --- | --- | --- |
| `max_interval` | `10` | Idle scheduling interval in seconds when no new upstream data is available. Must be an integer greater than or equal to 1. |
| `compute_group` | Current session or user default compute group | Supported only in compute-storage decoupled mode. Specifies the compute group in which the job runs. The user must have the USAGE privilege on the compute group. |
| `session.<variable_name>` | Default value of the corresponding session variable | Sets a session variable for the INSERT task. For load variables, see [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters). |

For the Job Property `offset` used to reset a CDC position through `ALTER JOB` and its complete restrictions, see [Common Job Load Configuration Parameters](./continuous-load-overview.md#job-common-load-configuration-parameters). The initial position for a new job must be set in `cdc_stream(...)`.
