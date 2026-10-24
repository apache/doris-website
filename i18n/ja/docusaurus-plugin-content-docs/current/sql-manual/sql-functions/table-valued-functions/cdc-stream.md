---
{
    "title": "CDC_STREAM | テーブル値関数",
    "language": "ja",
    "description": "CDC Stream TVF を使用して MySQL と PostgreSQL の変更データを読み取り、増分クエリや Streaming Job によるフル同期と増分同期を行います。",
    "sidebar_label": "CDC_STREAM"
}
---

# CDC_STREAM {#cdc_stream}

## 説明 {#description}

CDC Stream テーブル値関数（TVF）は、CDC を通じて MySQL や PostgreSQL などのリレーショナルデータベースから変更データを読み取ります。[Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合しており、データベースの変更ログ（Binlog/WAL）を継続的に読み取り、その結果を Doris に書き込むための Streaming Job の INSERT 文に渡します。

> この関数はバージョン 4.1.0 以降でサポートされています。

通常は `CREATE JOB ON STREAMING` と組み合わせ、SQL マッピングを使用して単一テーブルのフル同期と増分同期を継続的に行います。詳しい使い方は、[SQL マッピングを使用した MySQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md) と [SQL マッピングを使用した PostgreSQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md) を参照してください。

:::note
CDC Stream TVF を単独で使用する場合は増分データ同期のみをサポートし、フルスナップショットの読み取りはサポートしません。[CREATE STREAMING JOB](../../sql-statements/job/CREATE-STREAMING-JOB.md) と組み合わせると、フル同期と増分同期をサポートします。
:::

## 使用上の注意 {#usage-notes}

1. CDC Stream TVF を単独で使用する場合は増分同期のみをサポートします。`CREATE JOB ON STREAMING` と組み合わせると、フル同期と増分同期をサポートします。
2. 通常は `CREATE JOB ON STREAMING` と組み合わせて使用します。通常のクエリでの使用は推奨しません。
3. `skip_snapshot_backfill` を `true` に設定すると、at-least-once セマンティクスが適用されます。
4. MySQL を使用する場合は、Binlog を有効にする必要があります（`binlog_format=ROW`）。`server_id` の範囲を明示的に設定する場合、その範囲に含まれる ID の数は `snapshot_parallelism` 以上でなければなりません。
5. PostgreSQL を使用する場合は、論理レプリケーションを有効にする必要があります（`wal_level=logical`）。ユーザーが指定するレプリケーションスロットとパブリケーションは、事前に作成し、ユーザー自身でクリーンアップする必要があります。
6. `ssl_mode=verify-ca` の場合は、`ssl_rootcert` も設定する必要があります。
7. `include_delete_sign=true` の場合、ターゲットテーブルは Merge-on-Write Unique Key テーブルである必要があります。また、INSERT のターゲット列リストと SELECT リストの両方で `__DORIS_DELETE_SIGN__` を明示的にマッピングする必要があります。

## 構文 {#syntax}

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

## パラメータ {#parameters}

| パラメータ | 対象データソース | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| `type` | MySQL, PostgreSQL | はい | - | データソースの種類。MySQL の場合は `mysql`、PostgreSQL の場合は `postgres` を指定します。 |
| `jdbc_url` | MySQL, PostgreSQL | はい | - | JDBC 接続文字列。例：`jdbc:mysql://127.0.0.1:3306` または `jdbc:postgresql://127.0.0.1:5432/postgres`。 |
| `driver_url` | MySQL, PostgreSQL | はい | - | JDBC ドライバーの jar ファイルへのパス。ファイル名、ローカルの絶対パス、HTTP URL を指定できます。 |
| `driver_class` | MySQL, PostgreSQL | はい | - | JDBC ドライバーのクラス名。MySQL には `com.mysql.cj.jdbc.Driver`、PostgreSQL には `org.postgresql.Driver` を使用します。 |
| `user` | MySQL, PostgreSQL | はい | - | データベースのユーザー名。 |
| `password` | MySQL, PostgreSQL | はい | - | データベースのパスワード。 |
| `database` | MySQL, PostgreSQL | MySQL では必須 | PostgreSQL の JDBC URL に含まれるデータベース名 | データベース名。PostgreSQL では、明示的に設定した値が JDBC URL 内のデータベース名より優先されます。UTF-8 でエンコードした後の長さは 63 バイト以下である必要があります。 |
| `schema` | PostgreSQL | はい | - | PostgreSQL のスキーマ名。 |
| `table` | MySQL, PostgreSQL | はい | - | 同期するテーブルの名前。各 CDC Stream TVF が扱えるソーステーブルは単一のテーブルです。 |
| `offset` | MySQL, PostgreSQL | はい | - | 開始オフセット。`initial`：フル同期と増分同期、`snapshot`：フル同期のみ、`latest`：開始後の変更のみを同期します。MySQL では `earliest` もサポートします。正確な JSON オフセットの例：MySQL では `{"file":"binlog.000001","pos":"154"}` または `{"gtids":"<gtid_set>"}`、PostgreSQL では `{"lsn":"12345678"}` を使用します。 |
| `snapshot_split_size` | MySQL, PostgreSQL | いいえ | `40960` | 行数で指定する分割サイズ。フル同期中、テーブルは複数の分割に分けられます。正の整数を指定する必要があります。4.1.4 より前のデフォルト値は `8096` でした。 |
| `snapshot_parallelism` | MySQL, PostgreSQL | いいえ | `1` | フル同期フェーズの並列度。Task が同時にスケジュールする分割の最大数です。正の整数を指定する必要があります。 |
| `skip_snapshot_backfill` | MySQL, PostgreSQL | いいえ | `false` | スナップショット中の増分バックフィルをスキップするかどうか。`true` に設定すると、at-least-once セマンティクスが適用されます。 |
| `ssl_mode` | MySQL, PostgreSQL | いいえ | `disable` | SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | MySQL, PostgreSQL | 条件付きで必須 | - | `FILE:<file_name>` 形式の CA 証明書ファイル。`ssl_mode` が `verify-ca` の場合に必須です。先に [CREATE FILE](../../sql-statements/security/CREATE-FILE.md) を使用してファイルをアップロードしてください。 |
| `server_id` | MySQL | いいえ | 自動生成 | MySQL CDC リーダーの Server ID。`5400` のような単一の値、または `5400-5408` のような両端を含む範囲を指定できます。範囲に含まれる ID の数は `snapshot_parallelism` 以上である必要があります。 |
| `slot_name` | PostgreSQL | いいえ | `doris_cdc_<job_id>` | 論理レプリケーションスロット名。名前に使用できるのは小文字、数字、アンダースコアのみです。数字で始めることはできず、長さは 63 文字以下です。カスタムスロットは事前に作成する必要があり、Doris によって削除されません。 |
| `publication_name` | PostgreSQL | いいえ | `doris_pub_<job_id>` | パブリケーション名。命名規則は `slot_name` と同じです。カスタムパブリケーションは事前に作成してソーステーブルを含める必要があり、Doris によって削除されません。 |
| `include_delete_sign` | MySQL, PostgreSQL | いいえ | `false` | 追加の `__DORIS_DELETE_SIGN__` 列を出力するかどうか。`true` に設定すると、上流の DELETE 操作を Doris の主キーテーブルで削除として同期します。 |

## 戻り値 {#return-value}

ソーステーブルの列を返します。列名と型はソーステーブルのスキーマから取得され、ソースの NULL 値は対応する列の型で返されます。`include_delete_sign=true` の場合、結果には `TINYINT` 型の `__DORIS_DELETE_SIGN__` 列が追加されます。通常のレコードでは値が `0`、削除レコードでは `1` になります。データソースに接続できない場合、ソーステーブルが見つからない場合、またはパラメータが無効な場合は、関数の解析または実行が失敗し、データは返されません。

4.1.5 以降、Streaming Job と組み合わせて使用する場合、CDC 操作ではジョブ作成者の権限で Doris の権限チェックが行われ、失敗したタスクには通常の自動タスク再試行処理が適用されません。[継続的なデータロードにおける実行ユーザーと障害処理](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md#cdc-task-identity-and-failure-handling) を参照してください。

## 例 {#examples}

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
  );
  ```

  ```text
  The Job is created successfully; the source table's initial data and subsequent Binlog changes are continuously written to db1.target_table.
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
  );
  ```

  ```text
  The Job is created successfully; the source table's initial data and subsequent WAL changes are continuously written to db1.target_table.
  ```

- 列のマッピングとデータ変換

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

- 上流の DELETE 操作を同期する

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
