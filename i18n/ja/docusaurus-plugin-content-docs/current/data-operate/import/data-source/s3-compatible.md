---
{
    "title": "S3 互換ストレージ",
    "language": "ja",
    "description": "MinIO や Ceph などの S3 互換ストレージから Apache Doris にデータをインポートする方法。S3 Load による非同期インポートと TVF による同期インポートを説明します。",
    "keywords": [
        "S3 互換ストレージ",
        "MinIO から Doris へのインポート",
        "Ceph から Doris へのインポート",
        "S3 Load",
        "S3 TVF",
        "Broker Load",
        "オブジェクトストレージからのインポート",
        "use_path_style",
        "仮想ホスト形式",
        "パス形式"
    ]
}
---

<!-- Knowledge type: Procedure / Data loading -->
<!-- Applicable scenario: Loading data from S3-compatible storage (MinIO, Ceph, etc.) into Doris -->

Apache Doris は、MinIO、Ceph、Huawei Cloud OBS、Tencent Cloud COS など、S3 プロトコルと互換性のあるさまざまなオブジェクトストレージからのデータインポートに対応しています。このドキュメントでは、二つのインポート方法について、適した用途と一連の手順を説明します。

## 方法の選択

データ量と処理方式に応じて、適切なインポート方法を選択してください。

| インポート方法 | 実行方式 | 適した用途 | 参考ドキュメント |
| --- | --- | --- | --- |
| **S3 Load** | 非同期 | 大量のデータの一括インポート。ジョブ管理や再試行の仕組みが必要な場合 | [Broker Load マニュアル](../import-way/broker-load-manual.md) |
| **TVF（テーブル値関数）** | 同期 | アドホッククエリ、少量のデータのインポート、SQL で直接データを利用する場合 | - |

:::caution 注意
S3 SDK は、デフォルトで**仮想ホスト形式**を使用してオブジェクトストレージにアクセスします。対象のストレージシステムでこの形式が有効になっていない、またはサポートされていない場合は、パラメータ `"use_path_style" = "true"` を追加して**パス形式**を使用してください。
:::

## S3 Load によるインポート（非同期）

S3 Load は、大量のデータを一括でインポートする場合に適しています。インポートジョブは非同期に送信され、Doris がバックグラウンドでスケジュールします。詳しい仕組みについては、[Broker Load マニュアル](../import-way/broker-load-manual.md)を参照してください。

### 手順 1: データを準備する

S3 互換ストレージに、次の内容の CSV ファイル `s3load_example.csv` を作成します。

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

### 手順 2: Doris に対象テーブルを作成する

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 手順 3: S3 Load ジョブを送信する

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
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "use_path_style" = "true"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

主なパラメータは次のとおりです。

| パラメータ | 説明 |
| --- | --- |
| `provider` | オブジェクトストレージのプロバイダー種別。S3 互換ストレージの場合は、必ず `S3` を使用します。 |
| `s3.endpoint` | S3 互換ストレージのアクセス用エンドポイント。プロトコルのプレフィックスは含めません。 |
| `s3.region` | バケットが配置されているリージョン。 |
| `s3.access_key` | アクセスキー（AK）。 |
| `s3.secret_key` | シークレットキー（SK）。 |
| `use_path_style` | パス形式でアクセスするかどうか。MinIO などのストレージシステムでは、通常 `true` に設定する必要があります。 |
| `timeout` | インポートジョブのタイムアウト（秒）。 |

### 手順 4: インポート結果を確認する

```sql
SELECT * FROM test_s3load;
```

想定される結果:

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

## TVF によるインポート（同期）

TVF は、S3 互換ストレージ上のファイルをテーブルとして扱い、クエリで読み取れるようにします。`INSERT INTO ... SELECT` と組み合わせることで同期インポートが可能になり、アドホック分析や少量のデータのインポートに適しています。

### 手順 1: データを準備する

S3 互換ストレージに、次の内容の CSV ファイル `s3load_example.csv` を作成します。

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

### 手順 2: Doris に対象テーブルを作成する

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 手順 3: TVF で同期インポートする

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int",
    "use_path_style" = "true"
);
```

主なパラメータは次のとおりです。

| パラメータ | 説明 |
| --- | --- |
| `uri` | S3 互換ストレージ内のファイルのフルパス。 |
| `format` | ファイル形式。`csv`、`parquet`、`orc` などを指定します。 |
| `provider` | オブジェクトストレージのプロバイダー種別。S3 互換ストレージの場合は、必ず `S3` を使用します。 |
| `s3.endpoint` | S3 互換ストレージのアクセス用エンドポイント。 |
| `s3.region` | バケットが配置されているリージョン。 |
| `s3.access_key` | アクセスキー（AK）。 |
| `s3.secret_key` | シークレットキー（SK）。 |
| `column_separator` | カラムの区切り文字。 |
| `csv_schema` | CSV ファイルのカラム定義。形式は `field_name:type` です。 |
| `use_path_style` | パス形式でアクセスするかどうか。 |

### 手順 4: インポート結果を確認する

```sql
SELECT * FROM test_s3load;
```

想定される結果:

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

### 1. MinIO などのストレージにアクセスすると、バケットが存在しない、または名前を解決できないというエラーが表示されるのはなぜですか？

S3 SDK はデフォルトで仮想ホスト形式（`bucket.endpoint` など）でドメイン名を構築しますが、MinIO や Ceph などのシステムでは通常、パス形式（`endpoint/bucket` など）を使用します。解決するには、インポートのパラメータに `"use_path_style" = "true"` を追加してください。

### 2. `s3.endpoint` に `http://` または `https://` のプレフィックスを含める必要がありますか？

いいえ。`s3.endpoint` には、ホスト名とポート（`play.min.io:9000` など）のみを指定します。

### 3. S3 Load と TVF はどのように使い分けますか？

- 大量のデータを非同期に処理し、ジョブ履歴を保持したい場合は、**S3 Load** を使用します。
- 一つの SQL 文で S3 上のファイルを読み取り、`INSERT INTO ... SELECT` で結果を同期的に書き込みたい場合は、**TVF** を使用します。

### 4. インポートジョブがタイムアウトした場合はどうすればよいですか？

S3 Load の `timeout` プロパティ（単位は秒）を増やすか、大きなファイルを複数の小さなファイルに分割して並列処理を改善してください。
