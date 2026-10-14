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
| デフォルトモード、Sparse、DOC モード、Schema Template のいずれかを選びたい | [VARIANT の使用方法と設定ガイド](../../../sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide.md) |
| VARIANT のクエリ構文、インデックス、制限事項、設定項目を調べたい | [VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md) |

## 制限事項

- 以下の例では **CSV** と **JSON** のファイルをロードします。ロードジョブでは、`VARIANT` カラムにロードする文字列フィールドはすべて JSON として解析されます。そのため、Parquet の `STRING` カラムなど、ソースカラムが文字列であれば他の形式でも同じように動作します。Arrow 形式からは `VARIANT` カラムにロードできません。

## ロードした値の扱い

- **`NOT NULL` カラム：** VARIANT の値が SQL `NULL` の行はフィルタリングされます。解析に失敗して SQL `NULL` になった値も対象です。フィルタリングされた行は `max_filter_ratio`（デフォルトは `0`）に計上されるため、デフォルトではロードジョブが失敗します。
- **INSERT の動作は異なります：** `INSERT` は文字列を解析しません。`INSERT INTO t VALUES (1, '{"a": 1}')` は VARIANT の文字列 `{"a": 1}` を格納します。`INSERT INTO ... SELECT` で `s3()`、`hdfs()`、`local()` から読み込む場合も同様です。オブジェクトとして格納するには `PARSE_TO_VARIANT` を使用してください。

格納される値は正規化されます。配列の外側では、値が `null`、`{}`、`[]` のオブジェクトメンバーは削除されます。一方、クエリ内で計算した同じ値では、すべてのメンバーが保持されます。

```sql
CREATE TABLE variant_norm (k INT, v VARIANT)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO variant_norm VALUES (1, PARSE_TO_VARIANT('{"a": null, "b": {}, "c": [], "d": 1}'));

SELECT PARSE_TO_VARIANT('{"a": null, "b": {}, "c": [], "d": 1}') AS computed;
SELECT v AS stored, v['a'] IS NULL AS a_is_null FROM variant_norm;
```

```text
+--------------------------------+
| computed                       |
+--------------------------------+
| {"a":null,"b":{},"c":[],"d":1} |
+--------------------------------+

+---------+-----------+
| stored  | a_is_null |
+---------+-----------+
| {"d":1} |         1 |
+---------+-----------+
```

解析エラーとその他の正規化ルールについては、[解析エラー](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#parse-errors)と[ストレージに保持される内容](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#what-storage-keeps)を参照してください。

## 推奨ストレージフォーマット（V3）

<!-- Knowledge type: Architecture selection decision -->

新しく作成する `VARIANT` テーブル、特にフィールド数の多い JSON を扱う場合は、別のフォーマットを使用する明確な理由がない限り、**ストレージフォーマット V3** を使用してください。設計上の理由については、[ストレージフォーマット V3](../../../table-design/storage-format.md)を参照してください。

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

### ステップ 4：ロードしたデータを確認する

次の SQL クエリでデータが書き込まれたことを確認します。

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

### ステップ 4：ロードしたデータを確認する

次の SQL クエリでデータが書き込まれたことを確認します。

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

```sql
mysql> desc test_variant;
+------------+---------------------------+------+-------+---------+-------+
| Field      | Type                      | Null | Key   | Default | Extra |
+------------+---------------------------+------+-------+---------+-------+
| id         | bigint                    | No   | true  | NULL    |       |
| type       | varchar(30)               | Yes  | false | NULL    | NONE  |
| actor      | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| repo       | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| payload    | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| public     | boolean                   | Yes  | false | NULL    | NONE  |
| created_at | datetime                  | Yes  | false | NULL    | NONE  |
+------------+---------------------------+------+-------+---------+-------+
7 rows in set
```

カラムのプロパティを列挙する VARIANT の型文字列は、ここでは `variant<PROPERTIES (...)>` と省略しています。

`describe_extend_variant_column` を有効にすると、VARIANT カラムから推論されたサブカラムの型を表示できます。

```sql
mysql> set describe_extend_variant_column = true;
Query OK, 0 rows affected (0.00 sec)

mysql> desc test_variant;
+-----------------------+---------------------------+------+-------+---------+-------+
| Field                 | Type                      | Null | Key   | Default | Extra |
+-----------------------+---------------------------+------+-------+---------+-------+
| id                    | bigint                    | No   | true  | NULL    |       |
| type                  | varchar(30)               | Yes  | false | NULL    | NONE  |
| actor                 | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| repo                  | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| payload               | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| public                | boolean                   | Yes  | false | NULL    | NONE  |
| created_at            | datetime                  | Yes  | false | NULL    | NONE  |
| actor.avatar_url      | text                      | Yes  | false | NULL    | NONE  |
| actor.display_login   | text                      | Yes  | false | NULL    | NONE  |
| actor.gravatar_id     | text                      | Yes  | false | NULL    | NONE  |
| actor.id              | bigint                    | Yes  | false | NULL    | NONE  |
| actor.login           | text                      | Yes  | false | NULL    | NONE  |
| actor.url             | text                      | Yes  | false | NULL    | NONE  |
| payload.before        | text                      | Yes  | false | NULL    | NONE  |
| payload.commits       | array<text>               | Yes  | false | NULL    | NONE  |
| payload.distinct_size | bigint                    | Yes  | false | NULL    | NONE  |
| payload.head          | text                      | Yes  | false | NULL    | NONE  |
| payload.push_id       | bigint                    | Yes  | false | NULL    | NONE  |
| payload.ref           | text                      | Yes  | false | NULL    | NONE  |
| payload.size          | bigint                    | Yes  | false | NULL    | NONE  |
| repo.id               | bigint                    | Yes  | false | NULL    | NONE  |
| repo.name             | text                      | Yes  | false | NULL    | NONE  |
| repo.url              | text                      | Yes  | false | NULL    | NONE  |
+-----------------------+---------------------------+------+-------+---------+-------+
23 rows in set
```

パーティションごとの推論結果も表示できます。

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

## FAQ

### Q1：ロード時に VARIANT がサポートするデータ形式は何ですか？

ロードジョブでは、ファイル形式にかかわらず、`VARIANT` カラムにロードする文字列フィールドを JSON として解析します。このドキュメントの例では **CSV** と **JSON** を使用しています。`INSERT` では、テーブル関数からの `INSERT INTO ... SELECT` を含め、文字列値を `PARSE_TO_VARIANT` でラップしてください。

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
| CSV | `-H "column_separator:\|"` |
| JSON | `-H "format:json"` |

### Q5：Stream Load の成功はどう確認しますか？

返された JSON の `Status` フィールドを確認します。

- `Status` が `Success` なら、ロードは成功しています。
- `NumberLoadedRows` は `NumberTotalRows` と等しく、`NumberFilteredRows` は `0` である必要があります。

### Q6：`INSERT` で JSON テキストが文字列として格納されるのはなぜですか？

`INSERT` は `CAST(string AS VARIANT)` で文字列を VARIANT に変換します。この変換では文字列がそのまま保持され、JSON として解析されません。Stream Load などのロードジョブは JSON テキストを解析します。`INSERT` では、テキストを `PARSE_TO_VARIANT` でラップしてください。

```sql
INSERT INTO testdb.test_variant (id, actor)
VALUES (1, PARSE_TO_VARIANT('{"id": 282080, "login": "brianchandotcom"}'));
```
