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

CDC Stream 表函数（table-valued-function, TVF）通过 CDC 方式读取 MySQL、PostgreSQL 等关系型数据库的变更数据。通过集成 [Flink CDC](https://github.com/apache/flink-cdc) 的读取能力，函数持续读取数据库变更日志（Binlog/WAL），并将结果提供给 Streaming Job 的 INSERT 语句写入 Doris。

> 该函数自 4.1.0 版本起支持。

通常与 `CREATE JOB ON STREAMING` 配合使用，实现持续的单表 SQL 映射全量 + 增量同步。详细使用方式请参考 [MySQL CDC SQL 映射同步](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md) 和 [PostgreSQL CDC SQL 映射同步](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md)。

:::note
CDC Stream TVF 单独使用时仅支持增量数据同步，不支持全量快照读取。配合 [CREATE STREAMING JOB](../../sql-statements/job/CREATE-STREAMING-JOB.md) 使用时支持全量 + 增量同步。
:::

## 使用说明

1. CDC Stream TVF 单独使用时仅支持增量数据同步；配合 `CREATE JOB ON STREAMING` 使用时支持全量 + 增量同步。
2. 通常需要配合 `CREATE JOB ON STREAMING` 使用，不建议直接在普通查询中使用。
3. 将 `skip_snapshot_backfill` 设置为 `true` 时，采用 at-least-once 语义。
4. 使用 MySQL 时，需要开启 Binlog（`binlog_format=ROW`）。如果显式设置 `server_id` 范围，范围内的 ID 数量不能少于 `snapshot_parallelism`。
5. 使用 PostgreSQL 时，需要开启逻辑复制（`wal_level=logical`）。用户指定的复制槽和发布必须预先创建，并由用户负责清理。
6. 使用 `ssl_mode=verify-ca` 时，必须同时设置 `ssl_rootcert`。
7. 使用 `include_delete_sign=true` 时，目标表必须为 Merge-on-Write 主键表，并在 INSERT 目标列和 SELECT 列表中显式映射 `__DORIS_DELETE_SIGN__`。

## 语法

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

## 参数

| 参数 | 适用数据源 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `type` | MySQL、PostgreSQL | 是 | - | 数据源类型，MySQL 填写 `mysql`，PostgreSQL 填写 `postgres`。 |
| `jdbc_url` | MySQL、PostgreSQL | 是 | - | JDBC 连接串，例如 `jdbc:mysql://127.0.0.1:3306` 或 `jdbc:postgresql://127.0.0.1:5432/postgres`。 |
| `driver_url` | MySQL、PostgreSQL | 是 | - | JDBC 驱动 jar 包路径，支持文件名、本地绝对路径和 HTTP 地址。 |
| `driver_class` | MySQL、PostgreSQL | 是 | - | JDBC 驱动类名。MySQL 使用 `com.mysql.cj.jdbc.Driver`，PostgreSQL 使用 `org.postgresql.Driver`。 |
| `user` | MySQL、PostgreSQL | 是 | - | 数据库用户名。 |
| `password` | MySQL、PostgreSQL | 是 | - | 数据库密码。 |
| `database` | MySQL、PostgreSQL | MySQL 必填 | PostgreSQL JDBC URL 中的数据库名 | 数据库名。PostgreSQL 显式设置时覆盖 JDBC URL 中的数据库名，且 UTF-8 编码后不能超过 63 字节。 |
| `schema` | PostgreSQL | 是 | - | PostgreSQL Schema 名称。 |
| `table` | MySQL、PostgreSQL | 是 | - | 需要同步的表名。每个 CDC Stream TVF 只支持一张源表。 |
| `offset` | MySQL、PostgreSQL | 是 | - | 启动位点。`initial`：全量 + 增量；`snapshot`：仅全量；`latest`：仅同步启动后的增量；MySQL 还支持 `earliest`。JSON 精确位点示例：MySQL 使用 `{"file":"binlog.000001","pos":"154"}` 或 `{"gtids":"<gtid_set>"}`，PostgreSQL 使用 `{"lsn":"12345678"}`。 |
| `snapshot_split_size` | MySQL、PostgreSQL | 否 | `8096` | split 的大小（行数）。全量同步时表会被切分成多个 split。必须为正整数。 |
| `snapshot_parallelism` | MySQL、PostgreSQL | 否 | `1` | 全量阶段的并行度，即单次 Task 最多调度的 split 数量。必须为正整数。 |
| `skip_snapshot_backfill` | MySQL、PostgreSQL | 否 | `false` | 是否跳过快照期间的增量回填。设置为 `true` 时采用 at-least-once 语义。 |
| `ssl_mode` | MySQL、PostgreSQL | 否 | `disable` | SSL 模式，可选值为 `disable`、`require`、`verify-ca`。 |
| `ssl_rootcert` | MySQL、PostgreSQL | 条件必填 | - | CA 证书文件，格式为 `FILE:<file_name>`。`ssl_mode` 为 `verify-ca` 时必填；文件需先通过 [CREATE FILE](../../sql-statements/security/CREATE-FILE.md) 上传。 |
| `server_id` | MySQL | 否 | 自动生成 | MySQL CDC reader 的 server ID。支持单值（如 `5400`）或闭区间（如 `5400-5408`）；区间宽度必须大于等于 `snapshot_parallelism`。 |
| `slot_name` | PostgreSQL | 否 | `doris_cdc_<job_id>` | 逻辑复制槽名称。名称只能包含小写字母、数字和下划线，不能以数字开头，最长 63 个字符。自定义复制槽必须预先创建，且不会由 Doris 删除。 |
| `publication_name` | PostgreSQL | 否 | `doris_pub_<job_id>` | 发布名称，命名规则与 `slot_name` 相同。自定义发布必须预先创建并包含源表，且不会由 Doris 删除。 |
| `include_delete_sign` | MySQL、PostgreSQL | 否 | `false` | 是否额外输出 `__DORIS_DELETE_SIGN__` 列。需要把源端 DELETE 同步为 Doris 主键表删除操作时设置为 `true`。 |

## 返回值

返回源表各列，列名和类型根据源表 Schema 生成；源列中的 NULL 值按对应列类型返回。设置 `include_delete_sign=true` 时，结果末尾额外包含 `TINYINT` 类型的 `__DORIS_DELETE_SIGN__` 列；普通记录取值为 `0`，删除记录取值为 `1`。无法连接数据源、找不到源表或参数不合法时，函数分析或执行失败，不返回数据。

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
      "offset" = "initial"
  );
  ```

  ```text
  Job 创建成功；源表的初始数据和后续 Binlog 变更持续写入 db1.target_table。
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
      "offset" = "initial"
  );
  ```

  ```text
  Job 创建成功；源表的初始数据和后续 WAL 变更持续写入 db1.target_table。
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
      "offset" = "initial"
  );
  ```

  ```text
  Job 创建成功；age 转换为 INT 后，所选列持续写入 db1.target_table。
  ```

- 同步源端 DELETE 操作

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
  Job 创建成功；普通记录携带删除标记 0，DELETE 记录携带删除标记 1。
  ```
