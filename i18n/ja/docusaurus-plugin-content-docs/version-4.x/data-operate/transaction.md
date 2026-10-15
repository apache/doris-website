---
{
    "title": "トランザクション",
    "language": "ja",
    "description": "トランザクションは、一つ以上の SQL 文を含む操作です。これらの文はすべて成功するか、すべて失敗するかのいずれかであり、分割できない作業単位を構成します。"
}
---

トランザクションは、一つ以上の SQL 文を含む操作です。これらの文はすべて成功するか、すべて失敗するかのいずれかであり、分割できない作業単位を構成します。

## 概要

単一のクエリまたは DDL 文は暗黙的なトランザクションです。クエリまたは DDL を含む複数文のトランザクションはサポートされていません。デフォルトでは、各書き込みは個別の暗黙的なトランザクションですが、複数の書き込みを明示的なトランザクションにまとめることができます。現在、Doris はネストされたトランザクションをサポートしていません。

### 明示的なトランザクション

明示的なトランザクションでは、ユーザーがトランザクションの開始、コミット、ロールバックを明示的に実行する必要があります。現在、トランザクション内で DDL 文とクエリ文はサポートされていません。

```sql
BEGIN; 
[INSERT, UPDATE, DELETE statement]
COMMIT; / ROLLBACK;
```

### 暗黙的なトランザクション

暗黙的なトランザクションでは、実行する SQL 文の前後に、トランザクションを開始・コミットする文をユーザーが明示的に追加しません。

Doris では、[Group Commit](./import/load-best-practices/group-commit-manual.md) を除き、各ロード文の実行開始時にトランザクションが開始されます。文が正常に完了すると自動的にコミットされ、失敗すると自動的にロールバックされます。各クエリと DDL 文も暗黙的なトランザクションです。

### 分離レベル
現在、Doris がサポートする分離レベルは READ COMMITTED のみです。READ COMMITTED では、文の実行開始前にコミットされたデータだけが見え、未コミットのデータは見えません。

単一の文は、実行開始時にアクセスするテーブルのスナップショットを取得します。つまり、文の開始前に完了した他のトランザクションのコミットだけが見え、その文の実行中に他のトランザクションが行ったコミットは見えません。

複数文のトランザクション内で文を実行する場合は、次のようになります。

* 文の実行開始前にコミットされたデータだけが見えます。最初の文と次の文の間に別のトランザクションがコミットした場合、同じトランザクション内で連続する二つの文が異なるデータを見ることがあります。
* 現在、同じトランザクション内の先行する文による変更は見えません。

### データの欠落と重複の防止

Doris には、書き込み時のデータの欠落と重複を防ぐ仕組みが二つあります。Label の仕組みは単一のトランザクションでの重複を防ぎ、二相コミットは複数のトランザクションにまたがる重複防止の調整を可能にします。

#### Label の仕組み

Doris のトランザクションまたはロードには Label を設定できます。通常、Label は業務上の意味を持つユーザー定義の文字列です。設定しない場合は内部で UUID 文字列が生成されます。Label の主な目的は、トランザクションまたはロードタスクを一意に識別し、同じ Label を持つトランザクションやロードが一度だけ正常に実行されるようにすることです。Label の仕組みにより、ロードされるデータの欠落と重複を防ぎます。上流のデータソースが At-Least-Once セマンティクスを保証できれば、Doris の Label の仕組みと組み合わせて Exactly-Once セマンティクスを実現できます。Label はデータベース内で一意です。

Doris は、経過時間と件数に基づいて Label を削除します。デフォルトでは、Label の数が 2000 を超えると削除処理が開始され、3 日を超えた Label も削除されます。削除された Label と同じ名前は再び正常に使用できるため、その Label による重複排除は行われなくなります。

Label は通常、`business logic + time` という形式で設定します。例: `my_business1_20220330_125000`。この Label は、業務 `my_business1` が `2022-03-30 12:50:00` に生成したデータのバッチを示すために使用されます。この形式にすると、業務側で Label によってロードタスクの状態を照会し、その日時のバッチが正常にロード済みかどうかを明確に判断できます。未完了の場合は、同じ Label でロードを再試行できます。

#### StreamLoad 2PC

[StreamLoad 2PC](#stream-load-2pc) は、主に Flink から Doris への書き込みで EOS セマンティクスを実現するために使用します。

## 明示的なトランザクションの操作

### トランザクションの開始

```sql
BEGIN;

BEGIN WITH LABEL {user_label}; 
```

現在のセッションですでにトランザクションが進行中の場合、Doris はこの文を無視します。つまり、トランザクションはネストできません。

### トランザクションのコミット

```sql 
COMMIT;
```

現在のトランザクションで行ったすべての変更をコミットします。

### トランザクションのロールバック

```sql
ROLLBACK;
```

現在のトランザクションで行ったすべての変更を取り消します。

トランザクションはセッション単位です。セッションが中断または終了すると、トランザクションも自動的にロールバックされます。

## 複数の SQL 文による書き込み

現在、Doris はトランザクション内で二種類の書き込み方法をサポートしています。

### 単一テーブルへの複数の `INSERT INTO VALUES` 書き込み

テーブルの構造を次のようにします。

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

データを書き込みます。

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

この書き込み方法では、書き込みの原子性を確保できるだけでなく、Doris の `INSERT INTO VALUES` の書き込み性能も向上します。

`Group Commit` とトランザクション書き込みの両方を有効にした場合は、トランザクション書き込みが適用されます。

### 複数テーブルにまたがる `INSERT INTO SELECT`、`UPDATE`、`DELETE` の書き込み

上記と同じスキーマを持つ `dt1`、`dt2`、`dt3` の三つのテーブルがあるとします。データは次のとおりです。

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

`dt1` と `dt2` のデータを `dt3` にロードし、同時にテーブル `dt1` のスコアを更新し、テーブル `dt2` のデータを削除するトランザクション書き込みを実行します。

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':''}

# The status of the load task is PREPARE
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

データを照会します。

```sql
# Scores for rows with id >= 4 are increased by 10
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

# Rows with id >= 9 are deleted
mysql> SELECT * FROM dt2;
+------+---------+-------+
| id   | name    | score |
+------+---------+-------+
|    6 | William |    69 |
|    7 | Sophia  |    32 |
|    8 | James   |    64 |
+------+---------+-------+
3 rows in set (0.02 sec)

# The committed data from dt1 and dt2 is written into dt3
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

Doris のトランザクション書き込みの分離レベルは `READ COMMITTED` です。次の二点に注意してください。

* トランザクション内の複数の文は、それぞれの文の実行開始時点でコミット済みのデータを読み取ります。例:

    ```sql
     timestamp | ------------ Session 1 ------------  |  ------------ Session 2 ------------
       t1      | BEGIN;                               | 
       t2      | # read n rows from dt1 table         |
               | INSERT INTO dt3 SELECT * FROM dt1;   |
       t3      |                                      | # write 2 rows to dt1 table
               |                                      | INSERT INTO dt1 VALUES(...), (...);
       t4      | # read n + 2 rows from dt1 table     |
               | INSERT INTO dt3 SELECT * FROM dt1;   |
       t5      | COMMIT;                              |
    ```

* トランザクション内の複数の文は、同じトランザクション内の他の文による変更を読み取れません。例:

    トランザクションの開始前に、テーブル `dt1` に 5 行、`dt2` にも 5 行のデータがあり、`dt3` は空だとします。次の例はトランザクションの流れを示す概略です（テーブルを作成し、初期データをロードする実行可能なスクリプトは、後述の具体例にあります）。

    ```sql
    BEGIN;
    # 5 rows are written into dt2; after the transaction commits, dt2 has 10 rows in total
    INSERT INTO dt2 SELECT * FROM dt1;
    # 5 rows are written into dt3; the rows newly written to dt2 in the previous step cannot be read here
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;
    ```

    最初から最後まで実行できる具体例:

    ```sql
    # Create tables and write data
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

    # Transactional writes
    BEGIN;
    INSERT INTO dt2 SELECT * FROM dt1;
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;

    # Query
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

#### トランザクション内で文が失敗した場合

トランザクション内の文が失敗した場合、その操作はすでに自動的にロールバックされています。ただし、同じトランザクション内で正常に実行された他の文は、その後もコミットまたはロールバックできます。トランザクションが正常にコミットされると、成功した文による変更が反映されます。

例:

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'PREPARE', 'txnId':''}

mysql> INSERT INTO dt3 SELECT * FROM dt1;
Query OK, 5 rows affected (0.07 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'PREPARE', 'txnId':'11058'}

# A failed write is automatically rolled back
mysql> INSERT INTO dt3 SELECT * FROM dt2;
ERROR 5025 (HY000): Insert has filtered data in strict mode, tracking_url=http://172.21.16.12:9082/api/_load_error_log?file=__shard_3/error_log_insert_stmt_3d1fed266ce443f2-b54d2609c2ea6b11_3d1fed266ce443f2_b54d2609c2ea6b11

mysql> INSERT INTO dt3 SELECT * FROM dt2 WHERE id = 7;
Query OK, 1 row affected (0.07 sec)

mysql> COMMIT;
Query OK, 0 rows affected (0.02 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'VISIBLE', 'txnId':'11058'}
```

照会します。

```sql
# The data from dt1 is written into dt3, the row with id = 7 from dt2 is written successfully, and the other writes failed
mysql> SELECT * FROM dt3;
+------+----------+-------+
| id   | name     | score |
+------+----------+-------+
|    1 | Emily    |    25 |
|    2 | Benjamin |    35 |
|    3 | Olivia   |    28 |
|    4 | Alexander |    60 |
|    5 | Ava      |    17 |
|    7 | Sophia   |    32 |
+------+----------+-------+
6 rows in set (0.01 sec)
```

#### よくある問題

* 書き込み先の複数テーブルは同じデータベースに属している必要があります。そうでない場合は、`Transaction insert must be in the same database` というエラーが発生します。

* 二種類のトランザクション書き込みモード、`INSERT INTO SELECT` / `UPDATE` / `DELETE` と `INSERT INTO VALUES` は混在できません。混在させると、`Transaction insert can not insert into values and insert into select at the same time` というエラーが発生します。

* [Delete 操作](delete/delete-manual.md)には、条件式による削除と Using 句による削除の二つの方法があります。分離レベルを維持するため、トランザクション内で同じテーブルを削除する場合は、そのテーブルへの書き込みより先に削除を実行する必要があります。そうしないと、`Can not delete because there is a insert operation for the same table` というエラーが発生します。

* `BEGIN` から開始したロードが Doris に設定されたタイムアウトを超えると、トランザクションはロールバックされ、ロードは失敗します。現在のタイムアウトには、セッション変数 `insert_timeout` と `query_timeout` の大きい方の値が使用されます。

* JDBC で Doris に接続してトランザクション操作を行う場合は、JDBC URL に `useLocalSessionState=true` を追加してください。追加しないと、`This is in a transaction, only insert, update, delete, commit, rollback is acceptable.` というエラーが発生することがあります。

## Stream Load 2PC

**1. HTTP ヘッダーに `two_phase_commit:true` を設定して、二相コミットを有効にします。**

```shell
curl  --location-trusted -u user:passwd -H "two_phase_commit:true" -T test.txt http://fe_host:http_port/api/{db}/{table}/_stream_load
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

**2. トランザクションのコミット操作を実行します（リクエストは FE と BE のどちらにも送信できます）。**

- トランザクション ID で指定できます。

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "txn_id:18036" -H "txn_operation:commit" http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18036] commit successfully."
  }
  ```

- Label でも指定できます。

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:commit"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] commit successfully."
  }
  ```

**3. トランザクションの中止操作を実行します（リクエストは FE と BE のどちらにも送信できます）。**

- トランザクション ID で指定できます。

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "txn_id:18037" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18037] abort successfully."
  }
  ```

- Label でも指定できます。

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] abort successfully."
  }
  ```

## Broker Load の複数テーブルトランザクション

すべての Broker Load タスクは原子的に反映されます。同じロードタスクで複数テーブルにロードする場合も、原子性が保証されます。Label の仕組みを使用して、データの欠落と重複を防ぐこともできます。

次の例では、ワイルドカードで HDFS 上の二組のファイルを指定し、二つのテーブルにロードします。

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

ワイルドカードで `file-10*` と `file-20*` の二組のファイルを指定し、それぞれ二つのテーブル `my_table1` と `my_table2` にロードします。このうち `my_table1` ではパーティション `p1` にロードし、元ファイルの二列目と三列目の値にそれぞれ 1 を加算してからロードします。
