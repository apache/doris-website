---
{
    "title": "Transaction",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

A transaction is an operation that contains one or more SQL statements. The execution of these statements must either be completely successful or completely fail. It is an indivisible work unit.

## Explicit and Implicit Transactions

### Explicit Transactions

Explicit transactions require users to actively start, commit, or roll back transactions. Doris provides two types of explicit transactions:

1. The transaction write method introduced in this document :

    ```sql
    BEGIN;
    [INSERT, UPDATE, DELETE statement]
    COMMIT; / ROLLBACK;
    ```

2. [Stream Load 2PC](import/load-atomicity.md#stream-load)

### Implicit Transactions

Implicit transactions refer to SQL statements that are executed without explicitly adding statements to start and commit transactions before and after the statements.

In Doris, except for [Group Commit](import/group-commit-manual.md), each import statement opens a transaction when it starts executing. The transaction is automatically committed after the statement is executed, or automatically rolled back if the statement fails. For more information, see [Transaction Load](import/load-atomicity.md).

## Transaction Operations

### Start a Transaction

```sql
BEGIN;

BEGIN WITH LABEL {user_label}; 
```

If this statement is executed while the current session is in the middle of a transaction, Doris will ignore the statement, which can also be understood as transactions cannot be nested.

### Commit a Transaction

```sql
COMMIT;
```

Used to commit all modifications made in the current transaction.

### Rollback a Transaction

```sql
ROLLBACK;
```

Used to roll back all modifications made in the current transaction.

Transactions are session-level, so if a session is terminated or closed, the transaction will automatically be rolled back.

## Transaction Load

Currently, Doris supports two ways of transaction loading.

### Multiple `INSERT INTO VALUES` for one table

Suppose the table schema is:

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

Do transaction load:

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

This method not only achieves atomicity, but also in Doris, it enhances the writing performance of `INSERT INTO VALUES`.

If user enables `Group Commit` and transaction insert at the same time, the transaction insert will work. 

See [Insert Into](import/load-atomicity.md#insert-into) for more details.

### Multiple `INSERT INTO SELECT`, `UPDATE`, `DELETE` for multiple tables

Suppose there are 3 tables: `dt1`, `dt2`, `dt3`, with the same schema as above, and the data in the tables are:

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

Do transaction load, write the data from `dt1` and `dt2` to `dt3`, and update the scores in `dt1` and delete the data in `dt2`:

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

Select data:

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

#### Isolation Level

Doris provides the `READ COMMITTED` isolation level. Please note the following:

* In a transaction, each statement reads the data that was committed at the time the statement began executing:

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

* In a transaction, each statement cannot read the modifications made by other statements within the same transactio:

    Suppose `dt1` has 5 rows, `dt2` has 5 rows, `dt3` has 0 rows. And execute the following SQL:

    ```sql
    BEGIN;
    # write 5 rows to dt2, 
    INSERT INTO dt2 SELECT * FROM dt1;
    # write 5 rows to dt3, and cannot read the new data written to dt2 in the previous step
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;
    ```

    One example:

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

#### Failed Statements Within a Transaction

When a statement within a transaction fails, that operation is rolled back. However, other statements within the transaction that have executed successfully are still able to either commit or rollback. Once the transaction is successfully committed, the modifications made by the successfully executed statements within the transaction are applied.

One example:

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

Select data:

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

* Writing to multiple tables must belong to the same Database; otherwise, you will encounter the error `Transaction insert must be in the same database`

* Mixing the two transaction load of `INSERT INTO SELECT`, `UPDATE`, `DELETE` and `INSERT INTO VALUES` is not allowed; otherwise, you will encounter the error `Transaction insert can not insert into values and insert into select at the same time`.

* [Delete Command](delete/delete-manual.md) supports delete by specifying a filter predicate or using clause, to guarantee the isolation, currently only support that, the delete operations must before the insert operations for one table in one transaction, otherwise, you will encounter the error `Can not delete because there is a insert operation for the same table`.  

* If the time-consuming from `BEGIN` statement exceeds the timeout configured in Doris, the transaction will be rolled back. Currently, the timeout uses the maximum value of session variables `insert_timeout` and `query_timeout`.

* When using JDBC to connect to Doris for transaction operations, please add `useLocalSessionState=true` in the JDBC URL; otherwise, you may encounter the error `This is in a transaction, only insert, update, delete, commit, rollback is acceptable`.

* In cloud mode, transaction load does not support `merge on write` unique tables, otherwise, you will encounter the error `Transaction load is not supported for merge on write unique keys table in cloud mode`.  
