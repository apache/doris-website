---
{
    "title": "自動テーブル作成による OceanBase CDC",
    "language": "ja",
    "sidebar_label": "自動テーブル作成同期",
    "description": "Streaming Job を通じて、OceanBase の MySQL 互換モードにある主キーを持つテーブルの全量データと増分データを Doris に継続的に同期する方法を学びます。",
    "keywords": [
        "OceanBase 自動テーブル作成同期",
        "OceanBase CDC",
        "OBBinlog",
        "Doris Streaming Job",
        "継続データロード",
        "全量・増分同期",
        "自動テーブル作成"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror an OceanBase database in MySQL compatibility mode to Doris -->

OceanBase CDC の自動テーブル作成同期では、`FROM OCEANBASE (...) TO DATABASE (...)` を使用します。Doris は OBBinlog サービスを介して全量データと増分データを読み取り、上流スキーマから Doris Unique Key テーブルを自動的に作成します。`include_tables` を使用すると、データベース内の 1 つ、複数、またはすべてのテーブルを同期できます。

:::caution 実験的機能

OceanBase CDC の継続データロードは、Doris 4.1.4 以降、実験的機能として利用できます。現在は OceanBase の MySQL 互換モードと自動テーブル作成同期のみをサポートしており、Oracle 互換モードと SQL Mapping Sync はサポートしていません。

:::

### 適用シナリオ {#applicable-scenarios}

- OceanBase のテーブルグループまたはデータベース全体を Doris にミラーリングする。
- Doris に上流スキーマからターゲットテーブルと主キーを作成させる。
- 初回の全量データロードを実行した後、増分変更を継続的に同期する。
- SQL 式、行フィルター、データ変換を使用せずに、ターゲットテーブルの名前変更または列の除外を行う。

### 機能と制限事項 {#capabilities-and-limitations}

| 項目 | 説明 |
| --- | --- |
| 互換モード | OceanBase MySQL 互換モードのみ |
| 同期方式 | Auto Table Creation Sync のみ。SQL Mapping Sync はサポートされません |
| 整合性セマンティクス | At-least-once |
| テーブルタイプ | 上流テーブルには主キーが必要です。自動作成される Doris テーブルは Unique Key モデルを使用します |
| 権限 | Load 権限が必要です。ターゲットテーブルが存在しない場合は Create 権限も必要です |
| Schema Change | `ADD COLUMN` と `DROP COLUMN` を同期します。詳しくは [Schema Change 同期](./schema-change-oceanbase.md) を参照してください |
| データ型 | MySQL 互換の型変換を使用します。詳しくは [データ型マッピング](./data-type-mapping-oceanbase.md) を参照してください |

## 前提条件 {#prerequisites}

ジョブを作成する前に、次の点を確認してください。

1. OceanBase が MySQL 互換モードで実行されている。Doris はジョブ作成時に `SHOW VARIABLES LIKE 'ob_compatibility_mode'` を実行してモードを検証します。
2. OBBinlog サービスがデプロイされ、利用可能である。その MySQL プロトコルエンドポイントに対して `SHOW MASTER STATUS` を実行すると、有効な binlog ファイルと位置が返される。
3. Doris FE、BE、CDC Client から OBBinlog サービスにアクセスできる。
4. 互換性のある MySQL Connector/J ドライバーが利用可能で、`jdbc_url` が `jdbc:mysql://` で始まっている。
5. ソースアカウントが同期範囲内のテーブル、スキーマ、binlog を読み取れる。
6. 同期対象となるすべての上流テーブルに主キーがある。

## クイックスタート {#quick-start}

### 手順 1: ロードジョブを作成する {#step-1-create-a-load-job}

次の例では、`source_db` 内の `users` テーブルと `orders` テーブルを同期します。

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

- `jdbc_url` は OBBinlog サービスの MySQL プロトコルポートを指します。デプロイ時に設定したポートを使用してください。
- `offset = "initial"` は、既存の行を先にロードしてから binlog の変更を継続的に同期することを示します。
- `include_tables` を省略すると、`database` 内の同期対象となるすべてのテーブルが同期されます。
- 単一 BE のデプロイでは `replication_num` を `1` に設定します。本番環境では、クラスターサイズに応じてレプリカ数を設定してください。

### 手順 2: ロード状態を確認する {#step-2-check-load-status}

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

### 手順 3: 増分同期を確認する {#step-3-verify-incremental-sync}

OceanBase のソーステーブルに対して `INSERT`、`UPDATE`、または `DELETE` を実行した後、対応する Doris テーブルをクエリし、変更が同期されていることを確認します。

```sql
SELECT * FROM target_db.users ORDER BY id;
```

一時停止、再開、削除、Task クエリ操作については、[継続データロードの概要](./continuous-load-overview.md#common-operations) を参照してください。

## データソースパラメータ {#data-source-parameters}

| パラメータ | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `jdbc_url` | はい | - | OBBinlog サービスの JDBC 接続文字列。`jdbc:mysql://` で始まる必要があります。 |
| `driver_url` | はい | - | MySQL Connector/J ドライバー jar のパス。ファイル名、ローカルの絶対パス、または HTTP URL を使用できます。 |
| `driver_class` | はい | - | MySQL JDBC ドライバークラス。例: `com.mysql.cj.jdbc.Driver`。 |
| `user` | はい | - | OceanBase のユーザー名。OceanBase で必要なユーザー名形式を使用してテナント情報を含めてください。 |
| `password` | はい | - | OceanBase のユーザーパスワード。 |
| `database` | はい | - | OceanBase のデータベース名。 |
| `include_tables` | いいえ | - | 同期するテーブル名をコンマで区切って指定します。省略すると、データベース内のすべてのテーブルが同期されます。 |
| `exclude_tables` | いいえ | - | 同期しないテーブル名をコンマで区切って指定します。このパラメータは `include_tables` が設定されていない場合にのみ有効です。 |
| `table.<table_name>.target_table` | いいえ | ソーステーブル名 | ソーステーブルの Doris ターゲットテーブル名を設定します。 |
| `table.<table_name>.exclude_columns` | いいえ | - | ソーステーブルのキー以外の列をコンマで区切って除外します。各列が存在している必要があり、主キー列は除外できません。 |
| `offset` | いいえ | `latest` | 起動位置。`initial`: 全量・増分同期、`snapshot`: 全量同期のみ、`earliest`: 利用可能な最も早い binlog 位置から開始、`latest`: ジョブ開始後の変更のみを同期します。`{"file":"binlog.000001","pos":"154"}` のような正確な位置もサポートされます。 |
| `snapshot_split_size` | いいえ | `40960` | 全量同期フェーズで各 split に含める行数。正の整数である必要があります。 |
| `snapshot_parallelism` | いいえ | `1` | 全量同期フェーズで 1 つの Task が同時にスケジュールできる split の最大数。正の整数である必要があります。 |
| `skip_snapshot_backfill` | いいえ | `true` | スナップショットフェーズ中の binlog backfill をスキップするかどうか。Auto Table Creation Sync は at-least-once セマンティクスを提供します。 |
| `server_id` | いいえ | 自動生成 | CDC Reader のサーバー ID。`5400` のような単一値、または `5400-5408` のような閉区間を指定できます。範囲には少なくとも `snapshot_parallelism` 個の ID が含まれている必要があります。 |
| `ssl_mode` | いいえ | `disable` | SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | 条件付きで必須 | - | `ssl_mode` が `verify-ca` の場合に必要です。形式は `FILE:<file_name>` とし、先に [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) でファイルをアップロードしてください。 |

`schema`、`slot_name`、`publication_name` パラメータはサポートされていません。いずれかを指定すると、ジョブの作成に失敗します。

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
| `job_properties` | `max_interval` や `compute_group` などの共通 Job パラメータ。 |
| `comment` | ジョブコメント。 |
| `source_properties` | OceanBase データソースパラメータ。 |
| `target_properties` | Doris ターゲットデータベースパラメータ。 |

### Doris ターゲットデータベースパラメータ {#doris-target-database-parameters}

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris がテーブルを作成するときに追加するテーブルプロパティ。例: `table.create.properties.replication_num`。 |
| `load.strict_mode` | `false` | Stream Load で strict mode を有効にするかどうか。 |
| `load.max_filter_ratio` | `0` | サンプリングウィンドウで許容される最大フィルター率。範囲は `[0, 1]` です。この値を超えるとジョブは一時停止します。 |

## 注意事項とベストプラクティス {#considerations-and-best-practices}

- 本番環境で同期範囲を拡大する前に、少数のテーブルを使用して OBBinlog の接続性、型マッピング、増分レイテンシーを確認してください。
- `include_tables` を使用して同期範囲を明示的に定義し、後からデータベースに追加された無関係なテーブルが自動的に含まれないようにします。
- サポートされていないキー以外の列は、`table.<table_name>.exclude_columns` で除外します。主キー列は除外できません。
- サポートされていないスキーマ変更を行う前にジョブを一時停止し、Doris テーブルに互換性のある変更を適用してからジョブを再開してください。
- `CurrentOffset`、`LagBytes`、`ErrorMsg` を監視して、ジョブが継続して進行し、自動的に一時停止されていないことを確認してください。

## FAQ {#faq}

**Q1: OceanBase Oracle 互換モードはサポートされていますか？**

いいえ。Doris はジョブ作成時に `ob_compatibility_mode` を確認し、MySQL 互換モード以外のモードを拒否します。

**Q2: SQL Mapping Sync はサポートされていますか？**

いいえ。OceanBase が現在サポートしているのは、`FROM OCEANBASE (...) TO DATABASE (...)` による Auto Table Creation Sync のみです。

**Q3: ジョブ開始後に発生した変更だけを同期するにはどうすればよいですか？**

`offset` を `latest` に設定します。ジョブが `RUNNING` に到達する前に存在していた行は、スナップショットによってロードされません。

**Q4: 既存のターゲットテーブルは上書きされますか？**

いいえ。自動テーブル作成では、すでに存在するターゲットテーブルをスキップします。主キーと列型がソーステーブルと互換性を持つことを確認してください。

## 関連ドキュメント {#related-documents}

- [継続データロードの概要](./continuous-load-overview.md)
- [OceanBase Schema Change 同期](./schema-change-oceanbase.md)
- [OceanBase データ型マッピング](./data-type-mapping-oceanbase.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
