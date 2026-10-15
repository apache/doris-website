---
{
    "title": "Insert Into Select",
    "language": "ja",
    "description": "INSERT INTO SELECT は Doris の同期インポート方式です。テーブル間の ETL、Multi-Catalog を介した外部テーブルからのインポート、TVF を介したファイルのインポートに対応し、インポートの原子性を保証します。",
    "keywords": [
        "INSERT INTO SELECT",
        "Doris のデータインポート",
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

INSERT INTO を使用すると、Doris のクエリ結果を別のテーブルにインポートできます。これは**同期インポート**方式です。実行後すぐに結果が返され、戻り値から成否を確認できます。INSERT INTO はインポートタスクの**原子性**を保証します。つまり、すべて成功するか、すべて失敗します。

## ユースケース {#use-cases}

INSERT INTO SELECT は主に次の三つの場面で使用します。

| シナリオ | 説明 |
| --- | --- |
| テーブル間の ETL 変換 | Doris テーブルのデータに ETL 変換を適用し、別の Doris テーブルに書き込みます。 |
| 外部テーブルからのデータインポート | Multi-Catalog を介して MySQL や Hive などの外部システムのテーブルをマッピングし、INSERT INTO SELECT で外部データを Doris テーブルにインポートします。 |
| ファイルの直接インポート | テーブル値関数（TVF）を使用して、オブジェクトストレージまたは HDFS 上のファイルをテーブルとしてクエリし、列の型を自動推論して、その結果を Doris テーブルに書き込みます。 |

## 基本原理 {#basic-principles}

INSERT INTO は MySQL プロトコルを介して FE ノードにインポートジョブを送信します。実行の流れは次のとおりです。

1. FE は SQL を受信して実行計画を生成します。前半はクエリ関連の演算子で構成され、最後の演算子はクエリ結果をターゲットテーブルに書き込む `OlapTableSink` です。
2. 実行計画が BE ノードに配布され、実行されます。
3. Doris は一つの BE を Coordinator ノードに選びます。このノードがデータを受信し、他の BE ノードに配布します。

## クイックスタート {#quick-start}

INSERT INTO は MySQL プロトコルを介して送信されます。次の例では、MySQL コマンドラインを使用して一連の手順を示します。

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

**ステップ 2：ソーステーブルにデータをインポートする（INSERT INTO VALUES の例）**

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

**ステップ 4：INSERT INTO SELECT を使用してターゲットテーブルにインポートする**

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
- データソースには、[TVF](../../../lakehouse/file-analysis.md) または [Catalog](../../../lakehouse/catalog-overview) 内のテーブルを使用できます。

### インポートジョブの確認 {#view-import-jobs}

完了した INSERT INTO タスクを確認するには、`SHOW LOAD` コマンドを使用します。

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

SELECT 文は通常のクエリと同様で、`WHERE`、`JOIN` などの操作を含められます。

### インポートの設定パラメータ {#import-configuration-parameters}

<!-- Knowledge type: Configuration parameters -->

**FE 設定パラメータ**

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400（4 時間） | インポートタスクのタイムアウト（秒）。この時間内にタスクが完了しない場合、システムはタスクをキャンセルし、ステータスは `CANCELLED` に変わります。 |

**セッション変数**

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| insert_timeout | 14400（4 時間） | SQL 文としての INSERT INTO のタイムアウト（秒）。 |
| enable_insert_strict | true | true の場合、形式に合わないデータが一件でも見つかるとインポートは失敗します。false の場合、形式に合わない行は無視され、少なくとも一行が正しくインポートされれば成功と見なされます。バージョン 2.1.4 以前では、INSERT INTO でエラー率を制御できません。このパラメータで厳格なチェックを有効にするか、エラーデータをすべて無視するかを設定することしかできません。形式に合わないデータの一般的な原因には、ソース列の長さがターゲット列の長さを超えること、列の型の不一致、パーティションの不一致、列の順序の不一致があります。 |
| insert_max_filter_ratio | 1.0 | バージョン 2.1.5 以降でサポートされます。`enable_insert_strict` が false の場合にのみ有効です。`INSERT INTO FROM S3/HDFS/LOCAL()` のエラー許容率を制御します。デフォルト値の 1.0 はすべてのエラーを許容することを意味します。値の範囲は 0 から 1 で、エラー行の割合がこの値を超えると INSERT タスクは失敗します。 |

### インポートの戻り値 {#import-return-values}

INSERT INTO は SQL 文です。戻り値はクエリ結果に応じて次の三つのケースに分かれます。

#### 結果セットが空の場合 {#empty-result-set}

SELECT 句の結果セットが空の場合、次のように返されます。

```sql
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```

- `Query OK` は実行が成功したことを示します。
- `0 rows affected` はデータがインポートされなかったことを示します。

#### 結果セットが空ではなく、INSERT が成功した場合 {#non-empty-result-set-with-successful-insert}

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

各フィールドの説明：

- `Query OK`：実行が成功しました。
- `4 rows affected`：合計 4 行がインポートされました。
- `2 warnings`：除外された行数です。

JSON 文字列も返されます。

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
| Status   | インポートしたデータが参照可能かどうかを示します。<p>- `visible`：インポートが成功し、データを参照できます。</p><p>- `committed`：インポートは完了しています。データが参照可能になるまで時間がかかる場合がありますが、再試行は不要です。</p><p>- `Label Already Exists`：ラベルが重複しています。別のラベルを使用する必要があります。</p><p>- `Fail`：インポートが失敗しました。</p> |
| Err      | インポートのエラーメッセージ。 |

除外された行を確認するには、[SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD) 文を使用します。

```sql
SHOW LOAD WHERE label="xxx";
```

戻り値の `URL` フィールドを使用すると、エラーデータを照会できます。以下の[エラー行の確認](#view-error-rows)を参照してください。

`committed` は一時的な状態であり、データは最終的に参照可能になることが保証されます。[SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) 文で参照可能かどうかを確認できます。

```sql
SHOW TRANSACTION WHERE id=4005;
```

戻り値の `TransactionStatus` 列が `visible` になれば、データを参照できます。

```sql
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

#### 結果セットが空ではなく、INSERT が失敗した場合 {#non-empty-result-set-with-failed-insert}

失敗した場合、データは一行も正常にインポートされません。戻り値は次のとおりです。

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```

- `ERROR 1064 (HY000): all partitions have no load data`：失敗の原因です。
- 返された URL を使用すると、エラーデータを照会できます。以下の[エラー行の確認](#view-error-rows)を参照してください。

## ベストプラクティス {#best-practices}

### 大量データのインポート {#importing-large-volumes-of-data}

INSERT INTO にデータ量の制限はなく、大量のデータをインポートできます。ただし、データ量が多い場合は、次の条件を満たすようにタイムアウトを調整する必要があります。

> インポートのタイムアウト >= データ量 / 推定インポート速度

次の二つのパラメータを調整できます。

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

**一般的なエラーの原因：**

- ソース列の長さがターゲット列の長さを超えています。
- 列の型が一致していません。
- パーティションが一致していません。
- 列の順序が一致していません。

INSERT INTO でエラー行を無視するかどうかは、セッション変数 `enable_insert_strict` で制御できます。

## Multi-Catalog を介した外部テーブルデータのインポート {#importing-external-table-data-via-multi-catalog}

<!-- Applicable scenarios: External data source integration -->

Multi-Catalog 機能を使用すると、Doris は Apache Hive、Apache Iceberg、Apache Hudi、Apache Paimon（Incubating）、Elasticsearch、MySQL、Oracle、SQL Server などの主要なデータレイクやデータベースに接続できます。外部テーブルを作成した後、`INSERT INTO SELECT` でそのデータをインポートするか、`SELECT` で直接クエリできます。

Multi-Catalog の詳細は Lakehouse のドキュメントを参照してください。次の例では、Hive 外部テーブルを使用してインポートの流れを示します。

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

INSERT は同期コマンドです。成功を示す結果が返れば、インポートは成功しています。

### 注意事項 {#notes}

- 外部データソースと Doris クラスターの間、特に BE ノードと外部データソースの間でネットワーク接続を確保する必要があります。

## TVF を介したファイルデータのインポート {#importing-file-data-via-tvf}

<!-- Applicable scenarios: Direct import of files from object storage / HDFS -->

テーブル値関数（TVF）を使用すると、Doris はオブジェクトストレージまたは HDFS 上のファイルをテーブルとして直接クエリ・分析できます。列の型の自動推論と複数ファイルのインポートにも対応します。詳細は [Lakehouse / TVF のドキュメント](../../../lakehouse/file-analysis)を参照してください。

TVF はファイルパスでワイルドカード（`*`、`?`、`[...]`）と範囲パターン（`{1..10}`）をサポートします。完全な構文については、[ファイルパスのパターン](../../../sql-manual/basic-element/file-path-pattern)を参照してください。

### ファイル列の型の自動推論 {#automatic-file-column-type-inference}

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

注意事項：

- この例では、ファイルパス、接続情報、認証情報を指定しています。
- `DESC FUNCTION` でファイルのスキーマを確認できます。
- Parquet ファイルの場合、Doris はファイルのメタデータから列の型を自動推論します。
- Doris は現在、Parquet、ORC、CSV、JSON 形式の解析と列の型の推論をサポートしています。

### INSERT INTO SELECT によるインポート {#importing-with-insert-into-select}

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

- `S3 / hdfs` TVF に指定した URI に一致するファイルがない場合、または一致したファイルがすべて空の場合、TVF は空の結果セットを返します。このとき、`DESC FUNCTION` でスキーマを確認すると、`__dummy_col` という名前のダミー列が一つ返されますが、無視して構いません。
- TVF の形式に CSV を指定し、エラー `The first line is empty, can not parse column numbers` が報告された場合、ファイルの最初の行からスキーマを解析できないことが原因です。

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1：INSERT INTO は同期処理ですか、非同期処理ですか？**

INSERT INTO はデフォルトで**同期処理**であり、実行後すぐに結果を返します。非同期で実行するには、[JOB](../../../admin-manual/workload-management/job-scheduler) と組み合わせます。

**Q2：INSERT INTO が失敗した場合、一部のデータは書き込まれますか？**

いいえ。INSERT INTO は**原子性**を保証します。つまり、すべて成功するか、すべて失敗します。

**Q3：インポートのタイムアウトにはどう対処しますか？**

次の二つのパラメータを調整し、`Import timeout >= Data volume / Estimated import speed` を満たすようにします。

- FE 設定：`insert_load_default_timeout_second`
- セッション変数：`insert_timeout`

**Q4：エラーデータの許容度はどう制御しますか？**

- `enable_insert_strict = true`：形式に合わないデータが一件でも見つかると、直ちに失敗します。
- `enable_insert_strict = false`：形式に合わない行を無視します（バージョン 2.1.4 以前）。
- バージョン 2.1.5 以降は、`insert_max_filter_ratio`（`enable_insert_strict = false` の場合にのみ有効）を使用して、エラー許容率を制御できます。これは `INSERT INTO FROM S3/HDFS/LOCAL()` にのみ適用されます。

**Q5：ステータスが `committed` と返され、`visible` ではない場合、どうすればよいですか？**

`committed` はインポートが完了したことを意味します。データは最終的に参照可能になることが保証されるため、再試行は不要です。[SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) で `TransactionStatus` が `visible` に変わったか確認できます。

## 詳細情報 {#more-help}

INSERT INTO の詳しい構文については、[INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT) のコマンドリファレンスを参照してください。MySQL クライアントのコマンドラインで `HELP INSERT` と入力しても詳細を確認できます。
