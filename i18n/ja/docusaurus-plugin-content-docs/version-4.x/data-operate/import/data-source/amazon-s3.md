---
{
    "title": "Amazon S3",
    "language": "ja",
    "description": "Amazon S3 から Doris にデータをロードする方法：S3 Load による非同期ロードと TVF による同期ロードの完全な手順、パラメータ、例。",
    "keywords": [
        "Amazon S3 load",
        "Doris S3 Load",
        "S3 TVF",
        "AWS S3 data loading",
        "Broker Load S3",
        "AWS Assume Role"
    ]
}
---

<!-- Knowledge type: Procedure / Data loading -->
<!-- Use case: Load files from AWS S3 into Doris -->

Doris では、Amazon S3 からファイルをロードする方法として、非同期シナリオと同期シナリオにそれぞれ適した 2 つの方法を提供しています。

| 方法 | 種類 | 用途 |
| --- | --- | --- |
| **S3 Load** | 非同期 | 大規模バッチデータのロード、スケジュール済みジョブ、高スループットと安定性が必要なオフラインロード |
| **TVF (Table Value Function)** | 同期 | アドホッククエリ、ETL 処理、`INSERT INTO ... SELECT` と組み合わせた同期書き込み |

> ヒント: S3 Load は Broker Load に基づいて実装されています。詳細な動作については、[Broker Load マニュアル](../import-way/broker-load-manual.md)を参照してください。

## 方法 1: S3 Load でロード（非同期） {#method-1-load-with-s3-load-asynchronous}

<!-- Knowledge type: Procedure -->

S3 Load は非同期のロード方式です。送信後すぐに戻り、バックグラウンドで実行されます。データ量が多いシナリオや、バックグラウンドでのバッチ処理が必要なシナリオに適しています。

### ステップ 1: データを準備する {#step-1-prepare-the-data}

S3 上に `s3load_example.csv` という CSV ファイルを作成し、次の内容を記述します。

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

### ステップ 2: Doris にテーブルを作成する {#step-2-create-a-table-in-doris}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### ステップ 3: S3 Load でデータをロードする {#step-3-load-the-data-with-s3-load}

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

主なパラメータ：

| パラメータ | 説明 |
| --- | --- |
| `DATA INFILE` | S3 上でロードするファイルの URI。形式は `s3://bucket/path` |
| `COLUMNS TERMINATED BY` | CSV の列区切り文字 |
| `FORMAT AS` | ファイル形式。例：`CSV` |
| `provider` | オブジェクトストレージプロバイダー。AWS S3 には `S3` を指定 |
| `s3.endpoint` | S3 サービスのエンドポイント。例：`s3.us-west-2.amazonaws.com` |
| `s3.region` | S3 バケットが存在するリージョン |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `timeout` | ロードジョブのタイムアウト時間（秒） |

### ステップ 4: ロードしたデータを確認する {#step-4-check-the-loaded-data}

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
|       8 | James    |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

## 方法 2: TVF でロード（同期） {#method-2-load-with-tvf-synchronous}

<!-- Knowledge type: Procedure -->

TVF (Table Value Function) は S3 上のファイルをテーブルとして扱います。`SELECT` で直接クエリを実行でき、`INSERT INTO` と組み合わせて結果を Doris のテーブルに同期的に書き込めます。結果をすぐに確認する必要があり、データ量が中程度のシナリオに適しています。

### ステップ 1: データを準備する {#step-1-prepare-the-data-1}

S3 上に `s3load_example.csv` という CSV ファイルを作成し、次の内容を記述します。

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

### ステップ 2: Doris にテーブルを作成する {#step-2-create-a-table-in-doris-1}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### ステップ 3: TVF でデータをロードする {#step-3-load-the-data-with-tvf}

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

主なパラメータ：

| パラメータ | 説明 |
| --- | --- |
| `uri` | S3 上で読み取るファイルの URI |
| `format` | ファイル形式。例：`csv` |
| `s3.endpoint` | S3 サービスのエンドポイント |
| `s3.region` | S3 バケットが存在するリージョン |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `column_separator` | 列区切り文字 |
| `csv_schema` | CSV ファイルのスキーマ定義。形式は `column_name:type;...` |

### ステップ 4: ロードしたデータを確認する {#step-4-check-the-loaded-data-1}

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

## AWS Assume Role による認証 {#authentication-with-aws-assume-role}

<!-- Knowledge type: Configuration / Authentication -->

Access Key / Secret Key の使用に加えて、Doris は `AWS Assume Role` による S3 Load および TVF の認証にも対応しています。認証情報の配布を制限している企業に適しています。詳細な設定については、[AWS 統合 - Assumed Role 認証](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication-and-authorization)を参照してください。

## FAQ {#faq}

<!-- Knowledge type: FAQ -->

**Q1: S3 Load と TVF はどのように選択すればよいですか？**

- 大規模バッチ、オフライン処理、スケジュール済みジョブの場合：**S3 Load** を優先します（非同期、バックグラウンドで実行、タイムアウト制御に対応）。
- アドホッククエリや、書き込む前に SQL でデータを処理する必要がある場合：**TVF** を優先します（同期、`SELECT` / `INSERT` と組み合わせ可能）。

**Q2: S3 ファイルの Region と Endpoint はどのように指定しますか？**

- `s3.region` を使用してバケットが存在するリージョンを指定します。例：`us-west-2`。
- `s3.endpoint` を使用してサービスアドレスを指定します。例：`s3.us-west-2.amazonaws.com`。
- 2 つの値は一致している必要があります。一致しない場合、接続失敗やリダイレクトエラーが発生する可能性があります。

**Q3: TVF ロードでは `csv_schema` が必須ですか？**

ソースファイルが CSV の場合は、各列の名前と型を指定するために `csv_schema` を明示的に指定することをお勧めします。これにより、型推論による不確実性を回避できます。

**Q4: S3 Load ジョブの実行時間が長すぎる場合はどうすればよいですか？**

`timeout` を `PROPERTIES` 内で適切に増やします（単位は秒）。例では `3600` を使用しており、データ規模に応じて調整できます。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 症状 | 考えられる原因 | 推奨される対処 |
| --- | --- | --- |
| S3 への接続に失敗 / タイムアウト | `s3.endpoint` が `s3.region` と一致していない、またはネットワークに到達できない | Endpoint と Region を確認し、Doris BE ノードが S3 にアクセスできることを確認する |
| 認証に失敗（403） | Access Key / Secret Key が正しくない、または権限が不足している | AK/SK が正しいか確認し、対応するバケットとオブジェクトに対する読み取り権限を確認する |
| ファイルが見つからない | `DATA INFILE` / `uri` のパスが正しくない | バケット名、キーのパス、大文字と小文字を確認する |
| CSV の解析エラー | 区切り文字またはスキーマが一致していない | `COLUMNS TERMINATED BY` / `column_separator` と `csv_schema` を確認する |
| ジョブがタイムアウトする | データ量が多い、またはネットワークが遅い | `timeout` を増やすか、ファイルを分割して並列ロードする |

## 関連ドキュメント {#related-documents}

- [Broker Load マニュアル](../import-way/broker-load-manual.md)
- [AWS 統合 - Assumed Role 認証](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication-and-authorization)
