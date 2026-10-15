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

SQL マッピング同期は、Job と [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) を使用して実現します。同期先は既存の Doris テーブルです（`INSERT INTO tbl SELECT * FROM cdc_stream(...)`）。Doris SQL を使用すると、列マッピング、フィルタリング、データ変換を行いながら、exactly-once セマンティクスを保証できます。この方法は、書き込み前にデータを処理する必要があるリアルタイム同期に適しています。

Doris は [Flink CDC](https://github.com/apache/flink-cdc) の読み取り機能を統合し、PostgreSQL の変更ログ（WAL）を読み取って、同期元テーブルから同期先テーブルへの全量同期と増分同期を行います。Doris に同期先テーブルを自動作成させ、データベース単位で複数のテーブルを同期したい場合は、[テーブル自動作成を伴う PostgreSQL CDC](./continuous-load-postgresql-database.md) を参照してください。

### ユースケース

-   単一のテーブルをリアルタイムでウェアハウスに取り込み、書き込み前に列の絞り込み、フィルタリング、または式による変換が必要な場合。
-   Doris の同期先テーブルがすでに存在し、SQL でフィールドのマッピングを明示的に制御したい場合。
-   exactly-once セマンティクスを必要とする、高い一貫性要件がある場合。

### 前提条件

ジョブを作成する前に、次の事項を確認してください。

1. PostgreSQL 側で論理レプリケーションが有効になっていること。詳細は[設定ガイド](./continuous-load-overview.md)を参照してください。
2. 現在のユーザーに `Load` 権限があること。
3. 同期元テーブルが主キーテーブルであること（現在、同期できるのは主キーテーブルのみです）。
4. 同期先テーブルが Doris に事前に作成されており、そのスキーマがマッピング SQL と互換性があること。

### 注意事項

-   exactly-once セマンティクスをサポートします。
-   現在、同期できるのは主キーテーブルのみです。
-   `Load` 権限が必要です。
-   PostgreSQL 側で論理レプリケーションを有効にする必要があります。[設定ガイド](./continuous-load-overview.md)を参照してください。

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

| パラメーター | デフォルト | 説明 |
| --- | --- | --- |
| type | - | データソースの種類。`postgres` を指定します。 |
| jdbc_url | - | PostgreSQL の JDBC 接続文字列。 |
| driver_url | - | JDBC ドライバーの jar ファイルのパス。ファイル名、ローカルの絶対パス、または HTTP URL を指定できます。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)を参照してください。 |
| driver_class | - | JDBC ドライバーのクラス名。 |
| user | - | データベースのユーザー名。 |
| password | - | データベースのパスワード。 |
| database | - | データベース名。 |
| schema | - | スキーマ名。 |
| table | - | 同期するテーブルの名前。 |
| offset | latest | `latest`: 増分同期のみ。`initial`: 全量同期と増分同期。 |
| snapshot_split_size | 40960（4.1.4 より前は 8096） | 分割サイズ（行数）。全量同期時には、テーブルを複数の分割単位に分けて同期します。 |
| snapshot_parallelism | 1 | 全量同期フェーズの並列度。Task ごとにスケジュールされる分割単位の最大数です。 |

### ロード設定パラメーター

ロード設定パラメーターは、ジョブの `job_properties` で設定します。ロード動作とセッション変数を制御します。

| パラメーター | デフォルト | 説明 |
| --- | --- | --- |
| session.* | なし | すべてのセッション変数を `job_properties` で設定できます。ロード関連の変数については、[Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters)を参照してください。 |

その他の一般的なパラメーター（`max_interval` など）については、[継続的なロードの概要の「共通パラメーター」](./continuous-load-overview.md#common-parameters)を参照してください。
