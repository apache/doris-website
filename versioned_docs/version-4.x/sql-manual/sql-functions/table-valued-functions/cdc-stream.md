---
{
    "title": "CDC_STREAM | Table Valued Functions",
    "language": "en",
    "description": "The CDC Stream table-valued-function (TVF) enables users to read change data from relational databases (such as MySQL, PostgreSQL) via CDC, supporting full and incremental synchronization.",
    "sidebar_label": "CDC_STREAM"
}
---

# CDC_STREAM

## Description

The CDC Stream table-valued-function (TVF) enables users to read change data from relational databases (such as MySQL, PostgreSQL) via CDC. By integrating [Flink CDC](https://github.com/apache/flink-cdc) reading capabilities, it supports full and incremental data synchronization.

It is typically used with `CREATE JOB ON STREAMING` to achieve continuous single-table data synchronization. For detailed usage, see [MySQL Single-table Import](../../../data-operate/import/streaming-job/continuous-load-mysql-single.md) and [PostgreSQL Single-table Import](../../../data-operate/import/streaming-job/continuous-load-postgresql-single.md).

## Syntax

```sql
cdc_stream(
    "type" = "<source_type>",
    "jdbc_url" = "<jdbc_url>",
    "driver_url" = "<driver_url>",
    "driver_class" = "<driver_class>",
    "user" = "<user>",
    "password" = "<password>",
    "database" = "<database>",
    "table" = "<table>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
)
```

## Required Parameters

| Parameter      | Description                                                  |
|----------------|--------------------------------------------------------------|
| `type`         | Data source type, currently supports `mysql` and `postgres`  |
| `jdbc_url`     | JDBC connection string, e.g. `jdbc:mysql://127.0.0.1:3306` or `jdbc:postgresql://127.0.0.1:5432/postgres` |
| `driver_url`   | JDBC driver jar path                                         |
| `driver_class` | JDBC driver class name. `com.mysql.cj.jdbc.Driver` for MySQL, `org.postgresql.Driver` for PostgreSQL |
| `user`         | Database username                                            |
| `password`     | Database password                                            |
| `database`     | Database name                                                |
| `table`        | Table name to synchronize                                    |

## Optional Parameters

| Parameter              | Default | Description                                                  |
|------------------------|---------|--------------------------------------------------------------|
| `schema`               | -       | Schema name, required for PostgreSQL                         |
| `offset`               | initial | `initial`: full + incremental sync; `latest`: incremental only |
| `snapshot_split_size`  | 8096    | Split size (in rows). During full sync, the table is divided into multiple splits |
| `snapshot_parallelism` | 1       | Parallelism during full sync phase, i.e., max splits per task |

## Notes

1. CDC Stream TVF is typically used with `CREATE JOB ON STREAMING` and is not recommended for use in regular queries.
2. When using the MySQL type, Binlog must be enabled on MySQL (`binlog_format=ROW`).
3. When using the PostgreSQL type, logical replication must be enabled (`wal_level=logical`).
4. Supports exactly-once semantics.

## Examples

- Continuously synchronize a single table from MySQL

  ```sql
  CREATE JOB mysql_cdc_job
  ON STREAMING
  DO
  INSERT INTO db1.target_table
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

- Continuously synchronize a single table from PostgreSQL

  ```sql
  CREATE JOB pg_cdc_job
  ON STREAMING
  DO
  INSERT INTO db1.target_table
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

- Incremental sync only (skip full snapshot)

  ```sql
  CREATE JOB mysql_incremental_job
  ON STREAMING
  DO
  INSERT INTO db1.target_table
  SELECT * FROM cdc_stream(
      "type" = "mysql",
      "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
      "driver_url" = "mysql-connector-java-8.0.25.jar",
      "driver_class" = "com.mysql.cj.jdbc.Driver",
      "user" = "root",
      "password" = "123456",
      "database" = "source_db",
      "table" = "source_table",
      "offset" = "latest"
  )
  ```

- Column mapping and data transformation

  ```sql
  CREATE JOB mysql_cdc_transform_job
  ON STREAMING
  DO
  INSERT INTO db1.target_table (id, name, age)
  SELECT id, name, cast(age as INT) as age
  FROM cdc_stream(
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
