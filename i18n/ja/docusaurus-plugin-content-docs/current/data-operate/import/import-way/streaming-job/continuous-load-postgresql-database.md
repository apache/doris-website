---
{
    "title": "テーブル自動作成を使用する PostgreSQL CDC",
    "language": "ja",
    "sidebar_label": "テーブル自動作成同期",
    "description": "Doris のストリーミングジョブで、テーブルの自動作成、フィルタリング、レプリケーションリソース、SSL、データ品質の制御を使用して PostgreSQL のテーブルを同期する方法を説明します。",
    "keywords": [
        "PostgreSQL 同期",
        "PostgreSQL CDC",
        "テーブル自動作成同期",
        "データベース全体の同期",
        "ストリーミングジョブ",
        "Flink CDC",
        "Doris データ取り込み",
        "PostgreSQL から Doris への同期",
        "全量同期と増分同期",
        "テーブルの自動作成"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: Continuously sync an entire PostgreSQL database to Doris -->

テーブル自動作成同期は、ネイティブの `FROM POSTGRES (...) TO DATABASE (...)` DDL で実行します。同期先は Doris のデータベースであり、Doris は同期元のテーブルスキーマに基づいて対応する同期先テーブルを自動的に作成します。`include_tables` を使うと、単一のテーブル、複数のテーブル、またはすべてのテーブルを同期するか指定できます。初回の同期時に、Doris は同期先に主キーテーブルを自動作成し、その主キーを同期元と一致させます。この方法は、データに対する SQL 処理が不要で、同期先のテーブルスキーマを同期元に自動的に追従させたいミラーレプリケーションに適しています。

Doris は [Flink CDC](https://github.com/apache/flink-cdc) の機能を統合し、PostgreSQL の変更ログを読み取って、テーブル群の全量データと増分データを Stream Load で継続的に Doris に書き込みます。テーブル自動作成同期では、個別の同期元テーブルに同期先テーブル名を指定したり、主キー以外のカラムを除外したりできます。SQL 式、行のフィルタリング、データ変換が必要な場合は、[SQL マッピングを使用する PostgreSQL CDC](./continuous-load-postgresql-table.md) を参照してください。

### ユースケース

-   PostgreSQL データベース全体または複数のテーブルを Doris にミラーレプリケーションする
-   手動でテーブルを作成せずに、同期先のテーブルスキーマを同期元と一致させる
-   SQL 式、行のフィルタリング、データ変換は不要で、同期先テーブルの単純な名前変更やカラムの除外だけが必要な場合
-   初回の全量同期と、その後の増分変更の継続的な取り込みが必要な場合

### 注意事項

1.  現時点では少なくとも一回の処理（at-least-once）セマンティクスのみが保証されます。
2.  同期できるのは主キーを持つ同期元テーブルだけです。自動作成される同期先テーブルには Unique Key モデルが使用されます。
3.  Load 権限が必要です。同期先テーブルが存在しない場合は、Create 権限も必要です。
4.  テーブルの自動作成時に同期先テーブルがすでに存在する場合、作成はスキップされます。そのため、用途に応じてテーブルをカスタマイズできます。

## クイックスタート

<!-- Knowledge type: Operating procedure -->

次の手順で PostgreSQL のテーブル自動作成同期ジョブを作成し、状態を確認します。

### ステップ 1: ロードジョブを作成する

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して継続ロードジョブを作成します。

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

### ステップ 2: ロード状態を確認する

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

一時停止、再開、削除、タスクの表示など、一般的な操作については[継続ロードの概要](./continuous-load-overview.md)を参照してください。

## パラメータリファレンス

<!-- Knowledge type: Configuration parameters -->

### 同期元のパラメータ（PostgreSQL 側）

PostgreSQL の同期元パラメータでは、JDBC 接続、同期対象、および全量スナップショットの分割方法を設定します。接続情報、ドライバー情報、`database`、`schema` は必須です。

| パラメータ | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `jdbc_url` | はい | - | PostgreSQL の JDBC 接続文字列。 |
| `driver_url` | はい | - | JDBC ドライバーの jar ファイルへのパス。ファイル名、ローカルの絶対パス、HTTP URL を指定できます。詳しくは [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)を参照してください。 |
| `driver_class` | はい | - | JDBC ドライバーのクラス名。例: `org.postgresql.Driver`。 |
| `user` | はい | - | データベースのユーザー名。 |
| `password` | はい | - | データベースのパスワード。 |
| `database` | はい | - | PostgreSQL のデータベース名。JDBC URL 内のデータベース名と一致する必要があり、63 バイトを超えてはなりません（UTF-8 エンコード後）。 |
| `schema` | はい | - | スキーマ名。 |
| `include_tables` | いいえ | - | 同期するテーブルの名前をカンマで区切って指定します。未設定の場合、スキーマ内のすべてのテーブルが同期されます。 |
| `exclude_tables` | いいえ | - | 同期対象から除外するテーブルの名前をカンマで区切って指定します。`include_tables` が未設定の場合のみ有効です。 |
| `table.<table_name>.target_table` | いいえ | 同期元テーブル名 | バージョン 4.1.0 以降でサポートされます。同期元テーブルの Doris 側の同期先テーブル名を設定します。`<table_name>` は同期元テーブル名です。 |
| `table.<table_name>.exclude_columns` | いいえ | - | バージョン 4.1.0 以降でサポートされます。同期対象から除外する同期元カラムをカンマで区切って指定します。カラムは存在する必要があり、主キーカラムは指定できません。 |
| `offset` | いいえ | `latest` | 開始オフセット。`initial` は全量同期と増分同期、`latest` はジョブ開始後の変更のみを同期します。`{"lsn":"12345678"}` のように、正確な JSON オフセットも指定できます。バージョン 4.1.0 以降では、全量同期のみを行う `snapshot` もサポートされます。PostgreSQL では `earliest` はサポートされません。 |
| `snapshot_split_size` | いいえ | `40960`（`8096` は 4.1.4 より前のデフォルト値） | 分割あたりの行数。全量同期時に、テーブルは複数の分割に分けられます。正の整数を指定する必要があります。 |
| `snapshot_parallelism` | いいえ | `1` | 全量同期フェーズの並列度。Task が一度にスケジュールする分割の最大数です。正の整数を指定する必要があります。 |
| `slot_name` | いいえ | `doris_cdc_<job_id>` | バージョン 4.1.0 以降でサポートされます。論理レプリケーションスロット名。小文字の英字、数字、アンダースコアのみを使用でき、先頭に数字は使用できません。最大 63 文字です。カスタムスロットは事前に作成する必要があり、Doris によって削除されません。 |
| `publication_name` | いいえ | `doris_pub_<job_id>` | バージョン 4.1.0 以降でサポートされます。パブリケーション名。命名規則は `slot_name` と同じです。カスタムパブリケーションは事前に作成し、同期対象のすべてのテーブルを含める必要があります。Doris によって削除されません。 |
| `ssl_mode` | いいえ | `disable` | バージョン 4.1.0 以降でサポートされます。SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | 条件付きで必須 | - | バージョン 4.1.0 以降でサポートされます。`FILE:<file_name>` 形式の CA 証明書ファイル。`ssl_mode` が `verify-ca` の場合は必須です。先に [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) を使用してファイルをアップロードしてください。 |

`include_tables` と `exclude_tables` の両方を設定した場合は、`include_tables` が優先されます。次の `FROM POSTGRES` パラメータの例では、`orders` と `customers` を同期し、`orders` を `ods_orders` に書き込み、主キー以外の `internal_note` カラムを除外します。また、事前に作成した論理レプリケーションリソースと CA 証明書による検証を使用します。

```sql
"include_tables" = "orders,customers",
"table.orders.target_table" = "ods_orders",
"table.orders.exclude_columns" = "internal_note",
"slot_name" = "orders_slot",
"publication_name" = "orders_publication",
"ssl_mode" = "verify-ca",
"ssl_rootcert" = "FILE:ca.pem"
```

カスタムのレプリケーションスロットとパブリケーションはユーザーが管理し、ストリーミングジョブを削除しても残ります。`slot_name` または `publication_name` を省略した場合、Doris はジョブ用に該当するリソースを作成し、ジョブの削除時に Doris が作成したリソースをクリーンアップします。

### Doris の同期先データベースのパラメータ

同期先側のパラメータでは、自動作成されるテーブルのプロパティと Stream Load の書き込み方法を制御します。以下のパラメータはすべて省略可能です。

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris がテーブルを作成する際に、`table.create.properties.replication_num` などのテーブルプロパティを追加します。 |
| `load.strict_mode` | `false` | Stream Load の書き込みで厳格モードを有効にするかどうかを指定します。有効な値は `true` と `false` です。 |
| `load.max_filter_ratio` | `0` | サンプリングウィンドウ内で許容されるフィルタリング比率の最大値。範囲は `[0, 1]` です。`0` の場合、エラーのある行はフィルタリングできません。サンプリングウィンドウは `max_interval * 10` 秒です。ウィンドウ内の全行に対するエラーのある行の比率がこの値を超えると、ジョブは一時停止します。 |

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

各要素の説明を次に示します。

| 要素 | 説明 |
| --- | --- |
| job_name | ジョブ名 |
| job_properties | ジョブの共通ロードパラメータを指定します。 |
| comment | ジョブを説明するコメントを指定します。 |
| source_properties | PostgreSQL の同期元に関するパラメータを指定します。 |
| target_properties | Doris の同期先データベースに関するパラメータを指定します。 |

`job_properties` では `max_interval` と `compute_group` を指定できます。詳しくは[ジョブの共通ロード設定パラメータ](./continuous-load-overview.md#job-common-load-configuration-parameters)を参照してください。テーブル自動作成モードでは `session.*` は使用しません。

## よくある質問

<!-- Knowledge type: Frequently asked questions -->

**Q1: テーブル自動作成同期と SQL マッピング同期はどのように使い分けますか？**

-   ミラーレプリケーションやテーブルの自動作成が必要な場合、または同期先テーブルの名前変更と主キー以外のカラムの除外だけが必要な場合は、テーブル自動作成同期を使用します。
-   同期パイプラインで SQL 式、行のフィルタリング、データ変換が必要な場合は、[SQL マッピングを使用する PostgreSQL CDC](./continuous-load-postgresql-table.md)を使用します。

**Q2: 主キーのないテーブルはサポートされますか？**

現時点では、主キーを持つテーブルの同期のみがサポートされます。主キーのないテーブルはサポートされません。

**Q3: BE が一台の環境でテーブルの作成に失敗した場合はどうすればよいですか？**

デフォルトのレプリカ数と利用可能な BE の台数が一致しないことを避けるため、`"table.create.properties.replication_num" = "1"` を `TO DATABASE` 句で明示的に設定してください。

**Q4: 同期先テーブルがすでに存在する場合、上書きされますか？**

いいえ。テーブルの自動作成フェーズでは、既存の同期先テーブルはスキップされます。必要に応じて、事前にテーブルスキーマをカスタマイズできます。

**Q5: 全量同期フェーズをスキップして増分データだけを同期するにはどうすればよいですか？**

`offset` を `latest` に設定します。ジョブは開始後の増分変更のみを取り込み、全量の初期化は行いません。

## 関連ドキュメント

-   [SQL マッピングを使用する PostgreSQL CDC](./continuous-load-postgresql-table.md)
-   [継続ロードの概要](./continuous-load-overview.md)
-   [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
-   [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
