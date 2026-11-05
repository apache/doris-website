---
{
    "title": "SQL マッピングによる MySQL CDC",
    "language": "ja",
    "sidebar_label": "SQL マッピング同期",
    "description": "SQL マッピング（Job + CDC Stream TVF）を使用して MySQL の単一テーブルを Doris に継続的に同期し、列マッピングとデータ変換をサポートする方法。",
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

Doris の継続データロードは実験的機能であり、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenario: Real-time sync of a single MySQL table to Doris with column mapping or data transformation -->

SQL マッピング同期は Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) を通じて実装され、**既存の** Doris テーブルを対象とします（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`）。Doris SQL の表現力により、同期パイプラインで列マッピング、フィルタリング、データ変換を実行でき、exactly-once セマンティクスが保証されます。データ処理が必要なリアルタイム同期シナリオに適しています。

[Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合することで、Doris は MySQL から変更ログ（Binlog）を読み取り、ソーステーブルからターゲットテーブルへの**全量 + 増分**同期を完了します。Doris に下流テーブルを自動作成させ、データベース単位でテーブルのグループを同期する場合は、[MySQL CDC による自動テーブル作成同期](./continuous-load-mysql-database.md)を参照してください。

### 適用シナリオ {#applicable-scenarios}

- MySQL の単一テーブルを Doris に継続同期し、ターゲットテーブルのスキーマがすでに決まっている
- 同期中に列のプルーニング、列マッピング、フィールド名の変更、またはデータ変換が必要
- エンドツーエンドの exactly-once セマンティクスが必要なリアルタイムデータ統合

### 前提条件 {#prerequisites}

| 項目 | 説明 |
| ------ | ---- |
| Doris バージョン | 4.1.5 以上 |
| テーブルタイプ | 現在、ターゲットテーブルとしてサポートされるのは **主キーテーブル** のみ |
| ユーザー権限 | `Load` 権限が必要 |
| MySQL 構成 | MySQL 側で Binlog を有効にする必要があります。[構成ガイド](./continuous-load-overview.md)を参照してください |
| セマンティクスの保証 | exactly-once セマンティクスをサポート |

## クイックスタート {#quick-start}

以下の最小限の実行可能な例では、完全なフロー（Job の作成、続いてステータスの確認）を示します。

### 手順 1: インポートジョブの作成 {#step-1-create-the-import-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)を使用して継続インポートジョブを作成します：

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

### 手順 2: インポートステータスの確認 {#step-2-check-the-import-status}

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

### 手順 3: Job の操作 {#step-3-job-operations}

より一般的な操作（一時停止、再開、削除、タスクの表示など）については、[継続インポートの概要](./continuous-load-overview.md)を参照してください。

## パラメータリファレンス {#parameter-reference}

### データソースパラメータ {#data-source-parameters}

CDC Stream TVF でサポートされる MySQL データソースパラメータは次のとおりです：

| パラメータ             | デフォルト | 説明                                                                                                                                     |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| type                  | -       | データソースのタイプ。`mysql` に設定します                                                                                                                |
| jdbc_url              | -       | MySQL JDBC 接続文字列                                                                                                                    |
| driver_url            | -       | JDBC ドライバ jar のパス。ファイル名、ローカルの絶対パス、HTTP URL をサポートします。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)を参照してください |
| driver_class          | -       | JDBC ドライバクラス名                                                                                                                          |
| user                  | -       | データベースのユーザー名                                                                                                                               |
| password              | -       | データベースのパスワード                                                                                                                               |
| database              | -       | データベース名                                                                                                                                   |
| table                 | -       | 同期するテーブルの名前                                                                                                                       |
| offset                | latest  | `latest`：増分同期のみ。`initial`：全量 + 増分同期                                                                             |
| snapshot_split_size   | 40960    | split のサイズ（行数）。全量同期中、テーブルは同期用に複数の split に分割されます                                              |
| snapshot_parallelism  | 1       | 全量同期ステージでの並列度。つまり、Task ごとにスケジュールされる split の最大数                                                |

### インポート構成パラメータ {#import-configuration-parameters}

| パラメータ | デフォルト | 説明                                                                                                                                                                  |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| session.* | None    | すべての session 変数を `job_properties` で構成できます。インポート変数については [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters)を参照してください |

より一般的なパラメータ（`max_interval` など）については、[継続インポートの概要](./continuous-load-overview.md#common-parameters)を参照してください。

## よくある質問 {#faq}

**Q1: SQL マッピング同期と自動テーブル作成同期の違いは何ですか？**

- SQL マッピング同期：ターゲットの Doris テーブルを**事前に作成する必要があります**。列マッピングとデータ変換をサポートし、きめ細かな処理シナリオに適しています。
- 自動テーブル作成同期：Doris が下流テーブルを**自動作成**し、データベース単位で全体を同期します。詳細は [MySQL CDC による自動テーブル作成同期](./continuous-load-mysql-database.md)を参照してください。

**Q2: 非主キーテーブルをターゲットテーブルとしてサポートしていますか？**

現在、ターゲットテーブルとしてサポートされるのは**主キーテーブル**のみです。

**Q3: 履歴の全量データなしで増分データのみを同期するにはどうすればよいですか？**

`offset` パラメータを `latest` に設定します。Job は全量同期ステージをスキップし、Binlog の増分データのみを同期します。

**Q4: 全量同期が遅すぎる場合に最適化するにはどうすればよいですか？**

全量同期ステージのスループットを向上させるには、次のパラメータを調整できます：

- `snapshot_split_size`：一つの split あたりの行数を増やします。
- `snapshot_parallelism`：Task ごとにスケジュールされる split の並列度を上げます。

## 関連ドキュメント {#related-documents}

- [継続インポートの概要](./continuous-load-overview.md)
- [MySQL CDC による自動テーブル作成同期](./continuous-load-mysql-database.md)
- [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md)
