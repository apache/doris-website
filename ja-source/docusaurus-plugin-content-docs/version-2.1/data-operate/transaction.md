---
{
  "title": "トランザクション",
  "language": "ja",
  "description": "トランザクションとは、1つ以上のSQL文を含む操作です。"
}
---
トランザクションは、1つ以上のSQL文を含む操作です。これらの文の実行は、完全に成功するか完全に失敗するかのいずれかでなければなりません。これは分割不可能な作業単位です。

## 概要

クエリとDDLの単一文は暗黙的トランザクションであり、複数文トランザクション内ではサポートされていません。個々の書き込みはデフォルトで暗黙的トランザクションであり、複数の書き込みで明示的トランザクションを形成できます。現在、Dorisはネストしたトランザクションをサポートしていません。

## 明示的および暗黙的トランザクション

### 明示的トランザクション

明示的トランザクションでは、ユーザーが能動的にトランザクションを開始し、コミットする必要があります。2.1では insert into values 文のみがサポートされています。

```sql
BEGIN;
[INSERT INTO VALUES]
COMMIT;
```
2.1ではRollbackはサポートされていません。

### Implicit Transactions

Implicit transactionsとは、ステートメントの前後にトランザクションを開始およびコミットするステートメントを明示的に追加せずに実行されるSQLステートメントを指します。

Dorisでは、[Group Commit](../data-operate/import/group-commit-manual)を除き、各importステートメントは実行開始時にトランザクションを開きます。ステートメントの実行後、トランザクションは自動的にコミットされるか、ステートメントが失敗した場合は自動的にロールバックされます。各queryやDDLステートメントもimplicit transactionです。

### Isolation Level

Dorisで現在サポートされている唯一のisolation levelはREAD COMMITTEDです。READ COMMITTED isolation levelでは、ステートメントはステートメントの実行開始前にコミットされたデータのみを参照します。コミットされていないデータは参照しません。

単一のステートメントが実行される場合、ステートメントの開始時に関連するテーブルのスナップショットをキャプチャします。つまり、単一のステートメントは実行開始前に行われた他のトランザクションからのコミットのみを参照できます。他のトランザクションのコミットは、単一のステートメントの実行中には見えません。

multi-statement transactionの内部でステートメントが実行される場合：

* ステートメントの実行開始前にコミットされたデータのみを参照します。最初と2番目のステートメントの実行の間に別のトランザクションがコミットされた場合、同一トランザクション内の連続する2つのステートメントは異なるデータを参照する可能性があります。
* 現在、同一トランザクション内の前のステートメントによって行われた変更は参照できません。

### No Duplicates, No Loss

Dorisは、データ書き込み時の重複なし、損失なしを保証するメカニズムをサポートしています。Labelメカニズムは単一トランザクション内での重複を防ぎ、two-phase commitは複数のトランザクション間での重複を防ぐために調整します。

#### Labelメカニズム

DorisのトランザクションやwriteにはLabelを割り当てることができます。このLabelは通常、何らかのビジネスロジック属性を持つユーザー定義の文字列です。設定されていない場合、内部でUUID文字列が生成されます。Labelの主な目的は、トランザクションやimportタスクを一意に識別し、同じLabelを持つトランザクションやimportが一度だけ正常に実行されることを保証することです。Labelメカニズムにより、データimportが失われることも重複することもありません。上流のデータソースがat-least-onceセマンティクスを保証している場合、DorisのLabelメカニズムと組み合わせることで、exactly-onceセマンティクスを実現できます。Labelはデータベース内で一意です。

Dorisは時間と数に基づいてLabelをクリーンアップします。デフォルトでは、Labelの数が2000を超えるとクリーンアップがトリガーされます。3日より古いLabelもデフォルトでクリーンアップされます。Labelがクリーンアップされると、同じ名前のLabelが再び正常に実行できるようになり、重複排除セマンティクスを持たなくなります。

Labelは通常、`business_logic+timestamp`の形式で設定されます（例：`my_business1_20220330_125000`）。このLabelは通常、ビジネス`my_business1`が`2022-03-30 12:50:00`に生成したデータのバッチを表します。この方法でLabelを設定することで、ビジネスはLabelを使用してimportタスクのステータスを照会し、その時点でのデータバッチが正常にimportされたかどうかを明確に判断できます。されていない場合は、同じLabelを使用してimportを再試行できます。

#### StreamLoad 2PC

[StreamLoad 2PC](#stream-load)は主に、FlinkでDorisへの書き込み時にexactly-onceセマンティクス（EOS）をサポートするために使用されます。

## Transaction Operations

### Start a Transaction

```sql
BEGIN;

BEGIN WITH LABEL {user_label}; 
```
この文が現在のセッションがトランザクションの途中にある間に実行された場合、Dorisはこの文を無視します。これはトランザクションをネストできないと理解することもできます。

### トランザクションのコミット

```sql
COMMIT;
```
現在のトランザクションで行われたすべての変更をコミットするために使用されます。

## 複数のSQL文を含むトランザクション

現在、Dorisは1つのトランザクション読み込み方法のみをサポートしています。

### 1つのテーブルに対する複数の`INSERT INTO VALUES`

テーブルスキーマが以下であると仮定します：

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
トランザクション負荷を実行する:

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
このメソッドはアトミシティを実現するだけでなく、Dorisにおいて`INSERT INTO VALUES`の書き込みパフォーマンスも向上させます。

ユーザーが`Group Commit`とtransaction insertを同時に有効にした場合、transaction insertが動作します。

#### QA

* 複数のテーブルへの書き込みは同じDatabaseに属している必要があります。そうでなければ、`Transaction insert must be in the same database`エラーが発生します

* `BEGIN`文からの処理時間がDorisで設定されたタイムアウトを超えた場合、トランザクションはロールバックされます。現在、タイムアウトはセッション変数`insert_timeout`と`query_timeout`の最大値を使用します。

* JDBCを使用してDorisに接続してトランザクション操作を行う場合は、JDBC URLに`useLocalSessionState=true`を追加してください。そうでなければ、`This is in a transaction, only insert, update, delete, commit, rollback is acceptable`エラーが発生する可能性があります。

## Stream Load 2PC

**1. HTTPヘッダーで`two_phase_commit:true`を設定することで2フェーズコミットを有効にします。**

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
**2. トランザクションのcommit操作をトリガーする（FEまたはBEに送信可能）。**

- Transaction IDを使用してトランザクションを指定する：

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "txn_id:18036" -H "txn_operation:commit" http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18036] commit successfully."
  }
  ```
- ラベルを使用してトランザクションを指定します:

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:commit"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] commit successfully."
  }
  ```
**3. トランザクションのアボート操作をトリガーする（FEまたはBEに送信可能）。**

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
## トランザクションによる複数テーブルへのBroker Load

すべてのBroker Loadタスクはアトミックであり、同じタスク内で複数のテーブルをロードする場合でもアトミック性を保証します。Labelメカニズムを使用することで、データの損失や重複なしでのデータロードを保証できます。

以下の例では、ワイルドカードパターンを使用してHDFSからデータをロードし、2つのファイルセットにマッチさせて2つの異なるテーブルにロードする方法を示しています。

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
ワイルドカードパターンを使用して、`file-10*` と `file-20*` の2つのファイルセットをマッチさせ、それぞれを `my_table1` と `my_table2` に読み込みます。`my_table1` の場合、読み込みは `p1` パーティションに指定され、ソースファイルの2列目と3列目の値は読み込み前に1ずつ増加されます。
