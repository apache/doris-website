---
{
  "title": "ローカルファイル",
  "language": "ja",
  "description": "Dorisは、ローカルソースからデータを読み込むための複数の方法を提供します："
}
---
Dorisはローカルソースからデータを読み込む複数の方法を提供します：

### 1. Stream Load

HTTPプロトコル経由でローカルファイルやデータストリームをDorisに読み込みます。CSV、JSON、Parquet、ORCフォーマットをサポートします。詳細については、[Stream Loadドキュメント](../import-way/stream-load-manual.md)を参照してください。

### 2. Streamloaderツール

StreamloaderツールはStream Loadをベースとした、Dorisデータベースにデータを読み込むための専用クライアントツールです。マルチファイルと並行読み込み機能を提供し、大量データの読み込みに必要な時間を短縮できます。詳細なドキュメントについては、[Streamloader](../../../ecosystem/doris-streamloader)を参照してください。

### 3. MySQL Load

DorisはMySQLプロトコルと互換性があり、標準的な[LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html)構文を使用したローカルファイルの読み込みをサポートしており、CSVファイルの読み込みに適しています。

## Stream Loadを使用したデータの読み込み

### ステップ1：データの準備

以下の内容で`streamload_example.csv`という名前のCSVファイルを作成します：

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
### ステップ2: テーブルの作成

以下の構文を使用してDorisでテーブルを作成します:

```SQL
CREATE TABLE testdb.test_streamload(
    user_id BIGINT NOT NULL COMMENT "User ID",
    name VARCHAR(20) COMMENT "User Name",
    age INT COMMENT "User Age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
### Step 3: データの読み込み

`curl`を使用してStream Loadジョブを送信します：

```Bash
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
読み込み結果の例：

```SQL
{
    "TxnId": 3,
    "Status": "Success",
    "NumberTotalRows": 10,
    "NumberLoadedRows": 10
}
```
### ステップ4: 読み込まれたデータの確認

```SQL
mysql> SELECT COUNT(*) FROM testdb.test_streamload;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```
## Streamloader ツールを使用したデータの読み込み

### ステップ 1: データの準備

上記と同じ内容で `streamloader_example.csv` という名前の CSV ファイルを作成します。

### ステップ 2: テーブルの作成

上記と同じ構文を使用して Doris でテーブルを作成します。

### ステップ 3: データの読み込み

Streamloader ツールを使用してデータを読み込みます:

```Bash
doris-streamloader --source_file="streamloader_example.csv" --url="http://localhost:8330" --header="column_separator:," --db="testdb" --table="test_streamload"
```
読み込み結果の例：

```SQL
Load Result: {
    "Status": "Success",
    "TotalRows": 10,
    "LoadedRows": 10
}
```
### ステップ4: 読み込まれたデータの確認

```SQL
mysql> SELECT COUNT(*) FROM testdb.test_streamload;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```
## MySQL Loadを使用したデータの読み込み

### ステップ1: データの準備

以下のサンプルデータを含む`client_local.csv`という名前のファイルを作成します：

```SQL
1,10
2,20
3,30
4,40
5,50
6,60
```
### ステップ2: MySQLクライアントに接続する

```Shell
mysql --local-infile -h <fe_ip> -P <fe_query_port> -u root -D testdb
```
### ステップ3: データの読み込み

MySQL Loadコマンドを実行します：

```SQL
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```
### ステップ 4: 読み込まれたデータの確認

読み込みが成功した場合、結果は以下のように表示されます：

```SQL
Query OK, 6 row affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```
