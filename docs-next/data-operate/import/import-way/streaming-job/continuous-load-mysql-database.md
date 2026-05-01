---
{
    "title": "MySQL Database-Level Sync",
    "language": "en",
    "sidebar_label": "Database-Level Sync",
    "description": "Use a Streaming Job to continuously sync full and incremental data from a MySQL database to Doris, with tables created automatically on first sync.",
    "keywords": [
        "MySQL database-level sync",
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

Database-level sync is implemented through the native `FROM MYSQL (...) TO DATABASE (...)` DDL. **Sync happens at the database level, and the target is a Doris database container.** You can use `include_tables` to control whether to sync one table, several tables, or all tables. On the first sync, Doris automatically creates downstream primary key tables and keeps the primary keys consistent with the upstream. This is suitable for mirror replication scenarios where no SQL processing is required and the downstream table schema should follow the upstream automatically.

By integrating [Flink CDC](https://github.com/apache/flink-cdc) capabilities, Doris reads change logs from MySQL and continuously writes the full and incremental data of a group of tables into Doris through Stream Load. If you need to perform column mapping, filtering, or data transformation during sync, refer to [MySQL Table-Level Sync](./continuous-load-mysql-table.md).

### Applicable Scenarios

- You need to mirror a group of tables (or an entire database) from MySQL to Doris.
- You want the downstream table schema and primary keys to be created automatically based on the upstream, without manually creating tables.
- No column mapping, filtering, or data transformation is required during sync.
- You need to support both initial full initialization and continuous reception of incremental changes.

### Capabilities and Limitations

| Item                  | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| Consistency semantics | Currently only at-least-once semantics are guaranteed                |
| Table type            | Only primary key tables (Unique Key) are supported for sync          |
| Permission            | Load permission is required; Create permission is also required when the downstream table does not exist |
| Auto table creation   | Creation is skipped if the target table already exists; you can customize the table schema as needed |
| Data processing       | Column mapping, filtering, and transformation are not supported; use table-level sync if needed |

## Prerequisites

Before creating a database-level sync job, confirm the following:

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

The MySQL source side (`FROM MYSQL`) supports the following parameters:

| Parameter            | Default | Description                                                                                                          |
| -------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| jdbc_url             | -       | MySQL JDBC connection string                                                                                         |
| driver_url           | -       | Path to the JDBC driver jar. Supports file name, local absolute path, and HTTP address. See [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) for details |
| driver_class         | -       | JDBC driver class name                                                                                               |
| user                 | -       | Database user name                                                                                                   |
| password             | -       | Database password                                                                                                    |
| database             | -       | Database name                                                                                                        |
| include_tables       | -       | Names of tables to sync, separated by commas. If left empty, all tables are synced by default                        |
| offset               | initial | `initial`: full + incremental sync; `latest`: incremental sync only                                                  |
| snapshot_split_size  | 8096    | Size of a split (in rows). During full sync, a table is divided into multiple splits for sync                        |
| snapshot_parallelism | 1       | Parallelism during the full-sync phase, that is, the maximum number of splits a single Task can schedule at a time   |

## Reference Manual

### Load Statement

<!-- Knowledge type: Syntax reference -->

The syntax for creating a database-level sync job is as follows:

```sql
CREATE JOB <job_name>
ON STREAMING
[job_properties]
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

### Doris Target Database Configuration Parameters

<!-- Knowledge type: Configuration parameters -->

`TO DATABASE` supports the following parameters:

| Parameter                 | Default | Description                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| table.create.properties.* | -       | Specify table properties when creating a table, such as `replication_num`                                                                                                                                                                                                                                                              |
| load.strict_mode          | -       | Whether to enable strict mode. Disabled by default                                                                                                                                                                                                                                                                                     |
| load.max_filter_ratio     | -       | The maximum filter ratio allowed within the sampling window. Must be greater than or equal to 0 and less than or equal to 1. The default value is 0, meaning zero tolerance. The sampling window is `max_interval * 10`. If the ratio of error rows to total rows within the sampling window exceeds `load.max_filter_ratio`, the routine job is paused, and manual intervention is required to check the data quality issue. |

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: Does database-level sync support non-primary-key tables?**

No. Currently, database-level sync only supports primary key tables (Unique Key). On the first sync, Doris automatically creates downstream primary key tables based on the upstream primary keys.

**Q2: If the target table already exists, will it be overwritten?**

No. During the auto table creation phase, creation is skipped if the target table already exists. You can customize the table schema based on different scenarios.

**Q3: How do I sync only incremental data without full initialization?**

Set the `offset` parameter to `latest`. The job will skip the full-sync phase and start consuming directly from the latest binlog position.

**Q4: How do I choose between database-level sync and table-level sync?**

- For mirror replication, auto table creation, and keeping the table schema consistent with the upstream: use database-level sync.
- For column mapping, filtering, or data transformation: use [MySQL Table-Level Sync](./continuous-load-mysql-table.md).

**Q5: What should I do if table creation fails in a single-BE deployment?**

Explicitly specify a replica count of 1 in `TO DATABASE`: `"table.create.properties.replication_num" = "1"`.

## Troubleshooting

<!-- Knowledge type: Troubleshooting -->

| Symptom                                  | Possible cause                                              | Diagnosis and resolution                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Job creation fails with permission error | The current user lacks Load or Create permission            | Grant Load permission to the executing account; Create permission is also required for auto table creation         |
| Slow full sync                           | `snapshot_parallelism` is too small, or splits are too large | Increase `snapshot_parallelism` appropriately; adjust `snapshot_split_size` based on the number of rows in the table |
| Job is paused due to data quality issues | The error row ratio exceeds `load.max_filter_ratio`         | Check the `ErrorMsg` field to locate dirty data; adjust `load.strict_mode` or `load.max_filter_ratio`               |
| Replica count error during auto table creation | Single-BE deployment but the default replica count is 3 | Set `table.create.properties.replication_num = 1`                                                                    |
| Incremental data does not reach Doris    | MySQL binlog is not enabled, or the account has no binlog permission | Enable binlog on the MySQL side and grant `REPLICATION SLAVE` and `REPLICATION CLIENT` permissions to the sync account |

## Related Documents

- [Continuous Load Overview](./continuous-load-overview.md)
- [MySQL Table-Level Sync](./continuous-load-mysql-table.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
- [Flink CDC](https://github.com/apache/flink-cdc)
