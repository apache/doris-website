---
{
    "title": "MinIO からのデータ取り込み",
    "language": "ja",
    "description": "MinIO オブジェクトストレージにある CSV、Parquet などのファイルを Doris に取り込む方法。非同期の S3 Load と同期の TVF を利用できます。",
    "keywords": [
        "MinIO からの取り込み",
        "Doris MinIO",
        "S3 Load",
        "S3 TVF",
        "オブジェクトストレージからの取り込み",
        "use_path_style",
        "MinIO エンドポイント"
    ],
    "sidebar_label": "MinIO"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Importing files from MinIO object storage into Doris -->

[MinIO](https://min.io/) は S3 互換のオブジェクトストレージです。Doris では、MinIO からファイルを取り込む方法が二つあります。データ量と、データが必要になるまでの時間に応じて選択してください。

| 取り込み方法 | 実行方式 | 適した用途 | 参照先 |
|----------|----------|----------|----------|
| S3 Load   | 非同期 | 大量データの一括取り込み、バックグラウンドで実行するタスク | [Broker Load マニュアル](../import-way/broker-load-manual.md) |
| TVF（テーブル関数） | 同期 | 少量データやアドホッククエリでの取り込み。`INSERT INTO ... SELECT` と組み合わせて使用可能 | このドキュメントの例 |

## 前提条件

いずれかの方法で MinIO のデータを取り込む前に、次の条件を確認してください。

- Doris クラスターがデプロイ済みで、MinIO サービスにアクセスできること。
- MinIO のエンドポイント、リージョン、アクセスキー、シークレットキーを取得済みであること。
- 取り込む CSV/Parquet ファイルを MinIO バケットにアップロード済みであること。

:::caution 重要：MinIO への接続設定に関する注意事項
S3 Load または TVF で MinIO のデータを取り込む場合は、次の二点に注意してください。

- **エンドポイントのプロトコル接頭辞**：MinIO がローカルネットワーク上にデプロイされ、TLS が有効になっていない場合は、`http://` を `endpoint` に明示的に追加する必要があります。例：`"s3.endpoint" = "http://localhost:9000"`。
- **パス形式のアクセス**：S3 SDK はデフォルトで仮想ホスト形式を使用しますが、MinIO ではこのアクセス方式はデフォルトで有効になっていません。`"use_path_style" = "true"` を追加して、パス形式を強制してください。
:::

## 方法 1：S3 Load による取り込み（非同期）

S3 Load は、MinIO のファイルを非同期タスクとして Doris に取り込む場合に適しています。詳しい手順は [Broker Load マニュアル](../import-way/broker-load-manual.md)を参照してください。

### ステップ 1：データを準備する

次の内容の CSV ファイル `s3load_example.csv` を作成し、MinIO にアップロードします。

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

次の SQL を実行して S3 Load タスクを送信します。

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
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "use_path_style" = "true"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### ステップ 4：取り込んだデータを確認する

次のクエリを実行して、データが正常に取り込まれたか確認します。

```sql
SELECT * FROM test_s3load;
```

期待される出力：

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

TVF（テーブル関数）は、`S3()` 関数を通じて MinIO のファイルを仮想テーブルとして読み取り、`INSERT INTO ... SELECT` と組み合わせて同期的に取り込みます。少量データやアドホックな用途に適しています。

### ステップ 1：データを準備する

次の内容の CSV ファイル `s3load_example.csv` を作成し、MinIO にアップロードします。

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

次の SQL を実行してデータを同期的に取り込みます。

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int",
    "use_path_style" = "true"
);
```

### ステップ 4：取り込んだデータを確認する

次のクエリを実行して、データが正常に取り込まれたか確認します。

```sql
SELECT * FROM test_s3load;
```

期待される出力：

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

## 主なパラメーター

<!-- Knowledge type: Configuration parameters -->

S3 Load と TVF の両方で、次のパラメーターを正しく設定する必要があります。

| パラメーター | 説明 | 設定例 |
|------|------|--------|
| `provider` | オブジェクトストレージのプロバイダー。MinIO を使用する場合は `S3` に設定します。 | `S3` |
| `s3.endpoint` | MinIO サービスのアドレス。TLS が有効でない場合は `http://` 接頭辞が必要です。 | `http://localhost:9000` |
| `s3.region` | MinIO がデプロイされているリージョン。任意の値を設定できますが、一貫して同じ値を使用する必要があります。 | `us-east-1` |
| `s3.access_key` | MinIO のアクセスキー ID。 | `myminioadmin` |
| `s3.secret_key` | MinIO のシークレットアクセスキー。 | `minio-secret-key-change-me` |
| `use_path_style` | パス形式のアクセスを使用するかどうか。MinIO では `true` に設定する必要があります。 | `true` |

## よくある質問

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting / Connection configuration -->

### Q1：S3 Load と TVF はどのように選べばよいですか？

- **S3 Load**：非同期で実行されます。大量データの一括取り込みに適しています。送信後、Doris がバックグラウンドでタスクをスケジュールして実行します。タスクの状態は `SHOW LOAD` で確認できます。
- **TVF**：同期で実行されます。少量データ、アドホックな分析、または `INSERT INTO ... SELECT` と組み合わせた処理に適しています。結果はすぐに返されます。

### Q2：MinIO への接続時にエンドポイント関連のエラーが発生した場合はどうすればよいですか？

エンドポイントに適切なプロトコル接頭辞が付いているか確認してください。

- TLS が有効でない場合：`http://` を含める必要があります。例：`http://localhost:9000`。
- TLS が有効な場合：`https://` 接頭辞を使用します。

### Q3：アクセス時にバケットの解析エラーまたは 404 エラーが発生した場合はどうすればよいですか？

MinIO は、デフォルトでは仮想ホスト形式のアクセスをサポートしていません。取り込みパラメーターに次の設定を明示的に追加する必要があります。

```text
"use_path_style" = "true"
```

### Q4：Parquet や ORC など、ほかの形式もサポートされていますか？

はい。`FORMAT AS "CSV"`（TVF の場合は `"format" = "csv"`）を `parquet`、`orc`、または対応するほかの形式に置き換えてください。詳しくは [Broker Load マニュアル](../import-way/broker-load-manual.md)を参照してください。
