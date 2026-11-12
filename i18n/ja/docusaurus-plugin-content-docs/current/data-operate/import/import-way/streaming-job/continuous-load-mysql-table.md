---
{
    "title": "SQL マッピングによる MySQL CDC",
    "language": "ja",
    "sidebar_label": "SQL マッピング同期",
    "description": "Doris Streaming Job と CDC Stream TVF を使用して、SQL マッピング、全量および増分オフセット、SSL、削除処理に対応した MySQL テーブル同期を行います。",
    "keywords": [
        "MySQL から Doris への同期",
        "SQL マッピング同期",
        "CDC Stream TVF",
        "Streaming Job",
        "Binlog 増分同期",
        "exactly-once",
        "Flink CDC",
        "INSERT INTO SELECT"
    ]
}
---

:::caution 実験的機能

Doris の継続データロードは実験的機能であり、Doris 4.1.5 以降でサポートされています。

:::

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenario: Real-time sync of a single MySQL table to Doris with column mapping or data transformation -->

SQL マッピング同期は Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) によって実装され、**既存の** Doris テーブルを対象とします（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`）。Doris SQL の表現力を利用して、同期パイプライン内で列マッピング、フィルタリング、データ変換を実行できます。データ処理が必要なリアルタイム同期シナリオに適しています。

[Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合することで、Doris は MySQL から変更ログ（Binlog）を読み取り、ソーステーブルからターゲットテーブルへの**全量 + 増分**同期を完了します。Doris に下流テーブルを自動作成させ、データベース単位でテーブル群を同期する場合は、[MySQL CDC による自動テーブル作成同期](./continuous-load-mysql-database.md)を参照してください。

### 適用シナリオ {#applicable-scenarios}

- MySQL の単一テーブルを Doris に継続同期し、ターゲットテーブルのスキーマがあらかじめ計画されている
- 同期中に列の削除、列マッピング、フィールド名の変更、またはデータ変換が必要
- エンドツーエンドの exactly-once セマンティクスを必要とするリアルタイムデータ統合

### 前提条件 {#prerequisites}

| 項目 | 説明 |
| ------ | ---- |
| Doris バージョン | 4.1.5 以上 |
| テーブルタイプ | アップストリームのソーステーブルには主キーが必要です。Doris のターゲットテーブルは Unique Key モデルを使用する必要があります |
| ユーザー権限 | `Load` 権限が必要です |
| MySQL 構成 | MySQL 側で Binlog を有効にする必要があります。[構成ガイド](./continuous-load-overview.md#supported-data-sources-and-sync-modes)を参照してください |
| セマンティクス保証 | exactly-once セマンティクスをサポートします |

## クイックスタート {#quick-start}

次の最小限の実行可能な例では、ジョブを作成してからステータスを確認する完全なフローを示します。

### 手順 1: インポートジョブを作成する {#step-1-create-the-import-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して継続インポートジョブを作成します。

```sql
CREATE JOB mysql_single_sync
ON STREAMING
DO
INSERT INTO db1.tbl1
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

### 手順 2: インポートステータスを確認する {#step-2-check-the-import-status}

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

### 手順 3: ジョブの操作 {#step-3-job-operations}

一時停止、再開、削除、タスクの表示など、一般的な操作については、[継続インポートの概要](./continuous-load-overview.md)を参照してください。

## パラメータリファレンス {#parameter-reference}

### データソースパラメータ {#data-source-parameters}

CDC Stream TVF は、次の MySQL データソースパラメータをサポートします。

| パラメータ | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `type` | はい | - | データソースタイプ。`mysql` に設定します。 |
| `jdbc_url` | はい | - | MySQL JDBC 接続文字列。 |
| `driver_url` | はい | - | JDBC ドライバー jar のパス。ファイル名、ローカル絶対パス、または HTTP URL をサポートします。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)を参照してください。 |
| `driver_class` | はい | - | JDBC ドライバークラス名。例: `com.mysql.cj.jdbc.Driver`。 |
| `user` | はい | - | データベースユーザー名。 |
| `password` | はい | - | データベースパスワード。 |
| `database` | はい | - | MySQL データベース名。 |
| `table` | はい | - | 同期するテーブル名。各 SQL マッピングジョブでサポートされるソーステーブルは単一です。 |
| `offset` | はい | - | 起動オフセット。`initial`: 全量および増分同期、`snapshot`: 全量同期のみ、`earliest`: 利用可能な最も早い Binlog オフセットから開始、`latest`: ジョブ開始後の変更のみ同期します。`{"file":"binlog.000001","pos":"154"}` や `{"gtids":"<gtid_set>"}` のように、正確な JSON オフセットを指定することもできます。 |
| `snapshot_split_size` | いいえ | `40960` | 分割サイズ（行数）。全量同期中、テーブルは複数の split に分割されます。正の整数である必要があります。 |
| `snapshot_parallelism` | いいえ | `1` | 全量同期フェーズの並列度。つまり、Task によって同時にスケジュールされる split の最大数です。正の整数である必要があります。 |
| `skip_snapshot_backfill` | いいえ | `false` | スナップショット中に Binlog のバックフィルをスキップするかどうか。`true` に設定すると、at-least-once セマンティクスが使用されます。 |
| `server_id` | いいえ | 自動生成 | MySQL CDC リーダーのサーバー ID。`5400` のような単一値、または `5400-5408` のような閉区間をサポートします。範囲幅は `snapshot_parallelism` 以上である必要があります。 |
| `ssl_mode` | いいえ | `disable` | SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | 条件付きで必須 | - | `FILE:<file_name>` 形式の CA 証明書ファイル。`ssl_mode` が `verify-ca` の場合に必要です。まず [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) を使用してファイルをアップロードしてください。 |
| `include_delete_sign` | いいえ | `false` | TVF が `__DORIS_DELETE_SIGN__` 列を追加で出力するかどうか。上流の DELETE 操作を Doris 主キー テーブルの削除として同期するには `true` に設定します。 |

`include_delete_sign` を有効にすると、ターゲットテーブルは Merge-on-Write Unique Key テーブルである必要があり、INSERT のターゲット列リストと SELECT リストの両方で `__DORIS_DELETE_SIGN__` を明示的にマッピングする必要があります。

```sql
CREATE JOB mysql_cdc_with_delete
ON STREAMING
DO
INSERT INTO db1.target_table (id, value, __DORIS_DELETE_SIGN__)
SELECT id, value, __DORIS_DELETE_SIGN__
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

### ジョブ構成パラメータ {#job-configuration-parameters}

次のパラメータを `CREATE JOB ... PROPERTIES (...)` で設定します。

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `max_interval` | `10` | 上流に新しいデータがない場合のアイドルスケジューリング間隔（秒）。1 以上の整数である必要があります。 |
| `compute_group` | 現在のセッションまたはユーザーのデフォルトコンピュートグループ | コンピュートとストレージの分離モードでのみサポートされます。ジョブを実行するコンピュートグループを指定します。ユーザーはそのコンピュートグループに対する USAGE 権限を持っている必要があります。 |
| `session.<variable_name>` | 対応するセッション変数のデフォルト値 | INSERT タスクのセッション変数を設定します。ロード変数については、[Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters)を参照してください。 |

`ALTER JOB` で CDC 位置をリセットするために使用する Job Property `offset` とその完全な制約については、[ジョブ共通データロード構成パラメータ](./continuous-load-overview.md#job-common-load-configuration-parameters)を参照してください。新しいジョブの初期位置は `cdc_stream(...)` で設定する必要があります。

## FAQ {#faq}

**Q1: SQL マッピング同期と自動テーブル作成同期の違いは何ですか？**

- SQL マッピング同期: ターゲット Doris テーブルを**あらかじめ作成しておく必要があります**。列マッピングとデータ変換をサポートし、きめ細かな処理が必要なシナリオに適しています。
- 自動テーブル作成同期: Doris が下流テーブルを**自動的に作成**し、データベース単位で全体を同期します。詳細は [MySQL CDC による自動テーブル作成同期](./continuous-load-mysql-database.md)を参照してください。

**Q2: 主キーを持たないテーブルをターゲットテーブルとしてサポートしますか？**

アップストリームのソーステーブルには主キーが必要で、Doris のターゲットテーブルは現在 Unique Key モデルのみを使用できます。

**Q3: 履歴の全量データを含めず、増分データのみを同期するにはどうすればよいですか？**

`offset` パラメータを `latest` に設定します。ジョブは全量同期ステージをスキップし、Binlog の増分データのみを同期します。

**Q4: 全量同期が遅すぎる場合、どのように最適化できますか？**

全量同期ステージのスループットを向上させるには、次の 2 つのパラメータを調整できます。

- `snapshot_split_size`: split あたりの行数を増やします。
- `snapshot_parallelism`: Task ごとにスケジュールされる split の並列度を高めます。

`snapshot_parallelism` を調整する際に `server_id` の範囲も設定している場合は、範囲内の ID 数が並列度以上であることを確認してください。

## 関連ドキュメント {#related-documents}

- [継続インポートの概要](./continuous-load-overview.md)
- [MySQL CDC による自動テーブル作成同期](./continuous-load-mysql-database.md)
- [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md)
