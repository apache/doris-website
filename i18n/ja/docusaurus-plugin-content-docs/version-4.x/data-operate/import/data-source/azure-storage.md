---
{
    "title": "Azure Storage",
    "language": "ja",
    "description": "Azure Storage から Apache Doris にデータをインポートする方法。S3 Load による非同期インポートと TVF による同期インポートについて、手順と例を説明します。",
    "keywords": [
        "Azure Storage インポート",
        "Doris Azure Blob",
        "S3 Load Azure",
        "TVF Azure",
        "Doris データインポート",
        "s3_client_http_scheme",
        "Azure Blob から Doris へのインポート"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Importing data from Azure Storage into Apache Doris -->

Apache Doris は、Azure Storage（Azure Blob Storage）からのファイルのインポートに対応しています。このドキュメントでは、代表的な二つのインポート方法を説明します。データ量とリアルタイム性の要件に応じて選択してください。

## 方法の選択

次の表は、二つのインポート方法の主な違いを示します。

| インポート方法 | 実行方式 | 適した用途 | 参考ドキュメント |
|----------|----------|----------|----------|
| S3 Load | 非同期 | 大量のデータのインポート、バックグラウンドでのスケジューリングが必要な場合 | [Broker Load マニュアル](../import-way/broker-load-manual.md) |
| TVF（テーブル値関数） | 同期 | アドホッククエリ、少量のデータのインポート、簡単な動作確認 |  |

## 前提条件

どちらの方法で Azure Storage からデータをインポートする場合も、事前に次の設定を確認してください。

- **HTTPS 通信**: Azure Storage では、デフォルトで HTTPS 通信が必要です（ストレージアカウントの設定 `Secure transfer required: Enabled` に対応）。Doris の `s3_client_http_scheme = https` を `be.conf` で設定してください。設定しないと、正常にアクセスできません。
- **リージョンの省略**: Azure と互換性のある S3 プロトコルのプロパティでは、`s3.region` パラメータを省略できます。
- **アクセス認証情報**: Azure Storage アカウントの Access Key（AK）と Secret Key（SK）を用意してください。
- **エンドポイントの形式**: `<StorageAccount>.blob.core.windows.net` 形式のエンドポイントアドレスを使用してください。

:::caution 注意
BE の設定で HTTPS が有効になっていない場合、プロトコルの不一致によってインポートに失敗します。インポートを実行する前に、上記の設定を完了してください。
:::

## 方法 1: S3 Load によるインポート（非同期）

S3 Load は非同期のバッチインポート方法で、大量のデータを Azure Storage から Doris にインポートする場合に適しています。手順は次のとおりです。

### 手順 1: データを準備する

Azure Storage に、次の内容の CSV ファイル `s3load_example.csv` を作成します。

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

### 手順 2: Doris にテーブルを作成する

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 手順 3: S3 Load でデータをインポートする

次の SQL を実行して、S3 Load タスクを送信します。

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
    "provider" = "AZURE",
    "s3.endpoint" = "StorageAccountA.blob.core.windows.net",
    "s3.region" = "westus3",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

主なパラメータは次のとおりです。

| パラメータ | 説明 |
|------|------|
| `provider` | オブジェクトストレージのプロバイダーを識別するため、`AZURE` に設定する必要があります |
| `s3.endpoint` | Azure Blob サービスのアドレス。形式は `<StorageAccount>.blob.core.windows.net` です |
| `s3.region` | Azure を使用する場合は省略できます |
| `s3.access_key` | Azure Storage アカウントの Access Key |
| `s3.secret_key` | Azure Storage アカウントの Secret Key |
| `timeout` | インポートタスクのタイムアウト（秒） |

### 手順 4: インポートしたデータを確認する

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

## 方法 2: TVF によるインポート（同期）

TVF（テーブル値関数）は、単一の SQL 文でデータの読み取りと書き込みを行える同期インポート方法です。少量のデータやアドホックな用途に適しています。

### 手順 1: データを準備する

Azure Storage に、次の内容の CSV ファイル `s3load_example.csv` を作成します。

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

### 手順 2: Doris にテーブルを作成する

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 手順 3: TVF でデータをインポートする

`INSERT INTO ... SELECT FROM S3(...)` を使用して、データを直接インポートします。

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "AZURE",
    "s3.endpoint" = "StorageAccountA.blob.core.windows.net",
    "s3.region" = "westus3",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

主なパラメータは次のとおりです。

| パラメータ | 説明 |
|------|------|
| `uri` | Azure Storage 上のオブジェクトのパス。形式は `s3://<bucket>/<object>` です |
| `format` | `csv`、`parquet`、`orc` などのファイル形式 |
| `provider` | `AZURE` に設定する必要があります |
| `s3.endpoint` | Azure Blob サービスのアドレス |
| `s3.region` | Azure を使用する場合は省略できます |
| `s3.access_key` / `s3.secret_key` | Azure Storage のアクセス認証情報 |
| `column_separator` | 列の区切り文字（CSV に適用） |
| `csv_schema` | `column_name:type;column_name:type` 形式の CSV 列定義 |

### 手順 4: インポートしたデータを確認する

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

### Q1: S3 Load と TVF はどのように使い分けますか？

- **S3 Load**: 非同期で実行します。大量のデータ、Label によるインポート状態の追跡が必要な場合、定期的なタスクとしてスケジュールする場合に適しています。
- **TVF**: 同期で実行します。少量のデータ、アドホッククエリ、ファイル内容の簡単な確認、書き込み前に SELECT でデータを変換する場合に適しています。

### Q2: Azure Storage へのアクセス時にエラーや接続失敗が発生するのはなぜですか？

次の点を確認してください。

1. BE ノードで `s3_client_http_scheme = https` が `be.conf` に設定されており、設定を反映するために BE を再起動していること。
2. Azure Storage アカウントで `Secure transfer required` が有効な場合は、HTTPS を使用していること。
3. `s3.endpoint` の形式が正しく、プロトコルのプレフィックスを付けずに `<StorageAccount>.blob.core.windows.net` を指定していること。
4. AK/SK が有効で、対象バケットの読み取り権限を持っていること。

### Q3: `s3.region` は必須ですか？

いいえ。Azure を使用する場合、`s3.region` は省略できます。指定しても、インポート処理には影響しません。

### Q4: URI はどの形式で指定しますか？

S3 Load の `DATA INFILE` と TVF の `uri` のどちらも、Azure Storage 上のオブジェクトにアクセスするには `s3://<bucket_name>/<object_path>` 形式を使用します。

## トラブルシューティング

| 症状 | 考えられる原因 | 対処方法 |
|------|----------|----------|
| インポートタスクで接続エラーが報告される | BE で HTTPS が有効になっていない | `s3_client_http_scheme = https` を `be.conf` に設定し、BE を再起動します |
| 権限または認証の失敗が報告される | AK/SK が正しくないか、権限が不足している | Access Key と Secret Key が正しいこと、および対象コンテナーの読み取り権限があることを確認します |
| エンドポイントを解決できない | エンドポイントにプロトコルのプレフィックスが含まれているか、スペルが間違っている | `<StorageAccount>.blob.core.windows.net` を使用し、`https://` などのプレフィックスは付けないでください |
| インポートタスクがタイムアウトする | データ量が多いか、ネットワークが遅い | `timeout` の値を `PROPERTIES` で増やします |

## 関連ドキュメント

- [Broker Load マニュアル](../import-way/broker-load-manual.md)
