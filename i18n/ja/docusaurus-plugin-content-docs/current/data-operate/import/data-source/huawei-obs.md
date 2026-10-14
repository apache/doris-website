---
{
    "title": "Huawei Cloud OBS",
    "language": "ja",
    "description": "S3 Load による非同期インポート、または TVF による同期インポートを使用して、Huawei Cloud OBS 上の CSV や Parquet などのファイルを Apache Doris に効率的に取り込みます。",
    "keywords": [
        "Huawei Cloud OBS",
        "Huawei Cloud OBS",
        "Doris OBS インポート",
        "S3 Load OBS",
        "TVF S3",
        "オブジェクトストレージからのインポート",
        "OBS Endpoint",
        "obs.cn-north-1.myhuaweicloud.com"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import data files from Huawei Cloud OBS into Apache Doris -->

Apache Doris は、Huawei Cloud Object Storage Service（OBS）からデータファイルを直接インポートできます。一般に、オフラインでのデータ移行、過去データの補完、データレイク上のファイルのデータウェアハウスへの取り込みに使用します。このドキュメントでは、CSV ファイルを例に、両方のインポート方法の手順を説明します。

## 方法の選択

Doris では、Huawei Cloud OBS からファイルをインポートする方法が二つあります。データ量と適時性の要件に応じて選択してください。

| インポート方法 | 種類 | 適した用途 | 参照先 |
|---------|------|---------|---------|
| **S3 Load** | 非同期インポート | 大量のデータを一括インポートする場合。ジョブはバックグラウンドで実行され、失敗時の再試行に対応します | [Broker Load マニュアル](../import-way/broker-load-manual.md) |
| **TVF（テーブル値関数）** | 同期インポート | 少量から中量のデータやアドホッククエリに適しており、`INSERT INTO ... SELECT` と組み合わせて使用します | このドキュメントの「[TVF を使用したインポート](#import-using-tvf)」 |

> 注: どちらの方法も S3 プロトコルを介して OBS にアクセスするため、OBS が提供する Endpoint、Region、Access Key、Secret Key が必要です。

## 前提条件

インポートを開始する前に、以下を用意してください。

- アクセス可能な Huawei Cloud OBS バケット。インポートするデータファイルを事前にアップロードしておきます。
- OBS の **Endpoint**（例: `obs.cn-north-1.myhuaweicloud.com`）と、対応する **Region**（例: `cn-north-1`）。
- バケットの読み取り権限を持つ **Access Key（AK）** と **Secret Key（SK）**。
- デプロイ済みの Apache Doris クラスター。現在のユーザーには、対象のデータベースとテーブルに対する `LOAD_PRIV` 権限が必要です。

## S3 Load を使用したインポート

S3 Load は非同期のインポート方法です。ジョブを送信すると、Doris がバックグラウンドでスケジュールして実行するため、大量のデータに適しています。パラメータやステータスの確認方法について詳しくは、[Broker Load マニュアル](../import-way/broker-load-manual.md)を参照してください。

### ステップ 1: データを準備する

CSV ファイル `s3load_example.csv` を Huawei Cloud OBS にアップロードします。ファイルの内容は次のとおりです。

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

ファイルの構造に合わせて、Doris に対象テーブルを作成します。

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### ステップ 3: S3 Load でデータをインポートする

OBS 上の CSV ファイルを対象テーブルにインポートする S3 Load ジョブを送信します。

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
    "provider" = "OBS",
    "s3.endpoint" = "obs.cn-north-1.myhuaweicloud.com",
    "s3.region" = "cn-north-1",
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
| `DATA INFILE` | `s3://` プロトコルのプレフィックスを使用した OBS ファイルのパス |
| `provider` | オブジェクトストレージの種類が Huawei Cloud であることを示すため、`OBS` に固定します |
| `s3.endpoint` | OBS サービスの Endpoint。バケットのリージョンに合わせて設定します |
| `s3.region` | OBS バケットが配置されている Region |
| `s3.access_key` / `s3.secret_key` | 認証に使用する AK/SK |
| `timeout` | ジョブのタイムアウト。単位は秒です |

### ステップ 4: インポートしたデータを確認する

インポート完了後、対象テーブルをクエリして、データが正しく書き込まれたことを確認します。

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

## TVF を使用したインポート {#import-using-tvf}

TVF（テーブル値関数）は、OBS 上のファイルをテーブル関数が返す仮想テーブルとして公開します。そのため、`INSERT INTO ... SELECT` を使って同期インポートを直接実行できます。SQL 式と組み合わせた軽量な ETL にも便利です。

### ステップ 1: データを準備する

S3 Load で使用したものと同じ CSV ファイル `s3load_example.csv` を OBS にアップロードします。

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

### ステップ 3: TVF でデータをインポートする

`S3` テーブル関数を使って OBS 上のファイルを読み込み、`INSERT INTO ... SELECT` で対象テーブルに書き込みます。

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "OBS",
    "s3.endpoint" = "obs.cn-north-1.myhuaweicloud.com",
    "s3.region" = "cn-north-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

主なパラメータは次のとおりです。

| パラメータ | 説明 |
|------|------|
| `uri` | `s3://` プロトコルのプレフィックスを使用した OBS ファイルの URI |
| `format` | ファイル形式。CSV ファイルには `csv` を使用します |
| `provider` | `OBS` に固定します |
| `s3.endpoint` / `s3.region` | OBS の Endpoint と Region |
| `s3.access_key` / `s3.secret_key` | OBS の認証に必要な AK/SK |
| `column_separator` | フィールドの区切り文字。CSV のデフォルトは `,` です |
| `csv_schema` | CSV の列の型定義。形式は `column_name:type;column_name:type;...` です |

### ステップ 4: インポートしたデータを確認する

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

## よくある質問

**Q1: S3 Load と TVF はどのように使い分けますか？**

- データ量が多く、非同期実行と失敗時の再試行が必要な場合は、**S3 Load** を選択します。
- データ量が少なく、すぐに結果が必要な場合や、インポート時に SQL 式で軽量な変換を行う場合は、**TVF** を選択します。

**Q2: `provider` パラメータを `OBS` に設定する必要があるのはなぜですか？**

`provider` パラメータは、基盤となるオブジェクトストレージのベンダー種別を識別します。Huawei Cloud OBS は S3 プロトコルと互換性がありますが、署名方式などの詳細が異なります。Doris が対応するアクセスアダプターを使用できるよう、`OBS` を明示的に指定する必要があります。

**Q3: OBS の Endpoint と Region はどこで確認できますか？**

Huawei Cloud OBS コンソールのバケット概要ページで確認できます。一般的な Endpoint は `obs.<region>.myhuaweicloud.com` の形式です。たとえば、`cn-north-1` リージョンに対応する Endpoint は `obs.cn-north-1.myhuaweicloud.com` です。

**Q4: CSV 以外にどのファイル形式がサポートされていますか？**

S3 Load と TVF は、どちらも `csv`、`parquet`、`orc`、`json` などの一般的な形式に対応しています。`FORMAT AS` または `format` パラメータで形式を指定してください。

## トラブルシューティング

| 症状 | 考えられる原因 | 対処方法 |
|------|---------|---------|
| `Access Denied` または `403` エラー | AK/SK が正しくないか、アカウントにバケットの読み取り権限がありません | Huawei Cloud コンソールで AK/SK を確認し、アカウントに OBS バケットの読み取り権限を付与します |
| `endpoint is invalid` エラー | Endpoint のスペルが誤っているか、リージョンと一致していません | バケットのリージョンを確認し、そのリージョンに対応する Endpoint を使用します |
| インポートジョブが `PENDING` 状態のままになる | クラスターがビジー状態か、インポートの同時実行数が制限されています | `SHOW LOAD` でジョブのステータスを確認し、必要に応じて同時実行数を調整するか、リソースが解放されるまで待ちます |
| TVF で列数または型の不一致が報告される | `csv_schema` が実際のファイルの列構造と一致していません | ファイルの列順、列数、データ型を確認し、`csv_schema` を修正します |
| インポートがタイムアウトする | ファイルが大きく、デフォルトの `timeout` では足りません | `timeout` を `PROPERTIES` で増やします（単位は秒） |

## 関連ドキュメント

- [Broker Load マニュアル](../import-way/broker-load-manual.md)
