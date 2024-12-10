---
{
    "title": "事务",
    "language": "zh-CN"
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

事务是指一个操作，包含一个或多个SQL语句，这些语句的执行要么完全成功，要么完全失败，是一个不可分割的工作单位。

## 概览

查询和 DDL 单个语句是一个隐式事务，不支持多语句事务中包含查询和 DDL。每个单独的写入默认是一个隐式的事务，多个写入可以组成一个显式事务。目前 Doris 不支持嵌套事务。

### 显式事务

显式事务需要用户主动开启、提交或回滚事务，目前不支持 DDL 和查询语句。

```sql
BEGIN; 
[INSERT, UPDATE, DELETE statement]
COMMIT; / ROLLBACK;
```

### 隐式事务

隐式事务是指用户在所执行的一条或多条SQL语句的前后，没有显式添加开启事务和提交事务的语句。

在 Doris 中，除[Group Commit](import/import-way/group-commit-manual.md)外，每个导入语句在开始执行时都会开启一个事务，并且在该语句执行完成之后，自动提交该事务；或执行失败后，自动回滚该事务。每个查询或者 DDL 也是一个隐藏事务。

### 隔离级别
Doris 当前支持的唯一隔离级别是 READ COMMITTED。在 READ COMMITTED 隔离级别下，语句只能看到在该语句开始执行之前已经提交的数据，它不会看到未提交的数据。

单个语句执行时，会在语句的开始捕获涉及到表的快照，即单个语句只能看见开始执行前其它事务的提交，单个语句执行期间不可见其它事务的提交。

当一个语句在多语句事务中执行时：

* 只能看到在该语句开始执行之前已经提交的数据。如果在执行第一个和第二个语句之间有另一个事务提交，那么同一事务中的两个连续语句可能会看到不同的数据。
* 目前看不到在同一事务中之前语句所做的更改。

### 不重不丢

Doris 有两个机制支持写入的不重不丢，使用 Label 机制提供了单个事务的不重，使用两阶段提交提供了协调多事务不重的能力。

#### Label 机制

Doris 的事务或者写入可以设置一个 Label。这个 Label 通常是用户自定义的、具有一定业务逻辑属性的字符串，不设置时内部会生成一个 UUID 字符串。Label 的主要作用是唯一标识一个事务或者导入任务，并且能够保证相同 Label 的事务或者导入仅会成功执行一次。Label 机制可以保证导入数据的不丢不重，如果上游数据源能够保证 At-Least-Once 语义，则配合 Doris 的 Label 机制，能够保证 Exactly-Once 语义。Label 在一个数据库下具有唯一性。

Doris 会根据时间和数目清理 Label，默认 Label 数目超过 2000 个就会触发淘汰，默认超过 3 天的 Label 也会被淘汰。Label 被淘汰后相同名称的 Label 可以再次执行成功，即不再具有去重语义。

Label 通常被设置为 `业务逻辑+时间` 的格式。如 `my_business1_20220330_125000`。这个 Label 通常用于表示：业务 `my_business1` 这个业务在 `2022-03-30 12:50:00` 产生的一批数据。通过这种 Label 设定，业务上可以通过 Label 查询导入任务状态，来明确的获知该时间点批次的数据是否已经导入成功。如果没有成功，则可以使用这个 Label 继续重试导入。

#### StreamLoad 2PC

[StreamLoad 2PC](#stream-load)，主要用于支持 Flink 写入 Doris 时的 EOS 语义。

## 显式事务操作

### 开启事务

```sql
BEGIN;

BEGIN WITH LABEL {user_label}; 
```

如果执行该语句时，当前 Session 正处于一个事务的中间过程，那么 Doris 会忽略该语句，也可以理解为事务是不能嵌套的。

### 提交事务

```sql 
COMMIT;
```

用于提交在当前事务中进行的所有修改。

### 回滚事务

```sql
ROLLBACK;
```

用于撤销当前事务的所有修改。

事务是 Session 级别的，如果 Session 中止或关闭，也会自动回滚该事务。

## 多条 SQL 语句写入

目前 Doris 中支持 2 种方式的事务写入。

### 单表多次`INSERT INTO VALUES`写入

假如表的结构为：

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

写入：

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

这种写入方式不仅可以实现写入的原子性，而且在 Doris 中，能提升 `INSERT INTO VALUES` 的写入性能。

如果用户同时开启了 `Group Commit` 和事务写，事务写生效。

### 多表多次`INSERT INTO SELECT`, `UPDATE`, `DELETE`写入

假设有`dt1`, `dt2`, `dt3` 3 张表，表结构同上，表中数据为：

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

做事务写入，把`dt1`和`dt2`的数据写入到`dt3`中，同时，对`dt1`表中的分数进行更新，`dt2`表中的数据进行删除：

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

查询数据：

```sql
# id >= 4 的分数加 10
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

# id >= 9 的数据被删除
mysql> SELECT * FROM dt2;
+------+---------+-------+
| id   | name    | score |
+------+---------+-------+
|    6 | William |    69 |
|    7 | Sophia  |    32 |
|    8 | James   |    64 |
+------+---------+-------+
3 rows in set (0.02 sec)

# dt1 和 dt2 中已提交的数据被写入到 dt3 中
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

#### 隔离级别

目前 Doris 事务写提供的隔离级别为 `READ COMMITTED`。需要注意以下两点:

* 事务中的多个语句，每个语句会读取到本语句开始执行时已提交的数据，如:

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

* 事务中的多个语句，每个语句不能读到本事务内其它语句做出的修改，如：

    假如事务开启前，表 `dt1` 有 5 行，表 `dt2` 有 5 行，表 `dt3` 为空，执行以下语句： 

    ```sql
    BEGIN;
    # dt2 中写入 5 行，事务提交后共 10 行
    INSERT INTO dt2 SELECT * FROM dt1;
    # dt3 中写入 5 行，不能读出上一步中 dt2 中新写入的数据
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;
    ```

    具体的例子为：

    ```sql
    # 建表并写入数据
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

    # 事务写
    BEGIN;
    INSERT INTO dt2 SELECT * FROM dt1;
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;

    # 查询
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

#### 事务中执行失败的语句

当事务中的某个语句执行失败时，这个操作已经自动回滚。然而，事务中其它执行成功的语句，仍然是可提交或回滚的。当事务被成功提交后，事务中执行成功的语句的修改被应用。

比如：

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'PREPARE', 'txnId':''}

mysql> INSERT INTO dt3 SELECT * FROM dt1;
Query OK, 5 rows affected (0.07 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'PREPARE', 'txnId':'11058'}

# 失败的写入自动回滚
mysql> INSERT INTO dt3 SELECT * FROM dt2;
ERROR 5025 (HY000): Insert has filtered data in strict mode, tracking_url=http://172.21.16.12:9082/api/_load_error_log?file=__shard_3/error_log_insert_stmt_3d1fed266ce443f2-b54d2609c2ea6b11_3d1fed266ce443f2_b54d2609c2ea6b11

mysql> INSERT INTO dt3 SELECT * FROM dt2 WHERE id = 7;
Query OK, 0 rows affected (0.07 sec)

mysql> COMMIT;
Query OK, 0 rows affected (0.02 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'VISIBLE', 'txnId':'11058'}
```

查询：

```sql
# dt1 的数据被写入到 dt3 中，dt2 中 id = 7的数据写入成功，其它写入失败
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

#### 常见问题

* 写入的多表必须属于同一个 Database，否则会遇到错误 `Transaction insert must be in the same database`

* 两种事务写入`INSERT INTO SELECT`, `UPDATE`, `DELETE` 和 `INSET INTO VALUES` 不能混用，否则会遇到错误 `Transaction insert can not insert into values and insert into select at the same time`

* [Delete 操作](delete/delete-manual.md)提供了通过谓词和 Using 子句两种方式，为了保证隔离级别，在一个事务中，对相同表的删除必须在写入前，否则会遇到报错 `Can not delete because there is a insert operation for the same table`

* 当从 `BEGIN` 开始的导入耗时超出 Doris 配置的 timeout 时，会导致事务回滚，导入失败。目前 timeout 使用的是 Session 变量 `insert_timeout` 和 `query_timeout` 的最大值

* 当使用 JDBC 连接 Doris 进行事务操作时，请在 JDBC URL 中添加 `useLocalSessionState=true`，否则可能会遇到错误 `This is in a transaction, only insert, update, delete, commit, rollback is acceptable.`

* 存算分离模式下，事务写不支持 Merge-on-Write 表，否则会遇到报错 `Transaction load is not supported for merge on write unique keys table in cloud mode`


## Stream Load 2PC

**1. 在 HTTP Header 中设置 `two_phase_commit:true` 启用两阶段提交。**

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

**2. 对事务触发 commit 操作（请求发往 FE 或 BE 均可）**

- 可以使用事务 id 指定事务

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "txn_id:18036" -H "txn_operation:commit" http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18036] commit successfully."
  }
  ```

- 也可以使用 label 指定事务

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:commit"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] commit successfully."
  }
  ```

**3. 对事务触发 abort 操作（请求发往 FE 或 BE 均可）**

- 可以使用事务 id 指定事务

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "txn_id:18037" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18037] abort successfully."
  }
  ```

- 也可以使用 label 指定事务

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] abort successfully."
  }
  ```

## Broker Load 多表事务

所有 Broker Load 导入任务都是原子生效的。并且在同一个导入任务中对多张表的导入也能够保证原子性。还可以通过 Label 的机制来保证数据导入的不丢不重。

下面例子是从 HDFS 导入数据，使用通配符匹配两批文件，分别导入到两个表中。

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

使用通配符匹配导入两批文件 `file-10*` 和 `file-20*`。分别导入到 `my_table1` 和 `my_table2` 两张表中。其中 `my_table1` 指定导入到分区 `p1` 中，并且将导入源文件中第二列和第三列的值 +1 后导入。
