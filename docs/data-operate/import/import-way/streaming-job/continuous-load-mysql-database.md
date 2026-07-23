---
{
    "title": "MySQL CDC with Auto Table Creation",
    "language": "en",
    "sidebar_label": "Auto Table Creation Sync",
    "description": "Learn how Doris Streaming Jobs sync MySQL tables with automatic table creation, filtering, offsets, snapshots, SSL, and data quality controls.",
    "keywords": [
        "MySQL Auto Table Creation Sync",
        "MySQL whole-database sync",
        "Doris Streaming Job",
        "Flink CDC",
        "MySQL CDC real-time sync",
        "continuous load",
        "full plus incremental sync",
        "automatic table creation"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror sync of a whole MySQL database to Doris -->

Auto Table Creation Sync is implemented through the native `FROM MYSQL (...) TO DATABASE (...)` DDL. The target is a Doris database, and Doris automatically creates the corresponding downstream tables based on the upstream table schemas. You can use `include_tables` to control whether to sync one table, several tables, or all tables. On the first sync, Doris automatically creates downstream primary key tables and keeps the primary keys consistent with the upstream. This is suitable for mirror replication scenarios where no SQL processing is required and the downstream table schema should follow the upstream automatically.

By integrating [Flink CDC](https://github.com/apache/flink-cdc) capabilities, Doris reads change logs from MySQL and continuously writes the full and incremental data of a group of tables into Doris through Stream Load. Auto Table Creation Sync supports assigning a target table name to an individual source table or excluding non-key columns. If you need SQL expressions, row filtering, or data transformation, refer to [MySQL CDC with SQL Mapping](./continuous-load-mysql-table.md).

### Applicable Scenarios

- You need to mirror a group of tables (or an entire database) from MySQL to Doris.
- You want the downstream table schema and primary keys to be created automatically based on the upstream, without manually creating tables.
- You only need simple target table renaming or column pruning, without SQL expressions, row filtering, or data transformation.
- You need to support both initial full initialization and continuous reception of incremental changes.

### Capabilities and Limitations

| Item                  | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| Consistency semantics | Currently only at-least-once semantics are guaranteed                |
| Table type            | Only upstream tables with primary keys can be synced; automatically created downstream tables use the Unique Key model |
| Permission            | Load permission is required; Create permission is also required when the downstream table does not exist |
| Auto table creation   | Creation is skipped if the target table already exists; you can customize the table schema as needed |
| Data processing       | Supports target table renaming and exclusion of non-key columns; does not support SQL expressions, row filtering, or data transformation |

## Prerequisites

Before creating an Auto Table Creation Sync job, confirm the following:

1. A Doris cluster is deployed, and you have Load permission (Create permission is also required for auto table creation scenarios).
2. A JDBC driver jar that is compatible with the MySQL version has been uploaded and can be referenced by file name, local absolute path, or HTTP address. See [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) for details.
3. MySQL has binlog enabled, and the account has permission to read the binlog.
4. The sync scope is clear: whether to sync the entire database or only the tables specified in `include_tables`.

## Quick Start

<!-- Knowledge type: Procedure -->

### Step 1: Create a Load Job

Use [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) to create a continuous load job:

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
    "table.create.properties.replication_num" = "1"  -- Set to 1 for single-BE deployment
)
```

Key points of the example above:

- `database` specifies the upstream MySQL database. `include_tables` limits which tables to sync; multiple tables are separated by commas, and leaving it empty means syncing the entire database.
- `offset = "initial"` means full initialization first and then switching to incremental. To sync incremental data only, change it to `latest`.
- `TO DATABASE target_test_db` specifies the downstream Doris database. Use `table.create.properties.*` to control the table properties for auto-created tables (such as the number of replicas).

### Step 2: Check Load Status

Query the running status of the Streaming Job through the `jobs("type"="insert")` table function:

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING"
             Id: 1765332859199
             Name: mysql_db_sync
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: FROM MYSQL('include_tables'='user_info','database'='test','driver_class'='com.mysql.cj.jdbc.Driver','driver_url'='mysql-connector-java-8.0.25.jar','offset'='initial','jdbc_url'='jdbc:mysql://127.0.0.1:3306','user'='root' ) TO DATABASE target_test_db ('table.create.properties.replication_num'='1')
       CreateTime: 2025-12-10 10:19:35
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: 
       Properties: \N
    CurrentOffset: {"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","splitId":"binlog-split","row":"1","event":"2","server_id":"1"}
        EndOffset: \N
    LoadStatistic: {"scannedRows":24,"loadBytes":1146,"fileNumber":0,"fileSize":0}
         ErrorMsg: \N
```

Fields to focus on:

- `Status`: the overall status of the job (such as `RUNNING`).
- `CurrentOffset`: the binlog position currently consumed, useful for tracking sync progress.
- `LoadStatistic`: load statistics such as the number of scanned rows and bytes written.
- `ErrorMsg`: error messages, the primary basis for troubleshooting when the job has issues.

### Step 3: Modify the Load Job

If you need to update data source connection information (for example, rotating account credentials), use `ALTER JOB`:

```sql
ALTER JOB <job_name>
FROM MYSQL (
    "user" = "root",
    "password" = "123456"
)
TO DATABASE target_test_db
```

For more general operations (pausing, resuming, deleting, viewing tasks, and so on), refer to [Continuous Load Overview](./continuous-load-overview.md).

## Data Source Parameters

<!-- Knowledge type: Configuration parameters -->

The MySQL source (`FROM MYSQL`) supports the following parameters. Connection information, the database name, and driver information are required.

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `jdbc_url` | Yes | - | MySQL JDBC connection string. |
| `driver_url` | Yes | - | Path to the JDBC driver jar. Supports a file name, local absolute path, or HTTP URL. For details, see [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md). |
| `driver_class` | Yes | - | JDBC driver class name, for example, `com.mysql.cj.jdbc.Driver`. |
| `user` | Yes | - | Database user name. |
| `password` | Yes | - | Database password. |
| `database` | Yes | - | MySQL database name. |
| `include_tables` | No | - | Names of the tables to sync, separated by commas. If not set, all tables in the database are synced. |
| `exclude_tables` | No | - | Names of the tables not to sync, separated by commas. This parameter takes effect only when `include_tables` is not set. |
| `table.<table_name>.target_table` | No | Source table name | Supported since version 4.1.0. Sets the Doris target table name for a source table. `<table_name>` is the source table name. |
| `table.<table_name>.exclude_columns` | No | - | Supported since version 4.1.0. Specifies source columns not to sync, separated by commas. The columns must exist and cannot include primary key columns. |
| `offset` | No | `latest` | Startup offset. `initial`: full and incremental sync; `earliest`: start from the earliest available Binlog offset; `latest`: sync only changes after the job starts. You can also specify an exact JSON offset, such as `{"file":"binlog.000001","pos":"154"}` or `{"gtids":"<gtid_set>"}`. Since version 4.1.0, `snapshot` is also supported for full sync only. |
| `snapshot_split_size` | No | `8096` | Split size in rows. During full sync, a table is divided into multiple splits. Must be a positive integer. |
| `snapshot_parallelism` | No | `1` | Parallelism of the full-sync phase, that is, the maximum number of splits scheduled by a Task at one time. Must be a positive integer. |
| `server_id` | No | Automatically generated | Supported since version 4.1.0. Server ID of the MySQL CDC reader. Supports a single value, such as `5400`, or a closed range, such as `5400-5408`. The range width must be greater than or equal to `snapshot_parallelism`. |
| `ssl_mode` | No | `disable` | Supported since version 4.1.0. SSL mode. Valid values are `disable`, `require`, and `verify-ca`. |
| `ssl_rootcert` | Conditionally required | - | Supported since version 4.1.0. CA certificate file in the format `FILE:<file_name>`. Required when `ssl_mode` is `verify-ca`. Upload the file first using [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md). |

If both `include_tables` and `exclude_tables` are set, `include_tables` takes precedence. The following `FROM MYSQL` parameter fragment syncs `orders` and `customers`, writes `orders` to `ods_orders`, excludes the non-key column `internal_note`, and enables CA verification:

```sql
"include_tables" = "orders,customers",
"table.orders.target_table" = "ods_orders",
"table.orders.exclude_columns" = "internal_note",
"server_id" = "5400-5403",
"ssl_mode" = "verify-ca",
"ssl_rootcert" = "FILE:ca.pem"
```

## Reference Manual

### Load Statement

<!-- Knowledge type: Syntax reference -->

The syntax for creating an Auto Table Creation Sync job is as follows:

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
[ COMMENT <comment> ]
FROM MYSQL (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
)
```

Description of each module:

| Module            | Description                                          |
| ----------------- | ---------------------------------------------------- |
| job_name          | Job name                                             |
| job_properties    | Used to specify general load parameters for the Job  |
| comment           | Used to describe the Job with remarks                |
| source_properties | Parameters related to the MySQL source               |
| target_properties | Parameters related to the Doris target database      |

`job_properties` supports `max_interval` and `compute_group`. For details, see [Common Job Load Configuration Parameters](./continuous-load-overview.md#job-common-load-configuration-parameters). Auto Table Creation mode does not use `session.*`.

### Doris Target Database Configuration Parameters

<!-- Knowledge type: Configuration parameters -->

`TO DATABASE` supports the following optional parameters:

| Parameter | Default | Description |
| --- | --- | --- |
| `table.create.properties.*` | - | Adds table properties when Doris creates a table, for example, `table.create.properties.replication_num`. |
| `load.strict_mode` | `false` | Whether to enable strict mode for Stream Load writes. Valid values are `true` and `false`. |
| `load.max_filter_ratio` | `0` | Maximum allowed filter ratio in the sampling window, in the range `[0, 1]`. `0` means that erroneous rows cannot be filtered. The sampling window is `max_interval * 10` seconds. The job is paused when the ratio of erroneous rows to total rows in the window exceeds this value. |

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: Does Auto Table Creation Sync support non-primary-key tables?**

No. Currently, Auto Table Creation Sync only supports primary key tables (Unique Key). On the first sync, Doris automatically creates downstream primary key tables based on the upstream primary keys.

**Q2: If the target table already exists, will it be overwritten?**

No. During the auto table creation phase, creation is skipped if the target table already exists. You can customize the table schema based on different scenarios.

**Q3: How do I sync only incremental data without full initialization?**

Set the `offset` parameter to `latest`. The job will skip the full-sync phase and start consuming directly from the latest binlog position.

**Q4: How do I choose between Auto Table Creation Sync and SQL Mapping Sync?**

- For mirror replication, auto table creation, and keeping the table schema consistent with the upstream: use Auto Table Creation Sync.
- If you only need to rename target tables or exclude non-key columns: use Auto Table Creation Sync.
- If you need SQL expressions, row filtering, or data transformation: use [MySQL CDC with SQL Mapping](./continuous-load-mysql-table.md).

**Q5: What should I do if table creation fails in a single-BE deployment?**

Explicitly specify a replica count of 1 in `TO DATABASE`: `"table.create.properties.replication_num" = "1"`.

## Related Documents

- [Continuous Load Overview](./continuous-load-overview.md)
- [MySQL CDC with SQL Mapping](./continuous-load-mysql-table.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
- [Flink CDC](https://github.com/apache/flink-cdc)
