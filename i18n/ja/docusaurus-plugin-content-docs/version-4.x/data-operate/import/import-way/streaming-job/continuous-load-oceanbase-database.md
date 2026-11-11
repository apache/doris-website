---
{
    "title": "OceanBase CDC による自動テーブル作成",
    "language": "ja",
    "sidebar_label": "自動テーブル作成同期",
    "description": "Streaming Job を使用して、OceanBase MySQL 互換モードの主キー テーブルから Doris へ全量データと増分データを継続的に同期する方法を説明します。",
    "keywords": [
        "OceanBase 自動テーブル作成同期",
        "OceanBase CDC",
        "OBBinlog",
        "Doris Streaming Job",
        "継続的データロード",
        "全量および増分同期",
        "自動テーブル作成"
    ]
}
---

:::caution 実験的機能

Doris の継続的データロードは実験的機能であり、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror an OceanBase database in MySQL compatibility mode to Doris -->

OceanBase CDC の自動テーブル作成は `FROM OCEANBASE (...) TO DATABASE (...)` を使用します。Doris は OBBinlog サービスを介して全量および増分データを読み取り、アップストリームのスキーマに基づいて Doris Unique Key テーブルを自動的に作成します。`include_tables` を使用して、単一テーブル、複数テーブル、またはデータベース内のすべてのテーブルを同期できます。

OceanBase CDC の継続的データロードは現在、OceanBase MySQL 互換モードと自動テーブル作成同期のみをサポートし、Oracle 互換モードおよび SQL マッピング同期はサポートしません。

### 適用シナリオ {#applicable-scenarios}

- OceanBase のテーブル群またはデータベース全体を Doris にミラーリングする。
- アップストリームのスキーマから Doris にターゲットテーブルと主キーを作成させる。
- 初回の全量ロードを実行してから、増分変更を継続的に同期する。
- SQL 式、行フィルター、データ変換を使用せずに、ターゲットテーブルの名前変更や列の除外を行う。

### 機能と制限 {#capabilities-and-limitations}

| 項目 | 説明 |
| --- | --- |
| 互換モード | OceanBase MySQL 互換モードのみ |
| 同期方式 | 自動テーブル作成同期のみ。SQL マッピング同期はサポートされない |
| 一貫性セマンティクス | at-least-once |
| テーブルタイプ | アップストリームのテーブルには主キーが必要。自動作成される Doris テーブルは Unique Key モデルを使用する |
| 権限 | Load 権限が必要。ターゲットテーブルが存在しない場合は Create 権限も必要 |
| Schema Change | `ADD COLUMN` と `DROP COLUMN` を同期する。[Schema Change 同期](./schema-change-oceanbase.md) を参照 |
| データ型 | MySQL 互換の型変換を使用する。[データ型マッピング](./data-type-mapping-oceanbase.md) を参照 |

## 前提条件 {#prerequisites}

ジョブを作成する前に、次を確認してください。

1. OceanBase が MySQL 互換モードで実行されている。Doris はジョブの作成時に `SHOW VARIABLES LIKE 'ob_compatibility_mode'` を実行してモードを検証します。
2. OBBinlog サービスがデプロイされ、利用可能になっている。その MySQL プロトコルエンドポイントに対して `SHOW MASTER STATUS` を実行すると、有効な binlog ファイルとポジションが返される。
3. Doris FE、BE、および CDC Client から OBBinlog サービスにアクセスできる。
4. 互換性のある MySQL Connector/J ドライバーが利用可能で、`jdbc_url` が `jdbc:mysql://` で始まっている。
5. ソースアカウントが、同期対象範囲のテーブル、スキーマ、binlog を読み取れる。
6. 同期対象となるすべてのアップストリームテーブルに主キーがある。

## クイックスタート {#quick-start}

### 手順 1: ロードジョブを作成する {#step-1-create-a-load-job}

次の例では、`source_db` の `users` テーブルと `orders` テーブルを同期します。

```sql
CREATE JOB oceanbase_db_sync
ON STREAMING
FROM OCEANBASE (
    "jdbc_url" = "jdbc:mysql://127.0.0.1:2883",
    "driver_url" = "mysql-connector-j-8.4.0.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user" = "root@test",
    "password" = "123456",
    "database" = "source_db",
    "include_tables" = "users,orders",
    "offset" = "initial"
)
TO DATABASE target_db (
    "table.create.properties.replication_num" = "1"
);
```

- `jdbc_url` は OBBinlog サービスの MySQL プロトコルポートを指します。デプロイ環境で設定したポートを使用してください。
- `offset = "initial"` は、既存の行を先にロードしてから binlog の変更を継続的に同期することを示します。
- `include_tables` を省略すると、`database` 内の条件を満たすすべてのテーブルが同期されます。
- 単一 BE のデプロイでは、`replication_num` を `1` に設定します。本番環境では、クラスターの規模に応じてレプリカ数を設定してください。

### 手順 2: ロードステータスを確認する {#step-2-check-load-status}

```sql
SELECT Name, Status, CurrentOffset, ErrorMsg
FROM jobs("type" = "insert")
WHERE Name = "oceanbase_db_sync";
```

ジョブが正常に実行されている場合、`Status` は `RUNNING` です。

```text
+-------------------+---------+-----------------------------------------------+----------+
| Name              | Status  | CurrentOffset                                 | ErrorMsg |
+-------------------+---------+-----------------------------------------------+----------+
| oceanbase_db_sync | RUNNING | {"file":"binlog.000001","pos":"154", ...} | NULL     |
+-------------------+---------+-----------------------------------------------+----------+
```

### 手順 3: 増分同期を検証する {#step-3-verify-incremental-sync}

OceanBase のソーステーブルに対して `INSERT`、`UPDATE`、または `DELETE` を実行した後、対応する Doris テーブルをクエリして、変更が同期されていることを確認します。

```sql
SELECT * FROM target_db.users ORDER BY id;
```

一時停止、再開、削除、および Task クエリ操作については、[継続的データロードの概要](./continuous-load-overview.md#common-operations) を参照してください。

## データソースパラメーター {#data-source-parameters}

| パラメーター | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `jdbc_url` | はい | - | OBBinlog サービスの JDBC 接続文字列。`jdbc:mysql://` で始まる必要があります。 |
| `driver_url` | はい | - | MySQL Connector/J ドライバー jar のパス。ファイル名、ローカルの絶対パス、または HTTP URL をサポートします。 |
| `driver_class` | はい | - | MySQL JDBC ドライバークラス。例: `com.mysql.cj.jdbc.Driver`。 |
| `user` | はい | - | OceanBase のユーザー名。OceanBase で必要なユーザー名形式を使用してテナント情報を含めます。 |
| `password` | はい | - | OceanBase のユーザーパスワード。 |
| `database` | はい | - | OceanBase のデータベース名。 |
| `include_tables` | いいえ | - | 同期するテーブル名。複数のテーブルはコンマで区切ります。省略すると、データベース内のすべてのテーブルが同期されます。 |
| `exclude_tables` | いいえ | - | 同期しないテーブル名。複数のテーブルはコンマで区切ります。このパラメーターは `include_tables` が設定されていない場合にのみ有効です。 |
| `table.<table_name>.target_table` | いいえ | ソーステーブル名 | ソーステーブルの Doris ターゲットテーブル名を設定します。 |
| `table.<table_name>.exclude_columns` | いいえ | - | ソーステーブルから非キー列を除外します。複数の列はコンマで区切ります。各列は存在している必要があり、主キー列は除外できません。 |
| `offset` | いいえ | `latest` | 起動位置。`initial`: 全量および増分同期。`snapshot`: 全量同期のみ。`earliest`: 利用可能な最も早い binlog ポジションから開始。`latest`: ジョブの起動後の変更のみを同期。`{"file":"binlog.000001","pos":"154"}` のような正確なポジションもサポートされます。 |
| `snapshot_split_size` | いいえ | `40960` | 全量同期フェーズで各 split に含める行数。正の整数である必要があります。 |
| `snapshot_parallelism` | いいえ | `1` | 全量同期フェーズで単一 Task が同時にスケジュールできる split の最大数。正の整数である必要があります。 |
| `skip_snapshot_backfill` | いいえ | `true` | スナップショットフェーズ中の binlog バックフィルをスキップするかどうか。自動テーブル作成同期は at-least-once セマンティクスを提供します。 |
| `server_id` | いいえ | 自動生成 | CDC reader のサーバー ID。`5400` のような単一値、または `5400-5408` のような閉区間をサポートします。範囲には `snapshot_parallelism` 以上の ID が含まれている必要があります。 |
| `ssl_mode` | いいえ | `disable` | SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | 条件付きで必須 | - | `ssl_mode` が `verify-ca` の場合に必要です。`FILE:<file_name>` 形式を使用し、まず [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) でファイルをアップロードしてください。 |

`schema`、`slot_name`、`publication_name` パラメーターはサポートされていません。いずれかを指定すると、ジョブの作成に失敗します。

## リファレンスマニュアル {#reference-manual}

### ロードステートメント {#load-statement}

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
[COMMENT <comment>]
FROM OCEANBASE (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
);
```

| モジュール | 説明 |
| --- | --- |
| `job_name` | ジョブ名。 |
| `job_properties` | `max_interval` などの共通 Job パラメーター。 |
| `comment` | ジョブコメント。 |
| `source_properties` | OceanBase データソースパラメーター。 |
| `target_properties` | Doris ターゲットデータベースパラメーター。 |

### Doris ターゲットデータベースパラメーター {#doris-target-database-parameters}

| パラメーター | デフォルト | 説明 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris がテーブルを作成するときにテーブルプロパティを追加します。例: `table.create.properties.replication_num`。 |
| `load.strict_mode` | `false` | Stream Load の strict mode を有効にするかどうか。 |
| `load.max_filter_ratio` | `0` | サンプリングウィンドウで許容される最大フィルター比率。範囲は `[0, 1]` です。この値を超えるとジョブは一時停止します。 |

## 注意事項とベストプラクティス {#considerations-and-best-practices}

- 本番環境で同期範囲を拡大する前に、少数のテーブルを使用して OBBinlog の接続性、型マッピング、増分レイテンシーを検証してください。
- `include_tables` を使用して同期範囲を明示的に定義し、後からデータベースに追加された無関係なテーブルが自動的に含まれないようにします。
- サポートされていない非キー列は `table.<table_name>.exclude_columns` で除外します。主キー列は除外できません。
- サポートされていないスキーマ変更を行う前にジョブを一時停止し、Doris テーブルに互換性のある変更を適用してからジョブを再開してください。
- `CurrentOffset`、`LagBytes`、`ErrorMsg` を監視して、ジョブが継続的に進行し、自動的に一時停止されていないことを確認してください。

## FAQ {#faq}

**Q1: OceanBase Oracle 互換モードはサポートされていますか？**

いいえ。Doris はジョブの作成時に `ob_compatibility_mode` を確認し、MySQL 互換モード以外のモードを拒否します。

**Q2: SQL マッピング同期はサポートされていますか？**

いいえ。OceanBase が現在サポートしているのは、`FROM OCEANBASE (...) TO DATABASE (...)` 自動テーブル作成同期のみです。

**Q3: ジョブの起動後に発生した変更のみを同期するにはどうすればよいですか？**

`offset` を `latest` に設定します。ジョブが `RUNNING` になった後に存在する行は、スナップショットを通じてロードされません。

**Q4: 既存のターゲットテーブルは上書きされますか？**

いいえ。自動テーブル作成では、既に存在するターゲットテーブルはスキップされます。その主キーと列型がソーステーブルと互換性を持つことを確認してください。

## 関連ドキュメント {#related-documents}

- [継続的データロードの概要](./continuous-load-overview.md)
- [OceanBase Schema Change 同期](./schema-change-oceanbase.md)
- [OceanBase データ型マッピング](./data-type-mapping-oceanbase.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
