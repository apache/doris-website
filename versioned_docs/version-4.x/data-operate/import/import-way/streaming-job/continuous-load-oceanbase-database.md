---
{
    "title": "OceanBase CDC with Auto Table Creation",
    "language": "en",
    "sidebar_label": "Auto Table Creation Sync",
    "description": "Learn how to continuously sync full and incremental data from primary-key tables in OceanBase MySQL compatibility mode to Doris through a Streaming Job.",
    "keywords": [
        "OceanBase Auto Table Creation Sync",
        "OceanBase CDC",
        "OBBinlog",
        "Doris Streaming Job",
        "continuous load",
        "full and incremental sync",
        "automatic table creation"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror an OceanBase database in MySQL compatibility mode to Doris -->

OceanBase CDC with Auto Table Creation uses `FROM OCEANBASE (...) TO DATABASE (...)`. Doris reads full and incremental data through the OBBinlog service and automatically creates Doris Unique Key tables from the upstream schemas. Use `include_tables` to sync one table, multiple tables, or all tables in the database.

:::caution Experimental feature

OceanBase CDC continuous load is available as an experimental feature starting from Doris 4.1.4. It currently supports only OceanBase MySQL compatibility mode and Auto Table Creation Sync. Oracle compatibility mode and SQL Mapping Sync are not supported.

:::

### Applicable Scenarios

- Mirror a group of OceanBase tables or an entire database to Doris.
- Let Doris create target tables and primary keys from the upstream schemas.
- Perform an initial full load and then continuously sync incremental changes.
- Rename target tables or exclude columns without SQL expressions, row filters, or data transformations.

### Capabilities and Limitations

| Item | Description |
| --- | --- |
| Compatibility mode | OceanBase MySQL compatibility mode only |
| Sync method | Auto Table Creation Sync only; SQL Mapping Sync is not supported |
| Consistency semantics | At-least-once |
| Table type | Upstream tables must have primary keys; automatically created Doris tables use the Unique Key model |
| Permissions | Load permission is required; Create permission is also required when the target table does not exist |
| Schema Change | Syncs `ADD COLUMN` and `DROP COLUMN`; see [Schema Change Sync](./schema-change-oceanbase.md) |
| Data types | Uses MySQL-compatible type conversion; see [Data Type Mapping](./data-type-mapping-oceanbase.md) |

## Prerequisites

Before creating a job, confirm the following:

1. OceanBase runs in MySQL compatibility mode. Doris validates the mode by running `SHOW VARIABLES LIKE 'ob_compatibility_mode'` when creating the job.
2. The OBBinlog service is deployed and available. Running `SHOW MASTER STATUS` against its MySQL protocol endpoint returns a valid binlog file and position.
3. Doris FE, BE, and CDC Client can access the OBBinlog service.
4. A compatible MySQL Connector/J driver is available, and `jdbc_url` starts with `jdbc:mysql://`.
5. The source account can read the tables, schemas, and binlog in the sync scope.
6. Every upstream table to be synced has a primary key.

## Quick Start

### Step 1: Create a Load Job

The following example syncs the `users` and `orders` tables in `source_db`:

```sql
CREATE JOB oceanbase_db_sync
ON STREAMING
FROM OCEANBASE (
    "jdbc_url" = "jdbc:mysql://127.0.0.1:2883",
    "driver_url" = "mysql-connector-j-8.4.0.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user" = "root@test",
    "password" = "123456",
    "database" = "source_db",
    "include_tables" = "users,orders",
    "offset" = "initial"
)
TO DATABASE target_db (
    "table.create.properties.replication_num" = "1"
);
```

- `jdbc_url` points to the MySQL protocol port of the OBBinlog service. Use the port configured in your deployment.
- `offset = "initial"` loads existing rows first and then continuously syncs binlog changes.
- If `include_tables` is omitted, all eligible tables in `database` are synced.
- For a single-BE deployment, set `replication_num` to `1`. In production, set the replica count according to the cluster size.

### Step 2: Check Load Status

```sql
SELECT Name, Status, CurrentOffset, ErrorMsg
FROM jobs("type" = "insert")
WHERE Name = "oceanbase_db_sync";
```

When the job is running normally, `Status` is `RUNNING`:

```text
+-------------------+---------+-----------------------------------------------+----------+
| Name              | Status  | CurrentOffset                                 | ErrorMsg |
+-------------------+---------+-----------------------------------------------+----------+
| oceanbase_db_sync | RUNNING | {"file":"binlog.000001","pos":"154", ...} | NULL     |
+-------------------+---------+-----------------------------------------------+----------+
```

### Step 3: Verify Incremental Sync

After running `INSERT`, `UPDATE`, or `DELETE` against an OceanBase source table, query the corresponding Doris table and verify that the change has been synchronized:

```sql
SELECT * FROM target_db.users ORDER BY id;
```

For pause, resume, delete, and Task query operations, see [Continuous Load Overview](./continuous-load-overview.md#common-operations).

## Data Source Parameters

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `jdbc_url` | Yes | - | JDBC connection string for the OBBinlog service. It must start with `jdbc:mysql://`. |
| `driver_url` | Yes | - | Path to the MySQL Connector/J driver jar. Supports a file name, local absolute path, or HTTP URL. |
| `driver_class` | Yes | - | MySQL JDBC driver class, for example, `com.mysql.cj.jdbc.Driver`. |
| `user` | Yes | - | OceanBase user name. Include tenant information using the user name format required by OceanBase. |
| `password` | Yes | - | OceanBase user password. |
| `database` | Yes | - | OceanBase database name. |
| `include_tables` | No | - | Table names to sync, separated by commas. If omitted, all tables in the database are synced. |
| `exclude_tables` | No | - | Table names not to sync, separated by commas. This parameter takes effect only when `include_tables` is not set. |
| `table.<table_name>.target_table` | No | Source table name | Sets the Doris target table name for a source table. |
| `table.<table_name>.exclude_columns` | No | - | Excludes non-key columns from a source table, separated by commas. Each column must exist and cannot be a primary key column. |
| `offset` | No | `latest` | Startup position. `initial`: full and incremental sync; `snapshot`: full sync only; `earliest`: start at the earliest available binlog position; `latest`: sync only changes after the job starts. An exact position such as `{"file":"binlog.000001","pos":"154"}` is also supported. |
| `snapshot_split_size` | No | `40960` | Number of rows in each split during the full-sync phase. Must be a positive integer. |
| `snapshot_parallelism` | No | `1` | Maximum number of splits scheduled concurrently by one Task during the full-sync phase. Must be a positive integer. |
| `skip_snapshot_backfill` | No | `true` | Whether to skip binlog backfill during the snapshot phase. Auto Table Creation Sync provides at-least-once semantics. |
| `server_id` | No | Automatically generated | Server ID of the CDC reader. Supports a single value such as `5400` or a closed range such as `5400-5408`. The range must contain at least `snapshot_parallelism` IDs. |
| `ssl_mode` | No | `disable` | SSL mode. Valid values are `disable`, `require`, and `verify-ca`. |
| `ssl_rootcert` | Conditionally required | - | Required when `ssl_mode` is `verify-ca`. Use the format `FILE:<file_name>` and upload the file first with [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md). |

The `schema`, `slot_name`, and `publication_name` parameters are not supported. Job creation fails if any of them is specified.

## Reference Manual

### Load Statement

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
[COMMENT <comment>]
FROM OCEANBASE (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
);
```

| Module | Description |
| --- | --- |
| `job_name` | Job name. |
| `job_properties` | Common Job parameters such as `max_interval`. |
| `comment` | Job comment. |
| `source_properties` | OceanBase data source parameters. |
| `target_properties` | Doris target database parameters. |

### Doris Target Database Parameters

| Parameter | Default | Description |
| --- | --- | --- |
| `table.create.properties.*` | - | Adds table properties when Doris creates a table, for example, `table.create.properties.replication_num`. |
| `load.strict_mode` | `false` | Whether to enable strict mode for Stream Load. |
| `load.max_filter_ratio` | `0` | Maximum filter ratio allowed in the sampling window, in the range `[0, 1]`. The job is paused when the ratio exceeds this value. |

## Considerations and Best Practices

- Before expanding the sync scope in production, use a small set of tables to verify OBBinlog connectivity, type mappings, and incremental latency.
- Use `include_tables` to define the sync scope explicitly so that unrelated tables added later are not included automatically.
- Exclude unsupported non-key columns with `table.<table_name>.exclude_columns`. Primary key columns cannot be excluded.
- Before making an unsupported schema change, pause the job, apply a compatible change to the Doris table, and then resume the job.
- Monitor `CurrentOffset`, `LagBytes`, and `ErrorMsg` to verify that the job continues to make progress and has not been paused automatically.

## FAQ

**Q1: Is OceanBase Oracle compatibility mode supported?**

No. Doris checks `ob_compatibility_mode` during job creation and rejects any mode other than MySQL compatibility mode.

**Q2: Is SQL Mapping Sync supported?**

No. OceanBase currently supports only `FROM OCEANBASE (...) TO DATABASE (...)` Auto Table Creation Sync.

**Q3: How do I sync only changes that occur after the job starts?**

Set `offset` to `latest`. Rows that exist before the job reaches `RUNNING` are not loaded through a snapshot.

**Q4: Is an existing target table overwritten?**

No. Auto table creation skips a target table that already exists. Make sure its primary key and column types are compatible with the source table.

## Related Documents

- [Continuous Load Overview](./continuous-load-overview.md)
- [OceanBase Schema Change Sync](./schema-change-oceanbase.md)
- [OceanBase Data Type Mapping](./data-type-mapping-oceanbase.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
