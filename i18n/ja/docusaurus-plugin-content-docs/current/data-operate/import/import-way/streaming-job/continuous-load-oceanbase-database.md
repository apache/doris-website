---
{
    "title": "テーブル自動作成を使用する OceanBase CDC",
    "language": "ja",
    "sidebar_label": "テーブル自動作成同期",
    "description": "ストリーミングジョブを使用して、OceanBase の MySQL 互換モードにある主キーテーブルの全量データと増分データを Doris に継続的に同期する方法を説明します。",
    "keywords": [
        "OceanBase テーブル自動作成同期",
        "OceanBase CDC",
        "OBBinlog",
        "Doris ストリーミングジョブ",
        "継続ロード",
        "全量同期と増分同期",
        "テーブル自動作成"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror an OceanBase database in MySQL compatibility mode to Doris -->

テーブル自動作成を使用する OceanBase CDC では、`FROM OCEANBASE (...) TO DATABASE (...)` を使用します。Doris は OBBinlog サービスを介して全量データと増分データを読み取り、同期元のスキーマに基づいて Doris の Unique Key テーブルを自動的に作成します。`include_tables` を使用すると、データベース内の単一のテーブル、複数のテーブル、またはすべてのテーブルを同期できます。

:::caution 実験的機能

OceanBase CDC の継続ロードは、Doris 4.1.4 以降で実験的機能として利用できます。現在サポートされるのは、OceanBase の MySQL 互換モードとテーブル自動作成同期のみです。Oracle 互換モードと SQL マッピング同期はサポートされません。

:::

### 適用シナリオ

- OceanBase のテーブル群またはデータベース全体を Doris にミラーリングする。
- 同期元のスキーマに基づいて、Doris に同期先テーブルと主キーを作成させる。
- 初回の全量ロードを実行し、その後の増分変更を継続的に同期する。
- SQL 式、行フィルター、データ変換を使用せずに、同期先テーブルの名前を変更したり、カラムを除外したりする。

### 機能と制限

| 項目 | 説明 |
| --- | --- |
| 互換モード | OceanBase の MySQL 互換モードのみ |
| 同期方式 | テーブル自動作成同期のみ。SQL マッピング同期はサポートされません |
| 一貫性のセマンティクス | At-least-once |
| テーブルの種類 | 同期元テーブルには主キーが必要です。自動作成される Doris テーブルには Unique Key モデルを使用します |
| 権限 | Load 権限が必要です。同期先テーブルが存在しない場合は Create 権限も必要です |
| スキーマ変更 | `ADD COLUMN` と `DROP COLUMN` を同期します。詳しくは[スキーマ変更の同期](./schema-change-oceanbase.md)を参照してください |
| データ型 | MySQL 互換の型変換を使用します。詳しくは[データ型のマッピング](./data-type-mapping-oceanbase.md)を参照してください |

## 前提条件

ジョブを作成する前に、以下を確認してください。

1. OceanBase が MySQL 互換モードで稼働していること。Doris はジョブの作成時に `SHOW VARIABLES LIKE 'ob_compatibility_mode'` を実行して、互換モードを検証します。
2. OBBinlog サービスがデプロイされ、利用可能であること。その MySQL プロトコルのエンドポイントに対して `SHOW MASTER STATUS` を実行すると、有効な binlog ファイルと位置が返されます。
3. Doris の FE、BE、CDC Client から OBBinlog サービスにアクセスできること。
4. 互換性のある MySQL Connector/J ドライバーが利用可能で、`jdbc_url` が `jdbc:mysql://` で始まること。
5. 同期元のアカウントに、同期対象のテーブル、スキーマ、binlog を読み取る権限があること。
6. 同期対象となるすべての同期元テーブルに主キーがあること。

## クイックスタート

### ステップ 1: ロードジョブを作成する

次の例では、`users` テーブルと `orders` テーブルを `source_db` から同期します。

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

- `jdbc_url` には、OBBinlog サービスの MySQL プロトコル用ポートを指定します。デプロイ環境で設定したポートを使用してください。
- `offset = "initial"` は、既存の行を先にロードし、その後 binlog の変更を継続的に同期します。
- `include_tables` を省略すると、`database` 内の対象となるすべてのテーブルが同期されます。
- BE が一台のみの環境では、`replication_num` を `1` に設定します。本番環境では、クラスターの規模に応じてレプリカ数を設定してください。

### ステップ 2: ロードの状態を確認する

```sql
SELECT Name, Status, CurrentOffset, ErrorMsg
FROM jobs("type" = "insert")
WHERE Name = "oceanbase_db_sync";
```

ジョブが正常に稼働している場合、`Status` は `RUNNING` です。

```text
+-------------------+---------+-----------------------------------------------+----------+
| Name              | Status  | CurrentOffset                                 | ErrorMsg |
+-------------------+---------+-----------------------------------------------+----------+
| oceanbase_db_sync | RUNNING | {"file":"binlog.000001","pos":"154", ...} | NULL     |
+-------------------+---------+-----------------------------------------------+----------+
```

### ステップ 3: 増分同期を確認する

OceanBase の同期元テーブルで `INSERT`、`UPDATE`、または `DELETE` を実行した後、対応する Doris テーブルをクエリして、変更が同期されたことを確認します。

```sql
SELECT * FROM target_db.users ORDER BY id;
```

一時停止、再開、削除、Task のクエリ操作については、[継続ロードの概要](./continuous-load-overview.md#common-operations)を参照してください。

## データソースのパラメータ

| パラメータ | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `jdbc_url` | はい | - | OBBinlog サービスの JDBC 接続文字列。`jdbc:mysql://` で始まる必要があります。 |
| `driver_url` | はい | - | MySQL Connector/J ドライバーの jar ファイルのパス。ファイル名、ローカルの絶対パス、HTTP URL を指定できます。 |
| `driver_class` | はい | - | MySQL JDBC ドライバーのクラス。例: `com.mysql.cj.jdbc.Driver`。 |
| `user` | はい | - | OceanBase のユーザー名。OceanBase で必要なユーザー名の形式を使用して、テナント情報を含めてください。 |
| `password` | はい | - | OceanBase ユーザーのパスワード。 |
| `database` | はい | - | OceanBase のデータベース名。 |
| `include_tables` | いいえ | - | 同期するテーブル名。カンマで区切ります。省略すると、データベース内のすべてのテーブルが同期されます。 |
| `exclude_tables` | いいえ | - | 同期対象から除外するテーブル名。カンマで区切ります。このパラメータは `include_tables` が設定されていない場合にのみ有効です。 |
| `table.<table_name>.target_table` | いいえ | 同期元のテーブル名 | 同期元テーブルに対応する Doris の同期先テーブル名を設定します。 |
| `table.<table_name>.exclude_columns` | いいえ | - | 同期元テーブルで除外する主キー以外のカラムを、カンマ区切りで指定します。各カラムは存在する必要があり、主キーカラムは指定できません。 |
| `offset` | いいえ | `latest` | 開始位置。`initial`: 全量同期と増分同期、`snapshot`: 全量同期のみ、`earliest`: 利用可能な最も古い binlog の位置から開始、`latest`: ジョブ開始後の変更のみを同期します。`{"file":"binlog.000001","pos":"154"}` のような正確な位置も指定できます。 |
| `snapshot_split_size` | いいえ | `40960` | 全量同期フェーズで、各分割に含める行数。正の整数である必要があります。 |
| `snapshot_parallelism` | いいえ | `1` | 全量同期フェーズで、単一の Task が同時にスケジュールする分割の最大数。正の整数である必要があります。 |
| `skip_snapshot_backfill` | いいえ | `true` | スナップショットフェーズで binlog のバックフィルをスキップするかどうか。テーブル自動作成同期では At-least-once セマンティクスが提供されます。 |
| `server_id` | いいえ | 自動生成 | CDC リーダーのサーバー ID。`5400` のような単一の値、または `5400-5408` のような両端を含む範囲を指定できます。範囲には `snapshot_parallelism` 個以上の ID が含まれる必要があります。 |
| `ssl_mode` | いいえ | `disable` | SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | 条件付きで必須 | - | `ssl_mode` が `verify-ca` の場合に必要です。`FILE:<file_name>` 形式を使用し、先に [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md) でファイルをアップロードしてください。 |

`schema`、`slot_name`、`publication_name` パラメータはサポートされません。いずれかを指定すると、ジョブの作成に失敗します。

## リファレンスマニュアル

### ロード文

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

| 項目 | 説明 |
| --- | --- |
| `job_name` | ジョブ名。 |
| `job_properties` | `max_interval` や `compute_group` などの共通ジョブパラメータ。 |
| `comment` | ジョブのコメント。 |
| `source_properties` | OceanBase データソースのパラメータ。 |
| `target_properties` | Doris の同期先データベースのパラメータ。 |

### Doris の同期先データベースのパラメータ

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris がテーブルを作成する際に、テーブルのプロパティを追加します。例: `table.create.properties.replication_num`。 |
| `load.strict_mode` | `false` | Stream Load の strict mode を有効にするかどうか。 |
| `load.max_filter_ratio` | `0` | サンプリングウィンドウで許容されるフィルター比率の上限。範囲は `[0, 1]` です。この値を超えると、ジョブが一時停止されます。 |

## 注意事項とベストプラクティス

- 本番環境で同期対象を広げる前に、少数のテーブルで OBBinlog への接続、型のマッピング、増分同期の遅延を確認してください。
- 後から追加された無関係なテーブルが自動的に同期されないように、`include_tables` で同期対象を明示的に指定してください。
- サポートされていない主キー以外のカラムは、`table.<table_name>.exclude_columns` で除外してください。主キーカラムは除外できません。
- サポートされていないスキーマ変更を行う前にジョブを一時停止し、Doris テーブルに互換性のある変更を適用してからジョブを再開してください。
- `CurrentOffset`、`LagBytes`、`ErrorMsg` を監視し、ジョブが処理を続けていて、自動的に一時停止されていないことを確認してください。

## FAQ

**Q1: OceanBase の Oracle 互換モードはサポートされますか？**

いいえ。Doris はジョブの作成時に `ob_compatibility_mode` を確認し、MySQL 互換モード以外を拒否します。

**Q2: SQL マッピング同期はサポートされますか？**

いいえ。OceanBase で現在サポートされるのは、`FROM OCEANBASE (...) TO DATABASE (...)` によるテーブル自動作成同期のみです。

**Q3: ジョブの開始後に発生した変更だけを同期するにはどうすればよいですか？**

`offset` を `latest` に設定します。ジョブが `RUNNING` になる前から存在する行は、スナップショットによってロードされません。

**Q4: 既存の同期先テーブルは上書きされますか？**

いいえ。テーブル自動作成では、既存の同期先テーブルに対する作成処理をスキップします。その主キーとカラムの型が同期元テーブルと互換性があることを確認してください。

## 関連ドキュメント

- [継続ロードの概要](./continuous-load-overview.md)
- [OceanBase のスキーマ変更の同期](./schema-change-oceanbase.md)
- [OceanBase のデータ型のマッピング](./data-type-mapping-oceanbase.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
