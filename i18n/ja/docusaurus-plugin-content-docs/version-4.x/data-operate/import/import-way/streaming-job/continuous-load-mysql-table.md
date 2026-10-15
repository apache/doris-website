---
{
    "title": "SQL マッピングを使用した MySQL CDC",
    "language": "ja",
    "sidebar_label": "SQL マッピング同期",
    "description": "SQL マッピング（Job と CDC Stream TVF）を使用し、カラムのマッピングやデータ変換に対応しながら、単一の MySQL テーブルを Doris に継続的に同期する方法を説明します。",
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

SQL マッピング同期は、Job と [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) を組み合わせ、**既存の** Doris テーブルを同期先として実装します（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`）。Doris SQL の表現力を利用して、同期処理中にカラムのマッピング、フィルタリング、データ変換を行えます。また、exactly-once セマンティクスが保証されます。データ処理が必要なリアルタイム同期に適しています。

Doris は [Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合することで、MySQL の変更ログ（Binlog）を読み取り、ソーステーブルからターゲットテーブルへの**全量 + 増分**同期を実行します。Doris で同期先テーブルを自動作成し、データベース単位で複数のテーブルを同期する場合は、[テーブル自動作成を使用した MySQL CDC](./continuous-load-mysql-database.md) を参照してください。

### 適用シナリオ

- ターゲットテーブルのスキーマがすでに設計されている、単一の MySQL テーブルから Doris への継続的な同期
- 同期中にカラムの選択、カラムのマッピング、フィールド名の変更、またはデータ変換が必要な場合
- エンドツーエンドの exactly-once セマンティクスが必要なリアルタイムのデータ統合

### 前提条件

| 項目 | 説明 |
| ------ | ---- |
| Doris のバージョン | 4.1.0 以降 |
| テーブルの種類 | 現在、ターゲットテーブルとしてサポートされるのは**プライマリキーテーブルのみ**です。 |
| ユーザー権限 | `Load` 権限が必要です。 |
| MySQL の設定 | MySQL 側で Binlog を有効にする必要があります。[設定ガイド](./continuous-load-overview.md) を参照してください。 |
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

| パラメータ             | デフォルト | 説明                                                                                                                                     |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| type                  | -       | データソースの種類。`mysql` に設定します。                                                                                                                |
| jdbc_url              | -       | MySQL JDBC 接続文字列。                                                                                                                    |
| driver_url            | -       | JDBC ドライバーの jar ファイルのパス。ファイル名、ローカルの絶対パス、HTTP URL を指定できます。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください。 |
| driver_class          | -       | JDBC ドライバーのクラス名。                                                                                                                          |
| user                  | -       | データベースのユーザー名。                                                                                                                               |
| password              | -       | データベースのパスワード。                                                                                                                               |
| database              | -       | データベース名。                                                                                                                                   |
| table                 | -       | 同期するテーブル名。                                                                                                                       |
| offset                | latest  | `latest`: 増分同期のみ。`initial`: 全量 + 増分同期。                                                                             |
| snapshot_split_size   | 40960 (8096：4.1.4 より前)    | 分割単位の行数。全量同期中、テーブルは同期のために複数の分割単位に分けられます。                                              |
| snapshot_parallelism  | 1       | 全量同期フェーズの並列度。つまり、各 Task がスケジュールする分割単位の最大数です。                                                |

### インポート設定パラメータ

| パラメータ | デフォルト | 説明                                                                                                                                                                  |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| session.* | なし    | すべてのセッション変数を `job_properties` で設定できます。インポートに関する変数については、[Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters) を参照してください。 |

`max_interval` など、その他の共通パラメータについては、[継続的なインポートの概要](./continuous-load-overview.md#common-parameters) を参照してください。

## よくある質問

**Q1: SQL マッピング同期とテーブル自動作成同期の違いは何ですか？**

- SQL マッピング同期: Doris のターゲットテーブルを**事前に作成**する必要があります。カラムのマッピングとデータ変換をサポートし、きめ細かな処理が必要なシナリオに適しています。
- テーブル自動作成同期: Doris が同期先テーブルを**自動作成**し、データベース単位でまとめて同期します。詳細は [テーブル自動作成を使用した MySQL CDC](./continuous-load-mysql-database.md) を参照してください。

**Q2: プライマリキーテーブル以外をターゲットテーブルとして使用できますか？**

現在、ターゲットテーブルとしてサポートされるのは**プライマリキーテーブルのみ**です。

**Q3: 過去の全量データを含めず、増分データのみを同期するにはどうすればよいですか？**

`offset` パラメータを `latest` に設定します。ジョブは全量同期フェーズをスキップし、Binlog の増分データのみを同期します。

**Q4: 全量同期が遅すぎる場合、どう最適化すればよいですか？**

全量同期フェーズのスループットを向上させるには、次の二つのパラメータを調整できます。

- `snapshot_split_size`: 分割単位あたりの行数を増やします。
- `snapshot_parallelism`: Task がスケジュールする分割単位の並列度を上げます。

## 関連ドキュメント

- [継続的なインポートの概要](./continuous-load-overview.md)
- [テーブル自動作成を使用した MySQL CDC](./continuous-load-mysql-database.md)
- [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md)
