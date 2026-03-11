---
{
  "title": "Insert Into Select",
  "description": "INSERT INTO文は、Dorisクエリの結果を別のtableにインポートすることをサポートしています。INSERT INTOは同期インポート方式であり、",
  "language": "ja"
}
---
INSERT INTO文は、Dorisクエリの結果を別のtableにインポートすることをサポートしています。INSERT INTOは同期的なインポート方法で、インポートが実行された後にインポート結果が返されます。返された結果に基づいて、インポートが成功したかどうかを判断できます。INSERT INTOはインポートタスクの原子性を保証します。つまり、すべてのデータが正常にインポートされるか、どのデータもインポートされないかのいずれかです。

## 適用シナリオ

2. ユーザーがDorisTable内の既存データに対してETLを実行し、その後新しいDorisTableにインポートしたい場合、INSERT INTO SELECT構文が適用可能です。
3. Multi-カタログ外部tableメカニズムと組み合わせて、MySQLやHiveシステムからのtableをMulti-カタログ経由でマッピングできます。その後、INSERT INTO SELECT構文を使用して外部tableからDorisTableにデータをインポートできます。
4. table Value Functions (TVF)を利用して、ユーザーはオブジェクトストレージやHDFS上のファイルに格納されたデータを、自動的な列型推論機能付きのtableとして直接クエリできます。その後、INSERT INTO SELECT構文を使用して外部tableからDorisTableにデータをインポートできます。

## 実装

INSERT INTOを使用する場合、インポートジョブはMySQLプロトコルを使用してFEノードに開始され、送信される必要があります。FEは実行プランを生成し、これにはクエリ関連のオペレーターが含まれ、最後のオペレーターがOlapTableSinkです。OlapTableSinkオペレーターは、クエリ結果をターゲットtableに書き込む役割を担います。実行プランはその後、実行のためにBEノードに送信されます。DorisはCoordinatorとして1つのBEノードを指定し、このノードがデータを受信して他のBEノードに配布します。

## はじめに

INSERT INTOジョブはMySQLプロトコルを使用して送信および伝送されます。以下の例では、MySQLコマンドラインインターフェースを通じてINSERT INTOを使用してインポートジョブを送信する方法を示します。

詳細な構文はINSERT INTOドキュメントで確認できます。

### 準備

INSERT INTOはターゲットtableに対するINSERT権限が必要です。GRANTコマンドを使用してユーザーアカウントに権限を付与できます。

### INSERT INTOジョブの作成

1. ソースtableを作成

```SQL
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
2. 任意のロード方法を使用してソースTableにデータをインポートします。（ここでは例として`INSERT INTO VALUES`を使用します）。

```SQL
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```
3. 上記の操作に基づいて、ターゲットTableとして新しいTableを作成します（ソースTableと同じスキーマを使用）。

```SQL
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```
4. `INSERT INTO SELECT`を使用して新しいTableにデータを取り込みます。

```SQL
INSERT INTO testdb.test_table2
SELECT * FROM testdb.test_table WHERE age < 30;
Query OK, 3 rows affected (0.544 sec)
{'label':'label_9c2bae970023407d_b2c5b78b368e78a7', 'status':'VISIBLE', 'txnId':'9084'}
```
5. インポートしたデータを表示する。

```SQL
MySQL> SELECT * FROM testdb.test_table2 ORDER BY age;
+---------+--------+------+
| user_id | name   | age  |
+---------+--------+------+
|       5 | Ava    |   17 |
|       1 | Emily  |   25 |
|       3 | Olivia |   28 |
+---------+--------+------+
3 rows in set (0.02 sec)
```
6. [JOB](../../../admin-manual/workload-management/job-scheduler)を使用してINSERT操作を非同期で実行することができます。

7. ソースは[tvf](../../../lakehouse/file-analysis.md)または[catalog](../../../lakehouse/catalogs/hive-catalog.mdx)内のTableを使用できます。

### INSERT INTOジョブの表示

`SHOW LOAD`コマンドを使用して、完了したINSERT INTOタスクを表示することができます。

```SQL
MySQL> SHOW LOAD FROM testdb;
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| JobId  | Label                                   | State    | Progress           | Type   | EtlInfo | TaskInfo                                                             | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                            | TransactionId | ErrorTablets | User | Comment |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| 376416 | label_3e52da787aab4222_9126d2fce8f6d1e5 | FINISHED | Unknown id: 376416 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:18 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9081          | {}           | root |         |
| 376664 | label_9c2bae970023407d_b2c5b78b368e78a7 | FINISHED | Unknown id: 376664 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:38 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9084          | {}           | root |         |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
```
### INSERT INTO jobsのキャンセル

現在実行中のINSERT INTO jobをCtrl-Cでキャンセルできます。

## マニュアル

### 構文

INSERT INTOの構文は以下の通りです：

1. INSERT INTO SELECT

INSERT INTO SELECTは、クエリ結果をターゲットTableに書き込むために使用されます。

```SQL
INSERT INTO target_table SELECT ... FROM source_table;
```
上記のSELECT文は通常のSELECTクエリと同様で、WHEREやJOINなどの操作が可能です。

### パラメータ設定

**FE Config**

| Name | デフォルト値 | デスクリプション |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400s (4 hours) | インポートタスクのタイムアウト（秒単位）。インポートタスクがこのタイムアウト期間内に完了しない場合、システムによってキャンセルされ、`CANCELLED`としてマークされます。 |

**Session Variable**

| Name | デフォルト値 | デスクリプション |
| --- | --- | --- |
| insert_timeout | 14400s (4 hours) | SQL文としてのINSERT INTOのタイムアウト（秒単位）。 |
| enable_insert_strict | true | これがtrueに設定されている場合、タスクに無効なデータが含まれるとINSERT INTOは失敗します。falseに設定されている場合、INSERT INTOは無効な行を無視し、少なくとも1行が正常にインポートされればインポートは成功したとみなされます。バージョン2.1.4まで、INSERT INTOはエラー率を制御できないため、このパラメータはデータ品質を厳密にチェックするか、無効なデータを完全に無視するかのいずれかを選択するために使用されます。データが無効になる一般的な理由には、ソースデータの列長が宛先列長を超えている、列タイプの不一致、パーティションの不一致、列順序の不一致などがあります。 |
| insert_max_filter_ratio | 1.0 | バージョン2.1.5以降。`enable_insert_strict`がfalseの場合のみ有効。`INSERT INTO FROM S3/HDFS/LOCAL()`を使用する際のエラー許容度を制御するために使用されます。デフォルト値は1.0で、すべてのエラーが許容されることを意味します。0と1の間の小数値を設定できます。エラー行数がこの比率を超えると、INSERTタスクは失敗することを意味します。 |

### 戻り値

INSERT INTOはSQL文であり、異なるクエリ結果に基づいて異なる結果を返します：

**空の結果セット**

INSERT INTOのSELECT文のクエリ結果セットが空の場合、戻り値は以下のようになります：

```SQL
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```
`Query OK` は実行が成功したことを示します。`0 rows affected` はデータがインポートされなかったことを意味します。

**空でない結果セットと成功したINSERT**

```SQL
mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 4 rows affected (0.38 sec)
{'label':'INSERT_8510c568-9eda-4173-9e36-6adc7d35291c', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 WITH LABEL my_label1 SELECT * FROM tbl2;
Query OK, 4 rows affected (0.38 sec)
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 2 rows affected, 2 warnings (0.31 sec)
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 2 rows affected, 2 warnings (0.31 sec)
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
```
`Query OK`は実行が成功したことを示します。`4 rows affected`は合計4行のデータがインポートされたことを示します。`2 warnings`はフィルタリングされた行数を示します。

さらに、JSON文字列が返されます：

```Plain
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```
パラメータの説明：

| Parameter | デスクリプション                                                  |
| --------- | ------------------------------------------------------------ |
| TxnId     | インポートトランザクションのID                                 |
| Label     | インポートジョブのラベル："INSERT INTO tbl WITH LABEL label..."を使用して指定できます |
| Status    | インポートされたデータの可視性：可視である場合、"visible"と表示されます。そうでない場合、"committed"と表示されます。"committed"状態では、インポートは完了していますが、データが可視になるまでに遅延が生じる可能性があります。この場合、再試行する必要はありません。`visible`：インポートが成功し、データが可視です。`committed`：インポートは完了していますが、データが可視になるまでに遅延が生じる可能性があります。この場合、再試行する必要はありません。Label Already Exists：指定されたラベルが既に存在するため、別のラベルに変更する必要があります。Fail：インポートが失敗しました。 |
| Err       | エラーメッセージ                                               |

SHOW LOAD文を使用してフィルタされた行を表示できます。

```SQL
SHOW LOAD WHERE label="xxx";
```
この文の結果には、エラーデータをクエリするために使用できるURLが含まれます。詳細については、以下の「View error rows」セクションを参照してください。

データの非表示状態は一時的であり、データは最終的に表示されるようになります。

SHOW TRANSACTION文を使用して、データのバッチの可視性ステータスを確認できます。

```SQL
SHOW TRANSACTION WHERE id=4005;
```
結果の`TransactionStatus`列が`visible`の場合、データが表示可能であることを示します。

```SQL
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```
**空でない結果セットだがINSERTが失敗**

実行の失敗は、データが正常にインポートされなかったことを意味します。エラーメッセージが返されます：

```SQL
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```
`ERROR 1064 (HY000): all partitions have no load data`は失敗の根本原因を示しています。エラーメッセージで提供されるURLを使用してエラーデータを特定できます。詳細については、下記の「エラー行の確認」セクションを参照してください。

## ベストプラクティス

### データサイズ

INSERT INTOはデータ量に制限を課さず、大規模なデータインポートをサポートできます。ただし、大量のデータをインポートする場合は、`インポートタイムアウト >= データ量 / 推定インポート速度`を確実にするため、システムのINSERT INTOタイムアウト設定を調整することを推奨します。

1. FE設定パラメータ`insert_load_default_timeout_second`
2. 環境パラメータ`insert_timeout`

### エラー行の確認

INSERT INTOの結果にURLフィールドが含まれている場合、以下のコマンドを使用してエラー行を確認できます：

```SQL
SHOW LOAD WARNINGS ON "url";
```

```SQL
SHOW LOAD WARNINGS ON "http://ip:port/api/_load_error_log?file=_shard_13/error_loginsert_stmt_d2cac0a0a16d482d-9041c949a4b71605_d2cac0a0a16d482d_9041c949a4b71605";
```
エラーの一般的な原因には、ソースデータの列長が宛先列長を超える場合、列タイプの不一致、パーティションの不一致、列順序の不一致などがあります。

環境変数`enable_insert_strict`を設定することで、INSERT INTOがエラー行を無視するかどうかを制御できます。

## Multi-Catalogによる外部データの取り込み

Dorisは外部Tableの作成をサポートしています。作成後、外部Tableのデータは`INSERT INTO SELECT`を使用してDoris内部Tableにインポートするか、SELECT文を使用して直接クエリできます。

Multi-Catalog機能により、DorisはApache Hive、Apache Iceberg、Apache Hudi、Apache Paimon (Incubating)、Elasticsearch、MySQL、Oracle、SQL Serverなど、さまざまな主流データレイクやデータベースへの接続をサポートしています。

Multi-Catalogの詳細については、[レイクハウス overview](../../../lakehouse/lakehouse-overview)を参照してください。

以下では、Hive外部TableからDoris内部Tableへのデータインポートの例を示します。

### Hive Catalogの作成

```SQL
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```
### データの取り込み

1. Dorisでデータインポート用のターゲットTableを作成します。

```SQL
CREATE TABLE `target_tbl` (
  `k1` decimal(9, 3) NOT NULL COMMENT "",
  `k2` char(10) NOT NULL COMMENT "",
  `k3` datetime NOT NULL COMMENT "",
  `k5` varchar(20) NOT NULL COMMENT "",
  `k6` double NOT NULL COMMENT ""
)
COMMENT "Doris Table"
DISTRIBUTED BY HASH(k1) BUCKETS 2
PROPERTIES (
    "replication_num" = "1"
);
```
2. DorisTableの作成に関する詳細な手順については、CREATE TABLEを参照してください。

3. データのインポート（`hive.db1.source_tbl`Tableから`target_tbl`Tableへ）。

```SQL
INSERT INTO target_tbl SELECT k1,k2,k3 FROM  hive.db1.source_tbl limit 100;
```
INSERTコマンドは同期コマンドです。結果が返される場合、インポートが成功したことを示します。

### 注意事項

- 外部データソースとDorisクラスターが通信できることを確認してください。これには、BEノードと外部データソース間の相互ネットワークアクセシビリティが含まれます。

## TVFによるデータ取り込み

Dorisは、Table Value Functions (TVFs)を通じて、オブジェクトストレージやHDFSに保存されたファイルを直接Tableとしてクエリおよび解析できます。これは自動カラムタイプ推論をサポートします。詳細については、レイクハウス/TVFドキュメントを参照してください。

### 自動カラムタイプ推論

```Plain
DESC FUNCTION s3 (
    "URI" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style"="true"
);
+---------------+--------------+------+-------+---------+-------+
| Field         | Type         | Null | Key   | Default | Extra |
+---------------+--------------+------+-------+---------+-------+
| p_partkey     | INT          | Yes  | false | NULL    | NONE  |
| p_name        | TEXT         | Yes  | false | NULL    | NONE  |
| p_mfgr        | TEXT         | Yes  | false | NULL    | NONE  |
| p_brand       | TEXT         | Yes  | false | NULL    | NONE  |
| p_type        | TEXT         | Yes  | false | NULL    | NONE  |
| p_size        | INT          | Yes  | false | NULL    | NONE  |
| p_container   | TEXT         | Yes  | false | NULL    | NONE  |
| p_retailprice | DECIMAL(9,0) | Yes  | false | NULL    | NONE  |
| p_comment     | TEXT         | Yes  | false | NULL    | NONE  |
+---------------+--------------+------+-------+---------+-------+
```
このS3 TVFの例では、ファイルパス、接続情報、および認証情報が指定されています。

`DESC FUNCTION`構文を使用して、このファイルのスキーマを表示できます。

Parquetファイルの場合、Dorisはファイル内のメタデータに基づいて列の型を自動的に推論することがわかります。

現在、DorisはParquet、ORC、CSV、およびJSON形式の解析と列型推論をサポートしています。

`INSERT INTO SELECT`構文と組み合わせて使用することで、ファイルをDorisTableに迅速にインポートし、より高速な分析を実現できます。

```Plain
// 1. Create Doris internal table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

// 2. Insert data by S3 Table Value Function
INSERT INTO test_table (id,name,age)
SELECT cast(id as INT) as id, name, cast (age as INT) as age
FROM s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style" = "true");
```
### 注意事項

- `S3 / hdfs` TVFで指定されたURIがいずれのファイルにもマッチしない場合、またはマッチしたファイルがすべて空の場合、`S3 / hdfs` TVFは空の結果セットを返します。このような場合、`DESC FUNCTION`を使用してファイルのスキーマを表示すると、ダミーカラム`__dummy_col`が表示されますが、これは無視できます。
- TVFに指定された形式がCSVで、読み取られるファイルが空でないにも関わらずファイルの最初の行が空の場合、エラーが表示されます：`The first line is empty, can not parse column numbers`。これはファイルの最初の行からスキーマを解析できないためです。

## より詳しいヘルプ

INSERT INTOのより詳細な構文については、INSERT INTOコマンドマニュアルを参照してください。また、MySQLクライアントのコマンドラインで`HELP INSERT`と入力することで、さらなる情報を得ることもできます。
