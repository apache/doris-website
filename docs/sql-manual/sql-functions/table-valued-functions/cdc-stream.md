---
{
    "title": "CDC_STREAM | Table Valued Functions",
    "language": "en",
    "description": "Use CDC Stream TVF to read MySQL and PostgreSQL changes for incremental queries or full and incremental Streaming Job synchronization.",
    "sidebar_label": "CDC_STREAM"
}
---

# CDC_STREAM

## Description

The CDC Stream table-valued function (TVF) reads change data from relational databases such as MySQL and PostgreSQL through CDC. By integrating [Flink CDC](https://github.com/apache/flink-cdc) reading capabilities, the function continuously reads database change logs (Binlog/WAL) and provides the results to a Streaming Job INSERT statement for writing into Doris.

> This function is supported since version 4.1.0.

It is typically used with `CREATE JOB ON STREAMING` to perform continuous full and incremental synchronization of a single table with SQL mapping. For detailed usage, see [MySQL CDC with SQL Mapping](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md) and [PostgreSQL CDC with SQL Mapping](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md).

:::note
When used alone, CDC Stream TVF supports only incremental data synchronization and does not support reading a full snapshot. When used with [CREATE STREAMING JOB](../../sql-statements/job/CREATE-STREAMING-JOB.md), it supports full and incremental synchronization.
:::

## Usage Notes

1. When used alone, CDC Stream TVF supports only incremental synchronization; when used with `CREATE JOB ON STREAMING`, it supports full and incremental synchronization.
2. It is typically used with `CREATE JOB ON STREAMING` and is not recommended for use in regular queries.
3. When `skip_snapshot_backfill` is set to `true`, at-least-once semantics are used.
4. When using MySQL, Binlog must be enabled (`binlog_format=ROW`). If a `server_id` range is explicitly set, the number of IDs in the range cannot be less than `snapshot_parallelism`.
5. When using PostgreSQL, logical replication must be enabled (`wal_level=logical`). User-specified replication slots and publications must be created in advance and cleaned up by the user.
6. When `ssl_mode=verify-ca`, `ssl_rootcert` must also be set.
7. When `include_delete_sign=true`, the target table must be a Merge-on-Write Unique Key table, and `__DORIS_DELETE_SIGN__` must be explicitly mapped in both the INSERT target column list and the SELECT list.

## Syntax

```sql
cdc_stream(
    "type" = "<source_type>",
    "jdbc_url" = "<jdbc_url>",
    "driver_url" = "<driver_url>",
    "driver_class" = "<driver_class>",
    "user" = "<user>",
    "password" = "<password>",
    "table" = "<table>",
    "offset" = "<offset>"
    [, "database" = "<database>"]
    [, "schema" = "<schema>"]
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
)
```

## Parameters

| Parameter | Applicable sources | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | MySQL, PostgreSQL | Yes | - | Data source type. Set to `mysql` for MySQL or `postgres` for PostgreSQL. |
| `jdbc_url` | MySQL, PostgreSQL | Yes | - | JDBC connection string, for example, `jdbc:mysql://127.0.0.1:3306` or `jdbc:postgresql://127.0.0.1:5432/postgres`. |
| `driver_url` | MySQL, PostgreSQL | Yes | - | Path to the JDBC driver jar. Supports a file name, local absolute path, or HTTP URL. |
| `driver_class` | MySQL, PostgreSQL | Yes | - | JDBC driver class name. Use `com.mysql.cj.jdbc.Driver` for MySQL or `org.postgresql.Driver` for PostgreSQL. |
| `user` | MySQL, PostgreSQL | Yes | - | Database user name. |
| `password` | MySQL, PostgreSQL | Yes | - | Database password. |
| `database` | MySQL, PostgreSQL | Required for MySQL | Database name in the PostgreSQL JDBC URL | Database name. For PostgreSQL, an explicitly configured value overrides the database name in the JDBC URL and cannot exceed 63 bytes after UTF-8 encoding. |
| `schema` | PostgreSQL | Yes | - | PostgreSQL Schema name. |
| `table` | MySQL, PostgreSQL | Yes | - | Name of the table to sync. Each CDC Stream TVF supports one source table. |
| `offset` | MySQL, PostgreSQL | Yes | - | Startup offset. `initial`: full and incremental sync; `snapshot`: full sync only; `latest`: sync only changes after startup. MySQL also supports `earliest`. Exact JSON offset examples: MySQL uses `{"file":"binlog.000001","pos":"154"}` or `{"gtids":"<gtid_set>"}`, and PostgreSQL uses `{"lsn":"12345678"}`. |
| `snapshot_split_size` | MySQL, PostgreSQL | No | `8096` | Split size in rows. During full sync, the table is divided into multiple splits. Must be a positive integer. |
| `snapshot_parallelism` | MySQL, PostgreSQL | No | `1` | Parallelism of the full-sync phase, that is, the maximum number of splits scheduled by a Task at one time. Must be a positive integer. |
| `skip_snapshot_backfill` | MySQL, PostgreSQL | No | `false` | Whether to skip incremental backfill during the snapshot. When set to `true`, at-least-once semantics are used. |
| `ssl_mode` | MySQL, PostgreSQL | No | `disable` | SSL mode. Valid values are `disable`, `require`, and `verify-ca`. |
| `ssl_rootcert` | MySQL, PostgreSQL | Conditionally required | - | CA certificate file in the format `FILE:<file_name>`. Required when `ssl_mode` is `verify-ca`. Upload the file first using [CREATE FILE](../../sql-statements/security/CREATE-FILE.md). |
| `server_id` | MySQL | No | Automatically generated | Server ID of the MySQL CDC reader. Supports a single value, such as `5400`, or a closed range, such as `5400-5408`. The range width must be greater than or equal to `snapshot_parallelism`. |
| `slot_name` | PostgreSQL | No | `doris_cdc_<job_id>` | Logical replication slot name. The name can contain only lowercase letters, digits, and underscores, cannot start with a digit, and is limited to 63 characters. A custom slot must be created in advance and is not deleted by Doris. |
| `publication_name` | PostgreSQL | No | `doris_pub_<job_id>` | Publication name. The naming rules are the same as for `slot_name`. A custom publication must be created in advance, include the source table, and is not deleted by Doris. |
| `include_delete_sign` | MySQL, PostgreSQL | No | `false` | Whether to output an additional `__DORIS_DELETE_SIGN__` column. Set to `true` to sync upstream DELETE operations as deletes in a Doris primary key table. |

## Return Value

Returns the columns of the source table. Column names and types are derived from the source table Schema, and NULL source values are returned using the corresponding column types. When `include_delete_sign=true`, the result includes an additional `TINYINT` column named `__DORIS_DELETE_SIGN__`; regular records have a value of `0`, and delete records have a value of `1`. If the data source cannot be reached, the source table cannot be found, or a parameter is invalid, function analysis or execution fails and no data is returned.

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
  );
  ```

  ```text
  The Job is created successfully; the source table's initial data and subsequent Binlog changes are continuously written to db1.target_table.
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
  );
  ```

  ```text
  The Job is created successfully; the source table's initial data and subsequent WAL changes are continuously written to db1.target_table.
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
  );
  ```

  ```text
  The Job is created successfully; after age is converted to INT, the selected columns are continuously written to db1.target_table.
  ```

- Synchronize upstream DELETE operations

  ```sql
  CREATE JOB mysql_cdc_delete_job
  ON STREAMING
  DO
  INSERT INTO db1.target_table (id, name, __DORIS_DELETE_SIGN__)
  SELECT id, name, __DORIS_DELETE_SIGN__
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

  ```text
  The Job is created successfully; regular records carry delete sign 0, and DELETE records carry delete sign 1.
  ```
