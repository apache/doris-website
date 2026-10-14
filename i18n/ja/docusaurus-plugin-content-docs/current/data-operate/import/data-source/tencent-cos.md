---
{
    "title": "Tencent Cloud COS",
    "language": "ja",
    "description": "Tencent Cloud COS から Apache Doris にデータをロードする方法。非同期の S3 Load と同期の TVF について、手順と例を説明します。",
    "keywords": [
        "Tencent Cloud COS",
        "Tencent COS",
        "S3 Load",
        "TVF",
        "オブジェクトストレージからのロード",
        "Doris データロード",
        "COS から Doris へのロード",
        "S3 プロトコル"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import data files from Tencent Cloud COS into Apache Doris -->

Apache Doris は、S3 互換プロトコルを介して Tencent Cloud Object Storage（COS）にアクセスします。次の二つのロード方法がサポートされています。データ量と遅延に関する要件に応じて選択してください。

## 方法の選択

| ロード方法 | 実行方式 | 適した用途 | 参照先 |
| --- | --- | --- | --- |
| S3 Load | 非同期 | オフラインでの大量データの一括ロード。ロードジョブはバックグラウンドで実行され、状態を確認できます | [Broker Load マニュアル](../import-way/broker-load-manual.md) |
| TVF（テーブル値関数） | 同期 | アドホッククエリや少量データのロード。`INSERT INTO ... SELECT` で COS 上のファイルを直接読み取ります | - |

## 前提条件 {#prerequisites}

ロードを実行する前に、次の情報を用意してください。

- COS バケット名とオブジェクトのパス（例: `s3://your_bucket_name/s3load_example.csv`）
- COS のエンドポイント（例: `cos.ap-beijing.myqcloud.com`）とリージョン（例: `ap-beijing`）
- バケットへのアクセス権限を持つ AccessKey（`access_key`）と SecretKey（`secret_key`）
- アクセス可能な Apache Doris クラスター

このドキュメントの例では、次の CSV ファイル `s3load_example.csv` を使用します。

```text
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

ロード先のテーブルは、次の `test_s3load` です。

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

## 方法 1: S3 Load による非同期ロード

S3 Load は、オフライン処理や大量データのロードに適した非同期のロード方法です。詳しい仕組みについては、[Broker Load マニュアル](../import-way/broker-load-manual.md)を参照してください。

### ステップ 1: データを準備する

上記の `s3load_example.csv` ファイルを Tencent Cloud COS の対象バケットにアップロードします。

### ステップ 2: Doris にテーブルを作成する

`CREATE TABLE` 文（[前提条件](#prerequisites)を参照）を実行し、ロード先の `test_s3load` テーブルを作成します。

### ステップ 3: S3 Load ジョブを送信する

次の SQL でロードジョブを送信します。`<your-ak>` と `<your-sk>` を実際の認証情報に、`your_bucket_name` を実際のバケット名に置き換えてください。

```sql
LOAD LABEL s3_load_2022_04_01
(
    DATA INFILE("s3://your_bucket_name/s3load_example.csv")
    INTO TABLE test_s3load
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
)
WITH S3
(
    "provider" = "COS",
    "s3.endpoint" = "cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### ステップ 4: ロード結果を確認する

```sql
SELECT * FROM test_s3load;
```

結果の例:

```text
mysql> select * from test_s3load;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

## 方法 2: TVF による同期ロード

TVF（テーブル値関数）は、`S3` 関数を介して COS 上のファイルをテーブルとして読み取ります。`INSERT INTO ... SELECT` と組み合わせると同期ロードを実行でき、少量データのロードやアドホッククエリに適しています。

### ステップ 1: データを準備する

上記の `s3load_example.csv` ファイルを Tencent Cloud COS の対象バケットにアップロードします。

### ステップ 2: Doris にテーブルを作成する

`CREATE TABLE` 文（[前提条件](#prerequisites)を参照）を実行し、ロード先の `test_s3load` テーブルを作成します。

### ステップ 3: TVF でデータをロードする

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "COS",
    "s3.endpoint" = "cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

### ステップ 4: ロード結果を確認する

```sql
SELECT * FROM test_s3load;
```

結果の例:

```text
mysql> select * from test_s3load;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

## 主なパラメータ

<!-- Knowledge type: Configuration parameters -->

次の表に、Tencent Cloud COS からデータをロードする際によく使用するパラメータを示します。

| パラメータ | 説明 | 例 |
| --- | --- | --- |
| `provider` | オブジェクトストレージのプロバイダー。Tencent Cloud COS の場合は `COS` に固定します | `COS` |
| `s3.endpoint` | バケットのリージョンに対応する COS エンドポイント | `cos.ap-beijing.myqcloud.com` |
| `s3.region` | COS のリージョン | `ap-beijing` |
| `s3.access_key` | Tencent Cloud のアクセスキー ID | `<your-ak>` |
| `s3.secret_key` | Tencent Cloud のシークレットアクセスキー | `<your-sk>` |
| `uri` / `DATA INFILE` | COS 上のファイルのパス。必ず `s3://` プレフィックスを使用します | `s3://your_bucket_name/s3load_example.csv` |
| `format` / `FORMAT AS` | ファイル形式（CSV、Parquet、ORC など） | `csv` |
| `column_separator` / `COLUMNS TERMINATED BY` | 列区切り文字 | `,` |
| `csv_schema` | TVF モードで CSV の列スキーマを指定します | `user_id:int;name:string;age:int` |
| `timeout` | S3 Load ジョブのタイムアウト（秒） | `3600` |

## FAQ

<!-- Knowledge type: Troubleshooting -->

**Q1: S3 Load と TVF のどちらを選べばよいですか？**

- バックグラウンドで非同期に処理できる大量のデータには、**S3 Load** を選びます。
- すぐに結果が必要な少量のデータや、SELECT クエリ内で COS 上のファイルを使用する場合は、**TVF** を選びます。

**Q2: `s3.endpoint` の値はどう調べればよいですか？**

バケットのリージョンに対応する COS のパブリックドメイン名または内部ドメイン名を使用します。たとえば、北京リージョンでは `cos.ap-beijing.myqcloud.com`、上海リージョンでは `cos.ap-shanghai.myqcloud.com` を使用します。詳しくは、Tencent Cloud COS の公式ドキュメントを参照してください。

**Q3: URI は `s3://` で始める必要がありますか？**

はい。Doris は S3 プロトコルを介して COS にアクセスするため、`DATA INFILE`（S3 Load）と TVF の `uri` はどちらも `s3://bucket_name/path` 形式を使用する必要があります。

**Q4: 結果の行順が元のファイルと異なるのはなぜですか？**

Doris のテーブルは分散されています。データはバケットキー `HASH(user_id)` に従って複数のタブレットに分散され、`SELECT *` では特定の行順は保証されません。結果を並べ替えるには、明示的に `ORDER BY` を使用してください。

**Q5: ロードに失敗した場合はどう調査すればよいですか？**

- `access_key` / `secret_key` に対象バケットの読み取り権限があるか確認します。
- `s3.endpoint` と `s3.region` がバケットのリージョンと一致するか確認します。
- S3 Load ジョブの場合は、`SHOW LOAD WHERE LABEL = 's3_load_2022_04_01';` を実行してエラーの詳細を確認します。
