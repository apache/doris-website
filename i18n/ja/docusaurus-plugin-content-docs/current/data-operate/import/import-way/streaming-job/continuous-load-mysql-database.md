---
{
    "title": "テーブル自動作成を伴う MySQL CDC",
    "language": "ja",
    "sidebar_label": "テーブル自動作成同期",
    "description": "Doris の Streaming Job で、テーブルの自動作成、フィルタリング、オフセット、スナップショット、SSL、データ品質の制御を使用して MySQL テーブルを同期する方法を説明します。",
    "keywords": [
        "MySQL テーブル自動作成同期",
        "MySQL データベース全体の同期",
        "Doris Streaming Job",
        "Flink CDC",
        "MySQL CDC リアルタイム同期",
        "継続的なロード",
        "全量同期と増分同期",
        "テーブルの自動作成"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror sync of a whole MySQL database to Doris -->

テーブル自動作成同期は、ネイティブの `FROM MYSQL (...) TO DATABASE (...)` DDL で実現します。同期先は Doris データベースで、Doris は同期元のテーブルスキーマに基づいて対応するテーブルを自動作成します。`include_tables` を使用すると、単一のテーブル、複数のテーブル、またはすべてのテーブルを同期するかを制御できます。初回同期時には、Doris が同期先に主キーテーブルを自動作成し、主キーを同期元と一致させます。これは、SQL による処理が不要で、同期先のテーブルスキーマを同期元に自動的に追従させたいミラーレプリケーションに適しています。

Doris は [Flink CDC](https://github.com/apache/flink-cdc) の機能を統合し、MySQL の変更ログを読み取り、複数のテーブルの全量データと増分データを Stream Load を通じて継続的に書き込みます。テーブル自動作成同期では、個々の同期元テーブルに同期先テーブル名を指定したり、主キー以外の列を除外したりできます。SQL 式、行のフィルタリング、またはデータ変換が必要な場合は、[SQL マッピングを使用した MySQL CDC](./continuous-load-mysql-table.md) を参照してください。

### 適用シナリオ

- MySQL の複数のテーブル（またはデータベース全体）を Doris にミラーリングしたい場合。
- テーブルを手動で作成せずに、同期元に基づいて同期先のテーブルスキーマと主キーを自動作成したい場合。
- SQL 式、行のフィルタリング、データ変換は不要で、同期先テーブルの単純な名前変更や列の除外だけが必要な場合。
- 初回の全量同期と、その後の増分変更の継続的な取り込みの両方が必要な場合。

### 機能と制限

| 項目 | 説明 |
| --- | --- |
| 一貫性の保証 | 現在保証されるのは at-least-once セマンティクスのみです。 |
| テーブルの種類 | 同期できるのは主キーを持つ同期元テーブルのみです。自動作成される同期先テーブルには Unique Key モデルが使用されます。 |
| 権限 | Load 権限が必要です。同期先テーブルが存在しない場合は Create 権限も必要です。 |
| テーブルの自動作成 | 同期先テーブルがすでに存在する場合、作成はスキップされます。必要に応じてテーブルスキーマをカスタマイズできます。 |
| データ処理 | 同期先テーブル名の変更と主キー以外の列の除外をサポートします。SQL 式、行のフィルタリング、データ変換はサポートしません。 |

## 前提条件

テーブル自動作成同期ジョブを作成する前に、次の事項を確認してください。

1. Doris クラスターがデプロイされており、Load 権限があること（テーブルを自動作成する場合は Create 権限も必要です）。
2. MySQL のバージョンと互換性のある JDBC ドライバーの jar ファイルがアップロードされており、ファイル名、ローカルの絶対パス、または HTTP アドレスで参照できること。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください。
3. MySQL で binlog が有効になっており、アカウントに binlog の読み取り権限があること。
4. データベース全体を同期するか、`include_tables` で指定したテーブルだけを同期するかが決まっていること。

## クイックスタート

<!-- Knowledge type: Procedure -->

### ステップ 1: ロードジョブを作成する

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

上の例の要点は次のとおりです。

- `database` は同期元の MySQL データベースを指定します。`include_tables` は同期するテーブルを制限します。複数のテーブルはカンマで区切り、空にするとデータベース全体を同期します。
- `offset = "initial"` は、最初に全量同期を行い、その後に増分同期へ移ることを意味します。増分データだけを同期するには、`latest` に変更します。
- `TO DATABASE target_test_db` は同期先の Doris データベースを指定します。`table.create.properties.*` を使用すると、自動作成するテーブルのプロパティ（レプリカ数など）を制御できます。

### ステップ 2: ロード状態を確認する

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

確認する主なフィールドは次のとおりです。

- `Status`: ジョブ全体の状態（`RUNNING` など）。
- `CurrentOffset`: 現在読み取り済みの binlog 位置。同期の進捗確認に役立ちます。
- `LoadStatistic`: スキャンした行数や書き込んだバイト数などのロード統計。
- `ErrorMsg`: エラーメッセージ。ジョブで問題が発生したときの主な調査材料です。

### ステップ 3: ロードジョブを変更する

データソースの接続情報を更新する必要がある場合（アカウントの認証情報の変更など）は、`ALTER JOB` を使用します。

```sql
ALTER JOB <job_name>
FROM MYSQL (
    "user" = "root",
    "password" = "123456"
)
TO DATABASE target_test_db
```

一時停止、再開、削除、タスクの表示など、その他の操作については [継続的なロードの概要](./continuous-load-overview.md) を参照してください。

## データソースのパラメーター

<!-- Knowledge type: Configuration parameters -->

MySQL ソース（`FROM MYSQL`）は、次のパラメーターをサポートします。接続情報、データベース名、ドライバー情報は必須です。

| パラメーター | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `jdbc_url` | はい | - | MySQL の JDBC 接続文字列。 |
| `driver_url` | はい | - | JDBC ドライバーの jar ファイルのパス。ファイル名、ローカルの絶対パス、HTTP URL を指定できます。詳細は [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md) を参照してください。 |
| `driver_class` | はい | - | JDBC ドライバーのクラス名。例: `com.mysql.cj.jdbc.Driver`。 |
| `user` | はい | - | データベースのユーザー名。 |
| `password` | はい | - | データベースのパスワード。 |
| `database` | はい | - | MySQL データベース名。 |
| `include_tables` | いいえ | - | 同期するテーブル名。複数の場合はカンマで区切ります。未設定の場合、データベース内のすべてのテーブルを同期します。 |
| `exclude_tables` | いいえ | - | 同期対象から除外するテーブル名。複数の場合はカンマで区切ります。`include_tables` が設定されていない場合にのみ有効です。 |
| `table.<table_name>.target_table` | いいえ | 同期元のテーブル名 | バージョン 4.1.0 以降でサポートします。同期元テーブルに対応する Doris の同期先テーブル名を設定します。`<table_name>` は同期元のテーブル名です。 |
| `table.<table_name>.exclude_columns` | いいえ | - | バージョン 4.1.0 以降でサポートします。同期対象から除外する同期元の列をカンマ区切りで指定します。列は実在する必要があり、主キー列は指定できません。 |
| `offset` | いいえ | `latest` | 開始オフセット。`initial`: 全量同期と増分同期、`earliest`: 利用可能な最も古い Binlog オフセットから開始、`latest`: ジョブ開始後の変更のみを同期します。`{"file":"binlog.000001","pos":"154"}` や `{"gtids":"<gtid_set>"}` のように、正確な JSON オフセットも指定できます。バージョン 4.1.0 以降は、全量同期のみを行う `snapshot` もサポートします。 |
| `snapshot_split_size` | いいえ | `40960`（4.1.4 より前は `8096`） | 分割サイズ（行数）。全量同期時にテーブルを複数の分割単位に分けます。正の整数を指定してください。 |
| `snapshot_parallelism` | いいえ | `1` | 全量同期フェーズの並列度。Task が一度にスケジュールする分割単位の最大数です。正の整数を指定してください。 |
| `server_id` | いいえ | 自動生成 | バージョン 4.1.0 以降でサポートします。MySQL CDC リーダーのサーバー ID。`5400` のような単一の値、または `5400-5408` のような両端を含む範囲を指定できます。範囲の幅は `snapshot_parallelism` 以上である必要があります。 |
| `ssl_mode` | いいえ | `disable` | バージョン 4.1.0 以降でサポートします。SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | 条件付きで必須 | - | バージョン 4.1.0 以降でサポートします。`FILE:<file_name>` 形式の CA 証明書ファイル。`ssl_mode` が `verify-ca` の場合は必須です。先に [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) を使用してファイルをアップロードしてください。 |

`include_tables` と `exclude_tables` の両方を設定した場合は、`include_tables` が優先されます。次の `FROM MYSQL` パラメーターの抜粋では、`orders` と `customers` を同期し、`orders` を `ods_orders` に書き込み、主キー以外の列 `internal_note` を除外し、CA 証明書の検証を有効にします。

```sql
"include_tables" = "orders,customers",
"table.orders.target_table" = "ods_orders",
"table.orders.exclude_columns" = "internal_note",
"server_id" = "5400-5403",
"ssl_mode" = "verify-ca",
"ssl_rootcert" = "FILE:ca.pem"
```

## リファレンスマニュアル

### ロード文

<!-- Knowledge type: Syntax reference -->

テーブル自動作成同期ジョブの作成構文は次のとおりです。

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

各構成要素の説明は次のとおりです。

| 構成要素 | 説明 |
| --- | --- |
| job_name | ジョブ名。 |
| job_properties | ジョブの共通ロードパラメーターを指定します。 |
| comment | ジョブの説明を指定します。 |
| source_properties | MySQL ソースに関するパラメーターです。 |
| target_properties | Doris の同期先データベースに関するパラメーターです。 |

`job_properties` は `max_interval` と `compute_group` をサポートします。詳細は [ジョブ共通のロード設定パラメーター](./continuous-load-overview.md#job-common-load-configuration-parameters) を参照してください。テーブル自動作成モードでは `session.*` を使用しません。

### Doris の同期先データベースの設定パラメーター

<!-- Knowledge type: Configuration parameters -->

`TO DATABASE` は次の任意のパラメーターをサポートします。

| パラメーター | デフォルト | 説明 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris がテーブルを作成するときに、`table.create.properties.replication_num` などのテーブルプロパティを追加します。 |
| `load.strict_mode` | `false` | Stream Load による書き込みで厳密モードを有効にするかどうかを指定します。有効な値は `true` と `false` です。 |
| `load.max_filter_ratio` | `0` | サンプリング期間内に許容される最大フィルタリング率。範囲は `[0, 1]` です。`0` は、エラー行をフィルタリングできないことを意味します。サンプリング期間は `max_interval * 10` 秒です。期間内の全行に対するエラー行の割合がこの値を超えると、ジョブは一時停止します。 |

## よくある質問

<!-- Knowledge type: FAQ -->

**Q1: テーブル自動作成同期は主キーのないテーブルをサポートしますか？**

いいえ。現在、テーブル自動作成同期がサポートするのは主キーテーブル（Unique Key）のみです。初回同期時に、Doris は同期元の主キーに基づいて同期先の主キーテーブルを自動作成します。

**Q2: 同期先テーブルがすでに存在する場合、上書きされますか？**

いいえ。テーブルの自動作成フェーズでは、同期先テーブルがすでに存在すると作成をスキップします。用途に応じてテーブルスキーマをカスタマイズできます。

**Q3: 全量同期を行わず、増分データだけを同期するにはどうすればよいですか？**

`offset` パラメーターを `latest` に設定します。ジョブは全量同期フェーズをスキップし、最新の binlog 位置から直接読み取りを開始します。

**Q4: テーブル自動作成同期と SQL マッピング同期はどう使い分ければよいですか？**

- ミラーレプリケーション、テーブルの自動作成、同期元とのテーブルスキーマの一致が必要な場合は、テーブル自動作成同期を使用します。
- 同期先テーブル名の変更や主キー以外の列の除外だけが必要な場合は、テーブル自動作成同期を使用します。
- SQL 式、行のフィルタリング、またはデータ変換が必要な場合は、[SQL マッピングを使用した MySQL CDC](./continuous-load-mysql-table.md) を使用します。

**Q5: 単一 BE 構成でテーブルの作成に失敗した場合はどうすればよいですか？**

`TO DATABASE` でレプリカ数を明示的に 1 に指定します: `"table.create.properties.replication_num" = "1"`。

## 関連ドキュメント

- [継続的なロードの概要](./continuous-load-overview.md)
- [SQL マッピングを使用した MySQL CDC](./continuous-load-mysql-table.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [JDBC Catalog の概要](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
- [Flink CDC](https://github.com/apache/flink-cdc)
