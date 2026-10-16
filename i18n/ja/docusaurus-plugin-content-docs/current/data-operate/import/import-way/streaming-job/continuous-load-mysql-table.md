---
{
    "title": "SQL マッピングを使用した MySQL CDC",
    "language": "ja",
    "sidebar_label": "SQL マッピング同期",
    "description": "Doris Streaming Job と CDC Stream TVF を使用し、SQL マッピング、全量および増分の開始位置、SSL、削除処理に対応して MySQL テーブルを同期する方法を説明します。",
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

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenario: Real-time sync of a single MySQL table to Doris with column mapping or data transformation -->

SQL マッピング同期は、ジョブと [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) を組み合わせ、**既存の** Doris テーブルを同期先として実装します（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`）。Doris SQL の表現力を利用して、同期処理中にカラムのマッピング、フィルタリング、データ変換を行えます。データ処理が必要なリアルタイム同期に適しています。

> SQL マッピング同期はバージョン 4.1.0 以降でサポートされています。

Doris は [Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合することで、MySQL の変更ログ（Binlog）を読み取り、ソーステーブルからターゲットテーブルへの**全量 + 増分**同期を実行します。Doris で同期先テーブルを自動作成し、データベース単位で複数のテーブルを同期する場合は、[テーブル自動作成を使用した MySQL CDC](./continuous-load-mysql-database.md) を参照してください。

### 適用シナリオ

- ターゲットテーブルのスキーマがすでに設計されている、単一の MySQL テーブルから Doris への継続的な同期
- 同期中にカラムの選択、カラムのマッピング、フィールド名の変更、またはデータ変換が必要な場合
- エンドツーエンドの exactly-once セマンティクスが必要なリアルタイムのデータ統合

### 前提条件

| 項目 | 説明 |
| ------ | ---- |
| Doris のバージョン | 4.1.0 以降 |
| テーブルの種類 | 上流のソーステーブルにはプライマリキーが必要であり、Doris のターゲットテーブルには Unique Key モデルを使用する必要があります。 |
| ユーザー権限 | `Load` 権限が必要です。 |
| MySQL の設定 | MySQL 側で Binlog を有効にする必要があります。[設定ガイド](./continuous-load-overview.md#supported-data-sources-and-sync-modes) を参照してください。 |
| セマンティクスの保証 | exactly-once セマンティクスをサポートします。 |

## クイックスタート

次の最小限の実行可能な例では、ジョブを作成してから状態を確認するまでの一連の流れを示します。

### ステップ 1: インポートジョブを作成する

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して、継続的なインポートジョブを作成します。

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

### ステップ 2: インポート状態を確認する

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

### ステップ 3: ジョブを操作する

一時停止、再開、削除、タスクの表示など、一般的な操作については、[継続的なインポートの概要](./continuous-load-overview.md) を参照してください。

## パラメータリファレンス

### データソースのパラメータ

CDC Stream TVF は、次の MySQL データソースパラメータをサポートします。

| パラメータ | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `type` | はい | - | データソースの種類。`mysql` に設定します。 |
| `jdbc_url` | はい | - | MySQL JDBC 接続文字列。 |
| `driver_url` | はい | - | JDBC ドライバーの jar ファイルのパス。ファイル名、ローカルの絶対パス、HTTP URL を指定できます。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください。 |
| `driver_class` | はい | - | JDBC ドライバーのクラス名。例: `com.mysql.cj.jdbc.Driver`。 |
| `user` | はい | - | データベースのユーザー名。 |
| `password` | はい | - | データベースのパスワード。 |
| `database` | はい | - | MySQL データベース名。 |
| `table` | はい | - | 同期するテーブル名。各 SQL マッピングジョブで指定できるソーステーブルは単一のテーブルです。 |
| `offset` | はい | - | 開始位置。`initial`: 全量および増分同期。`snapshot`: 全量同期のみ。`earliest`: 利用可能な最も古い Binlog の位置から開始。`latest`: ジョブ開始後の変更のみを同期。`{"file":"binlog.000001","pos":"154"}` や `{"gtids":"<gtid_set>"}` のように、正確な位置を JSON で指定することもできます。 |
| `snapshot_split_size` | いいえ | `40960`（4.1.4 より前は `8096`） | 分割単位の行数。全量同期中、テーブルは複数の分割単位に分けられます。正の整数を指定する必要があります。 |
| `snapshot_parallelism` | いいえ | `1` | 全量同期フェーズの並列度。つまり、単一の Task が同時にスケジュールする分割単位の最大数です。正の整数を指定する必要があります。 |
| `skip_snapshot_backfill` | いいえ | `false` | スナップショット中に Binlog のバックフィルをスキップするかどうか。`true` に設定すると、at-least-once セマンティクスが適用されます。 |
| `server_id` | いいえ | 自動生成 | MySQL CDC リーダーの Server ID。`5400` のような単一の値、または `5400-5408` のような両端を含む範囲を指定できます。範囲の幅は `snapshot_parallelism` 以上である必要があります。 |
| `ssl_mode` | いいえ | `disable` | SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | 条件付きで必須 | - | `FILE:<file_name>` 形式の CA 証明書ファイル。`ssl_mode` が `verify-ca` の場合に必要です。先に [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) を使用してファイルをアップロードしてください。 |
| `include_delete_sign` | いいえ | `false` | TVF が `__DORIS_DELETE_SIGN__` カラムも出力するかどうか。上流の DELETE 操作を Doris のプライマリキーテーブルで削除として同期するには、`true` に設定します。 |

`include_delete_sign` を有効にする場合、ターゲットテーブルは Merge-on-Write の Unique Key テーブルである必要があります。また、INSERT のターゲットカラムリストと SELECT リストの両方に `__DORIS_DELETE_SIGN__` を明示的に指定する必要があります。

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

### ジョブ設定パラメータ

次のパラメータは `CREATE JOB ... PROPERTIES (...)` で設定します。

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `max_interval` | `10` | 上流に新しいデータがない場合の、アイドル時のスケジュール間隔（秒）。1 以上の整数を指定する必要があります。 |
| `compute_group` | 現在のセッションまたはユーザーのデフォルトのコンピュートグループ | コンピュートとストレージを分離したモードでのみサポートされます。ジョブを実行するコンピュートグループを指定します。ユーザーには、そのコンピュートグループに対する USAGE 権限が必要です。 |
| `session.<variable_name>` | 対応するセッション変数のデフォルト値 | INSERT タスクに適用するセッション変数を設定します。ロードに関する変数については、[Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters) を参照してください。 |

ジョブプロパティ `offset` を `ALTER JOB` で使用して CDC の位置をリセットする際の制約については、[ジョブの共通ロード設定パラメータ](./continuous-load-overview.md#job-common-load-configuration-parameters) を参照してください。新しいジョブの開始位置は `cdc_stream(...)` で設定する必要があります。

## よくある質問

**Q1: SQL マッピング同期とテーブル自動作成同期の違いは何ですか？**

- SQL マッピング同期: Doris のターゲットテーブルを**事前に作成**する必要があります。カラムのマッピングとデータ変換をサポートし、きめ細かな処理が必要なシナリオに適しています。
- テーブル自動作成同期: Doris が同期先テーブルを**自動作成**し、データベース単位でまとめて同期します。詳細は [テーブル自動作成を使用した MySQL CDC](./continuous-load-mysql-database.md) を参照してください。

**Q2: プライマリキーのないテーブルをターゲットテーブルとして使用できますか？**

上流のソーステーブルにはプライマリキーが必要であり、Doris のターゲットテーブルには現在 Unique Key モデルを使用する必要があります。

**Q3: 過去の全量データを含めず、増分データのみを同期するにはどうすればよいですか？**

`offset` パラメータを `latest` に設定します。ジョブは全量同期フェーズをスキップし、Binlog の増分データのみを同期します。

**Q4: 全量同期が遅すぎる場合、どう最適化すればよいですか？**

全量同期フェーズのスループットを向上させるには、次の二つのパラメータを調整できます。

- `snapshot_split_size`: 分割単位あたりの行数を増やします。
- `snapshot_parallelism`: Task がスケジュールする分割単位の並列度を上げます。

`snapshot_parallelism` を調整する際に `server_id` の範囲も設定している場合は、その範囲の幅が並列度以上であることを確認してください。

## 関連ドキュメント

- [継続的なインポートの概要](./continuous-load-overview.md)
- [テーブル自動作成を使用した MySQL CDC](./continuous-load-mysql-database.md)
- [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md)
