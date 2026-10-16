---
{
    "title": "CDC_STREAM | テーブル値関数",
    "language": "ja",
    "description": "CDC Stream テーブル値関数（TVF）は、CDC を使用して MySQL や PostgreSQL などのリレーショナルデータベースから変更データを読み取り、全量同期と増分同期をサポートします。",
    "sidebar_label": "CDC_STREAM"
}
---

# CDC_STREAM

## 説明

CDC Stream テーブル値関数（TVF）は、CDC を使用して MySQL や PostgreSQL などのリレーショナルデータベースから変更データを読み取ります。[Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合し、全量データ同期と増分データ同期をサポートします。

通常は `CREATE JOB ON STREAMING` と組み合わせ、SQL マッピングによる単一テーブルの継続的なデータ同期に使用します。詳しい使い方は、[SQL マッピングを使用した MySQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md) および [SQL マッピングを使用した PostgreSQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md) を参照してください。

## 構文

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

## 必須パラメータ

| パラメータ     | 説明                                                         |
|----------------|--------------------------------------------------------------|
| `type`         | データソースの種類。現在は `mysql` と `postgres` をサポートします |
| `jdbc_url`     | JDBC 接続文字列。例: `jdbc:mysql://127.0.0.1:3306` または `jdbc:postgresql://127.0.0.1:5432/postgres` |
| `driver_url`   | JDBC ドライバーの jar ファイルのパス                           |
| `driver_class` | JDBC ドライバーのクラス名。MySQL では `com.mysql.cj.jdbc.Driver`、PostgreSQL では `org.postgresql.Driver` |
| `user`         | データベースのユーザー名                                       |
| `password`     | データベースのパスワード                                       |
| `database`     | データベース名                                                 |
| `table`        | 同期対象のテーブル名                                           |

## オプションパラメータ

| パラメータ           | デフォルト値 | 説明                                                  |
|------------------------|---------|--------------------------------------------------------------|
| `schema`               | -       | スキーマ名。PostgreSQL では必須です                     |
| `offset`               | latest  | `latest`: 増分同期のみ。`initial`: 全量同期と増分同期。`snapshot`、`earliest`（MySQL のみ）、または JSON 形式の binlog/LSN 位置も指定できます |
| `snapshot_split_size`  | 40960 (4.1.4 より前は 8096)    | 分割サイズ（行数）。全量同期時にテーブルを複数の分割に分けます |
| `snapshot_parallelism` | 1       | 全量同期フェーズの並列度。タスクあたりの分割数の上限です |

## 注意事項

1. CDC Stream TVF は通常 `CREATE JOB ON STREAMING` と組み合わせて使用します。通常のクエリでの使用は推奨しません。
2. MySQL タイプを使用する場合は、MySQL で Binlog を有効にする必要があります（`binlog_format=ROW`）。
3. PostgreSQL タイプを使用する場合は、論理レプリケーションを有効にする必要があります（`wal_level=logical`）。
4. exactly-once セマンティクスをサポートします。

## 例

- MySQL の単一テーブルを継続的に同期する

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

- PostgreSQL の単一テーブルを継続的に同期する

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

- 増分同期のみを実行する（全量スナップショットを省略する）

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

- カラムのマッピングとデータ変換

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
