---
{
    "title": "PostgreSQL Table-level Sync",
    "sidebar_label": "Table-level Sync",
    "language": "en",
    "description": "Doris can continuously sync PostgreSQL data into a specified Doris table using Job + CDC Stream TVF at the table level, with support for column mapping and data transformation."
}
---

:::tip
This feature is supported since version 4.1.0.
:::

## Overview

Table-level Sync is implemented via Job + [CDC Stream TVF](../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md), targeting an existing Doris table (`INSERT INTO tbl SELECT * FROM cdc_stream(...)`). It leverages Doris SQL to support column mapping, filtering and data transformation, with exactly-once semantics. Suitable for real-time sync scenarios that require data processing.

By integrating [Flink CDC](https://github.com/apache/flink-cdc), Doris reads change logs (WAL) from PostgreSQL, enabling full + incremental sync from the source table to the target table. If you prefer Doris to auto-create downstream tables or sync a group of tables at the database granularity, see [PostgreSQL Database-level Sync](./continuous-load-postgresql-database.md).

**Notes:**

1. Supports exactly-once semantics.
2. Currently only primary key tables are supported for synchronization.
3. LOAD privilege is required.
3. Logical replication must be enabled on the PostgreSQL side. See the [Setup Guide](./continuous-load-overview.md).

## Quick Start

### Creating an Import Job

Use [CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) to create a continuous import job:

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

### Check Import Status

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

For more common operations (pause, resume, delete, check Task, etc.), see [Continuous Load Overview](./continuous-load-overview.md).

## Source Parameters

| Parameter    | Default | Description                                                  |
| -------------- | ------- | ------------------------------------------------------------ |
| type           | -       | Data source type, set to `postgres`                          |
| jdbc_url       | -       | PostgreSQL JDBC connection string                            |
| driver_url     | -       | JDBC driver jar path. Supports file name, local absolute path, and HTTP URL. See [JDBC Catalog Overview](../../../lakehouse/catalogs/jdbc-catalog-overview.md) for details. |
| driver_class   | -       | JDBC driver class name                                       |
| user           | -       | Database username                                            |
| password       | -       | Database password                                            |
| database       | -       | Database name                                                |
| schema         | -       | Schema name                                                  |
| table          | -       | Table name to synchronize                                    |
| offset         | initial | initial: full + incremental sync, latest: incremental only   |
| snapshot_split_size | 8096 | Split size (in rows). During full sync, the table is divided into multiple splits |
| snapshot_parallelism | 1   | Parallelism during full sync phase, i.e., max splits per task |

## Import Configuration Parameters

| Parameter          | Default | Description                                                  |
| ------------------ | ------- | ------------------------------------------------------------ |
| session.*          | -       | Supports all session variables in job_properties. See [Insert Into Select](../../../data-operate/import/import-way/insert-into-manual.md) for import variables |

For more common parameters (such as `max_interval`), see [Continuous Load Overview](./continuous-load-overview.md#common-parameters).
