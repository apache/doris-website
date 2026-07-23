---
{
    "title": "MySQL CDC with SQL Mapping",
    "language": "en",
    "sidebar_label": "SQL Mapping Sync",
    "description": "Use Doris Streaming Jobs and CDC Stream TVF to sync a MySQL table with SQL mapping, full and incremental offsets, SSL, and delete handling.",
    "keywords": [
        "MySQL sync to Doris",
        "SQL Mapping Sync",
        "CDC Stream TVF",
        "Streaming Job",
        "Binlog incremental sync",
        "exactly-once",
        "Flink CDC",
        "INSERT INTO SELECT"
    ]
}
---

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenario: Real-time sync of a single MySQL table to Doris with column mapping or data transformation -->

SQL Mapping Sync is implemented through Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md), targeting an **existing** Doris table (`INSERT INTO tbl SELECT * FROM cdc_stream(...)`). With the expressive power of Doris SQL, you can perform column mapping, filtering, and data transformation in the sync pipeline. This is suitable for real-time sync scenarios that require data processing.

> SQL Mapping Sync is supported since version 4.1.0.

By integrating the read capability of [Flink CDC](https://github.com/apache/flink-cdc), Doris reads the change log (Binlog) from MySQL and completes **full + incremental** sync from source table to target table. If you want Doris to automatically create downstream tables and sync a group of tables on a per-database basis, see [MySQL CDC with Auto Table Creation](./continuous-load-mysql-database.md).

### Applicable Scenarios

- Continuous sync of a single MySQL table to Doris, where the target table schema is already planned
- Column pruning, column mapping, field renaming, or data transformation is required during the sync
- Real-time data integration that requires end-to-end exactly-once semantics

### Prerequisites

| Item | Description |
| ------ | ---- |
| Doris version | 4.1.0 and above |
| Table type | The upstream source table must have a primary key; the Doris target table must use the Unique Key model |
| User privileges | `Load` privilege is required |
| MySQL configuration | Binlog must be enabled on the MySQL side. See the [Configuration Guide](./continuous-load-overview.md#supported-data-sources-and-sync-modes) |
| Semantic guarantee | Supports exactly-once semantics |

## Quick Start

The following minimal runnable example demonstrates the complete flow: create job, then check status.

### Step 1: Create the Import Job

Use [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) to create a continuous import job:

```sql
CREATE JOB mysql_single_sync
ON STREAMING
DO
INSERT INTO db1.tbl1
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
)
```

### Step 2: Check the Import Status

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

### Step 3: Job Operations

For more general operations (pause, resume, delete, view tasks, and so on), see the [Continuous Import Overview](./continuous-load-overview.md).

## Parameter Reference

### Data Source Parameters

CDC Stream TVF supports the following MySQL data source parameters.

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `type` | Yes | - | Data source type. Set to `mysql`. |
| `jdbc_url` | Yes | - | MySQL JDBC connection string. |
| `driver_url` | Yes | - | Path to the JDBC driver jar. Supports a file name, local absolute path, or HTTP URL. For details, see [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md). |
| `driver_class` | Yes | - | JDBC driver class name, for example, `com.mysql.cj.jdbc.Driver`. |
| `user` | Yes | - | Database user name. |
| `password` | Yes | - | Database password. |
| `database` | Yes | - | MySQL database name. |
| `table` | Yes | - | Name of the table to sync. Each SQL Mapping job supports one source table. |
| `offset` | Yes | - | Startup offset. `initial`: full and incremental sync; `snapshot`: full sync only; `earliest`: start from the earliest available Binlog offset; `latest`: sync only changes after the job starts. You can also specify an exact JSON offset, such as `{"file":"binlog.000001","pos":"154"}` or `{"gtids":"<gtid_set>"}`. |
| `snapshot_split_size` | No | `8096` | Split size in rows. During full sync, the table is divided into multiple splits. Must be a positive integer. |
| `snapshot_parallelism` | No | `1` | Parallelism of the full-sync phase, that is, the maximum number of splits scheduled by a Task at one time. Must be a positive integer. |
| `skip_snapshot_backfill` | No | `false` | Whether to skip Binlog backfill during the snapshot. When set to `true`, at-least-once semantics are used. |
| `server_id` | No | Automatically generated | Server ID of the MySQL CDC reader. Supports a single value, such as `5400`, or a closed range, such as `5400-5408`. The range width must be greater than or equal to `snapshot_parallelism`. |
| `ssl_mode` | No | `disable` | SSL mode. Valid values are `disable`, `require`, and `verify-ca`. |
| `ssl_rootcert` | Conditionally required | - | CA certificate file in the format `FILE:<file_name>`. Required when `ssl_mode` is `verify-ca`. Upload the file first using [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md). |
| `include_delete_sign` | No | `false` | Whether the TVF additionally outputs the `__DORIS_DELETE_SIGN__` column. Set to `true` to sync upstream DELETE operations as deletes in a Doris primary key table. |

When `include_delete_sign` is enabled, the target table must be a Merge-on-Write Unique Key table, and `__DORIS_DELETE_SIGN__` must be explicitly mapped in both the INSERT target column list and the SELECT list:

```sql
CREATE JOB mysql_cdc_with_delete
ON STREAMING
DO
INSERT INTO db1.target_table (id, value, __DORIS_DELETE_SIGN__)
SELECT id, value, __DORIS_DELETE_SIGN__
FROM cdc_stream(
    "type" = "mysql",
    "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
    "driver_url" = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user" = "root",
    "password" = "123456",
    "database" = "source_db",
    "table" = "source_table",
    "offset" = "initial",
    "include_delete_sign" = "true"
);
```

### Job Configuration Parameters

Set the following parameters through `CREATE JOB ... PROPERTIES (...)`:

| Parameter | Default | Description |
| --- | --- | --- |
| `max_interval` | `10` | Idle scheduling interval in seconds when no new upstream data is available. Must be an integer greater than or equal to 1. |
| `compute_group` | Current session or user default compute group | Supported only in compute-storage decoupled mode. Specifies the compute group in which the job runs. The user must have the USAGE privilege on the compute group. |
| `session.<variable_name>` | Default value of the corresponding session variable | Sets a session variable for the INSERT task. For load variables, see [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters). |

For the Job Property `offset` used to reset a CDC position through `ALTER JOB` and its complete restrictions, see [Common Job Load Configuration Parameters](./continuous-load-overview.md#job-common-load-configuration-parameters). The initial position for a new job must be set in `cdc_stream(...)`.

## FAQ

**Q1: What is the difference between SQL Mapping Sync and Auto Table Creation Sync?**

- SQL Mapping Sync: The target Doris table must be **created in advance**. Supports column mapping and data transformation, suitable for fine-grained processing scenarios.
- Auto Table Creation Sync: Doris **automatically creates** downstream tables and syncs as a whole on a per-database basis. See [MySQL CDC with Auto Table Creation](./continuous-load-mysql-database.md) for details.

**Q2: Are non-primary-key tables supported as the target table?**

The upstream source table must have a primary key, and the Doris target table currently must use the Unique Key model.

**Q3: How do I sync only incremental data without the historical full data?**

Set the `offset` parameter to `latest`. The job will skip the full sync stage and only sync Binlog incremental data.

**Q4: How do I optimize when full sync is too slow?**

You can adjust the following two parameters to improve throughput during the full sync stage:

- `snapshot_split_size`: Increase the number of rows per split.
- `snapshot_parallelism`: Increase the parallelism of splits scheduled per Task.

When adjusting `snapshot_parallelism`, if a `server_id` range is also configured, make sure that the number of IDs in the range is not less than the parallelism.

## Related Documents

- [Continuous Import Overview](./continuous-load-overview.md)
- [MySQL CDC with Auto Table Creation](./continuous-load-mysql-database.md)
- [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md)
