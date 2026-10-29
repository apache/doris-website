---
{
    "title": "MySQL CDC による自動テーブル作成",
    "language": "ja",
    "sidebar_label": "自動テーブル作成同期",
    "description": "Doris Streaming Job で MySQL テーブルを自動テーブル作成、フィルタリング、オフセット、スナップショット、SSL、データ品質制御とともに同期する方法を説明します。",
    "keywords": [
        "MySQL 自動テーブル作成同期",
        "MySQL データベース全体同期",
        "Doris Streaming Job",
        "Flink CDC",
        "MySQL CDC リアルタイム同期",
        "継続データロード",
        "全量 + 増分同期",
        "自動テーブル作成"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror sync of a whole MySQL database to Doris -->

自動テーブル作成同期は、ネイティブの `FROM MYSQL (...) TO DATABASE (...)` DDL によって実装されます。ターゲットは Doris データベースであり、Doris は上流テーブルのスキーマに基づいて対応する下流テーブルを自動的に作成します。`include_tables` を使用して、1 つのテーブル、複数のテーブル、またはすべてのテーブルを同期するかどうかを制御できます。初回同期時、Doris は下流の主キーテーブルを自動的に作成し、主キーを上流と一致させます。これは、SQL 処理を必要とせず、下流テーブルのスキーマを上流に自動追従させるミラー レプリケーション シナリオに適しています。

[Flink CDC](https://github.com/apache/flink-cdc) の機能を統合することで、Doris は MySQL から変更ログを読み取り、複数テーブルの全量データと増分データを Stream Load で継続的に Doris に書き込みます。自動テーブル作成同期では、個々のソーステーブルにターゲットテーブル名を割り当てたり、非キー列を除外したりできます。SQL 式、行フィルタリング、データ変換が必要な場合は、[MySQL CDC with SQL Mapping](./continuous-load-mysql-table.md) を参照してください。

### 適用シナリオ {#applicable-scenarios}

- MySQL の複数テーブル（またはデータベース全体）を Doris にミラー レプリケーションする必要がある。
- 手動でテーブルを作成せず、下流テーブルのスキーマと主キーを上流に基づいて自動的に作成したい。
- SQL 式、行フィルタリング、データ変換を必要とせず、単純なターゲットテーブル名の変更または列の削減だけが必要である。
- 初回の全量初期化と、増分変更の継続的な受信の両方をサポートする必要がある。

### 機能と制限 {#capabilities-and-limitations}

| 項目                  | 説明                                                          |
| --------------------- | ------------------------------------------------------------- |
| 一貫性セマンティクス | 現在は at-least-once セマンティクスのみ保証されます         |
| テーブルタイプ        | 主キーを持つ上流テーブルのみ同期できます。自動作成される下流テーブルは Unique Key モデルを使用します |
| 権限                  | Load 権限が必要です。下流テーブルが存在しない場合は Create 権限も必要です |
| 自動テーブル作成      | ターゲットテーブルがすでに存在する場合は作成をスキップします。必要に応じてテーブルスキーマをカスタマイズできます |
| データ処理            | ターゲットテーブル名の変更と非キー列の除外をサポートします。SQL 式、行フィルタリング、データ変換はサポートしません |

## 前提条件 {#prerequisites}

自動テーブル作成同期ジョブを作成する前に、次の事項を確認してください。

1. Doris クラスターがデプロイされ、Load 権限があること（自動テーブル作成シナリオでは Create 権限も必要です）。
2. MySQL バージョンと互換性のある JDBC ドライバー jar がアップロードされ、ファイル名、ローカル絶対パス、または HTTP アドレスで参照できること。詳細は [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください。
3. MySQL で binlog が有効になっており、アカウントに binlog の読み取り権限があること。
4. 同期範囲が明確であること。データベース全体を同期するのか、`include_tables` で指定したテーブルのみを同期するのかを確認してください。

## クイックスタート {#quick-start}

<!-- Knowledge type: Procedure -->

### ステップ 1: データロードジョブを作成する {#step-1-create-a-load-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して継続データロードジョブを作成します。

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

上記の例のポイントは次のとおりです。

- `database` は上流 MySQL データベースを指定します。`include_tables` は同期するテーブルを限定します。複数のテーブルはコンマで区切り、空のままにするとデータベース全体を同期します。
- `offset = "initial"` は、最初に全量初期化を実行し、その後増分同期に切り替えることを意味します。増分データのみを同期するには `latest` に変更します。
- `TO DATABASE target_test_db` は下流 Doris データベースを指定します。`table.create.properties.*` を使用して、自動作成されるテーブルのプロパティ（レプリカ数など）を制御します。

### ステップ 2: データロードの状態を確認する {#step-2-check-load-status}

`jobs("type"="insert")` テーブル関数を使用して、Streaming Job の実行状態を照会します。

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING"
             Id: 1765332859199
             Name: mysql_db_sync
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \\N
           Status: RUNNING
       ExecuteSql: FROM MYSQL('include_tables'='user_info','database'='test','driver_class'='com.mysql.cj.jdbc.Driver','driver_url'='mysql-connector-java-8.0.25.jar','offset'='initial','jdbc_url'='jdbc:mysql://127.0.0.1:3306','user'='root' ) TO DATABASE target_test_db ('table.create.properties.replication_num'='1')
       CreateTime: 2025-12-10 10:19:35
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment:
       Properties: \\N
    CurrentOffset: {"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","splitId":"binlog-split","row":"1","event":"2","server_id":"1"}
        EndOffset: \\N
    LoadStatistic: {"scannedRows":24,"loadBytes":1146,"fileNumber":0,"fileSize":0}
         ErrorMsg: \\N
```

確認する主なフィールドは次のとおりです。

- `Status`: ジョブ全体の状態（`RUNNING` など）。
- `CurrentOffset`: 現在消費している binlog の位置。同期の進行状況の追跡に役立ちます。
- `LoadStatistic`: スキャンした行数や書き込んだバイト数などのデータロード統計。
- `ErrorMsg`: エラーメッセージ。ジョブに問題がある場合のトラブルシューティングの主要な手がかりです。

### ステップ 3: データロードジョブを変更する {#step-3-modify-the-load-job}

データソース接続情報（アカウント認証情報のローテーションなど）を更新する必要がある場合は、`ALTER JOB` を使用します。

```sql
ALTER JOB <job_name>
FROM MYSQL (
    "user" = "root",
    "password" = "123456"
)
TO DATABASE target_test_db
```

一時停止、再開、削除、タスクの表示など、その他の一般的な操作については、[Continuous Load Overview](./continuous-load-overview.md) を参照してください。

## データソースパラメーター {#data-source-parameters}

<!-- Knowledge type: Configuration parameters -->

MySQL ソース（`FROM MYSQL`）は次のパラメーターをサポートします。接続情報、データベース名、ドライバー情報は必須です。

| パラメーター | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `jdbc_url` | はい | - | MySQL JDBC 接続文字列。 |
| `driver_url` | はい | - | JDBC ドライバー jar へのパス。ファイル名、ローカル絶対パス、HTTP URL をサポートします。詳細は [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください。 |
| `driver_class` | はい | - | JDBC ドライバーのクラス名。例: `com.mysql.cj.jdbc.Driver`。 |
| `user` | はい | - | データベースのユーザー名。 |
| `password` | はい | - | データベースのパスワード。 |
| `database` | はい | - | MySQL データベース名。 |
| `include_tables` | いいえ | - | 同期するテーブル名。複数のテーブルはコンマで区切ります。設定しない場合、データベース内のすべてのテーブルを同期します。 |
| `exclude_tables` | いいえ | - | 同期しないテーブル名。複数のテーブルはコンマで区切ります。このパラメーターは `include_tables` が設定されていない場合にのみ有効です。 |
| `table.<table_name>.target_table` | いいえ | ソーステーブル名 | バージョン 4.1.0 以降でサポートされます。ソーステーブルの Doris ターゲットテーブル名を設定します。`<table_name>` はソーステーブル名です。 |
| `table.<table_name>.exclude_columns` | いいえ | - | バージョン 4.1.0 以降でサポートされます。同期しないソース列を指定します。複数の列はコンマで区切ります。列は存在している必要があり、主キー列を含めることはできません。 |
| `offset` | いいえ | `latest` | 起動オフセット。`initial`: 全量および増分同期、`earliest`: 利用可能な最も早い Binlog オフセットから開始、`latest`: ジョブ開始後の変更のみを同期します。`{"file":"binlog.000001","pos":"154"}` や `{"gtids":"<gtid_set>"}` のように、正確な JSON オフセットを指定することもできます。バージョン 4.1.0 以降では、全量同期のみを行う `snapshot` もサポートされます。 |
| `snapshot_split_size` | いいえ | `40960`（4.1.4 より前は `8096`） | 行単位の分割サイズ。全量同期中、テーブルは複数の分割に分けられます。正の整数である必要があります。 |
| `snapshot_parallelism` | いいえ | `1` | 全量同期フェーズの並列度。つまり、1 回の Task で同時にスケジュールされる分割の最大数です。正の整数である必要があります。 |
| `server_id` | いいえ | 自動生成 | バージョン 4.1.0 以降でサポートされます。MySQL CDC リーダーのサーバー ID です。`5400` のような単一値、または `5400-5408` のような閉区間を指定できます。区間の幅は `snapshot_parallelism` 以上である必要があります。 |
| `ssl_mode` | いいえ | `disable` | バージョン 4.1.0 以降でサポートされます。SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | 条件付き必須 | - | バージョン 4.1.0 以降でサポートされます。`FILE:<file_name>` 形式の CA 証明書ファイルです。`ssl_mode` が `verify-ca` の場合に必須です。まず [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) を使用してファイルをアップロードしてください。 |

`include_tables` と `exclude_tables` の両方を設定した場合は、`include_tables` が優先されます。次の `FROM MYSQL` パラメーター断片は、`orders` と `customers` を同期し、`orders` を `ods_orders` に書き込み、非キー列 `internal_note` を除外し、CA 検証を有効にします。

```sql
"include_tables" = "orders,customers",
"table.orders.target_table" = "ods_orders",
"table.orders.exclude_columns" = "internal_note",
"server_id" = "5400-5403",
"ssl_mode" = "verify-ca",
"ssl_rootcert" = "FILE:ca.pem"
```

## リファレンスマニュアル {#reference-manual}

### データロード文 {#load-statement}

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

各モジュールの説明:

| モジュール          | 説明                                             |
| ------------------- | ------------------------------------------------ |
| job_name            | ジョブ名                                         |
| job_properties      | Job の一般的なデータロードパラメーターを指定するために使用 |
| comment             | Job を注記で説明するために使用                   |
| source_properties   | MySQL ソースに関連するパラメーター               |
| target_properties   | Doris ターゲットデータベースに関連するパラメーター |

`job_properties` は `max_interval` と `compute_group` をサポートします。詳細は [Common Job Load Configuration Parameters](./continuous-load-overview.md#job-common-load-configuration-parameters) を参照してください。自動テーブル作成モードでは `session.*` は使用しません。

### Doris ターゲットデータベースの構成パラメーター {#doris-target-database-configuration-parameters}

<!-- Knowledge type: Configuration parameters -->

`TO DATABASE` は次のオプションパラメーターをサポートします。

| パラメーター | デフォルト | 説明 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris がテーブルを作成するときにテーブルプロパティを追加します。例: `table.create.properties.replication_num`。 |
| `load.strict_mode` | `false` | Stream Load の書き込みで strict モードを有効にするかどうか。有効な値は `true` と `false` です。 |
| `load.max_filter_ratio` | `0` | サンプリングウィンドウで許可される最大フィルター比率。範囲は `[0, 1]` です。`0` はエラー行をフィルターできないことを意味します。サンプリングウィンドウは `max_interval * 10` 秒です。ウィンドウ内のエラー行数と総行数の比率がこの値を超えると、ジョブは一時停止します。 |

## FAQ {#faq}

<!-- Knowledge type: FAQ -->

**Q1: 自動テーブル作成同期は非主キーテーブルをサポートしますか？**

いいえ。現在、自動テーブル作成同期は主キーテーブル（Unique Key）のみをサポートします。初回同期時、Doris は上流の主キーに基づいて下流の主キーテーブルを自動的に作成します。

**Q2: ターゲットテーブルがすでに存在する場合、上書きされますか？**

いいえ。自動テーブル作成フェーズでは、ターゲットテーブルがすでに存在する場合、作成をスキップします。シナリオに応じてテーブルスキーマをカスタマイズできます。

**Q3: 全量初期化を行わず、増分データだけを同期するにはどうすればよいですか？**

`offset` パラメーターを `latest` に設定します。ジョブは全量同期フェーズをスキップし、最新の binlog 位置から直接消費を開始します。

**Q4: 自動テーブル作成同期と SQL マッピング同期はどのように使い分けますか？**

- ミラー レプリケーション、自動テーブル作成、上流とのテーブルスキーマの一貫性が必要な場合: 自動テーブル作成同期を使用します。
- ターゲットテーブル名の変更または非キー列の除外だけが必要な場合: 自動テーブル作成同期を使用します。
- SQL 式、行フィルタリング、データ変換が必要な場合: [MySQL CDC with SQL Mapping](./continuous-load-mysql-table.md) を使用します。

**Q5: 単一 BE デプロイでテーブル作成に失敗した場合、どうすればよいですか？**

`TO DATABASE` でレプリカ数を 1 に明示的に指定します: `"table.create.properties.replication_num" = "1"`。

## 関連ドキュメント {#related-documents}

- [Continuous Load Overview](./continuous-load-overview.md)
- [MySQL CDC with SQL Mapping](./continuous-load-mysql-table.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [JDBC Catalog Overview](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
- [Flink CDC](https://github.com/apache/flink-cdc)
