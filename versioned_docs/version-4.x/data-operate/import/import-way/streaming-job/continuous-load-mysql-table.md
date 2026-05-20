---
{
    "title": "MySQL Table-Level Sync",
    "language": "en",
    "sidebar_label": "Table-Level Sync",
    "description": "How to continuously sync a single MySQL table to Doris? Achieve table-level real-time sync with Job + CDC Stream TVF, supporting column mapping and data transformation.",
    "keywords": [
        "MySQL sync to Doris",
        "table-level CDC",
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

Table-level sync is implemented through Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md), targeting an **existing** Doris table (`INSERT INTO tbl SELECT * FROM cdc_stream(...)`). With the expressive power of Doris SQL, you can perform column mapping, filtering, and data transformation in the sync pipeline, and exactly-once semantics is guaranteed. This is suitable for real-time sync scenarios that require data processing.

By integrating the read capability of [Flink CDC](https://github.com/apache/flink-cdc), Doris reads the change log (Binlog) from MySQL and completes **full + incremental** sync from source table to target table. If you want Doris to automatically create downstream tables and sync a group of tables on a per-database basis, see [MySQL Database-Level Sync](./continuous-load-mysql-database.md).

### Applicable Scenarios

- Continuous sync of a single MySQL table to Doris, where the target table schema is already planned
- Column pruning, column mapping, field renaming, or data transformation is required during the sync
- Real-time data integration that requires end-to-end exactly-once semantics

### Prerequisites

| Item | Description |
| ------ | ---- |
| Doris version | 4.1.0 and above |
| Table type | Currently only **primary key tables** are supported as the target table |
| User privileges | `Load` privilege is required |
| MySQL configuration | Binlog must be enabled on the MySQL side. See the [Configuration Guide](./continuous-load-overview.md) |
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

The MySQL data source parameters supported by CDC Stream TVF are as follows:

| Parameter             | Default | Description                                                                                                                                     |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| type                  | -       | Data source type. Set to `mysql`                                                                                                                |
| jdbc_url              | -       | MySQL JDBC connection string                                                                                                                    |
| driver_url            | -       | Path to the JDBC driver jar. Supports file name, local absolute path, and HTTP URL. See [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) for details |
| driver_class          | -       | JDBC driver class name                                                                                                                          |
| user                  | -       | Database username                                                                                                                               |
| password              | -       | Database password                                                                                                                               |
| database              | -       | Database name                                                                                                                                   |
| table                 | -       | Name of the table to sync                                                                                                                       |
| offset                | initial | `initial`: full + incremental sync; `latest`: incremental sync only                                                                             |
| snapshot_split_size   | 8096    | Size of a split (in rows). During full sync, the table is divided into multiple splits for syncing                                              |
| snapshot_parallelism  | 1       | Parallelism during the full sync stage, that is, the maximum number of splits scheduled per Task                                                |

### Import Configuration Parameters

| Parameter | Default | Description                                                                                                                                                                  |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| session.* | None    | All session variables can be configured under `job_properties`. For import variables, see [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters) |

For more general parameters (such as `max_interval`), see the [Continuous Import Overview](./continuous-load-overview.md#general-parameters).

## FAQ

**Q1: What is the difference between table-level sync and database-level sync?**

- Table-level sync: The target Doris table must be **created in advance**. Supports column mapping and data transformation, suitable for fine-grained processing scenarios.
- Database-level sync: Doris **automatically creates** downstream tables and syncs as a whole on a per-database basis. See [MySQL Database-Level Sync](./continuous-load-mysql-database.md) for details.

**Q2: Are non-primary-key tables supported as the target table?**

Currently, **only primary key tables** are supported as the target table.

**Q3: How do I sync only incremental data without the historical full data?**

Set the `offset` parameter to `latest`. The job will skip the full sync stage and only sync Binlog incremental data.

**Q4: How do I optimize when full sync is too slow?**

You can adjust the following two parameters to improve throughput during the full sync stage:

- `snapshot_split_size`: Increase the number of rows per split.
- `snapshot_parallelism`: Increase the parallelism of splits scheduled per Task.

## Related Documents

- [Continuous Import Overview](./continuous-load-overview.md)
- [MySQL Database-Level Sync](./continuous-load-mysql-database.md)
- [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md)
