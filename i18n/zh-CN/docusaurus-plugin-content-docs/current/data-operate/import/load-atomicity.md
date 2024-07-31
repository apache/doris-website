---
{
    "title": "导入事务与原子性",
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

## 使用场景

Doris 中所有导入任务都是原子性的，即一个导入作业要么全部成功，要么全部失败，不会出现仅部分数据导入成功的情况，并且在同一个导入任务中对多张表的导入也能够保证原子性。同时，Doris 还可以通过 Label 的机制来保证数据导入的不丢不重。对于简单的导入任务，用户无需做额外配置或操作。对于表所附属的物化视图，也同时保证和基表的原子性和一致性。对于以下情形，Doris 为用户提供了更多的事务控制。

1. 如果用户需要将对于同一个目标表的多个 `INSERT INTO` 导入组合成一个事务，可以使用 `BEGIN` 和 `COMMIT` 命令。

2. 如果用户需要将多个 Stream Load 导入组合成一个事务，可以使用 Stream Load 的两阶段事务提交模式。

3. Broker Load 多表导入的原子性，

## 基本原理

Doris 导入任务中，BE 会提交写入成功的 Tablet ID 到 FE。FE 会根据 tablet 成功副本数判断导入是否成功，如果成功，该导入的事务被 commit，导入数据可见。如果失败，该导入的事务会被 rollback，相应的 tablet 也会被清理。

### Label 机制

Doris 的导入作业都可以设置一个 Label。这个 Label 通常是用户自定义的、具有一定业务逻辑属性的字符串。

Label 的主要作用是唯一标识一个导入任务，并且能够保证相同的 Label 仅会被成功导入一次。

Label 机制可以保证导入数据的不丢不重。如果上游数据源能够保证 At-Least-Once 语义，则配合 Doris 的 Label 机制，能够保证 Exactly-Once 语义。

Label 在一个数据库下具有唯一性。Label 的保留期限默认是 3 天。即 3 天后，已完成的 Label 会被自动清理，之后 Label 可以被重复使用。

## 快速上手

### Insert Into

**1. 建表**

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "用户 ID",
    name               VARCHAR(20)  NOT NULL COMMENT "用户姓名",
    age                INT                   COMMENT "用户年龄"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

创建一个同样 Schema 的表用于失败的例子

```sql
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```

**2. 导入成功的例子**

```SQL
BEGIN;

-- INSERT #1
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);

-- INSERT #2
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (6, "William", 69),
       (7, "Sophia", 32),
       (8, "James", 64),
       (9, "Emma", 37),
       (10, "Liam", 64);

COMMIT;
```

导入结果，导入任务的状态先是 `PREPARE`，直到 COMMIT 后才是 `VISIBLE`。

```json
// BEGIN
Query OK, 0 rows affected (0.001 sec)
{'label':'txn_insert_2aeac5519bd549a1-a72fe4001c56e10c', 'status':'PREPARE', 'txnId':''}

// INSERT #1
Query OK, 5 rows affected (0.017 sec)
{'label':'txn_insert_2aeac5519bd549a1-a72fe4001c56e10c', 'status':'PREPARE', 'txnId':'10060'}

// INSERT #2
Query OK, 5 rows affected (0.007 sec)
{'label':'txn_insert_2aeac5519bd549a1-a72fe4001c56e10c', 'status':'PREPARE', 'txnId':'10060'}

// COMMIT
Query OK, 0 rows affected (1.013 sec)
{'label':'txn_insert_2aeac5519bd549a1-a72fe4001c56e10c', 'status':'VISIBLE', 'txnId':'10060'}
```

验证数据

```sql
MySQL [testdb]> SELECT * FROM testdb.test_table;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.110 sec)
```

**3. 导入失败的例子**

```sql
BEGIN;

-- INSERT #1
INSERT INTO testdb.test_table2 (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);

-- INSERT #2
INSERT INTO testdb.test_table2 (user_id, name, age)
VALUES (6, "William", 69),
       (7, "Sophia", 32),
       (8, NULL, 64),
       (9, "Emma", 37),
       (10, "Liam", 64);

COMMIT;
```

导入结果，因为第二个 INSERT INTO 存在 NULL，导致整个事务 COMMIT 失败。

```JSON
// BEGIN
Query OK, 0 rows affected (0.001 sec)
{'label':'txn_insert_f3ecb2285edf42e2-92988ee97d74fbb0', 'status':'PREPARE', 'txnId':''}

// INSERT #1
Query OK, 5 rows affected (0.012 sec)
{'label':'txn_insert_f3ecb2285edf42e2-92988ee97d74fbb0', 'status':'PREPARE', 'txnId':'10062'}

// INSERT #2
{'label':'txn_insert_f3ecb2285edf42e2-92988ee97d74fbb0', 'status':'PREPARE', 'txnId':'10062'}

// COMMIT
ERROR 1105 (HY000): errCode = 2, detailMessage = errCode = 2, detailMessage = [DATA_QUALITY_ERROR]too many filtered rows
```

验证结果，没有数据被导入。

```JSON
MySQL [testdb]> SELECT * FROM testdb.test_table2;
Empty set (0.019 sec)
```

### Stream Load

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
  curl -X PUT --location-trusted -u user:passwd -H "txn_id:18036" -H "txn_operation:commit" http://fe_host:http_port/api/{db}/{table}/stream_load2pc
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
  curl -X PUT --location-trusted -u user:passwd  -H "txn_id:18037" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/stream_load2pc
  {
      "status": "Success",
      "msg": "transaction [18037] abort successfully."
  }
  ```

- 也可以使用 label 指定事务

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/stream_load2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] abort successfully."
  }
  ```

### Broker Load

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

## 最佳实践

Label 通常被设置为 `业务逻辑+时间` 的格式。如 `my_business1_20220330_125000`。

这个 Label 通常用于表示：业务 `my_business1` 这个业务在 `2022-03-30 12:50:00` 产生的一批数据。通过这种 Label 设定，业务上可以通过 Label 查询导入任务状态，来明确的获知该时间点批次的数据是否已经导入成功。如果没有成功，则可以使用这个 Label 继续重试导入。

INSERT INTO 支持将 Doris 查询的结果导入到另一个表中。INSERT INTO 是一个同步导入方式，执行导入后返回导入结果。可以通过请求的返回判断导入是否成功。INSERT INTO 可以保证导入任务的原子性，要么全部导入成功，要么全部导入失败。