---
{
    "title": "CDC_STREAM | テーブル値関数",
    "language": "ja",
    "description": "CDC Stream テーブル値関数（TVF）を使用すると、CDC を介してリレーショナルデータベース（MySQL や PostgreSQL など）から変更データを読み取ることができ、全量同期と増分同期に対応します。",
    "sidebar_label": "CDC_STREAM"
}
---

# CDC_STREAM {#cdc_stream}

## 説明 {#description}

CDC Stream テーブル値関数（TVF）を使用すると、CDC を介してリレーショナルデータベース（MySQL や PostgreSQL など）から変更データを読み取ることができます。[Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合することで、全量データ同期と増分データ同期に対応します。

通常は `CREATE JOB ON STREAMING` と併用し、SQL マッピングを使用して単一テーブルの継続的なデータ同期を実現します。詳しい使用方法については、[SQL マッピングを使用した MySQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md) と [SQL マッピングを使用した PostgreSQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md) を参照してください。

## 構文 {#syntax}

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

## 必須パラメータ {#required-parameters}

| パラメータ | 説明 |
|----------------|--------------------------------------------------------------|
| `type`         | データソースの種類。現在は `mysql` と `postgres` に対応しています |
| `jdbc_url`     | JDBC 接続文字列。例：`jdbc:mysql://127.0.0.1:3306` または `jdbc:postgresql://127.0.0.1:5432/postgres` |
| `driver_url`   | JDBC ドライバーの jar ファイルのパス |
| `driver_class` | JDBC ドライバーのクラス名。MySQL では `com.mysql.cj.jdbc.Driver`、PostgreSQL では `org.postgresql.Driver` |
| `user`         | データベースのユーザー名 |
| `password`     | データベースのパスワード |
| `database`     | データベース名 |
| `table`        | 同期対象のテーブル名 |

## オプションパラメータ {#optional-parameters}

| パラメータ | デフォルト値 | 説明 |
|------------------------|---------|--------------------------------------------------------------|
| `schema`               | -       | スキーマ名。PostgreSQL では必須です |
| `offset`               | latest  | `latest`：増分同期のみ。`initial`：全量同期と増分同期。`snapshot`、`earliest`（MySQL のみ）、または binlog/LSN の位置を表す JSON にも対応しています |
| `snapshot_split_size`  | 40960（4.1.4 より前は 8096） | split のサイズ（行数）。全量同期時にはテーブルを複数の split に分割します |
| `snapshot_parallelism` | 1       | 全量同期フェーズの並列度。タスクあたりの split の最大数です |

## 注意事項 {#notes}

1. CDC Stream TVF は通常 `CREATE JOB ON STREAMING` と併用します。通常のクエリでの使用は推奨しません。
2. MySQL を使用する場合は、MySQL で Binlog を有効にする必要があります（`binlog_format=ROW`）。
3. PostgreSQL を使用する場合は、論理レプリケーションを有効にする必要があります（`wal_level=logical`）。
4. exactly-once セマンティクスに対応しています。

4.1.5 以降、Streaming Job と併用する場合、CDC の操作ではジョブ作成者の権限で Doris の権限がチェックされ、失敗したタスクには通常のタスク自動再試行処理が適用されません。詳しくは、[継続的なデータロードにおける ID と失敗時の処理](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md#cdc-task-identity-and-failure-handling)を参照してください。

## 例 {#examples}

- MySQL から単一のテーブルを継続的に同期する

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

- PostgreSQL から単一のテーブルを継続的に同期する

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

- 増分同期のみを行う（全量スナップショットを省略する）

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
