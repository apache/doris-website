---
{
    "title": "CDC_STREAM | Table Valued Functions",
    "language": "zh-CN",
    "description": "CDC Stream 表函数（table-valued-function, tvf）可以让用户通过 CDC 方式读取关系型数据库（如 MySQL、PostgreSQL）的变更数据。单独使用时支持增量同步，配合 Job 使用时支持全量 + 增量同步。",
    "sidebar_label": "CDC_STREAM"
}
---

# CDC_STREAM

## 描述

CDC Stream 表函数（table-valued-function, tvf）可以让用户通过 CDC 方式读取关系型数据库（如 MySQL、PostgreSQL）的增量变更数据。通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 的读取能力，持续读取数据库的变更日志（Binlog/WAL）并写入 Doris。

通常与 `CREATE JOB ON STREAMING` 配合使用，实现持续的单表增量数据同步。详细使用方式请参考 [MySQL 单表导入](../../../data-operate/import/streaming-job/continuous-load-mysql-single.md) 和 [PostgreSQL 单表导入](../../../data-operate/import/streaming-job/continuous-load-postgresql-single.md)。

:::note
CDC Stream TVF 单独使用时仅支持增量数据同步，不支持全量快照读取。配合 [CREATE STREAMING JOB](../../sql-statements/job/CREATE-STREAMING-JOB.md) 使用时支持全量 + 增量同步。
:::

## 语法

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

## 必选参数

| 参数           | 描述                                                         |
|----------------|--------------------------------------------------------------|
| `type`         | 数据源类型，目前支持 `mysql` 和 `postgres`                    |
| `jdbc_url`     | JDBC 连接串，如 `jdbc:mysql://127.0.0.1:3306` 或 `jdbc:postgresql://127.0.0.1:5432/postgres` |
| `driver_url`   | JDBC 驱动 jar 包路径                                          |
| `driver_class` | JDBC 驱动类名，MySQL 为 `com.mysql.cj.jdbc.Driver`，PostgreSQL 为 `org.postgresql.Driver` |
| `user`         | 数据库用户名                                                  |
| `password`     | 数据库密码                                                    |
| `database`     | 数据库名                                                      |
| `table`        | 需要同步的表名                                                |

## 可选参数

| 参数                 | 默认值  | 描述                                                         |
|----------------------|---------|--------------------------------------------------------------|
| `schema`             | -       | Schema 名称，PostgreSQL 必填                                  |

## 注意事项

1. CDC Stream TVF 单独使用时仅支持增量数据同步；配合 `CREATE JOB ON STREAMING` 使用时支持全量 + 增量同步。
2. 通常需要配合 `CREATE JOB ON STREAMING` 使用，不建议直接在普通查询中使用。
3. 使用 MySQL 类型时，需要在 MySQL 端开启 Binlog（`binlog_format=ROW`）。
4. 使用 PostgreSQL 类型时，需要开启逻辑复制（`wal_level=logical`）。
5. 支持 exactly-once 语义。

## 示例

- 从 MySQL 持续同步单表数据

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
  )
  ```

- 从 PostgreSQL 持续同步单表数据

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
  )
  ```

- 指定列映射和数据转换

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
  )
  ```
