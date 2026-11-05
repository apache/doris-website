---
{
    "title": "MySQL CDC による自動テーブル作成",
    "language": "ja",
    "sidebar_label": "自動テーブル作成同期",
    "description": "Streaming Job を使用して MySQL データベースの全量データと増分データを Doris に継続的に同期し、初回同期時にテーブルを自動作成します。",
    "keywords": [
        "MySQL 自動テーブル作成同期",
        "MySQL データベース全体の同期",
        "Doris Streaming Job",
        "Flink CDC",
        "MySQL CDC リアルタイム同期",
        "継続的データロード",
        "全量 + 増分同期",
        "自動テーブル作成"
    ]
}
---

:::caution 実験的機能

Doris の継続的データロードは実験的機能であり、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror sync of a whole MySQL database to Doris -->

自動テーブル作成同期はネイティブの `FROM MYSQL (...) TO DATABASE (...)` DDL を通じて実装されます。**ターゲットは Doris のデータベースコンテナであり、Doris が下流テーブルを自動作成します。** `include_tables` を使用して、単一テーブル、複数テーブル、またはすべてのテーブルを同期するかどうかを制御できます。初回同期時に、Doris は下流の主キーテーブルを自動的に作成し、主キーを上流と一致させます。これは、SQL 処理が不要で、下流テーブルのスキーマを上流に自動追従させるミラー レプリケーションのシナリオに適しています。

[Flink CDC](https://github.com/apache/flink-cdc) の機能を統合することで、Doris は MySQL から変更ログを読み取り、テーブル群の全量データと増分データを Stream Load 経由で Doris に継続的に書き込みます。同期中に列マッピング、フィルタリング、またはデータ変換を行う必要がある場合は、[SQL マッピングを使用した MySQL CDC](./continuous-load-mysql-table.md) を参照してください。

### 適用シナリオ {#applicable-scenarios}

- MySQL のテーブル群（またはデータベース全体）を Doris にミラーリングする必要がある。
- 手動でテーブルを作成せず、上流に基づいて下流テーブルのスキーマと主キーを自動的に作成したい。
- 同期中に列マッピング、フィルタリング、またはデータ変換が不要である。
- 初回の全量初期化と増分変更の継続的な受信の両方をサポートする必要がある。

### 機能と制限事項 {#capabilities-and-limitations}

| 項目                   | 説明                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| 一貫性セマンティクス   | 現在は at-least-once セマンティクスのみが保証されます                                            |
| テーブルタイプ         | 主キーテーブル（Unique Key）の同期のみがサポートされます                                        |
| 権限                   | Load 権限が必要です。下流テーブルが存在しない場合は Create 権限も必要です                       |
| 自動テーブル作成       | ターゲットテーブルがすでに存在する場合は作成をスキップします。必要に応じてテーブルスキーマをカスタマイズできます |
| データ処理             | 列マッピング、フィルタリング、変換はサポートされません。必要な場合は SQL マッピング同期を使用してください |

## 前提条件 {#prerequisites}

自動テーブル作成同期ジョブを作成する前に、次の事項を確認してください。

1. Doris クラスタがデプロイされ、Load 権限があること（自動テーブル作成のシナリオでは Create 権限も必要です）。
2. MySQL バージョンと互換性のある JDBC ドライバ jar がアップロードされ、ファイル名、ローカル絶対パス、または HTTP アドレスで参照できること。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください。
3. MySQL で binlog が有効になっており、アカウントに binlog の読み取り権限があること。
4. 同期範囲が明確であること。データベース全体を同期するのか、`include_tables` で指定したテーブルだけを同期するのかを確認してください。

## クイックスタート {#quick-start}

<!-- Knowledge type: Procedure -->

### ステップ 1: ロードジョブを作成する {#step-1-create-a-load-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して継続的なロードジョブを作成します。

```sql
CREATE JOB multi_table_sync
ON STREAMING
FROM MYSQL (
        "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
        "driver_url" = "mysql-connector-java-8.0.25.jar",
        "driver_class" = "com.mysql.cj.jdbc.Driver",
        "user" = "root",
        "password" = "123456",
        "database" = "test",
        "include_tables" = "user_info,order_info",
        "offset" = "initial"
)
TO DATABASE target_test_db (
    "table.create.properties.replication_num" = "1"  -- Set to 1 for single-BE deployment
)
```

上記の例の要点は次のとおりです。

- `database` は上流 MySQL データベースを指定します。`include_tables` で同期対象のテーブルを限定します。複数のテーブルはコンマで区切り、空にするとデータベース全体が同期されます。
- `offset = "initial"` は、最初に全量初期化を行い、その後増分に切り替えることを意味します。増分データだけを同期するには、`latest` に変更します。
- `TO DATABASE target_test_db` は下流の Doris データベースを指定します。`table.create.properties.*` を使用して、自動作成されるテーブルのプロパティ（レプリカ数など）を制御します。

### ステップ 2: ロード状態を確認する {#step-2-check-load-status}

`jobs("type"="insert")` テーブル関数を使用して、Streaming Job の実行状態を照会します。

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING"
             Id: 1765332859199
             Name: mysql_db_sync
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: FROM MYSQL('include_tables'='user_info','database'='test','driver_class'='com.mysql.cj.jdbc.Driver','driver_url'='mysql-connector-java-8.0.25.jar','offset'='initial','jdbc_url'='jdbc:mysql://127.0.0.1:3306','user'='root' ) TO DATABASE target_test_db ('table.create.properties.replication_num'='1')
       CreateTime: 2025-12-10 10:19:35
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment:
       Properties: \N
    CurrentOffset: {"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","splitId":"binlog-split","row":"1","event":"2","server_id":"1"}
        EndOffset: \N
    LoadStatistic: {"scannedRows":24,"loadBytes":1146,"fileNumber":0,"fileSize":0}
         ErrorMsg: \N
```

注目すべきフィールドは次のとおりです。

- `Status`: ジョブ全体の状態（`RUNNING` など）。
- `CurrentOffset`: 現在消費されている binlog の位置。同期の進行状況を追跡するのに役立ちます。
- `LoadStatistic`: スキャンした行数や書き込んだバイト数などのロード統計情報。
- `ErrorMsg`: エラーメッセージ。ジョブに問題がある場合のトラブルシューティングの主な手掛かりです。

### ステップ 3: ロードジョブを変更する {#step-3-modify-the-load-job}

データソースの接続情報（アカウント認証情報のローテーションなど）を更新する必要がある場合は、`ALTER JOB` を使用します。

```sql
ALTER JOB <job_name>
FROM MYSQL (
    "user" = "root",
    "password" = "123456"
)
TO DATABASE target_test_db
```

一時停止、再開、削除、タスクの表示など、その他の一般的な操作については、[継続的データロードの概要](./continuous-load-overview.md) を参照してください。

## データソースパラメータ {#data-source-parameters}

<!-- Knowledge type: Configuration parameters -->

MySQL ソース側（`FROM MYSQL`）では、次のパラメータがサポートされています。

| パラメータ            | デフォルト | 説明                                                                                                          |
| --------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| jdbc_url              | -          | MySQL JDBC 接続文字列                                                                                         |
| driver_url            | -          | JDBC ドライバ jar のパス。ファイル名、ローカル絶対パス、HTTP アドレスをサポートします。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください |
| driver_class          | -          | JDBC ドライバクラス名                                                                                         |
| user                  | -          | データベースユーザー名                                                                                        |
| password              | -          | データベースパスワード                                                                                         |
| database              | -          | データベース名                                                                                                |
| include_tables        | -          | 同期するテーブル名をコンマで区切って指定します。空欄の場合はデフォルトですべてのテーブルが同期されます        |
| offset                | latest     | `latest`: 増分同期のみ。`initial`: 全量 + 増分同期                                                            |
| snapshot_split_size   | 40960      | split のサイズ（行数）。全量同期時、テーブルは複数の split に分割されて同期されます                         |
| snapshot_parallelism  | 1          | 全量同期フェーズの並列度。つまり、単一の Task が一度にスケジュールできる split の最大数                   |

## リファレンスマニュアル {#reference-manual}

### ロードステートメント {#load-statement}

<!-- Knowledge type: Syntax reference -->

自動テーブル作成同期ジョブを作成する構文は次のとおりです。

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
[ COMMENT <comment> ]
FROM MYSQL (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
)
```

各モジュールの説明は次のとおりです。

| モジュール          | 説明                                     |
| ------------------- | ---------------------------------------- |
| job_name            | ジョブ名                                 |
| job_properties      | ジョブの一般的なロードパラメータを指定するために使用 |
| comment             | ジョブへの注記を記述するために使用       |
| source_properties   | MySQL ソース関連のパラメータ             |
| target_properties   | Doris ターゲットデータベース関連のパラメータ |

### Doris ターゲットデータベースの構成パラメータ {#doris-target-database-configuration-parameters}

<!-- Knowledge type: Configuration parameters -->

`TO DATABASE` では、次のパラメータがサポートされています。

| パラメータ                 | デフォルト | 説明                                                                                                                                                                                                                                                                                    |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| table.create.properties.*  | -          | テーブル作成時にテーブルプロパティを指定します。たとえば `replication_num` を指定できます                                                                                                                                                                                              |
| load.strict_mode           | -          | strict モードを有効にするかどうか。デフォルトでは無効です                                                                                                                                                                                                                               |
| load.max_filter_ratio      | -          | サンプリングウィンドウ内で許容される最大フィルタ率。0 以上 1 以下である必要があります。デフォルト値は 0 で、許容度ゼロを意味します。サンプリングウィンドウは `max_interval * 10` です。サンプリングウィンドウ内のエラー行数と総行数の比率が `load.max_filter_ratio` を超えると、ルーチンジョブが一時停止され、データ品質の問題を確認するため手動対応が必要です。 |

## FAQ {#faq}

<!-- Knowledge type: FAQ -->

**Q1: 自動テーブル作成同期は主キーなしテーブルをサポートしますか？**

いいえ。現在、自動テーブル作成同期は主キーテーブル（Unique Key）のみをサポートします。初回同期時に、Doris は上流の主キーに基づいて下流の主キーテーブルを自動作成します。

**Q2: ターゲットテーブルがすでに存在する場合、上書きされますか？**

いいえ。自動テーブル作成フェーズでは、ターゲットテーブルがすでに存在する場合は作成をスキップします。さまざまなシナリオに応じてテーブルスキーマをカスタマイズできます。

**Q3: 全量初期化を行わず、増分データだけを同期するにはどうすればよいですか？**

`offset` パラメータを `latest` に設定します。ジョブは全量同期フェーズをスキップし、最新の binlog 位置から直接消費を開始します。

**Q4: 自動テーブル作成同期と SQL マッピング同期はどのように使い分けますか？**

- ミラー レプリケーション、自動テーブル作成、上流とのテーブルスキーマの整合性維持が必要な場合: 自動テーブル作成同期を使用します。
- 列マッピング、フィルタリング、またはデータ変換が必要な場合: [SQL マッピングを使用した MySQL CDC](./continuous-load-mysql-table.md) を使用します。

**Q5: 単一 BE デプロイでテーブル作成に失敗した場合はどうすればよいですか？**

`TO DATABASE` でレプリカ数を明示的に 1 に指定します: `"table.create.properties.replication_num" = "1"`。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 症状                                      | 考えられる原因                                           | 診断と解決策                                                                                              |
| ----------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 権限エラーでジョブの作成に失敗する        | 現在のユーザーに Load または Create 権限がない           | 実行アカウントに Load 権限を付与します。自動テーブル作成には Create 権限も必要です                     |
| 全量同期が遅い                            | `snapshot_parallelism` が小さすぎるか、split が大きすぎる | `snapshot_parallelism` を適切に増やし、テーブルの行数に基づいて `snapshot_split_size` を調整します |
| データ品質の問題によりジョブが一時停止する | エラー行の比率が `load.max_filter_ratio` を超えている    | `ErrorMsg` フィールドを確認して不正なデータを特定し、`load.strict_mode` または `load.max_filter_ratio` を調整します |
| 自動テーブル作成中にレプリカ数エラーが発生する | 単一 BE デプロイなのにデフォルトのレプリカ数が 3       | `table.create.properties.replication_num = 1` を設定します                                               |
| 増分データが Doris に到達しない           | MySQL binlog が有効でないか、アカウントに binlog 権限がない | MySQL 側で binlog を有効にし、同期アカウントに `REPLICATION SLAVE` および `REPLICATION CLIENT` 権限を付与します |

## 関連ドキュメント {#related-documents}

- [継続的データロードの概要](./continuous-load-overview.md)
- [SQL マッピングを使用した MySQL CDC](./continuous-load-mysql-table.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
- [Flink CDC](https://github.com/apache/flink-cdc)
