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

查询和 DDL 单个语句是一个隐式事务，不支持多语句事务中包含查询和 DDL。每个单独的写入默认是一个隐式的事务，多个 INSERT INTO VALUES 可以组成一个显式事务。目前 Doris 不支持嵌套事务。

### 显式事务

显式事务需要用户主动开启、提交或回滚事务，目前不支持 DDL 和查询语句。

```sql
BEGIN; 
[INSERT INTO VALUES]
COMMIT;
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

#### 常见问题

* 写入的多表必须属于同一个 Database，否则会遇到错误 `Transaction insert must be in the same database`

* 当从 `BEGIN` 开始的导入耗时超出 Doris 配置的 timeout 时，会导致事务回滚，导入失败。目前 timeout 使用的是 Session 变量 `insert_timeout` 和 `query_timeout` 的最大值。

* 当使用 JDBC 连接 Doris 进行事务操作时，请在 JDBC URL 中添加 `useLocalSessionState=true`，否则可能会遇到错误 `This is in a transaction, only insert, update, delete, commit, rollback is acceptable.`

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
