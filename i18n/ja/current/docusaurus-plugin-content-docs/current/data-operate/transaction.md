---
{
  "title": "トランザクション",
  "language": "ja",
  "description": "トランザクションは、1つ以上のSQL文を含む操作です。"
}
---
トランザクションは、1つ以上のSQL文を含む操作です。これらの文の実行は、完全に成功するか完全に失敗するかのいずれかでなければなりません。これは分割不可能な作業単位です。

## はじめに

クエリとDDLの単一文は暗黙的なトランザクションであり、複数文トランザクション内ではサポートされていません。個々の書き込みはデフォルトで暗黙的なトランザクションであり、複数の書き込みは明示的なトランザクションを形成できます。現在、Dorisはネストしたトランザクションをサポートしていません。

## 明示的および暗黙的トランザクション

### 明示的トランザクション

明示的トランザクションでは、ユーザーが積極的にトランザクションを開始、コミット、またはロールバックする必要があります。現在、DDLおよびクエリ文はサポートされていません。

```sql
BEGIN;
[INSERT, UPDATE, DELETE statement]
COMMIT; / ROLLBACK;
```
### 暗黙的トランザクション

暗黙的トランザクションとは、ステートメントの前後にトランザクションを開始およびコミットするステートメントを明示的に追加することなく実行されるSQLステートメントを指します。

Dorisでは、[Group Commit](../data-operate/import/group-commit-manual)を除き、各インポートステートメントは実行開始時にトランザクションを開きます。ステートメントの実行後、トランザクションは自動的にコミットされるか、ステートメントが失敗した場合は自動的にロールバックされます。各クエリまたはDDLステートメントも暗黙的トランザクションです。

### 分離レベル

Dorisで現在サポートされている唯一の分離レベルはREAD COMMITTEDです。READ COMMITTED分離レベルでは、ステートメントはそのステートメントの実行開始前にコミットされたデータのみを見ることができます。コミットされていないデータは見ることができません。

単一のステートメントが実行される場合、ステートメント開始時に関連するテーブルのスナップショットをキャプチャします。つまり、単一のステートメントは実行開始前に行われた他のトランザクションからのコミットのみを見ることができます。単一のステートメントの実行中は、他のトランザクションのコミットは見えません。

マルチステートメントトランザクション内でステートメントが実行される場合：

* ステートメントの実行開始前にコミットされたデータのみを見ることができます。最初と2番目のステートメントの実行間に別のトランザクションがコミットされた場合、同じトランザクション内の2つの連続するステートメントは異なるデータを見る可能性があります。
* 現在、同じトランザクション内の前のステートメントによって行われた変更を見ることはできません。

### 重複なし、損失なし

Dorisは、データ書き込み時の重複と損失を防ぐメカニズムをサポートしています。Labelメカニズムは単一トランザクション内での重複を防止し、2フェーズコミットは複数トランザクション間での重複を防ぐために連携します。

#### Labelメカニズム

DorisのトランザクションまたはライトにはLabelを割り当てることができます。このLabelは通常、何らかのビジネスロジック属性を持つユーザー定義の文字列です。設定されていない場合、内部的にUUID文字列が生成されます。Labelの主な目的は、トランザクションまたはインポートタスクを一意に識別し、同じLabelを持つトランザクションまたはインポートが正常に実行されるのは一度のみであることを保証することです。Labelメカニズムは、データインポートが失われることも重複することもないことを保証します。上流データソースがat-least-onceセマンティクスを保証している場合、DorisのLabelメカニズムと組み合わせることでexactly-onceセマンティクスを実現できます。Labelはデータベース内で一意です。

Dorisは時間と数に基づいてLabelをクリーンアップします。デフォルトでは、Labelの数が2000を超えるとクリーンアップがトリガーされます。3日より古いLabelもデフォルトでクリーンアップされます。Labelがクリーンアップされると、同じ名前のLabelが再び正常に実行できるようになります。つまり、重複除去のセマンティクスを持たなくなります。

Labelは通常`business_logic+timestamp`の形式で設定されます。例えば`my_business1_20220330_125000`のようにです。このLabelは通常、`2022-03-30 12:50:00`にビジネス`my_business1`によって生成されたバッチデータを表します。このようにLabelを設定することで、ビジネスはLabelを使用してインポートタスクのステータスをクエリし、その時点でのバッチデータが正常にインポートされたかどうかを明確に判断できます。インポートされていない場合は、同じLabelを使用してインポートを再試行できます。

#### StreamLoad 2PC

[StreamLoad 2PC](#stream-load)は主にFlinkでDorisに書き込む際のexactly-onceセマンティクス（EOS）をサポートするために使用されます。

## トランザクション操作

### トランザクションの開始

```sql
BEGIN;

BEGIN WITH LABEL {user_label}; 
```
この文が現在のセッションがトランザクションの途中にある間に実行された場合、Dorisはその文を無視します。これはトランザクションをネストできないと理解することもできます。

### トランザクションのコミット

```sql
COMMIT;
```
現在のトランザクションで行われたすべての変更をコミットするために使用されます。

### トランザクションのロールバック

```sql
ROLLBACK;
```
現在のトランザクションで行われたすべての変更をロールバックするために使用されます。

トランザクションはセッションレベルなので、セッションが終了またはクローズされた場合、トランザクションは自動的にロールバックされます。

## 複数のsql文を含むトランザクション

現在、Dorisは2つの方法でトランザクションローディングをサポートしています。

### 1つのテーブルに対する複数の`INSERT INTO VALUES`

テーブルスキーマが以下であるとします：

```sql
CREATE TABLE `dt` (
    `id` INT(11) NOT NULL,
    `name` VARCHAR(50) NULL,
    `score` INT(11) NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);
```
トランザクション負荷を実行する：

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.01 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'PREPARE', 'txnId':''}

mysql> INSERT INTO dt (id, name, score) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.08 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'PREPARE', 'txnId':'10013'}

mysql> INSERT INTO dt VALUES (6, "William", 69), (7, "Sophia", 32), (8, "James", 64), (9, "Emma", 37), (10, "Liam", 64);
Query OK, 5 rows affected (0.00 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'PREPARE', 'txnId':'10013'}

mysql> COMMIT;
Query OK, 0 rows affected (1.02 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'VISIBLE', 'txnId':'10013'}
```
この方法は原子性を実現するだけでなく、Dorisにおいて`INSERT INTO VALUES`の書き込み性能も向上させます。

ユーザーが`Group Commit`とtransaction insertを同時に有効にした場合、transaction insertが動作します。

### 複数テーブルに対する複数の`INSERT INTO SELECT`、`UPDATE`、`DELETE`

3つのテーブル`dt1`、`dt2`、`dt3`があり、上記と同じスキーマを持ち、テーブル内のデータは以下の通りであるとします：

```sql
mysql> SELECT * FROM dt1;
+------+-----------+-------+
| id   | name      | score |
+------+-----------+-------+
|    1 | Emily     |    25 |
|    2 | Benjamin  |    35 |
|    3 | Olivia    |    28 |
|    4 | Alexander |    60 |
|    5 | Ava       |    17 |
+------+-----------+-------+
5 rows in set (0.04 sec)

mysql> SELECT * FROM dt2;
+------+---------+-------+
| id   | name    | score |
+------+---------+-------+
|    6 | William |    69 |
|    7 | Sophia  |    32 |
|    8 | James   |    64 |
|    9 | Emma    |    37 |
|   10 | Liam    |    64 |
+------+---------+-------+
5 rows in set (0.03 sec)

mysql> SELECT * FROM dt3;
Empty set (0.03 sec)
```
トランザクション負荷を実行し、`dt1`と`dt2`からのデータを`dt3`に書き込み、`dt1`のスコアを更新して`dt2`のデータを削除する：

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':''}

# 导入任务的状态是 PREPARE
mysql> INSERT INTO dt3 SELECT * FROM dt1;
Query OK, 5 rows affected (0.07 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11024'}

mysql> INSERT INTO dt3 SELECT * FROM dt2;
Query OK, 5 rows affected (0.08 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11025'}

mysql> UPDATE dt1 SET score = score + 10 WHERE id >= 4;
Query OK, 2 rows affected (0.07 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11026'}

mysql> DELETE FROM dt2 WHERE id >= 9;
Query OK, 0 rows affected (0.01 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11027'}

mysql> COMMIT;
Query OK, 0 rows affected (0.03 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'VISIBLE', 'txnId':'11024'}
```
データを選択:

```sql
# the score column of id >= 4 records is updated 
mysql> SELECT * FROM dt1;
+------+-----------+-------+
| id   | name      | score |
+------+-----------+-------+
|    1 | Emily     |    25 |
|    2 | Benjamin  |    35 |
|    3 | Olivia    |    28 |
|    4 | Alexander |    70 |
|    5 | Ava       |    27 |
+------+-----------+-------+
5 rows in set (0.01 sec)

# the records of id >= 9 are deleted
mysql> SELECT * FROM dt2;
+------+---------+-------+
| id   | name    | score |
+------+---------+-------+
|    6 | William |    69 |
|    7 | Sophia  |    32 |
|    8 | James   |    64 |
+------+---------+-------+
3 rows in set (0.02 sec)

# the data of dt1 and dt2 is written to dt3
mysql> SELECT * FROM dt3;
+------+-----------+-------+
| id   | name      | score |
+------+-----------+-------+
|    1 | Emily     |    25 |
|    2 | Benjamin  |    35 |
|    3 | Olivia    |    28 |
|    4 | Alexander |    60 |
|    5 | Ava       |    17 |
|    6 | William   |    69 |
|    7 | Sophia    |    32 |
|    8 | James     |    64 |
|    9 | Emma      |    37 |
|   10 | Liam      |    64 |
+------+-----------+-------+
10 rows in set (0.01 sec)
```
#### 分離レベル

Dorisは`READ COMMITTED`分離レベルを提供します。以下の点にご注意ください：

* トランザクション内では、各ステートメントはそのステートメントが実行を開始した時点でコミットされていたデータを読み取ります：

    ```sql
     timestamp | ------------ Session 1 ------------  |  ------------ Session 2 ------------
       t1      | BEGIN;                               | 
       t2      | # read n rows from dt1 table         |
               | INSERT INTO dt3 SELECT * FROM dt1;   |
       t3      |                                      | # write 2 rows to dt1 table
               |                                      | INSERT INTO dt1 VALUES(...), (...);
       t4      | # read n + 2 rows FROM dt1 table     |
               | INSERT INTO dt3 SELECT * FROM dt1;   |
       t5      | COMMIT;                              |
    ```
* トランザクション内では、各ステートメントは同じトランザクション内の他のステートメントによって行われた変更を読み取ることができません:

    `dt1`が5行、`dt2`が5行、`dt3`が0行あるとします。そして以下のSQLを実行します:

    ```sql
    BEGIN;
    # write 5 rows to dt2, 
    INSERT INTO dt2 SELECT * FROM dt1;
    # write 5 rows to dt3, and cannot read the new data written to dt2 in the previous step
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;
    ```
一つの例：

    ```sql
    # create table and insert data
    CREATE TABLE `dt1` (
        `id` INT(11) NOT NULL,
        `name` VARCHAR(50) NULL,
        `score` INT(11) NULL
    ) ENGINE=OLAP
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1"
    );
    CREATE TABLE dt2 LIKE dt1;
    CREATE TABLE dt3 LIKE dt1;
    INSERT INTO dt1 VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
    INSERT INTO dt2 VALUES (6, "William", 69), (7, "Sophia", 32), (8, "James", 64), (9, "Emma", 37), (10, "Liam", 64);
    
    # Do transaction write
    BEGIN;
    INSERT INTO dt2 SELECT * FROM dt1;
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;
    
    # Select data
    mysql> SELECT * FROM dt2;
    +------+-----------+-------+
    | id   | name      | score |
    +------+-----------+-------+
    |    6 | William   |    69 |
    |    7 | Sophia    |    32 |
    |    8 | James     |    64 |
    |    9 | Emma      |    37 |
    |   10 | Liam      |    64 |
    |    1 | Emily     |    25 |
    |    2 | Benjamin  |    35 |
    |    3 | Olivia    |    28 |
    |    4 | Alexander |    60 |
    |    5 | Ava       |    17 |
    +------+-----------+-------+
    10 rows in set (0.01 sec)
    
    mysql> SELECT * FROM dt3;
    +------+---------+-------+
    | id   | name    | score |
    +------+---------+-------+
    |    6 | William |    69 |
    |    7 | Sophia  |    32 |
    |    8 | James   |    64 |
    |    9 | Emma    |    37 |
    |   10 | Liam    |    64 |
    +------+---------+-------+
    5 rows in set (0.01 sec)
    ```
#### トランザクション内の失敗したステートメント

トランザクション内のステートメントが失敗した場合、その操作はロールバックされます。ただし、正常に実行されたトランザクション内の他のステートメントは、依然としてコミットまたはロールバックすることができます。トランザクションが正常にコミットされると、トランザクション内で正常に実行されたステートメントによって行われた変更が適用されます。

一例:

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'PREPARE', 'txnId':''}

mysql> INSERT INTO dt3 SELECT * FROM dt1;
Query OK, 5 rows affected (0.07 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'PREPARE', 'txnId':'11058'}

# The failed insert is rolled back
mysql> INSERT INTO dt3 SELECT * FROM dt2;
ERROR 5025 (HY000): Insert has filtered data in strict mode, tracking_url=http://172.21.16.12:9082/api/_load_error_log?file=__shard_3/error_log_insert_stmt_3d1fed266ce443f2-b54d2609c2ea6b11_3d1fed266ce443f2_b54d2609c2ea6b11

mysql> INSERT INTO dt3 SELECT * FROM dt2 WHERE id = 7;
Query OK, 0 rows affected (0.07 sec)

mysql> COMMIT;
Query OK, 0 rows affected (0.02 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'VISIBLE', 'txnId':'11058'}
```
データを選択:

```sql
# The data in dt1 is written to dt3, the data with id = 7 in dt2 is written successfully, and the other data is written failed
mysql> SELECT * FROM dt3;
+------+----------+-------+
| id   | name     | score |
+------+----------+-------+
|    1 | Emily    |    25 |
|    2 | Benjamin |    35 |
|    3 | Olivia   |    28 |
|    4 | Alexande |    60 |
|    5 | Ava      |    17 |
|    7 | Sophia   |    32 |
+------+----------+-------+
6 rows in set (0.01 sec)
```
#### QA

* 複数のテーブルへの書き込みは同じDatabaseに属していなければなりません。そうでない場合、`Transaction insert must be in the same database`エラーが発生します。

* `INSERT INTO SELECT`、`UPDATE`、`DELETE`と`INSERT INTO VALUES`の2つのトランザクションロードを混在させることはできません。そうでない場合、`Transaction insert can not insert into values and insert into select at the same time`エラーが発生します。

* [Delete Command](delete/delete-manual.md)では、フィルタ述語を指定するか、using句を使用した削除をサポートしており、分離を保証するため、現在は1つのトランザクション内で1つのテーブルに対する削除操作は挿入操作よりも前に実行されなければならないことのみサポートしています。そうでない場合、`Can not delete because there is a insert operation for the same table`エラーが発生します。

* `BEGIN`文からの処理時間がDorisで設定されたタイムアウトを超えると、トランザクションはロールバックされます。現在、タイムアウトはセッション変数`insert_timeout`と`query_timeout`の最大値を使用します。

* JDBCを使用してDorisに接続してトランザクション操作を行う場合は、JDBC URLに`useLocalSessionState=true`を追加してください。そうでない場合、`This is in a transaction, only insert, update, delete, commit, rollback is acceptable`エラーが発生する可能性があります。

* cloudモードでは、トランザクションロードは`merge on write` uniqueテーブルをサポートしません。そうでない場合、`Transaction load is not supported for merge on write unique keys table in cloud mode`エラーが発生します。

## stream Load 2PC

**1. HTTPヘッダーで`two_phase_commit:true`を設定することにより、2フェーズコミットを有効にします。**

```shell
curl --location-trusted -u user:passwd -H "two_phase_commit:true" -T test.txt http://fe_host:http_port/api/{db}/{table}/_stream_load
{
    "TxnId": 18036,
    "Label": "55c8ffc9-1c40-4d51-b75e-f2265b3602ef",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 100,
    "NumberLoadedRows": 100,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 1031,
    "LoadTimeMs": 77,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 1,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 58,
    "CommitAndPublishTimeMs": 0
}
```
**2. トランザクションのコミット操作をトリガーする（FEまたはBEに送信可能）。**

- Transaction IDを使用してトランザクションを指定する：

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "txn_id:18036" -H "txn_operation:commit" http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18036] commit successfully."
  }
  ```
- labelを使用してトランザクションを指定します：

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:commit"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] commit successfully."
  }
  ```
**3. トランザクションの中止操作をトリガーする（FEまたはBEに送信可能）。**

- Transaction IDを使用してトランザクションを指定する：

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "txn_id:18037" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18037] abort successfully."
  }
  ```
- ラベルを使用してトランザクションを指定します:

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] abort successfully."
  }
  ```
## トランザクションを使用した複数テーブルへのBroker Load

すべてのBroker Loadタスクはアトミックであり、同一タスク内で複数のテーブルにロードする場合でもアトミック性を保証します。Labelメカニズムを使用することで、データの欠損や重複なしでのデータロードを確実にできます。

以下の例では、ワイルドカードパターンを使用してHDFSから2つのファイルセットにマッチさせ、それらを2つの異なるテーブルにロードする方法を示しています。

```sql
LOAD LABEL example_db.label2
(
    DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-10*")
    INTO TABLE `my_table1`
    PARTITION (p1)
    COLUMNS TERMINATED BY ","
    (k1, tmp_k2, tmp_k3)
    SET (
        k2 = tmp_k2 + 1,
        k3 = tmp_k3 + 1
    )
    DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-20*")
    INTO TABLE `my_table2`
    COLUMNS TERMINATED BY ","
    (k1, k2, k3)
)
WITH BROKER hdfs
(
    "username"="hdfs_user",
    "password"="hdfs_password"
);
```
ワイルドカードパターンは、2つのファイルセット`file-10*`と`file-20*`をマッチングして、それぞれ`my_table1`と`my_table2`にロードするために使用されます。`my_table1`の場合、ロードは`p1`パーティションに指定され、ソースファイルの2番目と3番目の列の値は、ロードされる前に1ずつ増加されます。
