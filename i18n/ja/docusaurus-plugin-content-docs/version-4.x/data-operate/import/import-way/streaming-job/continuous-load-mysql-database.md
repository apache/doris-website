---
{
    "title": "MySQL 自動テーブル作成同期",
    "language": "ja",
    "sidebar_label": "自動テーブル作成同期",
    "description": "Streaming Job を使用して MySQL データベースの全量データと増分データを継続的に Doris に同期し、初回同期時にテーブルを自動作成します。",
    "keywords": [
        "MySQL 自動テーブル作成同期",
        "MySQL データベース全体の同期",
        "Doris Streaming Job",
        "Flink CDC",
        "MySQL CDC リアルタイム同期",
        "継続的なデータロード",
        "全量 + 増分同期",
        "自動テーブル作成"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror sync of a whole MySQL database to Doris -->

自動テーブル作成同期は、ネイティブな `FROM MYSQL (...) TO DATABASE (...)` DDL を介して実装します。**ターゲットは Doris データベースコンテナであり、Doris が下流テーブルを自動作成します。** `include_tables` を使用して、1 つのテーブル、複数のテーブル、またはすべてのテーブルを同期するかどうかを制御できます。初回同期時、Doris は下流の主キーテーブルを自動的に作成し、主キーを上流と一致させます。これは、SQL 処理が不要で、下流テーブルのスキーマを上流に自動的に追従させる必要があるミラー複製シナリオに適しています。

[Flink CDC](https://github.com/apache/flink-cdc) の機能を統合することで、Doris は MySQL から変更ログを読み取り、テーブルグループの全量データと増分データを Stream Load 経由で Doris に継続的に書き込みます。同期中に列マッピング、フィルタリング、またはデータ変換を実行する必要がある場合は、[SQL マッピングを使用した MySQL CDC](./continuous-load-mysql-table.md) を参照してください。

### 適用シナリオ {#applicable-scenarios}

- MySQL のテーブルグループ（またはデータベース全体）を Doris にミラー複製する必要がある。
- 下流テーブルのスキーマと主キーを上流に基づいて自動作成し、手動でテーブルを作成したくない。
- 同期中に列マッピング、フィルタリング、またはデータ変換が不要である。
- 初回の全量初期化と、増分変更の継続的な受信の両方をサポートする必要がある。

### 機能と制限 {#capabilities-and-limitations}

| 項目                  | 説明                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| 一貫性セマンティクス | 現在保証されるのは at-least-once セマンティクスのみ                 |
| テーブルタイプ        | 同期でサポートされるのは主キーテーブル（Unique Key）のみ            |
| 権限                  | Load 権限が必要。下流テーブルが存在しない場合は Create 権限も必要   |
| 自動テーブル作成      | ターゲットテーブルがすでに存在する場合は作成をスキップ。必要に応じてテーブルスキーマをカスタマイズ可能 |
| データ処理            | 列マッピング、フィルタリング、変換はサポートされない。必要な場合は SQL マッピング同期を使用 |

## 前提条件 {#prerequisites}

自動テーブル作成同期ジョブを作成する前に、次を確認してください。

1. Doris クラスタがデプロイされ、Load 権限がある（自動テーブル作成シナリオでは Create 権限も必要）。
2. MySQL のバージョンと互換性のある JDBC ドライバ jar がアップロードされ、ファイル名、ローカル絶対パス、または HTTP アドレスで参照できる。[JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください。
3. MySQL で binlog が有効になっており、アカウントに binlog の読み取り権限がある。
4. 同期範囲が明確である。データベース全体を同期するのか、`include_tables` で指定したテーブルのみを同期するのかを確認する。

## クイックスタート {#quick-start}

<!-- Knowledge type: Procedure -->

### 手順 1: ロードジョブを作成 {#step-1-create-a-load-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して継続的なデータロードジョブを作成します。

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

上の例のポイントは次のとおりです。

- `database` は上流 MySQL データベースを指定します。`include_tables` は同期するテーブルを制限します。複数のテーブルはコンマで区切り、空のままにするとデータベース全体を同期します。
- `offset = "initial"` は、最初に全量初期化を行い、その後増分に切り替えることを意味します。増分データのみを同期するには、`latest` に変更します。
- `TO DATABASE target_test_db` は下流 Doris データベースを指定します。`table.create.properties.*` を使用して、自動作成されるテーブルのプロパティ（レプリカ数など）を制御します。

### 手順 2: ロードステータスを確認 {#step-2-check-load-status}

`jobs("type"="insert")` テーブル関数を使用して Streaming Job の実行状態を照会します。

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

確認するフィールドは次のとおりです。

- `Status`: ジョブ全体の状態（`RUNNING` など）。
- `CurrentOffset`: 現在消費されている binlog の位置。同期の進行状況の追跡に使用できます。
- `LoadStatistic`: スキャンした行数や書き込まれたバイト数などのロード統計。
- `ErrorMsg`: エラーメッセージ。ジョブに問題がある場合のトラブルシューティングの主な手がかりです。

### 手順 3: ロードジョブを変更 {#step-3-modify-the-load-job}

データソースの接続情報（アカウント認証情報のローテーションなど）を更新する必要がある場合は、`ALTER JOB` を使用します。

```sql
ALTER JOB <job_name>
FROM MYSQL (
    "user" = "root",
    "password" = "123456"
)
TO DATABASE target_test_db
```

その他の一般的な操作（一時停止、再開、削除、タスクの表示など）については、[継続的なデータロードの概要](./continuous-load-overview.md) を参照してください。

## データソースパラメータ {#data-source-parameters}

<!-- Knowledge type: Configuration parameters -->

MySQL ソース側（`FROM MYSQL`）でサポートされるパラメータは次のとおりです。

| パラメータ            | デフォルト | 説明                                                                                                          |
| --------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| jdbc_url              | -          | MySQL JDBC 接続文字列                                                                                         |
| driver_url            | -          | JDBC ドライバ jar のパス。ファイル名、ローカル絶対パス、HTTP アドレスをサポートします。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください |
| driver_class          | -          | JDBC ドライバクラス名                                                                                        |
| user                  | -          | データベースユーザー名                                                                                       |
| password              | -          | データベースパスワード                                                                                       |
| database              | -          | データベース名                                                                                               |
| include_tables        | -          | 同期するテーブル名。複数のテーブルはコンマで区切ります。空のままにすると、デフォルトですべてのテーブルを同期します |
| offset                | latest     | `latest`: 増分同期のみ。`initial`: 全量 + 増分同期                                                           |
| snapshot_split_size   | 40960（4.1.4 より前は 8096） | split のサイズ（行数）。全量同期中、テーブルは同期のために複数の split に分割されます |
| snapshot_parallelism  | 1          | 全量同期フェーズの並列度。1 つの Task が一度にスケジュールできる split の最大数です                     |

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

| モジュール         | 説明                                  |
| ------------------ | ------------------------------------- |
| job_name           | ジョブ名                              |
| job_properties     | Job の一般的なロードパラメータを指定するために使用 |
| comment            | Job の注記による説明に使用            |
| source_properties  | MySQL ソースに関連するパラメータ       |
| target_properties  | Doris ターゲットデータベースに関連するパラメータ |

### Doris ターゲットデータベースの構成パラメータ {#doris-target-database-configuration-parameters}

<!-- Knowledge type: Configuration parameters -->

`TO DATABASE` は次のパラメータをサポートします。

| パラメータ                 | デフォルト | 説明                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| table.create.properties.* | -          | テーブル作成時にテーブルプロパティ（`replication_num` など）を指定します                                                                                                                                                                                                                                                              |
| load.strict_mode          | -          | 厳格モードを有効にするかどうか。デフォルトでは無効です                                                                                                                                                                                                                                                                                     |
| load.max_filter_ratio     | -          | サンプリングウィンドウ内で許容される最大フィルタ率。0 以上 1 以下である必要があります。デフォルト値は 0 で、許容度ゼロを意味します。サンプリングウィンドウは `max_interval * 10` です。サンプリングウィンドウ内のエラー行数と総行数の比率が `load.max_filter_ratio` を超えると、定期ジョブが一時停止され、データ品質の問題を確認するために手動介入が必要になります。 |

## FAQ {#faq}

<!-- Knowledge type: FAQ -->

**Q1: 自動テーブル作成同期は非主キーテーブルをサポートしますか？**

いいえ。現在、自動テーブル作成同期は主キーテーブル（Unique Key）のみをサポートします。初回同期時、Doris は上流の主キーに基づいて下流の主キーテーブルを自動的に作成します。

**Q2: ターゲットテーブルがすでに存在する場合、上書きされますか？**

いいえ。自動テーブル作成フェーズでは、ターゲットテーブルがすでに存在する場合、作成をスキップします。さまざまなシナリオに応じてテーブルスキーマをカスタマイズできます。

**Q3: 全量初期化を行わず、増分データのみを同期するにはどうすればよいですか？**

`offset` パラメータを `latest` に設定します。ジョブは全量同期フェーズをスキップし、最新の binlog 位置から直接消費を開始します。

**Q4: 自動テーブル作成同期と SQL マッピング同期はどのように使い分けますか？**

- ミラー複製、自動テーブル作成、上流とのテーブルスキーマの一貫性維持には、自動テーブル作成同期を使用します。
- 列マッピング、フィルタリング、またはデータ変換には、[SQL マッピングを使用した MySQL CDC](./continuous-load-mysql-table.md) を使用します。

**Q5: シングル BE デプロイでテーブル作成に失敗した場合はどうすればよいですか？**

`TO DATABASE` でレプリカ数を 1 と明示的に指定します。`"table.create.properties.replication_num" = "1"`。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 症状                                      | 考えられる原因                                             | 診断と解決策                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 権限エラーでジョブの作成に失敗する        | 現在のユーザーに Load または Create 権限がない             | 実行アカウントに Load 権限を付与します。自動テーブル作成には Create 権限も必要です                         |
| 全量同期が遅い                            | `snapshot_parallelism` が小さすぎる、または split が大きすぎる | `snapshot_parallelism` を適切に増やします。テーブルの行数に基づいて `snapshot_split_size` を調整します |
| データ品質の問題によりジョブが一時停止する | エラー行の比率が `load.max_filter_ratio` を超えている       | `ErrorMsg` フィールドを確認して不正データを特定し、`load.strict_mode` または `load.max_filter_ratio` を調整します |
| 自動テーブル作成中にレプリカ数エラーが発生する | シングル BE デプロイだがデフォルトのレプリカ数が 3        | `table.create.properties.replication_num = 1` を設定します                                                  |
| 増分データが Doris に到達しない            | MySQL binlog が有効でない、またはアカウントに binlog 権限がない | MySQL 側で binlog を有効にし、同期アカウントに `REPLICATION SLAVE` と `REPLICATION CLIENT` 権限を付与します |

## 関連ドキュメント {#related-documents}

- [継続的なデータロードの概要](./continuous-load-overview.md)
- [SQL マッピングを使用した MySQL CDC](./continuous-load-mysql-table.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
- [Flink CDC](https://github.com/apache/flink-cdc)
