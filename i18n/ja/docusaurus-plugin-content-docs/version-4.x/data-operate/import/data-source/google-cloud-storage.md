---
{
    "title": "Google Cloud Storage（GCS）からのデータ取り込み",
    "language": "ja",
    "description": "Google Cloud Storage から Apache Doris にデータを取り込む方法。S3 Load による非同期取り込みと、S3 TVF による同期取り込みを説明します。",
    "keywords": [
        "Google Cloud Storage からの取り込み",
        "GCS から Doris への取り込み",
        "GCP での S3 Load",
        "GCS での S3 TVF",
        "Doris のオブジェクトストレージからの取り込み",
        "GCP プロバイダー"
    ],
    "sidebar_label": "Google Cloud Storage"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Importing data from Google Cloud Storage into Apache Doris -->

Apache Doris は、S3 互換プロトコルを介して GCS バケットにアクセスし、Google Cloud Storage（GCS）からファイルを取り込めます。このドキュメントでは、二つの取り込み方法と、それぞれの操作手順を説明します。

## 取り込み方法の選択

Doris には、Google Cloud Storage からファイルを取り込む方法が二つあります。データ量と結果が必要になるまでの時間に応じて選択してください。

| 取り込み方法 | 実行方式 | 適した用途 | 参照先 |
|---------|---------|---------|---------|
| S3 Load | 非同期 | 大量データの一括取り込み、長時間実行するジョブ | [Broker Load マニュアル](../import-way/broker-load-manual.md) |
| S3 TVF（テーブル関数） | 同期 | 少量データの取り込み、アドホッククエリ、すばやい検証 | このドキュメント |

選択の目安は次のとおりです。

- データ量が多い場合や、バックグラウンドでジョブを実行する必要がある場合は、**S3 Load** を使用します。
- すぐに結果が必要な場合や、`INSERT INTO ... SELECT` と組み合わせる場合は、**S3 TVF** を使用します。

## 前提条件

取り込みを始める前に、次の情報を用意してください。

- Google Cloud Storage のバケット名（`your_bucket_name`）。
- アクセス認証情報：Access Key と Secret Key。
- GCS の Endpoint と Region（例：`storage.us-west2.rep.googleapis.com` と `US-WEST2`）。
- デプロイ済みでアクセス可能な Apache Doris クラスター。

## 方法 1：S3 Load による取り込み（非同期）

S3 Load は、大量データの非同期取り込みに適しています。パラメーターの詳細と高度な使い方については、[Broker Load マニュアル](../import-way/broker-load-manual.md)を参照してください。

### ステップ 1：データを準備する

次の内容の CSV ファイル `s3load_example.csv` を作成し、Google Cloud Storage にアップロードします。

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

### ステップ 2：Doris にテーブルを作成する

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### ステップ 3：S3 Load でデータを取り込む

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
    "provider" = "GCP",
    "s3.endpoint" = "storage.us-west2.rep.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

主なパラメーターは次のとおりです。

| パラメーター | 説明 |
|------|------|
| `provider` | オブジェクトストレージのプロバイダー。GCS では `GCP` に固定します |
| `s3.endpoint` | GCS の S3 互換アクセス用エンドポイント |
| `s3.region` | GCS バケットが配置されているリージョン |
| `s3.access_key` | GCS のアクセスキー ID |
| `s3.secret_key` | GCS のシークレットアクセスキー |
| `timeout` | 取り込みのタイムアウト（秒） |

### ステップ 4：取り込んだデータを確認する

```sql
SELECT * FROM test_s3load;
```

期待される結果：

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

## 方法 2：TVF による取り込み（同期）

S3 テーブル関数（TVF）は、同期取り込みやアドホッククエリに適しており、`INSERT INTO ... SELECT` と直接組み合わせて使用できます。

### ステップ 1：データを準備する

次の内容の CSV ファイル `s3load_example.csv` を作成し、Google Cloud Storage にアップロードします。

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

### ステップ 2：Doris にテーブルを作成する

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### ステップ 3：TVF でデータを取り込む

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "GCP",
    "s3.endpoint" = "storage.us-west2.rep.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

主なパラメーターは次のとおりです。

| パラメーター | 説明 |
|------|------|
| `uri` | オブジェクトストレージ内のファイルの S3 URI |
| `format` | `csv`、`parquet`、`orc` などのファイル形式 |
| `provider` | オブジェクトストレージのプロバイダー。GCS では `GCP` に固定します |
| `s3.endpoint` | GCS の S3 互換アクセス用エンドポイント |
| `s3.region` | GCS バケットが配置されているリージョン |
| `s3.access_key` | GCS のアクセスキー ID |
| `s3.secret_key` | GCS のシークレットアクセスキー |
| `column_separator` | 列の区切り文字 |
| `csv_schema` | `column_name:type;column_name:type` 形式の CSV 列定義 |

### ステップ 4：取り込んだデータを確認する

```sql
SELECT * FROM test_s3load;
```

期待される結果：

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

## よくある質問

<!-- Knowledge type: Troubleshooting -->

**Q1: `provider` パラメーターには何を指定しますか？**

Google Cloud Storage から取り込む場合は、Doris が S3 互換プロトコルを介して GCS にアクセスできるよう、`provider` に `GCP` を指定する必要があります。

**Q2: S3 Load と S3 TVF はどのように選べばよいですか？**

- 大量データをバックグラウンドで非同期に取り込む必要がある場合は、**S3 Load** を選択します。
- 少量データですぐに結果が必要な場合や、SQL クエリと組み合わせる場合は、**S3 TVF** を選択します。

**Q3: GCS の Access Key と Secret Key はどこで取得できますか？**

S3 互換アクセス用の HMAC キー（Access Key / Secret Key）は、Google Cloud Console の **Cloud Storage > Settings > Interoperability** ページで作成・管理できます。

**Q4: Endpoint と Region はどのように確認しますか？**

Endpoint と Region は、バケットが配置されているリージョンによって異なります。たとえば、リージョン `US-WEST2` に対応するエンドポイントは `storage.us-west2.rep.googleapis.com` です。実際のバケットの配置先に応じて、これらの値を置き換えてください。

**Q5: 取り込みがタイムアウトした場合はどうすればよいですか？**

`timeout` パラメーター（単位：秒）を `PROPERTIES` で増やしてください。デフォルトは `3600` です。ファイルが非常に大きい場合やネットワークが遅い場合は、必要に応じて延長してください。
