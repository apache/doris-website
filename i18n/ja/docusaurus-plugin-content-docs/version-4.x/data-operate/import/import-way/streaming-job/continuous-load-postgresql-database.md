---
{
    "title": "テーブル自動作成を伴う PostgreSQL CDC",
    "language": "ja",
    "sidebar_label": "テーブル自動作成同期",
    "description": "Streaming Job を使用して、PostgreSQL データベース全体の全量データと増分データを Doris に継続的に同期し、初回同期時にテーブルを自動作成します。",
    "keywords": [
        "PostgreSQL の同期",
        "PostgreSQL CDC",
        "テーブル自動作成同期",
        "データベース全体の同期",
        "Streaming Job",
        "Flink CDC",
        "Doris へのデータ取り込み",
        "PostgreSQL から Doris へ",
        "全量・増分同期",
        "テーブルの自動作成"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: Continuously sync an entire PostgreSQL database to Doris -->

テーブル自動作成同期は、ネイティブの `FROM POSTGRES (...) TO DATABASE (...)` DDL で実装します。**同期先は Doris のデータベースであり、Doris が同期先テーブルを自動作成します。** `include_tables` を使用すると、一つのテーブル、複数のテーブル、またはすべてのテーブルを同期対象に指定できます。初回の同期時に、Doris は同期先の主キーテーブルを自動作成し、その主キーを同期元と一致させます。この方法は、データに対する SQL 処理が不要で、同期先のテーブルスキーマを同期元に自動追従させたいミラーリングに適しています。

Doris は [Flink CDC](https://github.com/apache/flink-cdc) の機能を利用して PostgreSQL の変更ログを読み取り、Stream Load を通じて複数のテーブルの全量データと増分データを継続的に書き込みます。同期中に列のマッピング、フィルタリング、またはデータ変換が必要な場合は、[SQL マッピングを使用した PostgreSQL CDC](./continuous-load-postgresql-table.md) を参照してください。

### ユースケース

-   PostgreSQL データベース全体または複数のテーブルを Doris にミラーリングする
-   テーブルを手動で作成せずに、同期先のテーブルスキーマを同期元と一致させる
-   同期処理で列の除外、フィルタリング、変換が不要である
-   初回の全量同期と、その後の増分変更の継続的な取得が必要である

### 注意事項

1.  現時点では、少なくとも一度（at-least-once）のセマンティクスのみが保証されます。
2.  現時点では、主キーテーブルの同期のみをサポートします。
3.  Load 権限が必要です。同期先のテーブルが存在しない場合は、Create 権限も必要です。
4.  テーブルの自動作成時に同期先のテーブルがすでに存在する場合、その作成はスキップされます。そのため、用途に応じてテーブルをカスタマイズできます。

## クイックスタート

<!-- Knowledge type: Operating procedure -->

以下の手順で PostgreSQL のテーブル自動作成同期ジョブを作成し、状態を確認します。

### ステップ 1：ロードジョブを作成する

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して継続的なロードジョブを作成します。

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

### ステップ 2：ロードの状態を確認する

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

一時停止、再開、削除、タスクの表示など、一般的な操作については、[継続的なロードの概要](./continuous-load-overview.md) を参照してください。

## パラメータ一覧

<!-- Knowledge type: Configuration parameters -->

### 同期元のパラメータ（PostgreSQL 側）

PostgreSQL 側のパラメータでは、JDBC 接続、同期対象、および全量スナップショットの分割方法を設定します。

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| jdbc_url | - | PostgreSQL の JDBC 接続文字列 |
| driver_url | - | JDBC ドライバーの JAR ファイルのパス。ファイル名、ローカルの絶対パス、HTTP URL を指定できます。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください。 |
| driver_class | - | JDBC ドライバーのクラス名 |
| user | - | データベースのユーザー名 |
| password | - | データベースのパスワード |
| database | - | データベース名 |
| schema | - | スキーマ名 |
| include_tables | - | 同期するテーブルをカンマ区切りで指定します。空の場合、デフォルトですべてのテーブルを同期します。 |
| offset | latest | latest：増分データのみを同期します。initial：全量データと増分データを同期します。 |
| snapshot_split_size | 40960 (8096 は 4.1.4 より前のデフォルト値) | 分割サイズ（行数）。全量同期時にテーブルを複数に分割して同期します。 |
| snapshot_parallelism | 1 | 全量同期フェーズの並列度。単一のタスク内でスケジュールされる分割の最大数です。 |

### Doris 同期先データベースのパラメータ

同期先のパラメータでは、自動作成するテーブルのプロパティと Stream Load の書き込み方法を制御します。

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| table.create.properties.* | - | テーブル作成時に replication_num などのテーブルプロパティを指定できます。 |
| load.strict_mode | - | 厳格モードを有効にするかどうかを指定します。デフォルトでは無効です。 |
| load.max_filter_ratio | - | サンプリング期間内に許容される最大のフィルタリング率です。値は 0 以上 1 以下で指定します。デフォルト値は 0 で、エラー行は許容されません。サンプリング期間は max_interval * 10 です。期間内のエラー行数と全行数の比率が max_filter_ratio を超えると、ルーチンジョブは一時停止し、データ品質の問題を手動で確認する必要があります。 |

## リファレンス

<!-- Knowledge type: Syntax reference -->

### ロードコマンドの構文

テーブル自動作成同期ジョブを作成する構文は次のとおりです。

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

各要素の説明は次のとおりです。

| 要素 | 説明 |
| --- | --- |
| job_name | ジョブ名 |
| job_properties | ジョブの一般的なロードパラメータを指定します。 |
| comment | ジョブを説明するコメントを指定します。 |
| source_properties | PostgreSQL の同期元に関するパラメータを指定します。 |
| target_properties | Doris の同期先データベースに関するパラメータを指定します。 |

## よくある質問

<!-- Knowledge type: Frequently asked questions -->

**Q1：テーブル自動作成同期と SQL マッピング同期はどのように使い分けますか？**

-   ミラーリングとテーブルの自動作成が必要で、列の除外や変換が不要な場合は、テーブル自動作成同期を使用します。
-   同期中に列のマッピング、フィルタリング、またはデータ変換が必要な場合は、[SQL マッピングを使用した PostgreSQL CDC](./continuous-load-postgresql-table.md) を使用します。

**Q2：主キーのないテーブルをサポートしていますか？**

現時点では、主キーテーブルの同期のみをサポートします。主キーのないテーブルはサポートしていません。

**Q3：単一 BE 構成でテーブルの作成に失敗した場合は、どうすればよいですか？**

デフォルトのレプリカ数と利用可能な BE の台数が一致しないことを防ぐため、`"table.create.properties.replication_num" = "1"` を `TO DATABASE` 句で明示的に指定します。

**Q4：同期先のテーブルがすでに存在する場合、上書きされますか？**

いいえ。テーブルの自動作成フェーズでは、すでに存在する同期先のテーブルをスキップします。必要に応じて、あらかじめテーブルスキーマをカスタマイズできます。

**Q5：全量同期フェーズを省略し、増分データのみを同期するにはどうすればよいですか？**

`offset` に `latest` を指定します。ジョブは最新の増分変更のみを取り込み、全量データによる初期化は行いません。

## 関連ドキュメント

-   [SQL マッピングを使用した PostgreSQL CDC](./continuous-load-postgresql-table.md)
-   [継続的なロードの概要](./continuous-load-overview.md)
-   [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
-   [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
