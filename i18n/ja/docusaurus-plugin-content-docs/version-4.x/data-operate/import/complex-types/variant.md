---
{
    "title": "VARIANT",
    "language": "ja",
    "description": "CSV と JSON のデータを Doris の VARIANT カラムにロードする方法。テーブルの作成、Stream Load コマンド、型推論の確認までの手順を説明します。",
    "keywords": [
        "Doris VARIANT のロード",
        "CSV を VARIANT にロード",
        "JSON を VARIANT にロード",
        "半構造化データ",
        "Stream Load による JSON のロード",
        "ストレージフォーマット V3",
        "describe_extend_variant_column",
        "VARIANT の型推論"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Semi-structured data load / VARIANT table initialization -->

このドキュメントでは、CSV または JSON のデータを Doris の `VARIANT` カラムにロードする方法を、テーブルの作成からデータのロード、結果の確認まで説明します。

## 対象読者と事前に参照する資料

目的に合わせて、次の資料を参照してください。

| 目的 | 参照先 |
| --- | --- |
| CSV / JSON のロードをすぐに実行したい | このドキュメントを読み進めてください |
| デフォルトモード、Sparse、DOC モード、Schema Template のいずれかを選びたい | [VARIANT の使用方法と設定ガイド](../../../sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide) |
| VARIANT のクエリ構文、インデックス、制限事項、設定項目を調べたい | [VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT) |

## 制限事項

- 現在、`VARIANT` カラムへのロードでサポートされているデータ形式は **CSV** と **JSON** のみです。

## 推奨ストレージフォーマット（V3）

<!-- Knowledge type: Architecture selection decision -->

新しく作成する `VARIANT` テーブル、特にフィールド数の多い JSON を扱う場合は、別のフォーマットを使用する明確な理由がない限り、**ストレージフォーマット V3** を使用してください。設計上の理由については、[ストレージフォーマット V3](../../../table-design/storage-format)を参照してください。

テーブル作成時に `PROPERTIES` で明示的に有効にします。

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    data VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

## CSV 形式のロード

### ステップ 1：データを準備する

次の内容で `test_variant.csv` という CSV ファイルを作成します。

```SQL
14186154924|PushEvent|{"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}|{"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}|{"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}|1|2020-11-14 02:00:00
```

### ステップ 2：データベースにテーブルを作成する

次の SQL 文を実行してテーブルを作成します。

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10
properties("replication_num" = "1");
```

### ステップ 3：データをロードする

Stream Load を使用する例として、次のコマンドでデータをロードします。

```SQL
curl --location-trusted -u root:  -T test_variant.csv -H "column_separator:|" http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

ロード成功時の応答例：

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### ステップ 4：ロードされたデータを確認する

次の SQL クエリで、データが書き込まれたことを確認します。

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```

## JSON 形式のロード

### ステップ 1：データを準備する

次の内容で `test_variant.json` という JSON ファイルを作成します。

```SQL
{"id": "14186154924","type": "PushEvent","actor": {"id": 282080,"login":"brianchandotcom","display_login": "brianchandotcom","gravatar_id": "","url": "https://api.github.com/users/brianchandotcom","avatar_url": "https://avatars.githubusercontent.com/u/282080?"},"repo": {"id": 1920851,"name": "brianchandotcom/liferay-portal","url": "https://api.github.com/repos/brianchandotcom/liferay-portal"},"payload": {"push_id": 6027092734,"size": 4,"distinct_size": 4,"ref": "refs/heads/master","head": "91edd3c8c98c214155191feb852831ec535580ba","before": "abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits": [""]},"public": true,"created_at": "2020-11-13T18:00:00Z"}
```

### ステップ 2：データベースにテーブルを作成する

次の SQL 文を実行してテーブルを作成します。

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

### ステップ 3：データをロードする

Stream Load を使用する例として、次のコマンドでデータをロードします。

```SQL
curl --location-trusted -u root:  -T test_variant.json -H "format:json"  http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

ロード成功時の応答例：

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### ステップ 4：ロードされたデータを確認する

次の SQL クエリで、データが書き込まれたことを確認します。

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```

### ステップ 5：型推論を確認する

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: VARIANT subcolumn type confirmation / schema exploration -->

デフォルトでは、`DESC` は最上位の VARIANT カラムのみを表示し、内部のサブカラムは展開しません。

``` sql
mysql> desc test_variant;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| public                                                     | BOOLEAN    | Yes  | false | NULL    | NONE  |
+------------------------------------------------------------+------------+------+-------+---------+-------+
6 rows in set (0.07 sec)
```

`describe_extend_variant_column` を有効にすると、VARIANT カラムから推論されたサブカラムの型を表示できます。

``` sql
mysql> set describe_extend_variant_column = true;
Query OK, 0 rows affected (0.01 sec)

mysql> desc test_variant;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| actor.avatar_url                                           | TEXT       | Yes  | false | NULL    | NONE  |
| actor.display_login                                        | TEXT       | Yes  | false | NULL    | NONE  |
| actor.id                                                   | INT        | Yes  | false | NULL    | NONE  |
| actor.login                                                | TEXT       | Yes  | false | NULL    | NONE  |
| actor.url                                                  | TEXT       | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| payload.action                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.before                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.author_association                         | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.body                                       | TEXT       | Yes  | false | NULL    | NONE  |
....
+------------------------------------------------------------+------------+------+-------+---------+-------+
406 rows in set (0.07 sec)
```

パーティションごとの型推論結果も表示できます。

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

## よくある質問（FAQ）

### Q1：ロード時に VARIANT がサポートするデータ形式は何ですか？

現在、`VARIANT` カラムへのロードでサポートされている形式は **CSV** と **JSON** のみです。その他の形式は、ロード前に変換する必要があります。

### Q2：ストレージフォーマット V3 はいつ必要ですか？

新しく作成する `VARIANT` テーブル、特にフィールド数の多い JSON を扱う場合は、V3 ストレージフォーマットを使用してください。明確な理由がない限り、以前のストレージフォーマットは推奨されません。

### Q3：`DESC` に VARIANT から推論されたサブカラムが表示されないのはなぜですか？

デフォルトでは、`DESC` は最上位の VARIANT カラムのみを表示します。まず、次を実行します。

```sql
SET describe_extend_variant_column = true;
```

その後、`DESC` を再度実行すると、推論されたすべてのサブカラムとその型が表示されます。`DESCRIBE ${table_name} PARTITION ($partition_name)` を使用して、パーティションごとに表示することもできます。

### Q4：CSV と JSON のロード方法では、テーブル作成文にどのような違いがありますか？

テーブル作成文は基本的に同じです。唯一の違いは、CSV の例では `"replication_num" = "1"` を明示的に指定していることです。ロード時には Stream Load コマンドの指定が異なります。

| 形式 | 主なヘッダー |
| --- | --- |
| CSV | `-H "column_separator:|"` |
| JSON | `-H "format:json"` |

### Q5：Stream Load の成功はどう確認しますか？

返された JSON の `Status` フィールドを確認します。

- `Status` が `Success` なら、ロードは成功しています。
- `NumberLoadedRows` は `NumberTotalRows` と等しく、`NumberFilteredRows` は `0` である必要があります。
