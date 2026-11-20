---
{
    "title": "INSERT INTO SELECT",
    "language": "ja",
    "description": "INSERT INTO SELECT は Doris の同期インポート方式です。テーブル間の ETL、Multi-Catalog を介した外部テーブルからのインポート、TVF を介したファイルのインポートに対応し、インポートの原子性を保証します。",
    "keywords": [
        "INSERT INTO SELECT",
        "Doris データインポート",
        "同期インポート",
        "Multi-Catalog インポート",
        "TVF インポート",
        "ETL 変換",
        "トランザクションの原子性",
        "insert_timeout",
        "enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Data import / ETL transformation / External data source integration -->

INSERT INTO を使用すると、Doris のクエリ結果を別のテーブルにインポートできます。これは**同期インポート**方式で、実行後すぐに結果が返り、戻り値から成功したかどうかを判断できます。INSERT INTO はインポートタスクの**原子性**を保証します。すべて成功するか、すべて失敗するかのどちらかです。

## ユースケース {#use-cases}

INSERT INTO SELECT は主に次の用途で使用します。

| 用途 | 説明 |
| --- | --- |
| テーブル間の ETL 変換 | Doris テーブルのデータに ETL 変換を適用し、別の Doris テーブルに書き込みます。 |
| 外部テーブルからのデータインポート | Multi-Catalog を介して MySQL や Hive などの外部システムのテーブルをマッピングし、INSERT INTO SELECT で外部データを Doris テーブルにインポートします。 |
| ファイルの直接インポート | Table Value Function（TVF）を使用して、オブジェクトストレージまたは HDFS 上のファイルをテーブルとしてクエリし、列の型を自動推論して、結果を Doris テーブルに書き込みます。 |

## 基本原理 {#basic-principles}

INSERT INTO は MySQL プロトコルを通じて FE ノードにインポートジョブを送信します。実行の流れは次のとおりです。

1. FE が SQL を受信して実行計画を生成します。前半はクエリ関連のオペレーターで構成され、最後の `OlapTableSink` オペレーターがクエリ結果をターゲットテーブルに書き込みます。
2. 実行計画が BE ノードに配布され、実行されます。
3. Doris は BE のいずれかを Coordinator ノードとして選択します。このノードがデータを受け取り、ほかの BE ノードに分配します。

## クイックスタート {#quick-start}

INSERT INTO の送信と転送には MySQL プロトコルを使用します。以下の例では、MySQL コマンドラインを使って一連の流れを示します。

詳しい構文については、[INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT) を参照してください。

### 前提条件 {#prerequisites}

実行前に、ターゲットテーブルに対する `INSERT` 権限が必要です。権限がない場合は、[GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) コマンドで付与できます。

### インポートジョブの作成 {#create-an-import-job}

**ステップ 1：ソーステーブルを作成する**

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**ステップ 2：ソーステーブルにデータをインポートする（INSERT INTO VALUES を使用する例）**

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

**ステップ 3：ターゲットテーブルを作成する（ソーステーブルと同じスキーマ）**

```sql
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```

**ステップ 4：INSERT INTO SELECT でターゲットテーブルにインポートする**

```sql
INSERT INTO testdb.test_table2
SELECT * FROM testdb.test_table WHERE age < 30;
Query OK, 3 rows affected (0.544 sec)
{'label':'label_9c2bae970023407d_b2c5b78b368e78a7', 'status':'VISIBLE', 'txnId':'9084'}
```

**ステップ 5：インポート結果を確認する**

```sql
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

**応用的な使い方：**

- [JOB](../../../admin-manual/workload-management/job-scheduler) を使用すると、INSERT を非同期で実行できます。
- データソースには [TVF](../../../lakehouse/file-analysis.md) や [Catalog](../../../lakehouse/catalog-overview) 内のテーブルを使用できます。

### インポートジョブの確認 {#view-import-jobs}

完了した INSERT INTO タスクは `SHOW LOAD` コマンドで確認できます。

```sql
MySQL> SHOW LOAD FROM testdb;
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| JobId  | Label                                   | State    | Progress           | Type   | EtlInfo | TaskInfo                                                             | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                            | TransactionId | ErrorTablets | User | Comment |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| 376416 | label_3e52da787aab4222_9126d2fce8f6d1e5 | FINISHED | Unknown id: 376416 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:18 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9081          | {}           | root |         |
| 376664 | label_9c2bae970023407d_b2c5b78b368e78a7 | FINISHED | Unknown id: 376664 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:38 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9084          | {}           | root |         |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
```

### インポートジョブのキャンセル {#cancel-an-import-job}

実行中の INSERT INTO ジョブは `Ctrl-C` でキャンセルできます。

## リファレンス {#reference}

### インポートコマンド {#import-command}

INSERT INTO SELECT はクエリ結果をターゲットテーブルに保存します。基本構文は次のとおりです。

```sql
INSERT INTO target_table SELECT ... FROM source_table;
```

SELECT 文は通常のクエリと同じで、`WHERE` や `JOIN` などの操作を含めることができます。

### インポートの設定パラメータ {#import-configuration-parameters}

<!-- Knowledge type: Configuration parameters -->

**FE 設定パラメータ**

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400（4 時間） | インポートタスクのタイムアウト時間（秒）。この時間内にタスクが完了しない場合、システムがタスクをキャンセルし、ステータスが `CANCELLED` に変わります。 |

**セッション変数**

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| insert_timeout | 14400（4 時間） | SQL 文としての INSERT INTO のタイムアウト時間（秒）。 |
| enable_insert_strict | true | true の場合、不適合なデータがあるとインポートは失敗します。false の場合、不適合な行は無視され、少なくとも1行が正しくインポートされれば成功と見なされます。バージョン 2.1.4 以前の INSERT INTO ではエラー率を制御できず、このパラメータで厳密なチェックを行うか、エラーデータをすべて無視するかを指定する方法に限られます。不適合なデータの主な原因には、ソース列の長さがターゲット列の長さを超えること、列の型の不一致、パーティションの不一致、列の順序の不一致があります。 |
| insert_max_filter_ratio | 1.0 | バージョン 2.1.5 以降でサポートされ、`enable_insert_strict = false` の場合にのみ有効です。`INSERT INTO ... VALUES` と `INSERT INTO ... SELECT` でフィルタリングできる行の最大比率を制御します。Doris テーブル、外部テーブル、S3、HDFS、LOCAL などのファイル TVF からのクエリも対象です。値の範囲は 0～1 で、デフォルトは 1.0 です。`filtered_rows / (loaded_rows + filtered_rows)` がこの値を超えると INSERT は失敗します。1.0 を指定するとすべての行をフィルタリングできますが、ほかの実行エラーは抑制されません。 |

### インポートの戻り値 {#import-return-values}

INSERT INTO は SQL 文であり、戻り値はクエリ結果に応じて次のいずれかになります。

#### 結果セットが空の場合 {#empty-result-set}

SELECT 句の結果セットが空の場合、次のように返ります。

```sql
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```

- `Query OK` は実行が成功したことを示します。
- `0 rows affected` はデータがインポートされなかったことを示します。

#### 結果セットが空でなく、INSERT が成功した場合 {#non-empty-result-set-with-successful-insert}

```sql
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

表示内容の説明：

- `Query OK`：実行が成功しました。
- `4 rows affected`：合計4行がインポートされました。
- `2 warnings`：フィルタリングされた行数です。

JSON 文字列も返ります。

```Plain
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

戻り値のフィールドは次のとおりです。

| パラメータ | 説明 |
| -------- | ---- |
| TxnId    | インポートトランザクションの ID。 |
| Label    | インポートジョブのラベル。`INSERT INTO tbl WITH LABEL label ...` で指定できます。 |
| Status   | インポートしたデータが可視かどうかを示します。<p>- `visible`：インポートが成功し、データが可視です。</p><p>- `committed`：インポートは完了しています。データが可視になるまでに遅延が生じる場合がありますが、再試行は不要です。</p><p>- `Label Already Exists`：ラベルが重複しています。別のラベルを使用する必要があります。</p><p>- `Fail`：インポートが失敗しました。</p> |
| Err      | インポートのエラーメッセージ。 |

フィルタリングされた行を確認するには、[SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD) 文を使用します。

```sql
SHOW LOAD WHERE label="xxx";
```

戻り値の `URL` フィールドを使用すると、エラーデータを確認できます。詳しくは後述の[エラー行の確認](#view-error-rows)を参照してください。

`committed` は一時的な状態で、データはいずれ可視になることが保証されています。[SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) 文で可視状態を確認できます。

```sql
SHOW TRANSACTION WHERE id=4005;
```

戻り値の `TransactionStatus` 列が `visible` になれば、データは可視です。

```sql
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

#### 結果セットが空でなく、INSERT が失敗した場合 {#non-empty-result-set-with-failed-insert}

失敗した場合、データは一切インポートされません。戻り値は次のとおりです。

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```

- `ERROR 1064 (HY000): all partitions have no load data`：失敗の原因です。
- 返された URL を使用すると、エラーデータを確認できます。詳しくは後述の[エラー行の確認](#view-error-rows)を参照してください。

## ベストプラクティス {#best-practices}

### 大量データのインポート {#importing-large-volumes-of-data}

INSERT INTO にはデータ量の制限がなく、大量のデータをインポートできます。ただし、データ量が多い場合は、次の条件を満たすようにタイムアウト時間を調整する必要があります。

> インポートのタイムアウト時間 >= データ量 / 推定インポート速度

調整できるパラメータは次のとおりです。

1. FE 設定パラメータ `insert_load_default_timeout_second`。
2. セッション変数 `insert_timeout`。

### エラー行の確認 {#view-error-rows}

<!-- Knowledge type: Troubleshooting -->

INSERT INTO の戻り値に `url` フィールドが含まれる場合、次のコマンドでエラー行を確認できます。

```sql
SHOW LOAD WARNINGS ON "url";
```

例：

```sql
SHOW LOAD WARNINGS ON "http://ip:port/api/_load_error_log?file=_shard_13/error_loginsert_stmt_d2cac0a0a16d482d-9041c949a4b71605_d2cac0a0a16d482d_9041c949a4b71605";
```

**主なエラー原因：**

- ソース列の長さがターゲット列の長さを超えている。
- 列の型が一致しない。
- パーティションが一致しない。
- 列の順序が一致しない。

セッション変数 `enable_insert_strict` で、INSERT INTO がエラー行を無視するかどうかを制御できます。

## Multi-Catalog を介した外部テーブルデータのインポート {#importing-external-table-data-via-multi-catalog}

<!-- Applicable scenarios: External data source integration -->

Doris は Multi-Catalog 機能を通じて、Apache Hive、Apache Iceberg、Apache Hudi、Apache Paimon (Incubating)、Elasticsearch、MySQL、Oracle、SQL Server などの主要なデータレイクやデータベースに接続できます。外部テーブルを作成した後は、`INSERT INTO SELECT` でそのデータをインポートするか、`SELECT` で直接クエリできます。

Multi-Catalog の詳細については、レイクハウスのドキュメントを参照してください。以下では Hive 外部テーブルを例に、インポートの流れを説明します。

### ステップ 1：Hive Catalog を作成する {#step-1-create-a-hive-catalog}

```sql
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

### ステップ 2：Doris のターゲットテーブルを作成する {#step-2-create-the-doris-target-table}

```sql
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

テーブルの作成方法については、[CREATE-TABLE](../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) の構文リファレンスを参照してください。

### ステップ 3：インポートを実行する {#step-3-execute-the-import}

`hive.db1.source_tbl` テーブルから `target_tbl` テーブルにインポートします。

```sql
INSERT INTO target_tbl SELECT k1,k2,k3 FROM  hive.db1.source_tbl limit 100;
```

INSERT は同期コマンドです。成功が返れば、インポートは成功しています。

### 注意事項 {#notes}

- 外部データソースと Doris クラスターがネットワークで接続できることを確認してください。特に、BE ノードと外部データソース間の接続が必要です。

## TVF を介したファイルデータのインポート {#importing-file-data-via-tvf}

<!-- Applicable scenarios: Direct import of files from object storage / HDFS -->

Table Value Function（TVF）を使用すると、Doris はオブジェクトストレージや HDFS 上のファイルをテーブルとして直接クエリ・分析できます。列の型の自動推論と複数ファイルのインポートにも対応しています。詳しくは[レイクハウス / TVF のドキュメント](../../../lakehouse/file-analysis)を参照してください。

TVF はファイルパス内のワイルドカード（`*`、`?`、`[...]`）と範囲パターン（`{1..10}`）をサポートします。完全な構文については、[ファイルパスのパターン](../../../sql-manual/basic-element/file-path-pattern)を参照してください。

### ファイルの列の型の自動推論 {#automatic-file-column-type-inference}

S3 TVF を例に、まず `DESC FUNCTION` でファイルのスキーマを確認します。

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

補足：

- この例では、ファイルパス、接続情報、認証情報を指定しています。
- `DESC FUNCTION` でファイルのスキーマを確認できます。
- Parquet ファイルの場合、Doris はファイルのメタデータから列の型を自動推論します。
- Doris は現在、Parquet、ORC、CSV、JSON 形式の分析と列の型の推論をサポートしています。

### INSERT INTO SELECT を使用したインポート {#importing-with-insert-into-select}

```Plain
// 1. Create a Doris internal table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

// 2. Insert data using the S3 Table Value Function
INSERT INTO test_table (id,name,age)
SELECT cast(id as INT) as id, name, cast (age as INT) as age
FROM s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style" = "true");
```

### 注意事項 {#notes-1}

- `S3 / hdfs` TVF に指定した URI に一致するファイルがない場合、または一致するファイルがすべて空の場合、TVF は空の結果セットを返します。このとき `DESC FUNCTION` でスキーマを確認すると、`__dummy_col` というダミー列が1列返りますが、無視してかまいません。
- TVF の形式に CSV を指定して `The first line is empty, can not parse column numbers` というエラーが報告された場合、ファイルの先頭行からスキーマを解析できないことが原因です。

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1：INSERT INTO は同期ですか、非同期ですか？**

INSERT INTO はデフォルトで**同期**実行され、実行後すぐに結果を返します。非同期で実行するには、[JOB](../../../admin-manual/workload-management/job-scheduler) と組み合わせます。

**Q2：INSERT INTO が失敗した場合、データの一部が書き込まれますか？**

いいえ。INSERT INTO は**原子性**を保証します。すべて成功するか、すべて失敗するかのどちらかです。

**Q3：インポートがタイムアウトする場合はどうすればよいですか？**

`Import timeout >= Data volume / Estimated import speed` を満たすように、次のパラメータを調整してください。

- FE 設定：`insert_load_default_timeout_second`
- セッション変数：`insert_timeout`

**Q4：エラーデータの許容度はどのように制御しますか？**

- `enable_insert_strict = true`：不適合なデータがあると、直ちに失敗します。
- `enable_insert_strict = false`：不適合な行を無視します（バージョン 2.1.4 以前）。
- バージョン 2.1.5 以降は、`insert_max_filter_ratio` を使用して比率でエラーの許容度を制御できます。このパラメータは `enable_insert_strict = false` の場合にのみ有効です。Doris テーブル、外部テーブル、ファイル TVF を含む、`INSERT INTO ... VALUES` と `INSERT INTO ... SELECT` の両方に適用されます。

**Q5：ステータスが `committed` で、`visible` ではない場合はどうすればよいですか？**

`committed` はインポートが完了したことを意味します。データはいずれ可視になることが保証されているため、再試行は不要です。[SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) で `TransactionStatus` が `visible` に変わったか確認できます。

## さらに詳しく {#more-help}

INSERT INTO の構文については、[INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT) のコマンドリファレンスを参照してください。MySQL クライアントのコマンドラインで `HELP INSERT` と入力して、詳細を確認することもできます。
