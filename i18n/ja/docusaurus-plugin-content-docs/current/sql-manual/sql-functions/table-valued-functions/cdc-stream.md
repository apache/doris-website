---
{
    "title": "CDC_STREAM | テーブル値関数",
    "language": "ja",
    "description": "CDC Stream TVF を使用して MySQL と PostgreSQL の変更データを読み取り、増分クエリや、Streaming Job による全量・増分同期を行います。",
    "sidebar_label": "CDC_STREAM"
}
---

# CDC_STREAM

## 説明

CDC Stream テーブル値関数（TVF）は、CDC を通じて MySQL や PostgreSQL などのリレーショナルデータベースから変更データを読み取ります。[Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合し、データベースの変更ログ（Binlog/WAL）を継続的に読み取って、その結果を Doris に書き込むための Streaming Job の INSERT 文に渡します。

> この関数はバージョン 4.1.0 以降でサポートされています。

通常は `CREATE JOB ON STREAMING` と組み合わせ、SQL マッピングを使用して単一テーブルの全量・増分同期を継続的に実行します。詳しい使い方は、[SQL マッピングを使用した MySQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md) および [SQL マッピングを使用した PostgreSQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md) を参照してください。

:::note
CDC Stream TVF を単独で使用する場合、増分データ同期のみをサポートし、全量スナップショットの読み取りはサポートしません。[CREATE STREAMING JOB](../../sql-statements/job/CREATE-STREAMING-JOB.md) と組み合わせる場合は、全量・増分同期をサポートします。
:::

## 使用上の注意

1. CDC Stream TVF を単独で使用する場合は増分同期のみをサポートします。`CREATE JOB ON STREAMING` と組み合わせる場合は全量・増分同期をサポートします。
2. 通常は `CREATE JOB ON STREAMING` と組み合わせて使用します。通常のクエリでの使用は推奨しません。
3. `skip_snapshot_backfill` を `true` に設定すると、at-least-once セマンティクスが適用されます。
4. MySQL を使用する場合は、Binlog を有効にする必要があります（`binlog_format=ROW`）。`server_id` の範囲を明示的に設定する場合、その範囲に含まれる ID の数を `snapshot_parallelism` より少なくすることはできません。
5. PostgreSQL を使用する場合は、論理レプリケーションを有効にする必要があります（`wal_level=logical`）。ユーザーが指定するレプリケーションスロットとパブリケーションは、事前に作成し、ユーザー自身でクリーンアップする必要があります。
6. `ssl_mode=verify-ca` を使用する場合は、`ssl_rootcert` も設定する必要があります。
7. `include_delete_sign=true` を使用する場合、対象テーブルは Merge-on-Write の Unique Key テーブルである必要があります。また、INSERT の対象カラムリストと SELECT リストの両方で `__DORIS_DELETE_SIGN__` を明示的にマッピングする必要があります。

## 構文

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

## パラメータ

| パラメータ | 対象データソース | 必須 | デフォルト値 | 説明 |
| --- | --- | --- | --- | --- |
| `type` | MySQL、PostgreSQL | はい | - | データソースの種類。MySQL では `mysql`、PostgreSQL では `postgres` を指定します。 |
| `jdbc_url` | MySQL、PostgreSQL | はい | - | JDBC 接続文字列。例: `jdbc:mysql://127.0.0.1:3306` または `jdbc:postgresql://127.0.0.1:5432/postgres`。 |
| `driver_url` | MySQL、PostgreSQL | はい | - | JDBC ドライバーの jar ファイルのパス。ファイル名、ローカルの絶対パス、HTTP URL をサポートします。 |
| `driver_class` | MySQL、PostgreSQL | はい | - | JDBC ドライバーのクラス名。MySQL では `com.mysql.cj.jdbc.Driver`、PostgreSQL では `org.postgresql.Driver` を使用します。 |
| `user` | MySQL、PostgreSQL | はい | - | データベースのユーザー名。 |
| `password` | MySQL、PostgreSQL | はい | - | データベースのパスワード。 |
| `database` | MySQL、PostgreSQL | MySQL では必須 | PostgreSQL の JDBC URL に含まれるデータベース名 | データベース名。PostgreSQL では、明示的に設定した値が JDBC URL 内のデータベース名より優先されます。長さは 63 バイト以下（UTF-8 でエンコードした後）である必要があります。 |
| `schema` | PostgreSQL | はい | - | PostgreSQL のスキーマ名。 |
| `table` | MySQL、PostgreSQL | はい | - | 同期対象のテーブル名。各 CDC Stream TVF がサポートするソーステーブルは一つです。 |
| `offset` | MySQL、PostgreSQL | はい | - | 開始オフセット。`initial`: 全量・増分同期、`snapshot`: 全量同期のみ、`latest`: 起動後の変更のみを同期します。MySQL では `earliest` もサポートします。JSON 形式で正確なオフセットを指定する例: MySQL では `{"file":"binlog.000001","pos":"154"}` または `{"gtids":"<gtid_set>"}`、PostgreSQL では `{"lsn":"12345678"}` を使用します。 |
| `snapshot_split_size` | MySQL、PostgreSQL | いいえ | `40960` | 分割サイズ（行数）。全量同期時にテーブルを複数の分割に分けます。正の整数を指定する必要があります。デフォルト値は `8096` でした（4.1.4 より前）。 |
| `snapshot_parallelism` | MySQL、PostgreSQL | いいえ | `1` | 全量同期フェーズの並列度。一つの Task が同時にスケジュールできる分割数の上限です。正の整数を指定する必要があります。 |
| `skip_snapshot_backfill` | MySQL、PostgreSQL | いいえ | `false` | スナップショット中の増分バックフィルを省略するかどうか。`true` に設定すると、at-least-once セマンティクスが適用されます。 |
| `ssl_mode` | MySQL、PostgreSQL | いいえ | `disable` | SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | MySQL、PostgreSQL | 条件付きで必須 | - | `FILE:<file_name>` 形式の CA 証明書ファイル。`ssl_mode` が `verify-ca` の場合に必須です。事前に [CREATE FILE](../../sql-statements/security/CREATE-FILE.md) を使用してファイルをアップロードしてください。 |
| `server_id` | MySQL | いいえ | 自動生成 | MySQL CDC リーダーの Server ID。`5400` のような単一の値、または `5400-5408` のような両端を含む範囲をサポートします。範囲に含まれる ID の数は `snapshot_parallelism` 以上である必要があります。 |
| `slot_name` | PostgreSQL | いいえ | `doris_cdc_<job_id>` | 論理レプリケーションスロット名。名前に使用できるのは小文字、数字、アンダースコアのみで、数字で始めることはできず、長さは 63 文字以内です。カスタムスロットは事前に作成する必要があり、Doris によって削除されません。 |
| `publication_name` | PostgreSQL | いいえ | `doris_pub_<job_id>` | パブリケーション名。命名規則は `slot_name` と同じです。カスタムパブリケーションは事前に作成し、ソーステーブルを含める必要があります。Doris によって削除されません。 |
| `include_delete_sign` | MySQL、PostgreSQL | いいえ | `false` | 追加の `__DORIS_DELETE_SIGN__` カラムを出力するかどうか。上流の DELETE 操作を Doris のプライマリキーテーブルでの削除として同期するには、`true` に設定します。 |

## 戻り値

ソーステーブルのカラムを返します。カラム名と型はソーステーブルのスキーマから取得され、ソースの NULL 値は対応するカラム型で返されます。`include_delete_sign=true` の場合、結果に `TINYINT` 型の `__DORIS_DELETE_SIGN__` カラムが追加されます。通常のレコードの値は `0`、削除レコードの値は `1` です。データソースに接続できない場合、ソーステーブルが見つからない場合、またはパラメータが無効な場合は、関数の解析または実行が失敗し、データは返されません。

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
