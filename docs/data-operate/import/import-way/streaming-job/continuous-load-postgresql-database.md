---
{
    "title": "PostgreSQL CDC with Auto Table Creation",
    "language": "en",
    "sidebar_label": "Auto Table Creation Sync",
    "description": "Learn how Doris Streaming Jobs sync PostgreSQL tables with automatic table creation, filtering, replication resources, SSL, and data quality controls.",
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

Auto Table Creation Sync is implemented through the native `FROM POSTGRES (...) TO DATABASE (...)` DDL. The target is a Doris database, and Doris automatically creates the corresponding downstream tables based on the upstream table schemas. You can use `include_tables` to control whether one table, multiple tables, or all tables are synced. On the first sync, Doris automatically creates the downstream primary-key tables and keeps their primary keys consistent with the upstream. This approach is suitable for mirror-replication scenarios where no SQL processing of the data is needed and the downstream table schemas should follow the upstream automatically.

By integrating [Flink CDC](https://github.com/apache/flink-cdc) capabilities, Doris reads change logs from PostgreSQL and continuously writes the full + incremental data of a group of tables into Doris through Stream Load. Auto Table Creation Sync supports assigning a target table name to an individual source table or excluding non-key columns. If you need SQL expressions, row filtering, or data transformation, see [PostgreSQL CDC with SQL Mapping](./continuous-load-postgresql-table.md).

### Use Cases

-   Mirror-replicating an entire PostgreSQL database or multiple tables to Doris
-   Keeping the downstream table schema consistent with the upstream without manual table creation
-   Only simple target table renaming or column pruning is required, without SQL expressions, row filtering, or data transformation
-   Need both full initialization and continuous capture of incremental changes

### Notes

1.  Currently only at-least-once semantics is guaranteed.
2.  Only upstream tables with primary keys can be synced; automatically created downstream tables use the Unique Key model.
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

PostgreSQL source parameters configure the JDBC connection, sync scope, and full-snapshot slicing behavior. Connection information, driver information, `database`, and `schema` are required.

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `jdbc_url` | Yes | - | PostgreSQL JDBC connection string. |
| `driver_url` | Yes | - | Path to the JDBC driver jar. Supports a file name, local absolute path, or HTTP URL. For details, see [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md). |
| `driver_class` | Yes | - | JDBC driver class name, for example, `org.postgresql.Driver`. |
| `user` | Yes | - | Database user name. |
| `password` | Yes | - | Database password. |
| `database` | Yes | - | PostgreSQL database name. It must match the database name in the JDBC URL and cannot exceed 63 bytes after UTF-8 encoding. |
| `schema` | Yes | - | Schema name. |
| `include_tables` | No | - | Names of the tables to sync, separated by commas. If not set, all tables in the Schema are synced. |
| `exclude_tables` | No | - | Names of the tables not to sync, separated by commas. This parameter takes effect only when `include_tables` is not set. |
| `table.<table_name>.target_table` | No | Source table name | Supported since version 4.1.0. Sets the Doris target table name for a source table. `<table_name>` is the source table name. |
| `table.<table_name>.exclude_columns` | No | - | Supported since version 4.1.0. Specifies source columns not to sync, separated by commas. The columns must exist and cannot include primary key columns. |
| `offset` | No | `latest` | Startup offset. `initial`: full and incremental sync; `latest`: sync only changes after the job starts. You can also specify an exact JSON offset, such as `{"lsn":"12345678"}`. Since version 4.1.0, `snapshot` is also supported for full sync only. PostgreSQL does not support `earliest`. |
| `snapshot_split_size` | No | `8096` | Split size in rows. During full sync, a table is divided into multiple splits. Must be a positive integer. |
| `snapshot_parallelism` | No | `1` | Parallelism of the full-sync phase, that is, the maximum number of splits scheduled by a Task at one time. Must be a positive integer. |
| `slot_name` | No | `doris_cdc_<job_id>` | Supported since version 4.1.0. Logical replication slot name. The name can contain only lowercase letters, digits, and underscores, cannot start with a digit, and is limited to 63 characters. A custom slot must be created in advance and is not deleted by Doris. |
| `publication_name` | No | `doris_pub_<job_id>` | Supported since version 4.1.0. Publication name. The naming rules are the same as for `slot_name`. A custom publication must be created in advance, include all synced tables, and is not deleted by Doris. |
| `ssl_mode` | No | `disable` | Supported since version 4.1.0. SSL mode. Valid values are `disable`, `require`, and `verify-ca`. |
| `ssl_rootcert` | Conditionally required | - | Supported since version 4.1.0. CA certificate file in the format `FILE:<file_name>`. Required when `ssl_mode` is `verify-ca`. Upload the file first using [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md). |

If both `include_tables` and `exclude_tables` are set, `include_tables` takes precedence. The following `FROM POSTGRES` parameter fragment syncs `orders` and `customers`, writes `orders` to `ods_orders`, excludes the non-key column `internal_note`, and uses pre-created logical replication resources with CA verification:

```sql
"include_tables" = "orders,customers",
"table.orders.target_table" = "ods_orders",
"table.orders.exclude_columns" = "internal_note",
"slot_name" = "orders_slot",
"publication_name" = "orders_publication",
"ssl_mode" = "verify-ca",
"ssl_rootcert" = "FILE:ca.pem"
```

Custom replication slots and publications are managed by the user and are retained when the Streaming Job is deleted. If `slot_name` or `publication_name` is omitted, Doris creates the corresponding resource for the job and cleans up resources it created when the job is deleted.

### Doris Target Database Parameters

Target-side parameters control the properties of automatically created tables and the Stream Load write strategy. All of the following parameters are optional.

| Parameter | Default | Description |
| --- | --- | --- |
| `table.create.properties.*` | - | Adds table properties when Doris creates a table, for example, `table.create.properties.replication_num`. |
| `load.strict_mode` | `false` | Whether to enable strict mode for Stream Load writes. Valid values are `true` and `false`. |
| `load.max_filter_ratio` | `0` | Maximum allowed filter ratio in the sampling window, in the range `[0, 1]`. `0` means that erroneous rows cannot be filtered. The sampling window is `max_interval * 10` seconds. The job is paused when the ratio of erroneous rows to total rows in the window exceeds this value. |

## Reference

<!-- Knowledge type: Syntax reference -->

### Load Command Syntax

The syntax for creating an Auto Table Creation Sync job is as follows:

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
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

`job_properties` supports `max_interval` and `compute_group`. For details, see [Common Job Load Configuration Parameters](./continuous-load-overview.md#job-common-load-configuration-parameters). Auto Table Creation mode does not use `session.*`.

## FAQ

<!-- Knowledge type: Frequently asked questions -->

**Q1: How to choose between Auto Table Creation Sync and SQL Mapping Sync?**

-   When you need mirror replication, automatic table creation, or only target table renaming and exclusion of non-key columns, use Auto Table Creation Sync.
-   When you need SQL expressions, row filtering, or data transformation in the sync pipeline, use [PostgreSQL CDC with SQL Mapping](./continuous-load-postgresql-table.md).

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
