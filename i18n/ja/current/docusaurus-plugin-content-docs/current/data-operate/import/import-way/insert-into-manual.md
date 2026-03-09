---
{
  "title": "Insert Into Select",
  "language": "ja",
  "description": "INSERT INTO文は、Dorisクエリの結果を別のテーブルにインポートすることをサポートします。INSERT INTOは同期インポート方式です。"
}
---
INSERT INTO文は、Dorisクエリの結果を別のテーブルにインポートすることをサポートしています。INSERT INTOは同期インポート方式であり、インポートの実行後にインポート結果が返されます。インポートが成功したかどうかは、返された結果に基づいて判断できます。INSERT INTOはインポートタスクの原子性を保証します。これは、すべてのデータが正常にインポートされるか、全くインポートされないかのいずれかであることを意味します。

## 適用シナリオ

2. ユーザーがDorisテーブルの既存データに対してETLを実行し、新しいDorisテーブルにインポートしたい場合、INSERT INTO SELECT構文が適用できます。
3. Multi-Catalog外部テーブルメカニズムと組み合わせて、MySQLまたはHiveシステムのテーブルをMulti-Catalog経由でマッピングできます。その後、INSERT INTO SELECT構文を使用して外部テーブルからDorisテーブルにデータをインポートできます。
4. Table Value Functions（TVFs）を利用することで、ユーザーはオブジェクトストレージやHDFS上のファイルに保存されたデータを、自動的な列型推論を伴ってテーブルとして直接クエリできます。その後、INSERT INTO SELECT構文を使用して外部テーブルからDorisテーブルにデータをインポートできます。

## 実装

INSERT INTOを使用する場合、インポートジョブはMySQLプロトコルを使用してFEノードに開始・送信される必要があります。FEは実行プランを生成し、これにはクエリ関連の演算子が含まれ、最後の演算子がOlapTableSinkとなります。OlapTableSink演算子は、クエリ結果をターゲットテーブルに書き込む役割を担います。実行プランはその後BEノードに送信され実行されます。DorisはBEノードの1つをCoordinatorとして指定し、これがデータを受信して他のBEノードに分散します。

## 開始方法

INSERT INTOジョブはMySQLプロトコルを使用して送信・伝送されます。以下の例では、MySQLコマンドラインインターフェース経由でINSERT INTOを使用してインポートジョブを送信する方法を示しています。

詳細な構文については、INSERT INTOドキュメントを参照してください。

### 準備

INSERT INTOはターゲットテーブルに対するINSERT権限が必要です。GRANTコマンドを使用してユーザーアカウントに権限を付与できます。

### INSERT INTOジョブの作成

1. ソーステーブルを作成する

```SQL
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
2. 任意のロード方法を使用してソーステーブルにデータをインポートします。（ここでは例として`INSERT INTO VALUES`を使用します）。

```SQL
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```
3. 上記の操作に基づいて、ターゲットテーブルとして新しいテーブルを作成します（ソーステーブルと同じスキーマで）。

```SQL
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```
4. `INSERT INTO SELECT`を使用して新しいテーブルにデータを取り込みます。

```SQL
INSERT INTO testdb.test_table2
SELECT * FROM testdb.test_table WHERE age < 30;
Query OK, 3 rows affected (0.544 sec)
{'label':'label_9c2bae970023407d_b2c5b78b368e78a7', 'status':'VISIBLE', 'txnId':'9084'}
```
5. インポートしたデータを表示します。

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
6. [JOB](../../../admin-manual/workload-management/job-scheduler)を使用してINSERT操作を非同期で実行できます。

7. ソースは[tvf](../../../lakehouse/file-analysis)または[catalog](../../../lakehouse/catalog-overview)内のテーブルを使用できます。

### INSERT INTOジョブの表示

完了したINSERT INTOタスクを表示するには、`SHOW LOAD`コマンドを使用できます。

```SQL
MySQL> SHOW LOAD FROM testdb;
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| JobId  | Label                                   | State    | Progress           | Type   | EtlInfo | TaskInfo                                                             | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                            | TransactionId | ErrorTablets | User | Comment |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| 376416 | label_3e52da787aab4222_9126d2fce8f6d1e5 | FINISHED | Unknown id: 376416 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:18 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9081          | {}           | root |         |
| 376664 | label_9c2bae970023407d_b2c5b78b368e78a7 | FINISHED | Unknown id: 376664 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:38 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9084          | {}           | root |         |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
```
### INSERT INTO jobs のキャンセル

現在実行中のINSERT INTO jobはCtrl-Cでキャンセルできます。

## マニュアル

### 構文

INSERT INTOの構文は以下の通りです：

1. INSERT INTO SELECT

INSERT INTO SELECTは、クエリ結果をターゲットテーブルに書き込むために使用されます。

```SQL
INSERT INTO target_table SELECT ... FROM source_table;
```
上記のSELECT文は通常のSELECTクエリと同様で、WHEREやJOINなどの操作が可能です。

### パラメータ設定

**FE Config**

| Name | Default Value | Description |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400s (4 hours) | インポートタスクのタイムアウト（秒単位）。インポートタスクがこのタイムアウト期間内に完了しない場合、システムによってキャンセルされ、`CANCELLED`としてマークされます。 |

**Session Variable**

| Name | Default Value | Description |
| --- | --- | --- |
| insert_timeout | 14400s (4 hours) | SQL文としてのINSERT INTOのタイムアウト（秒単位）。 |
| enable_insert_strict | true | これがtrueに設定されている場合、タスクに無効なデータが含まれるとINSERT INTOは失敗します。falseに設定されている場合、INSERT INTOは無効な行を無視し、少なくとも1行が正常にインポートされればインポートは成功とみなされます。バージョン2.1.4まで、INSERT INTOはエラー率を制御できないため、このパラメータはデータ品質を厳密にチェックするか、無効なデータを完全に無視するために使用されます。データが無効になる一般的な理由には、ソースデータ列の長さが宛先列の長さを超えること、列タイプの不一致、パーティションの不一致、列順序の不一致などがあります。 |
| insert_max_filter_ratio | 1.0 | バージョン2.1.5以降。`enable_insert_strict`がfalseの場合のみ有効。`INSERT INTO FROM S3/HDFS/LOCAL()`を使用する際のエラー許容度を制御するために使用されます。デフォルト値は1.0で、すべてのエラーが許容されることを意味します。0から1の間の小数値を指定できます。エラー行数がこの比率を超えた場合、INSERTタスクは失敗します。 |

### 戻り値

INSERT INTOはSQL文であり、異なるクエリ結果に基づいて異なる結果を返します：

**空の結果セット**

INSERT INTOのSELECT文のクエリ結果セットが空の場合、戻り値は以下のようになります：

```SQL
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```
`Query OK`は実行が成功したことを示します。`0 rows affected`はデータがインポートされなかったことを意味します。

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
パラメータの説明:

| Parameter | Description                                                  |
| --------- | ------------------------------------------------------------ |
| TxnId     | インポートトランザクションのID                                 |
| Label     | インポートジョブのラベル: "INSERT INTO tbl WITH LABEL label..." を使用して指定可能 |
| Status    | インポートされたデータの可視性: 可視の場合は "visible" と表示されます。そうでない場合は "committed" と表示されます。"committed" 状態では、インポートは完了していますが、データが可視になるまでに遅延が生じる可能性があります。この場合は再試行の必要はありません。`visible`: インポートが成功し、データが可視です。`committed`: インポートは完了していますが、データが可視になるまでに遅延が生じる可能性があります。この場合は再試行の必要はありません。Label Already Exists: 指定されたラベルが既に存在するため、別のラベルに変更する必要があります。Fail: インポートが失敗しました。 |
| Err       | エラーメッセージ                                              |

フィルタされた行を表示するには [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD) ステートメントを使用できます。

```SQL
SHOW LOAD WHERE label="xxx";
```
このステートメントの結果には、エラーデータをクエリするために使用できるURLが含まれます。詳細については、以下の「エラー行の表示」セクションを参照してください。

データの非表示状態は一時的なものであり、データは最終的に表示されるようになります。

[SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION)ステートメントを使用して、データのバッチの可視性ステータスを確認できます。

```SQL
SHOW TRANSACTION WHERE id=4005;
```
結果の`TransactionStatus`列が`visible`の場合、そのデータが可視であることを示します。

```SQL
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```
**空でない結果セットでもINSERTが失敗**

実行の失敗は、データが正常にインポートされなかったことを意味します。エラーメッセージが返されます：

```SQL
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```
`ERROR 1064 (HY000): all partitions have no load data`は失敗の根本原因を示しています。エラーメッセージに提供されているURLを使用してエラーデータを特定できます。詳細については、以下の「エラー行の表示」セクションを参照してください。

## ベストプラクティス

### データサイズ

INSERT INTOはデータ量に制限を課さず、大規模なデータインポートをサポートできます。ただし、大量のデータをインポートする場合は、`import timeout >= data volume ``/`` estimated import speed`を確保するためにシステムのINSERT INTOタイムアウト設定を調整することが推奨されます。

1. FE設定パラメータ `insert_load_default_timeout_second`
2. 環境パラメータ `insert_timeout`

### エラー行の表示

INSERT INTOの結果にURLフィールドが含まれている場合、以下のコマンドを使用してエラー行を表示できます：

```SQL
SHOW LOAD WARNINGS ON "url";
```
例:

```SQL
SHOW LOAD WARNINGS ON "http://ip:port/api/_load_error_log?file=_shard_13/error_loginsert_stmt_d2cac0a0a16d482d-9041c949a4b71605_d2cac0a0a16d482d_9041c949a4b71605";
```
エラーの一般的な原因には、ソースデータ列長が宛先列長を超過すること、列タイプの不一致、パーティションの不一致、列順序の不一致が含まれます。

環境変数`enable_insert_strict`を設定することで、INSERT INTOがエラー行を無視するかどうかを制御できます。

## Multi-Catalogによる外部データの取り込み

Dorisは外部テーブルの作成をサポートしています。作成後、外部テーブルのデータは`INSERT INTO SELECT`を使用してDoris内部テーブルにインポートするか、SELECT文を使用して直接クエリできます。

Multi-Catalog機能により、DorisはApache Hive、Apache Iceberg、Apache Hudi、Apache Paimon (Incubating)、Elasticsearch、MySQL、Oracle、SQL Serverを含む様々な主要なデータレイクやデータベースへの接続をサポートしています。

Multi-Catalogの詳細については、[Lakehouse overview](../../../lakehouse/lakehouse-overview)を参照してください。

以下は、Hive外部テーブルからDoris内部テーブルへのデータインポートを説明しています。

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

1. Dorisでデータインポート用のターゲットテーブルを作成します。

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
2. Dorisテーブルの作成に関する詳細な手順については、[CREATE TABLE](../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)を参照してください。

3. データのインポート（`hive.db1.source_tbl`テーブルから`target_tbl`テーブルへ）。

```SQL
INSERT INTO target_tbl SELECT k1,k2,k3 FROM  hive.db1.source_tbl limit 100;
```
INSERT コマンドは同期コマンドです。結果が返される場合、それはインポートが成功したことを示しています。

### 注意事項

- 外部データソースと Doris クラスターが通信できることを確認してください。BE ノードと外部データソース間の相互ネットワークアクセシビリティを含みます。

## TVF によるデータ取り込み

Doris は Table Value Functions (TVFs) を通じて、オブジェクトストレージや HDFS に保存されたファイルをテーブルとして直接クエリおよび分析でき、自動カラム型推論をサポートしています。詳細な情報については、[Lakehouse/TVF documentation](../../../lakehouse/file-analysis) を参照してください。

TVF はファイルパスでワイルドカード（`*`、`?`、`[...]`）および範囲パターン（`{1..10}`）をサポートしています。完全な構文については、[File Path Pattern](../../../sql-manual/basic-element/file-path-pattern) を参照してください。

### 自動カラム型推論

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
この S3 TVF の例では、ファイルパス、接続情報、認証情報が指定されています。

`DESC FUNCTION` 構文を使用して、このファイルのスキーマを表示できます。

Parquet ファイルの場合、Doris はファイル内のメタデータに基づいて自動的に列タイプを推論することがわかります。

現在、Doris は Parquet、ORC、CSV、JSON 形式の解析および列タイプ推論をサポートしています。

`INSERT INTO SELECT` 構文と組み合わせて使用することで、Doris テーブルにファイルを迅速にインポートして、より高速な分析を行うことができます。

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

- `S3 / hdfs` TVFで指定されたURIがどのファイルにも一致しない場合、または一致したすべてのファイルが空の場合、`S3 / hdfs` TVFは空の結果セットを返します。このような場合、`DESC FUNCTION`を使用してファイルのスキーマを表示すると、ダミーカラム`__dummy_col`が表示されますが、これは無視できます。
- TVFに指定されたフォーマットがCSVで、読み取られるファイルが空でないが、ファイルの最初の行が空の場合、エラーが表示されます：`The first line is empty, can not parse column numbers`。これは、ファイルの最初の行からスキーマを解析できないためです。

## その他のヘルプ

INSERT INTOのより詳細な構文については、[INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT)コマンドマニュアルを参照してください。MySQLクライアントのコマンドラインで`HELP INSERT`と入力することでも、さらなる情報を得ることができます。
