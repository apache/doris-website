---
{
    "title": "Transactions",
    "language": "en",
    "description": "A transaction is an operation that contains one or more SQL statements. The execution of these statements either completes successfully in full or fails in full, forming an indivisible unit of work."
}
---

A transaction is an operation that contains one or more SQL statements. The execution of these statements either completes successfully in full or fails in full, forming an indivisible unit of work.

## Overview

A single query or DDL statement is an implicit transaction. Multi-statement transactions that contain queries or DDL are not supported. By default, each individual write is an implicit transaction, and multiple writes can be combined into an explicit transaction. Doris does not currently support nested transactions.

### Explicit Transaction

An explicit transaction requires the user to actively begin, commit, or roll back the transaction. DDL and query statements are not currently supported inside one.

```sql
BEGIN; 
[INSERT, UPDATE, DELETE statement]
COMMIT; / ROLLBACK;
```

### Implicit Transaction

An implicit transaction is one in which the user does not explicitly add statements to begin and commit the transaction before and after the executed SQL statement or statements.

In Doris, except for [Group Commit](./import/load-best-practices/group-commit-manual.md), every load statement opens a transaction when it starts to execute. The transaction is automatically committed after the statement completes successfully, or automatically rolled back when the statement fails. Each query or DDL is also an implicit transaction.

### Isolation Level
The only isolation level currently supported by Doris is READ COMMITTED. Under the READ COMMITTED isolation level, a statement can only see data that was committed before the statement began executing; it cannot see uncommitted data.

When a single statement runs, it captures a snapshot of the tables it touches at the start of the statement. That is, a single statement can only see commits from other transactions that completed before the statement started; commits made by other transactions during the statement's execution are not visible.

When a statement runs inside a multi-statement transaction:

* It can only see data that was committed before the statement began executing. If another transaction commits between the first and second statements, two consecutive statements in the same transaction may see different data.
* It cannot currently see changes made by previous statements in the same transaction.

### No Loss, No Duplication

Doris provides two mechanisms to support no-loss, no-duplication writes. The Label mechanism guarantees no duplication for a single transaction, and two-phase commit provides the ability to coordinate no duplication across multiple transactions.

#### Label Mechanism

A Doris transaction or load can have a Label set on it. This Label is usually a user-defined string with some business-logic meaning; if it is not set, an internal UUID string is generated. The main purpose of the Label is to uniquely identify a transaction or load task and to ensure that transactions or loads with the same Label are executed successfully only once. The Label mechanism guarantees that loaded data is neither lost nor duplicated. If the upstream data source can guarantee At-Least-Once semantics, then together with the Doris Label mechanism, Exactly-Once semantics can be achieved. A Label is unique within a database.

Doris cleans up Labels based on time and count. By default, eviction is triggered once the number of Labels exceeds 2000, and Labels older than 3 days are also evicted by default. After a Label is evicted, a Label with the same name can be executed successfully again, that is, deduplication semantics no longer apply.

A Label is typically set in the format `business logic + time`, such as `my_business1_20220330_125000`. This Label is generally used to indicate: a batch of data produced by the business `my_business1` at `2022-03-30 12:50:00`. With this kind of Label scheme, the business can query the load task status by Label to clearly determine whether the data for that batch and time has already been loaded successfully. If it has not, the same Label can be used to retry the load.

#### StreamLoad 2PC

[StreamLoad 2PC](#stream-load) is mainly used to support EOS semantics when Flink writes to Doris.

## Explicit Transaction Operations

### Begin a Transaction

```sql
BEGIN;

BEGIN WITH LABEL {user_label}; 
```

If this statement is executed while the current Session is already in the middle of a transaction, Doris ignores the statement. In other words, transactions cannot be nested.

### Commit a Transaction

```sql 
COMMIT;
```

This is used to commit all modifications made in the current transaction.

### Roll Back a Transaction

```sql
ROLLBACK;
```

This is used to undo all modifications in the current transaction.

A transaction is at the Session level. If the Session is aborted or closed, the transaction is automatically rolled back as well.

## Writing Multiple SQL Statements

Doris currently supports two ways to write within a transaction.

### Multiple `INSERT INTO VALUES` Writes to a Single Table

Suppose the table structure is:

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

Write data:

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

This way of writing not only achieves write atomicity, but also improves the write performance of `INSERT INTO VALUES` in Doris.

If the user enables both `Group Commit` and transactional writes, transactional writes take effect.

### Multiple `INSERT INTO SELECT`, `UPDATE`, and `DELETE` Writes Across Tables

Suppose there are three tables `dt1`, `dt2`, and `dt3`, with the same schema as above. Their data is as follows:

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

Perform a transactional write that loads data from `dt1` and `dt2` into `dt3`, while also updating the scores in table `dt1` and deleting data from table `dt2`:

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

Query the data:

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

#### Isolation Level

The isolation level provided by Doris transactional writes is `READ COMMITTED`. Note the following two points:

* For multiple statements in a transaction, each statement reads the data that was committed at the time the statement starts executing. For example:

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

* For multiple statements in a transaction, each statement cannot read modifications made by other statements within the same transaction. For example:

    Suppose that before the transaction begins, table `dt1` has 5 rows, table `dt2` has 5 rows, and table `dt3` is empty. The following statements are executed:

    ```sql
    BEGIN;
    # 5 rows are written into dt2; after the transaction commits, dt2 has 10 rows in total
    INSERT INTO dt2 SELECT * FROM dt1;
    # 5 rows are written into dt3; the rows newly written to dt2 in the previous step cannot be read here
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;
    ```

    A concrete example:

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

#### Failed Statements in a Transaction

When a statement in a transaction fails, that operation has already been automatically rolled back. However, other statements in the transaction that executed successfully can still be committed or rolled back. After the transaction is committed successfully, the modifications from the successfully executed statements take effect.

For example:

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

Query:

```sql
# The data from dt1 is written into dt3, the row with id = 7 from dt2 is written successfully, and the other writes failed
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

#### Common Issues

* Multiple tables written to must belong to the same Database, otherwise the error `Transaction insert must be in the same database` will be raised.

* The two transactional write modes, `INSERT INTO SELECT` / `UPDATE` / `DELETE` and `INSERT INTO VALUES`, cannot be mixed, otherwise the error `Transaction insert can not insert into values and insert into select at the same time` will be raised.

* The [Delete operation](delete/delete-manual.md) provides two ways to delete: by predicate and using the Using clause. To preserve the isolation level, within a transaction, deletions on the same table must occur before writes; otherwise the error `Can not delete because there is a insert operation for the same table` will be raised.

* When a load that started from `BEGIN` exceeds the timeout configured in Doris, the transaction is rolled back and the load fails. The current timeout uses the maximum of the Session variables `insert_timeout` and `query_timeout`.

* When using JDBC to connect to Doris for transactional operations, add `useLocalSessionState=true` in the JDBC URL; otherwise the error `This is in a transaction, only insert, update, delete, commit, rollback is acceptable.` may be raised.

* In compute-storage decoupled mode, transactional writes do not support Merge-on-Write tables. Otherwise the error `Transaction load is not supported for merge on write unique keys table in cloud mode` will be raised.


## Stream Load 2PC

**1. Set `two_phase_commit:true` in the HTTP Header to enable two-phase commit.**

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

**2. Trigger a commit operation on the transaction (the request can be sent to either FE or BE).**

- The transaction can be specified by transaction id:

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "txn_id:18036" -H "txn_operation:commit" http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18036] commit successfully."
  }
  ```

- The transaction can also be specified by label:

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:commit"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] commit successfully."
  }
  ```

**3. Trigger an abort operation on the transaction (the request can be sent to either FE or BE).**

- The transaction can be specified by transaction id:

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "txn_id:18037" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18037] abort successfully."
  }
  ```

- The transaction can also be specified by label:

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] abort successfully."
  }
  ```

## Broker Load Multi-Table Transactions

All Broker Load load tasks take effect atomically. Loads into multiple tables within the same load task are also guaranteed to be atomic. The Label mechanism can also be used to ensure no-loss, no-duplication data loading.

The following example loads data from HDFS, using wildcards to match two batches of files and load them into two tables.

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

Wildcards are used to match and load two batches of files, `file-10*` and `file-20*`, into two tables, `my_table1` and `my_table2`, respectively. Among them, `my_table1` is loaded into partition `p1`, with the values from the second and third columns of the source file incremented by 1 before being loaded.
