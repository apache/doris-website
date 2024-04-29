---
{
    "title": "Transaction Load",
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

## 显式事务和隐式事务

### 显式事务

显式事务需要用户主动的开启，提交或回滚事务。 在 Doris 中，提供了 2 种显式事务：

1. 本文中介绍的事务写方式，即

```sql
begin; 
[INSERT, UPDATE, DELETE statement]
COMMIT; / ROLLBACK;
```

2. [Stream Load 2PC](load-atomicity.md#stream-load)

### 隐式事务

隐式事务是指用户在所执行的一条或多条SQL语句的前后，没有显式添加开启事务和提交事务的语句。

在 Doris 中，除[Group Commit](group-commit-manual.md)外，每个导入语句在开始执行时都会开启一个事务，并且在该语句执行完成之后，自动提交该事务；或执行失败后，自动回滚该事务。更多详细信息请参考: [导入事务与原子性](load-atomicity.md)。

## 事务操作

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

## 事务写入

目前 Doris 中支持 2 种方式的事务写入。

### 单表多次`INSERT INTO VALUES`写入

假如表的结构为：

```sql
CREATE TABLE `dt` (
    `id` int(11) NOT NULL,
    `name` varchar(50) NULL,
    `score` int(11) NULL
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

也可以参考 [Insert Into](load-atomicity.md#insert-into)。 

### 多表多次`INSERT INTO SELECT`, `UPDATE`, `DELETE`写入

假设有`dt1`, `dt2`, `dt3` 3 张表，表结构同上，表中数据为：

```sql
mysql> select * from dt1;
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

mysql> select * from dt2;
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

mysql> select * from dt3;
Empty set (0.03 sec)
```

做事务写入，把`dt1`和`dt2`的数据写入到`dt3`中，同时，对`dt1`表中的分数进行更新，`dt2`表中的数据进行删除：

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':''}

# 导入任务的状态是 PREPARE
mysql> INSERT INTO dt3 SELECT * from dt1;
Query OK, 5 rows affected (0.07 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11024'}

mysql> INSERT INTO dt3 SELECT * from dt2;
Query OK, 5 rows affected (0.08 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11025'}

mysql> UPDATE dt1 SET score = score + 10 where id >= 4;
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
mysql> select * from  dt1;
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
mysql> select * from  dt2;
+------+---------+-------+
| id   | name    | score |
+------+---------+-------+
|    6 | William |    69 |
|    7 | Sophia  |    32 |
|    8 | James   |    64 |
+------+---------+-------+
3 rows in set (0.02 sec)

# dt1 和 dt2 中已提交的数据被写入到 dt3 中
mysql> select * from  dt3;
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
           | INSERT INTO dt3 SELECT * from dt1;   |
   t3      |                                      | # write 2 rows to dt1 table
           |                                      | INSERT INTO dt1 VALUES(...), (...);
   t4      | # read n + 2 rows from dt1 table     |
           | INSERT INTO dt3 SELECT * from dt1;   |
   t5      | COMMIT;                              |
```

* 事务中的多个语句，每个语句不能读到本事务内其它语句做出的修改，如：

假如事务开启前，表 dt1 有 5行，表 dt2 有 5 行，表 dt3 为空，执行以下语句： 

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
    `id` int(11) NOT NULL,
    `name` varchar(50) NULL,
    `score` int(11) NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);
create table dt2 like dt1;
create table dt3 like dt1;
INSERT INTO dt1 VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
INSERT INTO dt2 VALUES (6, "William", 69), (7, "Sophia", 32), (8, "James", 64), (9, "Emma", 37), (10, "Liam", 64);

# 事务写
BEGIN;
INSERT INTO dt2 SELECT * FROM dt1;
INSERT INTO dt3 SELECT * FROM dt2;
COMMIT;

# 查询
mysql> SELECT * from dt2;
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

mysql> SELECT * from dt3;
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
# dt1 的数据被写入到 dt3 中，dt2中 id = 7的数据写入成功，其它写入失败
mysql> select * from  dt3;
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

* `INSERT INTO SELECT` 和 `INSET INTO VALUES` 不能混用，否则会遇到错误 `Transaction insert can not insert into values and insert into select at the same time`

* 当从 `BEGIN` 开始的导入耗时超出 Doris 配置的 timeout 时，会导致事务回滚，导入失败。目前 timeout 使用的是 Session 变量 `insert_timeout` 和 `query_timeout` 的最大值

* 当使用 JDBC 连接 Doris 进行事务操作时，请在 JDBC URL 中添加 `useLocalSessionState=true`，否则可能会遇到错误 `This is in a transaction, only insert, update, delete, commit, rollback is acceptable.`