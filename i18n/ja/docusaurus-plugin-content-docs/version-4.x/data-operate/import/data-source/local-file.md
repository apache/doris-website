---
{
    "title": "ローカルファイル",
    "language": "ja",
    "description": "Apache Doris のローカルファイルインポートガイド。Stream Load、Streamloader、MySQL Load を使用して、ローカルの CSV、JSON、Parquet、ORC ファイルを Doris にインポートします。",
    "keywords": [
        "Doris ローカルファイルインポート",
        "Stream Load",
        "Streamloader",
        "MySQL Load",
        "LOAD DATA LOCAL INFILE",
        "CSV インポート",
        "ローカルデータインポート"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import local files or client-side local data into Apache Doris -->

このドキュメントでは、ローカルファイルから Apache Doris にデータをインポートする方法を説明します。Doris にはローカルファイルのインポート方法が三つあります。データ量、ファイル数、クライアント環境に応じて選択できます。

## 方法の選択

次の表では、三つのローカルインポート方法の特徴と適した用途を比較します。

| インポート方法 | プロトコル／基盤 | 同期／非同期 | 対応形式 | 主な用途 | 参照先 |
|---------|----------|----------|---------|---------|---------|
| **Stream Load** | HTTP | 同期 | CSV、JSON、Parquet、ORC | 単一ファイル、スクリプトによるインポート | [Stream Load](../import-way/stream-load-manual.md) |
| **Streamloader** | Stream Load を基盤とする | 同期 | CSV、JSON、Parquet、ORC | 複数ファイル、大量データの並列インポート | [Streamloader](../../../connection-integration/data-integration/doris-streamloader) |
| **MySQL Load** | MySQL プロトコル | 同期 | CSV | MySQL クライアントからローカルの CSV ファイルをインポート | [MySQL Load](../import-way/mysql-load-manual.md) |

各方法の概要は次のとおりです。

- **Stream Load**: HTTP 経由でローカルファイルやデータストリームを Doris にインポートします。実行後すぐに結果が返され、戻り値からインポートの成否を確認できます。
- **Streamloader**: Stream Load を基盤とする Doris 公式のクライアントツールです。複数ファイルの並列インポートに対応し、大量データのインポートにかかる時間を大幅に短縮できます。
- **MySQL Load**: 標準の MySQL [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) 構文と互換性があります。主に MySQL クライアントからローカルの CSV ファイルをインポートする場合に使用します。

## Stream Load を使用したインポート

### ステップ 1: データを準備する

次の内容の CSV ファイル `streamload_example.csv` を作成します。

```SQL
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

### ステップ 2: データベースにテーブルを作成する

次の構文を使用して、Doris にインポート先のテーブルを作成します。

```SQL
CREATE TABLE testdb.test_streamload(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### ステップ 3: Stream Load を使用してデータをインポートする

`curl` を使用して Stream Load のインポートジョブを送信します。

```Bash
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

Stream Load は同期インポート方式であり、インポート結果がユーザーに直接返されます。

```SQL
{
    "TxnId": 3,
    "Label": "123",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 10,
    "NumberLoadedRows": 10,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 118,
    "LoadTimeMs": 173,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 70,
    "ReadDataTimeMs": 2,
    "WriteDataTimeMs": 48,
    "CommitAndPublishTimeMs": 52
}
```

### ステップ 4: インポートしたデータを確認する

```SQL
select count(*) from testdb.test_streamload;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## Streamloader ツールを使用したインポート

### ステップ 1: データを準備する

次の内容の CSV ファイル `streamloader_example.csv` を作成します。

```SQL
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

### ステップ 2: データベースにテーブルを作成する

次の構文を使用して、Doris にインポート先のテーブルを作成します。

```SQL
CREATE TABLE testdb.test_streamloader(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### ステップ 3: Streamloader ツールを使用してデータをインポートする

```Bash
doris-streamloader --source_file="streamloader_example.csv" --url="http://localhost:8330" --header="column_separator:," --db="testdb" --table="test_streamloader"
```

これは同期インポート方式であり、インポート結果がユーザーに直接返されます。

```SQL
Load Result: {
        "Status": "Success",
        "TotalRows": 10,
        "FailLoadRows": 0,
        "LoadedRows": 10,
        "FilteredRows": 0,
        "UnselectedRows": 0,
        "LoadBytes": 118,
        "LoadTimeMs": 623,
        "LoadFiles": [
                "streamloader_example.csv"
        ]
}
```

### ステップ 4: インポートしたデータを確認する

```SQL
select count(*) from testdb.test_streamloader;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## MySQL Load を使用したローカルデータのインポート

### ステップ 1: データを準備する

次のサンプルデータを含む `client_local.csv` というファイルを作成します。

```SQL
1,10
2,20
3,30
4,40
5,50
6,60
```

### ステップ 2: データベースにテーブルを作成する

`LOAD DATA` コマンドを実行する前に、まず MySQL クライアントで接続します。

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

MySQL Load を正しく実行するには、接続時に次のオプションを指定する必要があります。

1. MySQL クライアントで接続する場合は、`--local-infile` オプションを追加します。追加しないとエラーが発生することがあります。
2. JDBC で接続する場合は、URL に `allowLoadLocalInfile=true` を指定します。

次に、Doris にインポート先のテーブルを作成します。

```SQL
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

### ステップ 3: MySQL Load を使用してデータをインポートする

MySQL クライアントで接続した後、次のコマンドでインポートジョブを作成します。

```SQL
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### ステップ 4: インポートしたデータを確認する

MySQL Load は同期インポート方式です。インポート後、結果がコマンドラインでユーザーに返されます。インポートに失敗した場合は、具体的なエラーメッセージが表示されます。

次はインポートに成功した場合の結果で、インポートされた行数が返されます。

```SQL
Query OK, 6 rows affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```

## よくある質問（FAQ）

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting failures of local file imports -->

**Q1: 三つのインポート方法はどのように選べばよいですか？**

- 単一ファイルをインポートする場合やスクリプトから実行する場合は、Stream Load を選びます。
- 大量のデータがある複数ファイルを並列処理で短時間にインポートしたい場合は、Streamloader を選びます。
- 既存の MySQL クライアント環境からローカルの CSV ファイルをインポートする場合は、MySQL Load を選びます。

**Q2: MySQL Load の実行時に `The used command is not allowed with this MySQL version` というエラーが表示されます。**

次の二点を確認してください。

1. MySQL コマンドラインから接続する際に、`--local-infile` オプションを追加しているか。
2. JDBC で接続する際に、URL に `allowLoadLocalInfile=true` を追加しているか。

**Q3: Stream Load はどのデータ形式に対応していますか？**

CSV、JSON、Parquet、ORC の四形式に対応しています。HTTP ヘッダーで `format` パラメーターを指定できます。

**Q4: Stream Load のインポートが成功したかどうかは、どのように確認できますか？**

返された結果の `Status` フィールドを確認します。値が `Success` なら成功です。`NumberLoadedRows` フィールドと `NumberFilteredRows` フィールドで、インポートされた行数とフィルタリングされた行数も確認できます。
