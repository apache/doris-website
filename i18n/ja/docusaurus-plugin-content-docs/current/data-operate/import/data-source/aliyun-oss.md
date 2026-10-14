---
{
    "title": "Aliyun OSS",
    "language": "ja",
    "description": "この記事では、S3 Load と TVF を使用して Aliyun OSS から Apache Doris に CSV などのファイルを効率的にインポートする方法を説明します。",
    "keywords": [
        "Aliyun OSS",
        "Aliyun OSS",
        "Doris の OSS インポート",
        "S3 Load",
        "Table Value Function",
        "TVF インポート",
        "オブジェクトストレージからのインポート",
        "Broker Load",
        "OSS エンドポイント"
    ]
}
---

<!-- Knowledge type: Procedure / Data Import -->
<!-- Applicable scenario: Loading data from Aliyun OSS into Doris -->

Apache Doris は Aliyun OSS（Object Storage Service）上のファイルのインポートに対応しています。主な用途は、大量データの非同期インポートと、必要に応じた同期インポートの二つです。この記事では、両方式の比較、操作手順、よくある問題への対処方法を説明します。

## インポート方法の選択

インポート方法を選ぶ前に、次の表で用途に合う方式を確認してください。

| インポート方法 | 実行コマンド                        | 同期／非同期 | 適した用途                                                               | 参考資料                                                          |
| -------------- | ----------------------------------- | ------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| S3 Load        | `LOAD LABEL ...`                    | 非同期       | 大量データの一括インポート。タスク管理と失敗時の再試行が必要な場合         | [Broker Load マニュアル](../import-way/broker-load-manual.md)      |
| TVF インポート | `INSERT INTO ... SELECT FROM S3(...)` | 同期       | 必要に応じたクエリや小規模なデータインポート。すぐに結果が必要な場合       | -                                                                 |

## 前提条件

開始前に、次の情報を用意してください。

- Aliyun OSS の `bucket` 名と対象ファイルのパス
- アクセス認証情報: `AccessKey`（AK）と `SecretKey`（SK）
- OSS のエンドポイントと Region の情報
- Doris クラスターから OSS にアクセスできること（パブリックネットワークまたは内部ネットワーク経由）

:::caution エンドポイントの選択について
Aliyun OSS のパブリックネットワーク用エンドポイントと内部ネットワーク用エンドポイントは異なります。Doris クラスターと OSS が同じ Region にある場合は、内部ネットワーク用エンドポイントを使用してください。レイテンシーが低く、帯域幅が安定し、パブリックネットワークのトラフィック料金も発生しません。

- 内部エンドポイント: `oss-cn-hangzhou-internal.aliyuncs.com`
- パブリックエンドポイント: `oss-cn-hangzhou.aliyuncs.com`
:::

## S3 Load によるインポート（非同期）

S3 Load は Broker Load を基盤とする非同期のインポート方法で、データの一括ロードに適しています。仕組みの詳細については、[Broker Load マニュアル](../import-way/broker-load-manual.md)を参照してください。

### ステップ 1: データを準備する

次の内容の CSV ファイル `s3load_example.csv` を Aliyun OSS 上に作成します。

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

### ステップ 3: S3 Load でインポートする

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
    "provider" = "OSS",
    "s3.endpoint" = "oss-cn-hangzhou.aliyuncs.com",
    "s3.region" = "oss-cn-hangzhou",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

主なパラメータ:

| パラメータ        | 説明                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| `provider`        | オブジェクトストレージの種類。Aliyun OSS の場合は `OSS` に固定されます。       |
| `s3.endpoint`     | OSS サービスのエンドポイント。Region とネットワーク環境に応じて選びます。      |
| `s3.region`       | OSS の Region 名。例: `oss-cn-hangzhou`。                                      |
| `s3.access_key`   | Aliyun アカウントの AccessKey ID。                                             |
| `s3.secret_key`   | Aliyun アカウントの AccessKey Secret。                                         |
| `timeout`         | タスクのタイムアウト。単位は秒です。                                           |

### ステップ 4: インポート結果を確認する

```sql
SELECT * FROM test_s3load;
```

期待される出力:

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

TVF（Table Value Function）を使用すると、オブジェクトストレージ上のファイルをテーブル値関数として直接読み取り、`INSERT INTO ... SELECT` で対象テーブルに同期的に書き込めます。必要に応じたデータインポートや小規模なデータロードに適しています。

### ステップ 1: データを準備する

次の内容の CSV ファイル `s3load_example.csv` を Aliyun OSS 上に作成します。

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

### ステップ 3: TVF でインポートする

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "OSS",
    "s3.endpoint" = "oss-cn-hangzhou.aliyuncs.com",
    "s3.region" = "oss-cn-hangzhou",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

主なパラメータ:

| パラメータ          | 説明                                                                    |
| ------------------- | ----------------------------------------------------------------------- |
| `uri`               | `s3://` プロトコルプレフィックスを使用した OSS ファイルのアドレス。      |
| `format`            | ファイル形式。例: `csv`、`parquet`、`orc`。                              |
| `provider`          | オブジェクトストレージの種類。Aliyun OSS の場合は `OSS` に固定されます。 |
| `s3.endpoint`       | OSS サービスのエンドポイント。                                           |
| `s3.region`         | OSS の Region 名。                                                       |
| `s3.access_key`     | Aliyun アカウントの AccessKey ID。                                      |
| `s3.secret_key`     | Aliyun アカウントの AccessKey Secret。                                  |
| `column_separator`  | CSV の列区切り文字。                                                     |
| `csv_schema`        | `column_name:type;column_name:type;...` 形式の CSV の列定義。            |

### ステップ 4: インポート結果を確認する

```sql
SELECT * FROM test_s3load;
```

期待される出力:

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

<!-- Knowledge type: FAQ / Troubleshooting -->

## よくある質問

### Q1: S3 Load と TVF インポートはどのように使い分けますか？

- データ量が多く、タスクのスケジューリングや再試行の仕組みを備えた非同期実行が必要な場合は、**S3 Load** を使用します。
- 必要に応じたクエリや同期書き込みを行い、すぐに結果を得たい場合は、**TVF インポート**を使用します。

### Q2: 内部エンドポイントとパブリックエンドポイントの違いは何ですか？

- Doris クラスターと OSS が同じ Region にある場合、**内部エンドポイント**（例: `oss-cn-hangzhou-internal.aliyuncs.com`）を使用すると、レイテンシーが低く、帯域幅が安定し、パブリックネットワークのトラフィック料金も発生しません。
- Region をまたいでアクセスする場合や、クラスターを Aliyun の外部にデプロイしている場合は、**パブリックエンドポイント**（例: `oss-cn-hangzhou.aliyuncs.com`）を使用します。

### Q3: `provider` パラメータを `OSS` に設定する必要があるのはなぜですか？

`provider` パラメータは、使用するオブジェクトストレージの種類を Doris のバックエンドに伝えます。これにより、バックエンドは Aliyun OSS の認証とプロトコルの詳細に対応できます。Aliyun OSS からファイルをインポートする場合は、このパラメータを明示的に `OSS` に設定する必要があります。

### Q4: S3 Load のタスクの処理が進まない、またはタイムアウトする場合はどうすればよいですか？

- `timeout` の値（単位: 秒）を `PROPERTIES` で増やします。
- ネットワーク接続を確認し、内部エンドポイントの使用を優先します。
- `SHOW LOAD` を実行してタスクの状態と失敗の原因を確認します。詳細については、[Broker Load マニュアル](../import-way/broker-load-manual.md)を参照してください。

### Q5: TVF インポートは CSV 以外の形式に対応していますか？

はい。`csv`、`parquet`、`orc` などの形式に対応しており、`format` パラメータで指定できます。CSV 以外の形式では、`column_separator` と `csv_schema` を指定する必要はありません。
