---
{
    "title": "PostgreSQL CDC SQL マッピング同期",
    "language": "ja",
    "sidebar_label": "SQL マッピング同期",
    "description": "Doris Job + CDC Stream TVF を使用して PostgreSQL テーブルを Doris に継続的に同期し、列マッピング、データ変換、exactly-once セマンティクスを実現します。",
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

:::caution 実験的機能

Doris の継続データロードは実験的機能であり、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: PostgreSQL real-time data sync / single-table CDC ingestion with SQL mapping -->

SQL マッピング同期は Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) を介して実装されます。対象は既存の Doris テーブルです（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`）。Doris SQL の表現力により、列マッピング、フィルタリング、データ変換をサポートします。この方式は、書き込み前にデータを処理する必要があるリアルタイム同期シナリオに適しています。

[Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合することで、Doris は PostgreSQL から変更ログ（WAL）を読み取り、ソーステーブルからターゲットテーブルへの全量 + 増分同期を実行します。Doris に下流テーブルを自動作成させ、データベース単位でテーブル群を同期する場合は、[PostgreSQL CDC 自動テーブル作成](./continuous-load-postgresql-database.md)を参照してください。

### ユースケース {#use-cases}

-   単一テーブルをリアルタイムでデータウェアハウスに取り込み、書き込み前に列の絞り込み、フィルタリング、または式による変換が必要な場合。
-   下流の Doris テーブルがすでに存在し、SQL でフィールドマッピングを明示的に制御したい場合。
-   高い整合性要件があり、exactly-once セマンティクスが必要な場合。

### 前提条件 {#prerequisites}

ジョブを作成する前に、次の条件を確認してください。

1. PostgreSQL 側で論理レプリケーションが有効になっていること。詳細は[構成ガイド](./continuous-load-overview.md#supported-data-sources-and-sync-modes)を参照してください。
2. 現在のユーザーが `Load` 権限を持っていること。
3. ソーステーブルが主キーテーブルであること（現在、同期でサポートされるのは主キーテーブルのみです）。
4. ターゲットの Unique Key テーブルが Doris にあらかじめ作成されており、そのスキーマがマッピング SQL と互換性を持つこと。

### 注意事項 {#notes}

-   exactly-once セマンティクスがサポートされます。
-   現在サポートされているのは主キーテーブルの同期のみです。
-   `Load` 権限が必要です。
-   PostgreSQL 側で論理レプリケーションを有効にする必要があります。[構成ガイド](./continuous-load-overview.md#supported-data-sources-and-sync-modes)を参照してください。

## クイックスタート {#quick-start}

全体のワークフローは二つのステップで構成されます。継続データロードジョブを作成し、次にジョブのステータスを確認します。

### ステップ 1：ロードジョブの作成 {#step-1-create-the-load-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して継続データロードジョブを作成し、PostgreSQL の `public.source_table` を Doris の `db1.tbl1` に同期します。

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

### ステップ 2：ロードステータスの確認 {#step-2-check-the-load-status}

`jobs` テーブル関数を使用して、Streaming タイプのジョブの実行ステータスを確認します。

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

その他の一般的な操作（一時停止、再開、削除、タスクの表示など）については、[継続データロードの概要](./continuous-load-overview.md)を参照してください。

## パラメーターの説明 {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

### データソースパラメーター {#data-source-parameters}

データソースパラメーターは `cdc_stream(...)` TVF を介して設定します。同期対象の PostgreSQL テーブルと読み取り動作を記述します。

| パラメーター | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `type` | はい | - | データソースの種類。`postgres` に設定します。 |
| `jdbc_url` | はい | - | PostgreSQL JDBC 接続文字列。 |
| `driver_url` | はい | - | JDBC ドライバー jar のパス。ファイル名、ローカル絶対パス、または HTTP URL をサポートします。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)を参照してください。 |
| `driver_class` | はい | - | JDBC ドライバークラス名。例：`org.postgresql.Driver`。 |
| `user` | はい | - | データベースのユーザー名。 |
| `password` | はい | - | データベースのパスワード。 |
| `database` | いいえ | JDBC URL のデータベース名 | PostgreSQL データベース名。明示的に設定すると、JDBC URL のデータベース名を上書きします。UTF-8 エンコード後に 63 バイトを超えることはできません。 |
| `schema` | はい | - | スキーマ名。 |
| `table` | はい | - | 同期するテーブル名。各 SQL Mapping ジョブでサポートされるソーステーブルは一つです。 |
| `offset` | はい | - | 起動オフセット。`initial`：全量および増分同期。`snapshot`：全量同期のみ。`latest`：ジョブ開始後の変更のみを同期します。`{"lsn":"12345678"}` のように正確な JSON オフセットも指定できます。PostgreSQL は `earliest` をサポートしません。 |
| `snapshot_split_size` | いいえ | `40960` | 行数単位の split サイズ。全量同期中にテーブルを複数の split に分割します。正の整数である必要があります。 |
| `snapshot_parallelism` | いいえ | `1` | 全量同期フェーズの並列度。つまり、Task が一度にスケジュールできる split の最大数です。正の整数である必要があります。 |
| `skip_snapshot_backfill` | いいえ | `false` | スナップショット中に WAL のバックフィルをスキップするかどうか。`true` に設定すると、at-least-once セマンティクスが使用されます。 |
| `slot_name` | いいえ | `doris_cdc_<job_id>` | 論理レプリケーションスロット名。名前には小文字、数字、アンダースコアのみを含めることができ、数字で始めることはできず、最大 63 文字です。カスタムスロットは事前に作成する必要があり、Doris によって削除されません。 |
| `publication_name` | いいえ | `doris_pub_<job_id>` | パブリケーション名。命名規則は `slot_name` と同じです。カスタムパブリケーションは事前に作成し、現在のソーステーブルを含める必要があり、Doris によって削除されません。 |
| `ssl_mode` | いいえ | `disable` | SSL モード。使用できる値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | 条件付き必須 | - | `FILE:<file_name>` 形式の CA 証明書ファイル。`ssl_mode` が `verify-ca` の場合に必要です。まず [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) を使用してファイルをアップロードしてください。 |
| `include_delete_sign` | いいえ | `false` | TVF が `__DORIS_DELETE_SIGN__` 列を追加出力するかどうか。ソースの DELETE 操作を Doris の主キーテーブルで削除として同期するには `true` に設定します。 |

`include_delete_sign` を有効にすると、ターゲットテーブルは Merge-on-Write Unique Key テーブルでなければなりません。また、INSERT のターゲット列リストと SELECT リストの両方で `__DORIS_DELETE_SIGN__` を明示的にマッピングする必要があります。

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

`slot_name` または `publication_name` をカスタマイズする場合は、ジョブを作成する前に対応するリソースを準備してください。ジョブを削除しても、ユーザーが提供したリソースは Doris によって保持されます。

### Job の設定パラメーター {#job-configuration-parameters}

次のパラメーターを `CREATE JOB ... PROPERTIES (...)` で設定します。

| パラメーター | デフォルト | 説明 |
| --- | --- | --- |
| `max_interval` | `10` | 上流に新しいデータがない場合のアイドル時のスケジューリング間隔（秒）。`1` 以上の整数である必要があります。 |
| `compute_group` | 現在のセッションまたはユーザーのデフォルトのコンピュートグループ | コンピュートとストレージの分離モードでのみサポートされます。ジョブを実行するコンピュートグループを指定します。ユーザーはそのコンピュートグループに対する USAGE 権限を持っている必要があります。 |
| `session.<variable_name>` | 対応するセッション変数のデフォルト値 | INSERT タスクのセッション変数を設定します。データロード変数については、[Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters)を参照してください。 |

`ALTER JOB` で CDC 位置をリセットするときに使用する Job Property `offset` と、その完全な制限事項については、[継続データロードの概要](./continuous-load-overview.md#job-common-load-configuration-parameters)を参照してください。新しいジョブの初期位置は `cdc_stream(...)` で設定する必要があります。
