---
{
    "title": "HDFS からのデータのインポート",
    "language": "ja",
    "description": "HDFS Load（非同期）と TVF（同期）を使用して HDFS のファイルを Apache Doris にインポートする方法を、手順と例を交えて説明します。",
    "sidebar_label": "HDFS",
    "keywords": [
        "Doris の HDFS インポート",
        "HDFS Load",
        "HDFS TVF",
        "Broker Load",
        "Hadoop データのインポート",
        "非同期インポート",
        "同期インポート",
        "fs.defaultFS",
        "hadoop.username"
    ]
}
---

<!-- Knowledge type: Procedure / Data import -->
<!-- Applicable scenario: Importing data from HDFS to Doris -->

Apache Doris には、HDFS からファイルをインポートする方法が二つあり、それぞれ異なる業務シナリオに適しています。

## 方法の選択

開始する前に、データ量、処理の遅延に関する要件、業務シナリオに応じてインポート方法を選択してください。

| インポート方法 | 実行方式 | 適したシナリオ | 参照先 |
|----------|----------|----------|----------|
| **HDFS Load** | 非同期 | 大量のデータを定期的にロードするオフラインジョブ。インポートの完了まで現在のセッションを待機させる必要がない場合 | [Broker Load マニュアル](../import-way/broker-load-manual.md) |
| **TVF（テーブル値関数）** | 同期 | 少量のデータのインポートや、その場でのクエリ。`INSERT INTO ... SELECT` と柔軟に組み合わせられます | このドキュメントの以下の例 |

> ヒント: どちらの方法でも、HDFS への接続パラメータ（`fs.defaultFS`、`hadoop.username` など）を正しく設定する必要があります。Doris クラスターから HDFS にネットワーク経由で接続できることを確認してください。

---

## 方法 1: HDFS Load でインポートする（非同期）

<!-- Knowledge type: Procedure -->

HDFS Load は Broker Load を基盤とする非同期のインポート方法で、大量のデータのロードに適しています。すべての機能については、[Broker Load マニュアル](../import-way/broker-load-manual.md)を参照してください。

### ステップ 1: HDFS 上のデータファイルを準備する

HDFS 上に、次の内容の CSV ファイル `hdfsload_example.csv` を作成します。

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

### ステップ 2: Doris にインポート先のテーブルを作成する

```sql
CREATE TABLE test_hdfsload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### ステップ 3: HDFS Load ジョブを送信する

```sql
LOAD LABEL hdfs_load_2022_04_01
(
    DATA INFILE("hdfs://127.0.0.1:8020/tmp/hdfsload_example.csv")
    INTO TABLE test_hdfsload
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
)
with HDFS
(
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",
    "hadoop.username" = "user"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

主なパラメータ:

| パラメータ | 説明 |
|------|------|
| `LABEL` | インポートジョブの一意の識別子。ジョブの追跡と重複防止に使用します |
| `DATA INFILE` | HDFS 上のファイルパス |
| `COLUMNS TERMINATED BY` | 列の区切り文字。ソースファイルと一致させる必要があります |
| `FORMAT AS` | ファイル形式。この例では `CSV` |
| `fs.defaultFS` | HDFS NameNode のアドレス |
| `hadoop.username` | HDFS へのアクセスに使用するユーザー名 |
| `timeout` | ジョブのタイムアウト（秒） |

### ステップ 4: インポート結果を確認する

```sql
SELECT * FROM test_hdfsload;
```

期待される出力:

```text
mysql> select * from test_hdfsload;
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

---

## 方法 2: TVF でインポートする（同期）

<!-- Knowledge type: Procedure -->

TVF（テーブル値関数）は同期的なインポート方法で、HDFS からデータを読み取り、`INSERT INTO ... SELECT` を使って Doris に柔軟に書き込む場合に適しています。

### ステップ 1: HDFS 上のデータファイルを準備する

HDFS 上に、次の内容の CSV ファイル `hdfsload_example.csv` を作成します。

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

### ステップ 2: Doris にインポート先のテーブルを作成する

```sql
CREATE TABLE test_hdfsload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### ステップ 3: TVF を使ってデータを同期的にインポートする

```sql
INSERT INTO test_hdfsload
SELECT * FROM hdfs (
    "uri" = "hdfs://127.0.0.1:8020/tmp/hdfsload_example.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",
    "hadoop.username" = "doris",
    "format" = "csv",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

主なパラメータ:

| パラメータ | 説明 |
|------|------|
| `uri` | HDFS 上のファイルの完全パス |
| `fs.defaultFS` | HDFS NameNode のアドレス |
| `hadoop.username` | HDFS へのアクセスに使用するユーザー名 |
| `format` | ファイル形式。たとえば `csv` |
| `csv_schema` | CSV ファイルの列定義。`column_name:type;column_name:type` の形式で指定します |

### ステップ 4: インポート結果を確認する

```sql
SELECT * FROM test_hdfsload;
```

期待される出力:

```text
mysql> select * from test_hdfsload;
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

---

## よくある質問

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Import failure troubleshooting / parameter selection -->

### Q1: HDFS Load と TVF はどう選べばよいですか？

- データ量が多く、非同期での実行が可能な場合は、**HDFS Load** を選びます。
- データ量が少なく、インポート結果をすぐに必要とする場合や、`INSERT INTO ... SELECT` と組み合わせてデータを変換したい場合は、**TVF** を選びます。

### Q2: HDFS への接続に共通して必要なパラメータは何ですか？

- `fs.defaultFS`: HDFS NameNode のアドレス。必須です。
- `hadoop.username`: HDFS へのアクセスに使用するユーザー名。必須です。
- Kerberos などの認証が有効になっている場合は、対応する認証設定を追加します。

### Q3: TVF の `csv_schema` はどのように記述しますか？

`column_name:type;column_name:type` の形式で記述します。たとえば、`user_id:int;name:string;age:int` です。CSV ファイルの実際の列順および型と一致させる必要があります。

### Q4: HDFS Load ジョブがタイムアウトした場合はどうすればよいですか？

`timeout`（秒）の値を `PROPERTIES` で調整します。デフォルトは 3600 です。大きなファイルをロードする場合は、必要に応じて値を増やしてください。

### Q5: インポート結果の順序がソースファイルと異なるのはなぜですか？

Doris は分散ストレージエンジンであり、`SELECT *` ではデフォルトで行の順序が保証されません。順序を指定して結果を取得するには、明示的に `ORDER BY` を追加してください。
