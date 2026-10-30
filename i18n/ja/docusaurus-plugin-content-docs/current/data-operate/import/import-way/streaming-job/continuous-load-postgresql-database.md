---
{
    "title": "PostgreSQL CDC による自動テーブル作成同期",
    "language": "ja",
    "sidebar_label": "自動テーブル作成同期",
    "description": "Doris Streaming Job で PostgreSQL テーブルを自動テーブル作成、フィルタリング、レプリケーションリソース、SSL、データ品質制御とともに同期する方法を説明します。",
    "keywords": [
        "PostgreSQL 同期",
        "PostgreSQL CDC",
        "自動テーブル作成同期",
        "データベース全体の同期",
        "Streaming Job",
        "Flink CDC",
        "Doris データロード",
        "PostgreSQL to Doris",
        "全量および増分同期",
        "自動テーブル作成"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: Continuously sync an entire PostgreSQL database to Doris -->

自動テーブル作成同期（Auto Table Creation Sync）は、ネイティブの `FROM POSTGRES (...) TO DATABASE (...)` DDL によって実装されます。ターゲットは Doris データベースで、Doris は上流テーブルのスキーマに基づいて対応する下流テーブルを自動的に作成します。`include_tables` を使用して、1 つのテーブル、複数のテーブル、またはすべてのテーブルを同期するかどうかを制御できます。初回同期時、Doris は下流の主キーテーブルを自動的に作成し、その主キーを上流と一致させます。この方式は、データに対する SQL 処理が不要で、下流テーブルのスキーマを上流に自動的に追従させたいミラー レプリケーションのシナリオに適しています。

[Flink CDC](https://github.com/apache/flink-cdc) の機能を統合することで、Doris は PostgreSQL から変更ログを読み取り、一連のテーブルの全量 + 増分データを Stream Load で継続的に Doris に書き込みます。自動テーブル作成同期では、個々のソーステーブルにターゲットテーブル名を割り当てたり、非キー列を除外したりできます。SQL 式、行フィルタリング、またはデータ変換が必要な場合は、[PostgreSQL CDC with SQL Mapping](./continuous-load-postgresql-table.md) を参照してください。

### ユースケース {#use-cases}

-   PostgreSQL データベース全体または複数のテーブルを Doris にミラー レプリケーションする
-   手動でテーブルを作成せず、下流テーブルのスキーマを上流と一致させる
-   SQL 式、行フィルタリング、データ変換を行わず、単純なターゲットテーブル名の変更または列の削減だけが必要
-   全量初期化と増分変更の継続的な取得の両方が必要

### 注意事項 {#notes}

1.  現在保証されるのは at-least-once セマンティクスのみです。
2.  主キーを持つ上流テーブルのみ同期できます。自動作成される下流テーブルは Unique Key モデルを使用します。
3.  Load 権限が必要です。下流テーブルが存在しない場合は、Create 権限も必要です。
4.  自動テーブル作成中にターゲットテーブルがすでに存在する場合はスキップされるため、ユーザーは異なるシナリオに合わせてテーブルをカスタマイズできます。

## クイックスタート {#quick-start}

<!-- Knowledge type: Operating procedure -->

以下の手順で PostgreSQL 自動テーブル作成同期ジョブを作成し、ステータスを確認します。

### ステップ 1：ロードジョブの作成 {#step-1-create-a-load-job}

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

### ステップ 2：ロードステータスの確認 {#step-2-check-load-status}

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

より一般的な操作（一時停止、再開、削除、タスクの表示など）については、[Continuous Load Overview](./continuous-load-overview.md) を参照してください。

## パラメータリファレンス {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

### ソースパラメータ（PostgreSQL 側） {#source-parameters-postgresql-side}

PostgreSQL ソースパラメータは、JDBC 接続、同期範囲、および全量スナップショットの分割動作を設定します。接続情報、ドライバー情報、`database`、`schema` は必須です。

| パラメータ | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `jdbc_url` | はい | - | PostgreSQL JDBC 接続文字列。 |
| `driver_url` | はい | - | JDBC ドライバー jar のパス。ファイル名、ローカルの絶対パス、または HTTP URL を指定できます。詳細は [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください。 |
| `driver_class` | はい | - | JDBC ドライバークラス名。例：`org.postgresql.Driver`。 |
| `user` | はい | - | データベースのユーザー名。 |
| `password` | はい | - | データベースのパスワード。 |
| `database` | はい | - | PostgreSQL データベース名。JDBC URL のデータベース名と一致している必要があり、UTF-8 エンコード後に 63 バイトを超えることはできません。 |
| `schema` | はい | - | スキーマ名。 |
| `include_tables` | いいえ | - | 同期するテーブル名。複数のテーブルはカンマで区切ります。設定しない場合は、Schema 内のすべてのテーブルが同期されます。 |
| `exclude_tables` | いいえ | - | 同期しないテーブル名。複数のテーブルはカンマで区切ります。このパラメータは `include_tables` が設定されていない場合にのみ有効です。 |
| `table.<table_name>.target_table` | いいえ | ソーステーブル名 | 4.1.0 以降でサポートされています。ソーステーブルの Doris ターゲットテーブル名を設定します。`<table_name>` はソーステーブル名です。 |
| `table.<table_name>.exclude_columns` | いいえ | - | 4.1.0 以降でサポートされています。同期しないソース列を指定します。複数の列はカンマで区切ります。列は存在している必要があり、主キー列を含めることはできません。 |
| `offset` | いいえ | `latest` | 起動オフセット。`initial`：全量および増分同期、`latest`：ジョブ開始後の変更のみを同期します。`{"lsn":"12345678"}` のような正確な JSON オフセットも指定できます。4.1.0 以降では、全量同期のみを行う `snapshot` もサポートされています。PostgreSQL は `earliest` をサポートしていません。 |
| `snapshot_split_size` | いいえ | `40960`（4.1.4 より前は `8096`） | 行数で指定する分割サイズ。全量同期中、テーブルは複数の分割に分割されます。正の整数である必要があります。 |
| `snapshot_parallelism` | いいえ | `1` | 全量同期フェーズの並列度。つまり、1 回に Task がスケジュールできる分割の最大数です。正の整数である必要があります。 |
| `slot_name` | いいえ | `doris_cdc_<job_id>` | 4.1.0 以降でサポートされています。論理レプリケーションスロット名。名前には小文字、数字、アンダースコアのみを使用でき、数字で始めることはできず、長さは 63 文字に制限されます。カスタムスロットは事前に作成する必要があり、Doris によって削除されません。 |
| `publication_name` | いいえ | `doris_pub_<job_id>` | 4.1.0 以降でサポートされています。パブリケーション名。命名規則は `slot_name` と同じです。カスタムパブリケーションは事前に作成し、同期するすべてのテーブルを含める必要があり、Doris によって削除されません。 |
| `ssl_mode` | いいえ | `disable` | 4.1.0 以降でサポートされています。SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | 条件付きで必須 | - | 4.1.0 以降でサポートされています。`FILE:<file_name>` 形式の CA 証明書ファイル。`ssl_mode` が `verify-ca` の場合に必要です。まず [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) を使用してファイルをアップロードしてください。 |

`include_tables` と `exclude_tables` の両方を設定した場合は、`include_tables` が優先されます。次の `FROM POSTGRES` パラメータ断片は、`orders` と `customers` を同期し、`orders` を `ods_orders` に書き込み、非キー列 `internal_note` を除外するとともに、事前に作成した論理レプリケーションリソースと CA 検証を使用します。

```sql
"include_tables" = "orders,customers",
"table.orders.target_table" = "ods_orders",
"table.orders.exclude_columns" = "internal_note",
"slot_name" = "orders_slot",
"publication_name" = "orders_publication",
"ssl_mode" = "verify-ca",
"ssl_rootcert" = "FILE:ca.pem"
```

カスタムレプリケーションスロットとパブリケーションはユーザーが管理し、Streaming Job を削除しても保持されます。`slot_name` または `publication_name` を省略した場合、Doris はジョブ用に対応するリソースを作成し、ジョブの削除時に自ら作成したリソースをクリーンアップします。

### Doris ターゲットデータベースパラメータ {#doris-target-database-parameters}

ターゲット側のパラメータは、自動作成されるテーブルのプロパティと Stream Load の書き込み戦略を制御します。以下のパラメータはすべて任意です。

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris がテーブルを作成するときに追加するテーブルプロパティ。例：`table.create.properties.replication_num`。 |
| `load.strict_mode` | `false` | Stream Load の書き込みで strict モードを有効にするかどうか。有効な値は `true` と `false` です。 |
| `load.max_filter_ratio` | `0` | サンプリングウィンドウで許可される最大フィルタリング率。範囲は `[0, 1]` です。`0` はエラー行をフィルタリングできないことを意味します。サンプリングウィンドウは `max_interval * 10` 秒です。ウィンドウ内のエラー行数と総行数の比率がこの値を超えると、ジョブは一時停止されます。 |

## リファレンス {#reference}

<!-- Knowledge type: Syntax reference -->

### ロードコマンド構文 {#load-command-syntax}

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

各モジュールについて、以下で説明します。

| モジュール | 説明 |
| ----------------- | ----------------------------- |
| job_name | ジョブ名 |
| job_properties | ジョブの一般的なロードパラメータを指定するために使用 |
| comment | コメント情報でジョブを説明するために使用 |
| source_properties | PostgreSQL ソース関連のパラメータ |
| target_properties | Doris ターゲットデータベース関連のパラメータ |

`job_properties` は `max_interval` と `compute_group` をサポートします。詳細は [Common Job Load Configuration Parameters](./continuous-load-overview.md#job-common-load-configuration-parameters) を参照してください。自動テーブル作成モードでは `session.*` は使用しません。

## FAQ {#faq}

<!-- Knowledge type: Frequently asked questions -->

**Q1：自動テーブル作成同期と SQL Mapping Sync はどのように選択すればよいですか？**

-   ミラー レプリケーション、自動テーブル作成、またはターゲットテーブル名の変更と非キー列の除外だけが必要な場合は、自動テーブル作成同期を使用します。
-   同期パイプラインで SQL 式、行フィルタリング、またはデータ変換が必要な場合は、[PostgreSQL CDC with SQL Mapping](./continuous-load-postgresql-table.md) を使用します。

**Q2：主キーを持たないテーブルはサポートされていますか？**

現在サポートされているのは主キーテーブルの同期のみです。主キーを持たないテーブルは現時点ではサポートされていません。

**Q3：単一 BE のデプロイでテーブル作成に失敗した場合はどうすればよいですか？**

デフォルトのレプリカ数と使用可能な BE の数の不一致を避けるため、`"table.create.properties.replication_num" = "1"` を `TO DATABASE` 句に明示的に設定する必要があります。

**Q4：ターゲットテーブルがすでに存在する場合、上書きされますか？**

いいえ。自動テーブル作成フェーズでは、すでに存在するターゲットテーブルをスキップします。必要に応じて、事前にテーブルスキーマをカスタマイズできます。

**Q5：増分データのみを同期し、全量同期フェーズをスキップするにはどうすればよいですか？**

`offset` を `latest` に設定します。ジョブは最新の増分変更だけを消費し、全量初期化は実行しなくなります。

## 関連ドキュメント {#related-docs}

-   [PostgreSQL CDC with SQL Mapping](./continuous-load-postgresql-table.md)
-   [Continuous Load Overview](./continuous-load-overview.md)
-   [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
-   [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
