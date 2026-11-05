---
{
    "title": "SQL マッピングを使用した PostgreSQL CDC",
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

Doris の継続データロードは実験的機能であり、Doris 4.1.5 以降でサポートされています。

:::

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: PostgreSQL real-time data sync / single-table CDC ingestion with SQL mapping -->

SQL マッピング同期は、Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) を介して実装されます。ターゲットは既存の Doris テーブルです（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`）。Doris SQL の表現力により、列マッピング、フィルタリング、データ変換をサポートしながら、exactly-once セマンティクスを保証します。この方法は、書き込み前にデータを処理する必要があるリアルタイム同期シナリオに適しています。

[Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合することで、Doris は PostgreSQL から変更ログ（WAL）を読み取り、ソーステーブルからターゲットテーブルへの全量 + 増分同期を実行します。Doris に下流テーブルを自動作成させ、データベース単位でテーブル群を同期したい場合は、[PostgreSQL CDC による自動テーブル作成](./continuous-load-postgresql-database.md)を参照してください。

### ユースケース {#use-cases}

-   単一テーブルをリアルタイムでウェアハウスに取り込み、書き込み前に列の削除、フィルタリング、または式による変換が必要な場合。
-   下流の Doris テーブルがすでに存在し、SQL でフィールドマッピングを明示的に制御したい場合。
-   高い整合性が求められ、exactly-once セマンティクスが必要な場合。

### 前提条件 {#prerequisites}

ジョブを作成する前に、次の条件を確認してください。

1. PostgreSQL 側で論理レプリケーションが有効になっていること。詳細は [構成ガイド](./continuous-load-overview.md) を参照してください。
2. 現在のユーザーに `Load` 権限があること。
3. ソーステーブルが主キーテーブルであること（現在、同期でサポートされるのは主キーテーブルのみです）。
4. ターゲットテーブルがあらかじめ Doris に作成され、そのスキーマがマッピング SQL と互換性があること。

### 注意事項 {#notes}

-   exactly-once セマンティクスがサポートされます。
-   現在、主キーテーブルの同期のみがサポートされています。
-   `Load` 権限が必要です。
-   PostgreSQL 側で論理レプリケーションを有効にする必要があります。詳細は [構成ガイド](./continuous-load-overview.md) を参照してください。

## クイックスタート {#quick-start}

全体のワークフローは、継続データロードジョブの作成とジョブのステータス確認という 2 つのステップで構成されます。

### ステップ 1: ロードジョブの作成 {#step-1-create-the-load-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して、PostgreSQL の `public.source_table` を Doris の `db1.tbl1` に同期する継続データロードジョブを作成します。

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

### ステップ 2: ロードステータスの確認 {#step-2-check-the-load-status}

`jobs` テーブル関数を使用して、Streaming タイプのジョブの実行ステータスを確認します。

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

その他の一般的な操作（一時停止、再開、削除、タスクの表示など）については、[継続データロードの概要](./continuous-load-overview.md)を参照してください。

## パラメータリファレンス {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

### データソースパラメータ {#data-source-parameters}

データソースパラメータは `cdc_stream(...)` TVF を介して設定します。同期する PostgreSQL テーブルと読み取り動作を指定します。

| パラメータ           | デフォルト | 説明                                                                                                                                                                  |
| -------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type                 | -          | データソースの種類。`postgres` に設定します。                                                                                                                        |
| jdbc_url             | -          | PostgreSQL JDBC 接続文字列。                                                                                                                                         |
| driver_url           | -          | JDBC ドライバー jar のパス。ファイル名、ローカルの絶対パス、または HTTP URL を使用できます。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください。 |
| driver_class         | -          | JDBC ドライバークラス名。                                                                                                                                             |
| user                 | -          | データベースユーザー名。                                                                                                                                              |
| password             | -          | データベースパスワード。                                                                                                                                              |
| database             | -          | データベース名。                                                                                                                                                      |
| schema               | -          | スキーマ名。                                                                                                                                                          |
| table                | -          | 同期するテーブルの名前。                                                                                                                                              |
| offset               | latest     | `latest`: 増分同期のみ。`initial`: 全量 + 増分同期。                                                                                                                  |
| snapshot_split_size  | 40960      | split のサイズ（行数）。全量同期中、テーブルは複数の split に分割されて同期されます。                                                                                |
| snapshot_parallelism | 1          | 全量同期ステージの並列度。つまり、1 つの Task でスケジュールされる split の最大数です。                                                                              |

### ロード構成パラメータ {#load-configuration-parameters}

ロード構成パラメータはジョブの `job_properties` を介して設定します。ロード動作とセッション変数を制御します。

| パラメータ | デフォルト | 説明                                                                                                                                                                       |
| ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| session.*  | なし       | すべてのセッション変数を `job_properties` で設定できます。ロード関連の変数については、[Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters) を参照してください。 |

その他の一般的なパラメータ（`max_interval` など）については、継続データロードの概要にある [共通パラメータ](./continuous-load-overview.md#common-parameters) セクションを参照してください。
