---
{
    "title": "Amazon S3",
    "language": "ja",
    "description": "Amazon S3 から Doris にデータをロードする方法。S3 Load による非同期ロードと TVF による同期ロードの手順、パラメータ、例を説明します。",
    "keywords": [
        "Amazon S3 ロード",
        "Doris S3 Load",
        "S3 TVF",
        "AWS S3 データロード",
        "Broker Load S3",
        "AWS Assume Role"
    ]
}
---

<!-- Knowledge type: Procedure / Data loading -->
<!-- Use case: Load files from AWS S3 into Doris -->

Doris では、AWS S3 上のファイルをロードする方法として、非同期と同期のそれぞれに適した次の二つを提供しています。

| 方法 | 種別 | 用途 |
| --- | --- | --- |
| **S3 Load** | 非同期 | 大量データの一括ロード、定期実行ジョブ、高いスループットと安定性が必要なオフラインロード |
| **TVF（テーブル値関数）** | 同期 | アドホッククエリ、ETL 処理、`INSERT INTO ... SELECT` と組み合わせた同期書き込み |

> ヒント: S3 Load は Broker Load を基に実装されています。詳しい動作については、[Broker Load マニュアル](../import-way/broker-load-manual.md)を参照してください。

## 方法 1: S3 Load でロードする（非同期）

<!-- Knowledge type: Procedure -->

S3 Load は非同期のロード方法です。ジョブの送信後すぐに応答を返し、バックグラウンドで実行します。データ量が多い場合や、バックグラウンドでの一括処理が必要な場合に適しています。

### ステップ 1: データを準備する

次の内容の CSV ファイル `s3load_example.csv` を S3 上に作成します。

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

### ステップ 2: Doris にテーブルを作成する

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### ステップ 3: S3 Load でデータをロードする

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
    "provider" = "S3",
    "s3.endpoint" = "https://s3.us-west-2.amazonaws.com",
    "s3.region" = "us-west-2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

主なパラメータ:

| パラメータ | 説明 |
| --- | --- |
| `DATA INFILE` | ロードする S3 上のファイルの URI。形式は `s3://bucket/path` |
| `COLUMNS TERMINATED BY` | CSV の列区切り文字 |
| `FORMAT AS` | ファイル形式（例: `CSV`） |
| `provider` | オブジェクトストレージのプロバイダー。AWS S3 には `S3` を指定 |
| `s3.endpoint` | S3 サービスのエンドポイント（例: `s3.us-west-2.amazonaws.com`） |
| `s3.region` | S3 バケットが配置されているリージョン |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `timeout` | ロードジョブのタイムアウト（秒） |

### ステップ 4: ロードしたデータを確認する

```sql
SELECT * FROM test_s3load;
```

期待される結果:

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

## 方法 2: TVF でロードする（同期）

<!-- Knowledge type: Procedure -->

TVF（テーブル値関数）は、S3 上のファイルをテーブルとして扱います。`SELECT` で直接クエリでき、`INSERT INTO` と組み合わせることで、その結果を Doris のテーブルに同期的に書き込めます。中程度のデータ量で、処理結果をすぐに確認する必要がある場合に適しています。

### ステップ 1: データを準備する

次の内容の CSV ファイル `s3load_example.csv` を S3 上に作成します。

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

### ステップ 2: Doris にテーブルを作成する

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### ステップ 3: TVF でデータをロードする

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "s3.endpoint" = "https://s3.us-west-2.amazonaws.com",
    "s3.region" = "us-west-2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

主なパラメータ:

| パラメータ | 説明 |
| --- | --- |
| `uri` | 読み込む S3 上のファイルの URI |
| `format` | ファイル形式（例: `csv`） |
| `s3.endpoint` | S3 サービスのエンドポイント |
| `s3.region` | S3 バケットが配置されているリージョン |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `column_separator` | 列区切り文字 |
| `csv_schema` | CSV ファイルのスキーマ定義。形式は `column_name:type;...` |

### ステップ 4: ロードしたデータを確認する

```sql
SELECT * FROM test_s3load;
```

期待される結果:

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

## AWS Assume Role による認証

<!-- Knowledge type: Configuration / Authentication -->

Doris は、Access Key / Secret Key に加えて、`AWS Assume Role` を使った S3 Load と TVF の認証にも対応しています。認証情報の配布に制約がある企業に適しています。詳しい設定については、[AWS 連携: Assume Role による認証](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication-and-authorization)を参照してください。

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: S3 Load と TVF はどう使い分けますか？**

- 大量データの一括ロード、オフラインロード、定期実行ジョブには、**S3 Load** が適しています（非同期、バックグラウンドで実行、タイムアウトを制御可能）。
- アドホッククエリや、書き込む前に SQL でデータを処理する場合には、**TVF** が適しています（同期、`SELECT` / `INSERT` と組み合わせ可能）。

**Q2: S3 ファイルのリージョンとエンドポイントはどのように指定しますか？**

- `s3.region` には、バケットが配置されているリージョン（例: `us-west-2`）を指定します。
- `s3.endpoint` には、サービスのアドレス（例: `s3.us-west-2.amazonaws.com`）を指定します。
- 両者が一致していないと、接続失敗やリダイレクトエラーが発生する場合があります。

**Q3: TVF でのロードに `csv_schema` は必須ですか？**

ソースファイルが CSV の場合、型推論による不確実性を避けるため、`csv_schema` で各列の名前と型を明示することを推奨します。

**Q4: S3 Load ジョブの実行時間が長すぎる場合はどうすればよいですか？**

`timeout`（秒）の値を `PROPERTIES` で適切に増やします。例では `3600` を指定していますが、データ量に応じて調整できます。

## トラブルシューティング

<!-- Knowledge type: Troubleshooting -->

| 症状 | 考えられる原因 | 推奨される対処 |
| --- | --- | --- |
| S3 への接続に失敗する、またはタイムアウトする | `s3.endpoint` と `s3.region` が一致しない、またはネットワークに到達できない | エンドポイントとリージョンを確認し、Doris の BE ノードから S3 にアクセスできることを確認する |
| 認証に失敗する（403） | Access Key / Secret Key が正しくない、または権限が不足している | AK/SK が正しいことを確認し、対象のバケットとオブジェクトの読み取り権限を確認する |
| ファイルが見つからない | `DATA INFILE` / `uri` のパスが正しくない | バケット名、キーのパス、大文字と小文字を確認する |
| CSV の解析エラーが発生する | 区切り文字またはスキーマが一致しない | `COLUMNS TERMINATED BY` / `column_separator` と `csv_schema` を確認する |
| ジョブがタイムアウトする | データ量が多い、またはネットワークが遅い | `timeout` を増やすか、ファイルを分割して並列にロードする |

## 関連ドキュメント

- [Broker Load マニュアル](../import-way/broker-load-manual.md)
- [AWS 連携: Assume Role による認証](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication-and-authorization)
