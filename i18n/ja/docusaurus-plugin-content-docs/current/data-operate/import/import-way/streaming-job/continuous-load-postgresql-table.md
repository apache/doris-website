---
{
    "title": "SQL マッピングを使用した PostgreSQL CDC",
    "language": "ja",
    "sidebar_label": "SQL マッピング同期",
    "description": "Doris Job と CDC Stream TVF を使用し、列マッピング、データ変換、exactly-once セマンティクスを適用して PostgreSQL テーブルを Doris に継続的に同期する方法を説明します。",
    "keywords": [
        "PostgreSQL CDC",
        "PostgreSQL リアルタイム同期",
        "Doris CDC Stream",
        "WAL 増分同期",
        "Flink CDC",
        "exactly-once",
        "Streaming Job",
        "SQL マッピング同期"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: PostgreSQL real-time data sync / single-table CDC ingestion with SQL mapping -->

SQL マッピング同期は、Job と [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) を使用して実現します。同期先は既存の Doris テーブルです（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`）。Doris SQL を使用すると、列マッピング、フィルタリング、データ変換を行えます。この方法は、書き込み前にデータを処理する必要があるリアルタイム同期に適しています。

> SQL マッピング同期はバージョン 4.1.0 以降でサポートされています。

Doris は [Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合し、PostgreSQL の変更ログ（WAL）を読み取って、同期元テーブルから同期先テーブルへの全量同期と増分同期を行います。Doris に同期先テーブルを自動作成させ、データベース単位で複数のテーブルを同期したい場合は、[テーブル自動作成を伴う PostgreSQL CDC](./continuous-load-postgresql-database.md) を参照してください。

### 適用シナリオ

-   単一のテーブルをリアルタイムでウェアハウスに取り込み、書き込み前に列の絞り込み、フィルタリング、または式による変換が必要な場合。
-   Doris の同期先テーブルがすでに存在し、SQL でフィールドのマッピングを明示的に制御したい場合。
-   exactly-once セマンティクスを必要とする、高い一貫性要件がある場合。

### 前提条件

ジョブを作成する前に、次の事項を確認してください。

1. PostgreSQL 側で論理レプリケーションが有効になっていること。詳細は[設定ガイド](./continuous-load-overview.md#supported-data-sources-and-sync-modes)を参照してください。
2. 現在のユーザーに `Load` 権限があること。
3. 同期元テーブルが主キーテーブルであること（現在、同期できるのは主キーテーブルのみです）。
4. 同期先の Unique Key テーブルが Doris に事前に作成されており、そのスキーマがマッピング SQL と互換性があること。

### 注意事項

-   exactly-once セマンティクスをサポートします。
-   現在、同期できるのは主キーテーブルのみです。
-   `Load` 権限が必要です。
-   PostgreSQL 側で論理レプリケーションを有効にする必要があります。[設定ガイド](./continuous-load-overview.md#supported-data-sources-and-sync-modes)を参照してください。

## クイックスタート

全体の手順は、継続的なロードジョブを作成し、ジョブの状態を確認するという二つのステップです。

### ステップ 1: ロードジョブを作成する

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して、PostgreSQL の `public.source_table` を Doris の `db1.tbl1` に同期する継続的なロードジョブを作成します。

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

### ステップ 2: ロード状態を確認する

`jobs` テーブル関数を使用して、Streaming タイプのジョブの実行状態を確認します。

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

一時停止、再開、削除、タスクの表示など、その他の一般的な操作については、[継続的なロードの概要](./continuous-load-overview.md)を参照してください。

## パラメーターリファレンス

<!-- Knowledge type: Configuration parameters -->

### データソースのパラメーター

データソースのパラメーターは `cdc_stream(...)` TVF で設定します。同期対象の PostgreSQL テーブルと読み取り動作を指定します。

| パラメーター | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `type` | はい | - | データソースの種類。`postgres` を指定します。 |
| `jdbc_url` | はい | - | PostgreSQL の JDBC 接続文字列。 |
| `driver_url` | はい | - | JDBC ドライバーの jar ファイルのパス。ファイル名、ローカルの絶対パス、または HTTP URL を指定できます。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)を参照してください。 |
| `driver_class` | はい | - | JDBC ドライバーのクラス名。例: `org.postgresql.Driver`。 |
| `user` | はい | - | データベースのユーザー名。 |
| `password` | はい | - | データベースのパスワード。 |
| `database` | いいえ | JDBC URL 内のデータベース名 | PostgreSQL のデータベース名。明示的に指定すると、JDBC URL 内のデータベース名より優先されます。63 バイトを超えることはできません（UTF-8 エンコード後）。 |
| `schema` | はい | - | スキーマ名。 |
| `table` | はい | - | 同期するテーブルの名前。各 SQL マッピングジョブがサポートする同期元テーブルは一つです。 |
| `offset` | はい | - | 開始オフセット。`initial`: 全量同期と増分同期、`snapshot`: 全量同期のみ、`latest`: ジョブ開始後の変更のみを同期します。`{"lsn":"12345678"}` のような正確な JSON オフセットも指定できます。PostgreSQL は `earliest` をサポートしません。 |
| `snapshot_split_size` | いいえ | `40960`（`8096` は 4.1.4 より前のデフォルト値） | 分割サイズ（行数）。全量同期時にはテーブルを複数の分割単位に分けます。正の整数を指定してください。 |
| `snapshot_parallelism` | いいえ | `1` | 全量同期フェーズの並列度。Task が一度にスケジュールする分割単位の最大数です。正の整数を指定してください。 |
| `skip_snapshot_backfill` | いいえ | `false` | スナップショット中の WAL バックフィルをスキップするかどうか。`true` に設定すると、at-least-once セマンティクスが使用されます。 |
| `slot_name` | いいえ | `doris_cdc_<job_id>` | 論理レプリケーションスロット名。名前に使用できるのは小文字、数字、アンダースコアのみで、数字で始めることはできず、最大 63 文字です。カスタムスロットは事前に作成する必要があり、Doris によって削除されません。 |
| `publication_name` | いいえ | `doris_pub_<job_id>` | パブリケーション名。命名規則は `slot_name` と同じです。カスタムパブリケーションは事前に作成し、現在の同期元テーブルを含める必要があります。Doris によって削除されません。 |
| `ssl_mode` | いいえ | `disable` | SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | 条件付きで必須 | - | `FILE:<file_name>` 形式の CA 証明書ファイル。`ssl_mode` が `verify-ca` の場合に必須です。先に [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) を使用してファイルをアップロードしてください。 |
| `include_delete_sign` | いいえ | `false` | TVF が `__DORIS_DELETE_SIGN__` 列を追加で出力するかどうか。`true` に設定すると、同期元の DELETE 操作を Doris の主キーテーブルでの削除として同期します。 |

`include_delete_sign` を有効にした場合、同期先テーブルは Merge-on-Write の Unique Key テーブルである必要があります。また、INSERT の同期先列リストと SELECT リストの両方で `__DORIS_DELETE_SIGN__` を明示的にマッピングする必要があります。

```sql
CREATE JOB pg_cdc_with_delete
ON STREAMING
DO
INSERT INTO db1.target_table (id, value, __DORIS_DELETE_SIGN__)
SELECT id, value, __DORIS_DELETE_SIGN__
FROM cdc_stream(
    "type" = "postgres",
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "schema" = "public",
    "table" = "source_table",
    "offset" = "initial",
    "include_delete_sign" = "true"
);
```

`slot_name` または `publication_name` をカスタマイズする場合は、Job を作成する前に対応するリソースを準備してください。ユーザーが指定したリソースは、Job を削除しても Doris によって保持されます。

### ジョブの設定パラメーター

次のパラメーターは `CREATE JOB ... PROPERTIES (...)` で設定します。

| パラメーター | デフォルト | 説明 |
| --- | --- | --- |
| `max_interval` | `10` | 同期元に新しいデータがない場合の待機中のスケジューリング間隔（秒）。1 以上の整数を指定してください。 |
| `compute_group` | 現在のセッションまたはユーザーのデフォルトのコンピュートグループ | コンピュートとストレージを分離したモードでのみサポートされます。ジョブを実行するコンピュートグループを指定します。ユーザーにはそのコンピュートグループに対する USAGE 権限が必要です。 |
| `session.<variable_name>` | 対応するセッション変数のデフォルト値 | INSERT タスクのセッション変数を設定します。ロード変数については、[Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters) を参照してください。 |

Job Property `offset` を `ALTER JOB` で使用して CDC 位置をリセットする際の制約については、[ジョブ共通のロード設定パラメーター](./continuous-load-overview.md#job-common-load-configuration-parameters)を参照してください。新しいジョブの開始位置は `cdc_stream(...)` で設定する必要があります。
