---
{
    "title": "Insert Into",
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


INSERT INTO 支持将 Doris 查询的结果导入到另一个表中。INSERT INTO 是一个同步导入方式，执行导入后返回导入结果。可以通过请求的返回判断导入是否成功。INSERT INTO 可以保证导入任务的原子性，要么全部导入成功，要么全部导入失败。

主要的 Insert Into 命令包含以下两种：

- INSERT INTO tbl SELECT ...

- INSERT INTO tbl (col1, col2, ...) VALUES (1, 2, ...), (1,3, ...)

## 使用场景

1. 用户希望仅导入几条假数据，验证一下 Doris 系统的功能。此时适合使用 INSERT INTO VALUES 的语法，语法和 MySQL 一样。不建议在生产环境中使用 INSERT INTO VALUES。

2. 用户希望将已经在 Doris 表中的数据进行 ETL 转换并导入到一个新的 Doris 表中，此时适合使用 INSERT INTO SELECT 语法。

3. 与 Multi-Catalog 外部表机制进行配合，如通过 Multi-Catalog 映射 MySQL 或者 Hive 系统中的表，然后通过 INSERT INTO SELECT 语法将外部表中的数据导入到 Doris 表中存储。

4. 通过 Table Value Function（TVF）功能，可以直接将对象存储或 HDFS 上的文件作为 Table 进行查询，并且支持自动的列类型推断。然后，通过 INSERT INTO SELECT 语法将外部表中的数据导入到 Doris 表中存储。

## 基本原理

在使用 INSERT INTO 时，需要通过 MySQL 协议发起导入作业给 FE 节点，FE 会生成执行计划，执行计划中前部是查询相关的算子，最后一个是 OlapTableSink 算子，用于将查询结果写到目标表中。执行计划会被发送给 BE 节点执行，Doris 会选定一个节点做为 Coordinator 节点，Coordinator 节点负责接受数据并分发数据到其他节点上。

## 快速上手

INSERT INTO 通过 MySQL 协议提交和传输。下例以 MySQL 命令行为例，演示通过 INSERT INTO 提交导入作业。

详细语法可以参见 [INSERT INTO](../../../sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/INSERT.md)。

### 前置检查

INSERT INTO 需要对目标表的 INSERT 权限。如果没有 INSERT 权限，可以通过 [GRANT](../../../sql-manual/sql-statements/Account-Management-Statements/GRANT) 命令给用户授权。

### 创建导入作业

**INSERT INTO VALUES**

1. 创建源表

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

2. 使用 INSERT INTO VALUES 向源表导入数据（不推荐在生产环境中使用）

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

INSERT INTO 是一种同步导入方式，导入结果会直接返回给用户。可以打开 [group commit](../import-way/group-commit-manual.md) 达到更高的性能。

```JSON
Query OK, 5 rows affected (0.308 sec)
{'label':'label_3e52da787aab4222_9126d2fce8f6d1e5', 'status':'VISIBLE', 'txnId':'9081'}
```

3. 查看导入数据

```sql
MySQL> SELECT COUNT(*) FROM testdb.test_table;
+----------+
| count(*) |
+----------+
|        5 |
+----------+
1 row in set (0.179 sec)
```

**INSERT INTO SELECT**

1. 在上述操作的基础上，创建一个新表作为目标表（其 schema 与源表相同）

```sql
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```

2. 使用 INSERT INTO SELECT 导入到新表

```sql
INSERT INTO testdb.test_table2
SELECT * FROM testdb.test_table WHERE age < 30;
Query OK, 3 rows affected (0.544 sec)
{'label':'label_9c2bae970023407d_b2c5b78b368e78a7', 'status':'VISIBLE', 'txnId':'9084'}
```

3. 查看导入数据

```sql
MySQL> SELECT COUNT(*) FROM testdb.test_table2;
+----------+
| count(*) |
+----------+
|        3 |
+----------+
1 row in set (0.071 sec)
```

4. 可以使用 [JOB](../../scheduler/job-scheduler.md) 异步执行 INSERT。

5. 数据源可以是 [tvf](../../../lakehouse/file.md) 或者 [catalog](../../../lakehouse/database) 中的表。

### 查看导入作业

可以通过 show  load 命令查看已完成的 INSERT INTO 任务。

```sql
MySQL> SHOW LOAD FROM testdb;
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| JobId  | Label                                   | State    | Progress           | Type   | EtlInfo | TaskInfo                                                             | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                            | TransactionId | ErrorTablets | User | Comment |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| 376416 | label_3e52da787aab4222_9126d2fce8f6d1e5 | FINISHED | Unknown id: 376416 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:18 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9081          | {}           | root |         |
| 376664 | label_9c2bae970023407d_b2c5b78b368e78a7 | FINISHED | Unknown id: 376664 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:38 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9084          | {}           | root |         |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
```

### 取消导入作业

用户可以通过 Ctrl-C 取消当前正在执行的 INSERT INTO 作业。

## 参考手册

### 导入命令

INSERT INTO 导入语法如下：

1. INSERT INTO SELECT

INSERT INTO SELECT 一般用于将查询结果保存到目标表中。

```sql
INSERT INTO target_table SELECT ... FROM source_table;
```

其中 SELECT 语句同一般的 SELECT 查询语句，可以包含 WHERE JOIN 等操作。

2. INSERT INTO VALUES

INSERT INTO VALUES 一般仅用于 Demo，不建议在生产环境使用。

```sql
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```

### 导入配置参数

**01 FE 配置**

**insert_load_default_timeout_second**

- 默认值：14400（4 小时）

- 参数描述：导入任务的超时时间，单位：秒。导入任务在该超时时间内未完成则会被系统取消，变成 CANCELLED。

**02 环境变量**

**insert_timeout**

- 默认值：14400（4 小时）

- 参数描述：INSERT INTO 作为 SQL 语句的的超时时间，单位：秒。

**enable_insert_strict**

- 默认值：true

- 参数描述：如果设置为 true，当 INSERT INTO 遇到不合格数据时导入会失败。如果设置为 false，INSERT INTO 会忽略不合格的行，只要有一条数据被正确导入，导入就会成功。

- 解释：INSERT INTO 无法控制错误率，只能通过该参数设置为严格检查数据质量或完全忽略错误数据。常见的数据不合格的原因有：源数据列长度超过目的数据列长度、列类型不匹配、分区不匹配、列顺序不匹配等。

**insert_max_filter_ratio**

- 默认值：1.0

- 参数描述：自 2.1.5 版本。仅当 `enable_insert_strict` 值为 false 时生效。用于控制当使用 `INSERT INTO FROM S3/HDFS/LOCAL()` 时，设定错误容忍率的。默认为 1.0 表示容忍所有错误。可以取值 0 ~ 1 之间的小数。表示当错误行数超过该比例后，INSERT 任务会失败。

**enable_nereids_dml_with_pipeline**

  设置为 `true` 后，`insert into` 语句将尝试通过 Pipeline 引擎执行。详见[导入](../load-manual)文档。

### 导入返回值

INSERT INTO 是一个 SQL 语句，其返回结果会根据查询结果的不同，分为以下几种：

**结果集为空**

如果 INSERT INTO 中的 SELECT 语句的查询结果集为空，则返回如下：

```sql
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```

`Query OK` 表示执行成功。`0 rows affected` 表示没有数据被导入。

**结果集不为空且 INSERT 执行成功**

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

`Query OK` 表示执行成功。`4 rows affected` 表示总共有 4 行数据被导入。`2 warnings` 表示被过滤的行数。

同时会返回一个 JSON 串：

```Plain
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

其中，返回结果参数如下表说明：

| 参数名称 | 说明                                                         |
| -------- | ------------------------------------------------------------ |
| TxnId    | 导入事务的 ID                                                |
| Label    | 导入作业的 label，通过 INSERT INTO tbl WITH LABEL label ... 指定 |
| Status   | 表示导入数据是否可见。如果可见，显示 `visible`，如果不可见，显示 `committed`<p>- `visible`：表示导入成功，数据可见</p> <p>- `committed`：该状态也表示导入已经完成，只是数据可能会延迟可见，无需重试</p> <p>- Label Already Exists：Label 重复，需要更换 label</p> <p>- Fail：导入失败</p> |
| Err      | 导入错误信息                                                 |

当需要查看被过滤的行时，用户可以通过[ SHOW LOAD ](../../../sql-manual/sql-statements/Show-Statements/SHOW-LOAD)语句

```sql
SHOW LOAD WHERE label="xxx";
```

返回结果中的 URL 可以用于查询错误的数据，具体见后面 查看错误行 小结。

数据不可见是一个临时状态，这批数据最终是一定可见的

可以通过[ SHOW TRANSACTION ](../../../sql-manual/sql-statements/Show-Statements/SHOW-TRANSACTION)语句查看这批数据的可见状态：

```sql
SHOW TRANSACTION WHERE id=4005;
```

返回结果中的 `TransactionStatus` 列如果为 `visible`，则表述数据可见。

```sql
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

**结果集不为空但 INSERT 执行失败**

执行失败表示没有任何数据被成功导入，并返回如下：

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```

其中 `ERROR 1064 (HY000): all partitions have no load data` 显示失败原因。后面的 url 可以用于查询错误的数据，具体见后面 查看错误行 小结。

## 导入最佳实践

### 数据量

INSERT INTO 对数据量没有限制，大数据量导入也可以支持。但如果导入数据量过大，就需要通过以下配置修改系统的 INSERT INTO 导入超时时间，确保`导入超时 >= 数据量 ``/`` 预估导入速度`。

1. FE 配置参数`insert_load_default_timeout_second`。

2. 环境变量 `insert_timeout`。

### 查看错误行

当 INSERT INTO 返回结果中提供了 url 字段时，可以通过以下命令查看错误行：

```sql
SHOW LOAD WARNINGS ON "url";
```

示例：

```sql
SHOW LOAD WARNINGS ON "http://ip:port/api/_load_error_log?file=_shard_13/error_loginsert_stmt_d2cac0a0a16d482d-9041c949a4b71605_d2cac0a0a16d482d_9041c949a4b71605";
```

常见的错误的原因有：源数据列长度超过目的数据列长度、列类型不匹配、分区不匹配、列顺序不匹配等。

可以通过环境变量 `enable_insert_strict`来控制 INSERT INTO 是否忽略错误行。

## 通过外部表 Multi-Catalog 导入数据

Doris 可以创建外部表。创建完成后，可以通过 `INSERT INTO SELECT` 的方式导入外部表的数据，当然也可以通过 SELECT 语句直接查询外部表的数据，

Doris 通过多源数据目录（Multi-Catalog）功能，支持了包括 Apache Hive、Apache Iceberg、Apache Hudi、Apache Paimon(Incubating)、Elasticsearch、MySQL、Oracle、SQL Server 等主流数据湖、数据库的连接访问。

Multi-Catalog 相关功能，请查看湖仓一体文档。

这里以通过构建 Hive 外部表，导入其数据到 Doris 内部表来举例说明。

### 创建 Hive Catalog

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

### 导入数据

1. 创建一张 Doris 的导入目标表

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

2. 关于创建 Doris 表的详细说明，请参阅 [CREATE-TABLE](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE) 语法帮助。

3. 导入数据 (从 hive.db1.source_tbl 表导入到 target_tbl 表)

```sql
INSERT INTO target_tbl SELECT k1,k2,k3 FROM  hive.db1.source_tbl limit 100;
```

INSERT 命令是同步命令，返回成功，即表示导入成功。


### 注意事项

- 必须保证外部数据源与 Doris 集群是可以互通，包括 BE 节点和外部数据源的网络是互通的。

## 通过 TVF 导入数据

通过 Table Value Function 功能，Doris 可以直接将对象存储或 HDFS 上的文件作为 Table 进行查询分析、并且支持自动的列类型推断。详细介绍，请参考 湖仓一体/TVF 文档。

### 自动推断文件列类型

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

这里给出了了一个 s3 TVF 的例子。这个例子中指定了文件的路径、连接信息、认证信息等。

之后，通过 `DESC FUNCTION` 语法可以查看这个文件的 Schema。

可以看到，对于 Parquet 文件，Doris 会根据文件内的元信息自动推断列类型。

目前支持对 Parquet、ORC、CSV、Json 格式进行分析和列类型推断。

配合 `INSERT INTO SELECT` 语法，可以方便将文件导入到 Doris 表中进行更快速的分析：

```Plain
// 1. 创建doris内部表
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

// 2. 使用 S3 Table Value Function 插入数据
INSERT INTO test_table (id,name,age)
SELECT cast(id as INT) as id, name, cast (age as INT) as age
FROM s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style" = "true");
```

### 注意事项

- 如果 `S3 / hdfs` TVF 指定的 uri 匹配不到文件，或者匹配到的所有文件都是空文件，那么 `S3 / hdfs` TVF 将会返回空结果集。在这种情况下使用`DESC FUNCTION`查看这个文件的 Schema，会得到一列虚假的列`__dummy_col`，可忽略这一列。

- 如果指定 TVF 的 format 为 CSV `The first line is empty, can not parse column numbers`, 这因为无法通过该文件的第一行解析出 Schema。

## 更多帮助

关于 Insert Into 使用的更多详细语法，请参阅 [INSERT INTO](../../../sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/INSERT) 命令手册，也可以在 MySQL 客户端命令行下输入 `HELP INSERT` 获取更多帮助信息。
