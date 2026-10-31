---
{
    "title": "PostgreSQL CDC による自動テーブル作成同期",
    "language": "ja",
    "sidebar_label": "自動テーブル作成同期",
    "description": "Streaming Job を使用して PostgreSQL データベース全体の完全データと増分データを Doris に継続的に同期し、初回同期時にテーブルを自動作成します。",
    "keywords": [
        "PostgreSQL 同期",
        "PostgreSQL CDC",
        "自動テーブル作成同期",
        "データベース全体の同期",
        "Streaming Job",
        "Flink CDC",
        "Doris データ取り込み",
        "PostgreSQL to Doris",
        "完全同期と増分同期",
        "テーブル自動作成"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: Continuously sync an entire PostgreSQL database to Doris -->

自動テーブル作成同期は、ネイティブの `FROM POSTGRES (...) TO DATABASE (...)` DDL によって実装されます。**ターゲットは Doris のデータベースコンテナであり、Doris が下流テーブルを自動作成します。** `include_tables` を使用して、単一のテーブル、複数のテーブル、またはすべてのテーブルを同期するかどうかを制御できます。初回同期では、Doris が下流の主キーテーブルを自動的に作成し、その主キーを上流と一致させます。この方法は、データに対する SQL 処理が不要で、下流テーブルのスキーマを上流に自動的に追従させる必要があるミラーレプリケーションのシナリオに適しています。

[Flink CDC](https://github.com/apache/flink-cdc) の機能を統合することで、Doris は PostgreSQL から変更ログを読み取り、テーブル群の完全データ + 増分データを Stream Load 経由で Doris に継続的に書き込みます。同期中に列マッピング、フィルタリング、データ変換を実行する必要がある場合は、[SQL マッピングを使用した PostgreSQL CDC](./continuous-load-postgresql-table.md) を参照してください。

### ユースケース {#use-cases}

-   PostgreSQL データベース全体または複数のテーブルを Doris にミラーレプリケーションする
-   手動でテーブルを作成せず、下流テーブルのスキーマを上流と一致させる
-   同期パイプラインで列の絞り込み、フィルタリング、変換が不要
-   完全な初期化と増分変更の継続的なキャプチャの両方が必要

### 注記 {#notes}

1.  現在保証されるのは at-least-once セマンティクスのみです。
2.  現在サポートされるのは主キーテーブルの同期のみです。
3.  Load 権限が必要です。下流テーブルが存在しない場合は、Create 権限も必要です。
4.  テーブルの自動作成中にターゲットテーブルが既に存在する場合はスキップされるため、ユーザーはシナリオごとにテーブルをカスタマイズできます。

## クイックスタート {#quick-start}

<!-- Knowledge type: Operating procedure -->

以下の手順で PostgreSQL 自動テーブル作成同期ジョブを作成し、ステータスを確認します。

### ステップ 1: ロードジョブを作成する {#step-1-create-a-load-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して、継続的なロードジョブを作成します。

```sql
CREATE JOB test_postgres_job
ON STREAMING
FROM POSTGRES (
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "database" = "postgres",
    "schema" = "public",
    "include_tables" = "test_tbls",
    "offset" = "latest"
)
TO DATABASE target_test_db (
  "table.create.properties.replication_num" = "1"  -- Set to 1 for single-BE deployments
)
```

### ステップ 2: ロードステータスを確認する {#step-2-check-load-status}

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

一時停止、再開、削除、タスクの表示など、より一般的な操作については、[継続ロードの概要](./continuous-load-overview.md) を参照してください。

## パラメーターリファレンス {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

### ソースパラメーター（PostgreSQL 側） {#source-parameters-postgresql-side}

PostgreSQL ソースパラメーターでは、JDBC 接続、同期範囲、完全スナップショットの分割動作を設定します。

| パラメーター         | デフォルト | 説明                                                                                                                                                                        |
| -------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| jdbc_url             | -         | PostgreSQL JDBC 接続文字列                                                                                                                                                  |
| driver_url           | -         | JDBC ドライバー jar へのパス。ファイル名、ローカル絶対パス、HTTP URL をサポートします。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください |
| driver_class         | -         | JDBC ドライバークラス名                                                                                                                                                     |
| user                 | -         | データベースユーザー名                                                                                                                                                      |
| password             | -         | データベースパスワード                                                                                                                                                      |
| database             | -         | データベース名                                                                                                                                                              |
| schema               | -         | スキーマ名                                                                                                                                                                  |
| include_tables       | -         | 同期するテーブル。カンマ区切りで指定します。空の場合はデフォルトですべてのテーブルを同期します                                                                         |
| offset               | latest    | latest: 増分のみの同期、initial: 完全 + 増分同期                                                                                                                           |
| snapshot_split_size  | 40960 (8096 before 4.1.4) | 分割のサイズ（行数）。完全同期中、テーブルは同期のために複数の分割に分割されます                                                                          |
| snapshot_parallelism | 1         | 完全同期フェーズでの並列度、つまり 1 つの Task でスケジュールされる分割の最大数                                                                                           |

### Doris ターゲットデータベースのパラメーター {#doris-target-database-parameters}

ターゲット側のパラメーターでは、自動作成されるテーブルのプロパティと Stream Load の書き込み戦略を制御します。

| パラメーター             | デフォルト | 説明                                                                                                                                                                                                                                                                              |
| ------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| table.create.properties.* | -         | テーブル作成時にテーブルのプロパティ（replication_num など）を指定できます                                                                                                                                                                                                       |
| load.strict_mode          | -         | 厳密モードを有効にするかどうか。デフォルトでは無効です                                                                                                                                                                                                                           |
| load.max_filter_ratio     | -         | サンプリングウィンドウ内で許可される最大フィルター率。値は 0 以上 1 以下である必要があります。デフォルト値は 0 で、許容度がゼロであることを示します。サンプリングウィンドウは max_interval * 10 です。サンプリングウィンドウ内でエラー行数と総行数の比率が max_filter_ratio を超えると、定期ジョブが一時停止され、データ品質の問題を確認するために手動介入が必要になります。 |

## リファレンス {#reference}

<!-- Knowledge type: Syntax reference -->

### ロードコマンドの構文 {#load-command-syntax}

自動テーブル作成同期ジョブを作成する構文は次のとおりです。

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
[ COMMENT <comment> ]
FROM POSTGRES (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
)
```

各モジュールについて以下で説明します。

| モジュール         | 説明                                            |
| ----------------- | ----------------------------------------------- |
| job_name          | ジョブ名                                        |
| job_properties    | Job の一般的なロードパラメーターを指定するために使用 |
| comment           | コメント情報で Job を説明するために使用        |
| source_properties | PostgreSQL ソース関連パラメーター               |
| target_properties | Doris ターゲットデータベース関連パラメーター    |

## よくある質問 {#faq}

<!-- Knowledge type: Frequently asked questions -->

**Q1: 自動テーブル作成同期と SQL マッピング同期はどのように選択しますか？**

-   ミラーレプリケーション、自動テーブル作成、列の絞り込みや変換が不要な場合は、自動テーブル作成同期を使用します。
-   同期パイプラインで列マッピング、フィルタリング、データ変換が必要な場合は、[SQL マッピングを使用した PostgreSQL CDC](./continuous-load-postgresql-table.md) を使用します。

**Q2: 非主キーテーブルはサポートされていますか？**

現在サポートされるのは主キーテーブルの同期のみです。非主キーテーブルは現時点ではサポートされていません。

**Q3: 単一 BE デプロイメントでテーブル作成に失敗した場合はどうすればよいですか？**

デフォルトのレプリカ数と利用可能な BE 数の不一致を避けるため、`"table.create.properties.replication_num" = "1"` を `TO DATABASE` 句で明示的に設定する必要があります。

**Q4: ターゲットテーブルが既に存在する場合、上書きされますか？**

いいえ。テーブルの自動作成フェーズでは、既に存在するターゲットテーブルはスキップされます。必要に応じて、事前にテーブルスキーマをカスタマイズできます。

**Q5: 増分データのみを同期して、完全同期フェーズをスキップするにはどうすればよいですか？**

`offset` を `latest` に設定します。ジョブは最新の増分変更のみを消費し、完全な初期化は実行しなくなります。

## 関連ドキュメント {#related-docs}

-   [SQL マッピングを使用した PostgreSQL CDC](./continuous-load-postgresql-table.md)
-   [継続ロードの概要](./continuous-load-overview.md)
-   [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
-   [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
