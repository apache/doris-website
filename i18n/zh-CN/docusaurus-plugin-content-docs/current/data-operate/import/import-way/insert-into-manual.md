---
{
    "title": "Insert Into Select",
    "language": "zh-CN",
    "description": "INSERT INTO SELECT 是 Doris 同步导入方式，支持表间 ETL、Multi-Catalog 外部表导入及 TVF 文件导入，保证导入原子性。",
    "keywords": [
        "INSERT INTO SELECT",
        "Doris 数据导入",
        "同步导入",
        "Multi-Catalog 导入",
        "TVF 导入",
        "ETL 转换",
        "事务原子性",
        "insert_timeout",
        "enable_insert_strict"
    ]
}
---

<!-- 知识类型: 操作步骤 + 配置参数 -->
<!-- 适用场景: 数据导入 / ETL 转换 / 外部数据源接入 -->

INSERT INTO 支持将 Doris 查询的结果导入到另一个表中，是一种**同步导入**方式：执行后立即返回结果，可通过返回值判断是否成功。INSERT INTO 保证导入任务的**原子性**——要么全部成功，要么全部失败。

## 使用场景

INSERT INTO SELECT 主要适用于以下三类场景：

| 场景 | 说明 |
| --- | --- |
| 表间 ETL 转换 | 将 Doris 表中的数据进行 ETL 转换后写入另一张 Doris 表。 |
| 外部表数据导入 | 通过 Multi-Catalog 映射 MySQL、Hive 等外部系统中的表，再用 INSERT INTO SELECT 将外部数据导入 Doris 表。 |
| 文件直读导入 | 通过 Table Value Function（TVF）将对象存储或 HDFS 上的文件作为 Table 查询，并支持自动列类型推断，再写入 Doris 表。 |

## 基本原理

INSERT INTO 通过 MySQL 协议向 FE 节点发起导入作业，执行流程如下：

1. FE 接收 SQL 并生成执行计划：前部为查询相关算子，最后一个为 `OlapTableSink` 算子，用于将查询结果写入目标表。
2. 执行计划被下发至 BE 节点执行。
3. Doris 选定一个 BE 作为 Coordinator 节点，负责接收数据并分发到其他 BE 节点。

## 快速上手

INSERT INTO 通过 MySQL 协议提交和传输。以下示例使用 MySQL 命令行演示完整流程。

详细语法请参见 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT)。

### 前置检查

执行前需具备目标表的 `INSERT` 权限。如无权限，可通过 [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) 命令授权。

### 创建导入作业

**步骤 1：创建源表**

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**步骤 2：向源表导入数据（以 INSERT INTO VALUES 为例）**

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

**步骤 3：创建目标表（schema 与源表相同）**

```sql
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```

**步骤 4：使用 INSERT INTO SELECT 导入到目标表**

```sql
INSERT INTO testdb.test_table2
SELECT * FROM testdb.test_table WHERE age < 30;
Query OK, 3 rows affected (0.544 sec)
{'label':'label_9c2bae970023407d_b2c5b78b368e78a7', 'status':'VISIBLE', 'txnId':'9084'}
```

**步骤 5：查看导入结果**

```sql
MySQL> SELECT * FROM testdb.test_table2 ORDER BY age;
+---------+--------+------+
| user_id | name   | age  |
+---------+--------+------+
|       5 | Ava    |   17 |
|       1 | Emily  |   25 |
|       3 | Olivia |   28 |
+---------+--------+------+
3 rows in set (0.02 sec)
```

**进阶用法：**

- 可使用 [JOB](../../../admin-manual/workload-management/job-scheduler) 异步执行 INSERT。
- 数据源可以是 [TVF](../../../lakehouse/file-analysis.md) 或 [Catalog](../../../lakehouse/catalog-overview) 中的表。

### 查看导入作业

通过 `SHOW LOAD` 命令查看已完成的 INSERT INTO 任务：

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

可通过 `Ctrl-C` 取消当前正在执行的 INSERT INTO 作业。

## 参考手册

### 导入命令

INSERT INTO SELECT 用于将查询结果保存到目标表中，基本语法：

```sql
INSERT INTO target_table SELECT ... FROM source_table;
```

其中 SELECT 语句与一般查询语句相同，可包含 `WHERE`、`JOIN` 等操作。

### 导入配置参数

<!-- 知识类型: 配置参数 -->

**FE 配置参数**

| 参数 | 默认值 | 描述 |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400（4 小时） | 导入任务的超时时间，单位：秒。任务在该超时时间内未完成则被系统取消，状态变为 `CANCELLED`。 |

**会话环境变量**

| 参数 | 默认值 | 描述 |
| --- | --- | --- |
| insert_timeout | 14400（4 小时） | INSERT INTO 作为 SQL 语句的超时时间，单位：秒。 |
| enable_insert_strict | true | 设置为 true 时，遇到不合格数据导入会失败；设置为 false 时，会忽略不合格行，只要有一条数据被正确导入即视为成功。在 2.1.4 及以前的版本中，INSERT INTO 无法控制错误率，只能通过该参数设置严格检查或完全忽略错误数据。常见的数据不合格原因有：源数据列长度超过目的列长度、列类型不匹配、分区不匹配、列顺序不匹配等。 |
| insert_max_filter_ratio | 1.0 | 自 2.1.5 版本起支持，仅当 `enable_insert_strict` 为 false 时生效。用于控制 `INSERT INTO FROM S3/HDFS/LOCAL()` 的错误容忍率。默认 1.0 表示容忍所有错误；可取值 0~1，表示当错误行数超过该比例时 INSERT 任务失败。 |

### 导入返回值

INSERT INTO 是一个 SQL 语句，其返回结果根据查询情况分为以下三种：

#### 结果集为空

如果 SELECT 子句的结果集为空，返回如下：

```sql
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```

- `Query OK` 表示执行成功。
- `0 rows affected` 表示没有数据被导入。

#### 结果集不为空且 INSERT 执行成功

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

字段说明：

- `Query OK`：执行成功。
- `4 rows affected`：总共有 4 行数据被导入。
- `2 warnings`：被过滤的行数。

同时返回一个 JSON 串：

```Plain
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

返回结果参数说明如下：

| 参数名称 | 说明 |
| -------- | ---- |
| TxnId    | 导入事务的 ID。 |
| Label    | 导入作业的 label，可通过 `INSERT INTO tbl WITH LABEL label ...` 指定。 |
| Status   | 表示导入数据是否可见：<p>- `visible`：导入成功，数据可见</p><p>- `committed`：导入已完成，数据可能延迟可见，无需重试</p><p>- `Label Already Exists`：Label 重复，需要更换 label</p><p>- `Fail`：导入失败</p> |
| Err      | 导入错误信息。 |

如需查看被过滤的行，可使用 [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD) 语句：

```sql
SHOW LOAD WHERE label="xxx";
```

返回结果中的 `URL` 字段可用于查询错误数据，详见后文 [查看错误行](#查看错误行)。

数据 `committed` 是临时状态，最终一定可见。可通过 [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) 语句查询可见状态：

```sql
SHOW TRANSACTION WHERE id=4005;
```

当返回结果中的 `TransactionStatus` 列为 `visible` 时，表示数据可见。

```sql
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

#### 结果集不为空但 INSERT 执行失败

执行失败表示没有任何数据被成功导入，返回如下：

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```

- `ERROR 1064 (HY000): all partitions have no load data`：失败原因。
- 返回的 URL 可用于查询错误数据，详见后文 [查看错误行](#查看错误行)。

## 导入最佳实践

### 大数据量导入

INSERT INTO 对数据量没有限制，大数据量导入也可支持。但当数据量较大时，需要修改超时时间以确保：

> 导入超时 ≥ 数据量 / 预估导入速度

可调整以下两个参数：

1. FE 配置参数 `insert_load_default_timeout_second`。
2. 会话环境变量 `insert_timeout`。

### 查看错误行

<!-- 知识类型: 故障排查 -->

当 INSERT INTO 返回结果中提供了 `url` 字段时，可通过以下命令查看错误行：

```sql
SHOW LOAD WARNINGS ON "url";
```

示例：

```sql
SHOW LOAD WARNINGS ON "http://ip:port/api/_load_error_log?file=_shard_13/error_loginsert_stmt_d2cac0a0a16d482d-9041c949a4b71605_d2cac0a0a16d482d_9041c949a4b71605";
```

**常见错误原因：**

- 源数据列长度超过目的列长度
- 列类型不匹配
- 分区不匹配
- 列顺序不匹配

可通过环境变量 `enable_insert_strict` 控制 INSERT INTO 是否忽略错误行。

## 通过 Multi-Catalog 导入外部表数据

<!-- 适用场景: 外部数据源接入 -->

Doris 通过 Multi-Catalog 功能支持连接 Apache Hive、Apache Iceberg、Apache Hudi、Apache Paimon(Incubating)、Elasticsearch、MySQL、Oracle、SQL Server 等主流数据湖与数据库。创建外部表后，可通过 `INSERT INTO SELECT` 导入外部表数据，也可直接 `SELECT` 查询。

Multi-Catalog 相关功能详见湖仓一体文档。下面以 Hive 外部表为例说明导入流程。

### 步骤 1：创建 Hive Catalog

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

### 步骤 2：创建 Doris 目标表

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

详细建表说明请参阅 [CREATE-TABLE](../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) 语法帮助。

### 步骤 3：执行导入

从 `hive.db1.source_tbl` 表导入到 `target_tbl` 表：

```sql
INSERT INTO target_tbl SELECT k1,k2,k3 FROM  hive.db1.source_tbl limit 100;
```

INSERT 命令是同步命令，返回成功即表示导入成功。

### 注意事项

- 必须保证外部数据源与 Doris 集群网络互通，特别是 BE 节点与外部数据源之间。

## 通过 TVF 导入文件数据

<!-- 适用场景: 对象存储/HDFS 文件直接导入 -->

通过 Table Value Function（TVF），Doris 可直接将对象存储或 HDFS 上的文件作为 Table 进行查询分析，并支持自动列类型推断与多文件导入。详细介绍请参考 [湖仓一体/TVF 文档](../../../lakehouse/file-analysis)。

TVF 支持在文件路径中使用通配符（`*`、`?`、`[...]`）和范围模式（`{1..10}`），完整语法请参阅 [文件路径模式](../../../sql-manual/basic-element/file-path-pattern)。

### 自动推断文件列类型

以 S3 TVF 为例，先通过 `DESC FUNCTION` 查看文件 Schema：

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

说明：

- 示例指定了文件路径、连接信息和认证信息。
- 通过 `DESC FUNCTION` 可查看文件的 Schema。
- 对于 Parquet 文件，Doris 会根据文件元信息自动推断列类型。
- 目前支持 Parquet、ORC、CSV、Json 格式的分析与列类型推断。

### 配合 INSERT INTO SELECT 导入

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

- 如果 `S3 / hdfs` TVF 指定的 URI 匹配不到文件，或匹配到的所有文件都为空，则 TVF 返回空结果集。此时使用 `DESC FUNCTION` 查看 Schema 会得到一列虚假的 `__dummy_col`，可忽略。
- 如果指定 TVF 的 format 为 CSV 时报错 `The first line is empty, can not parse column numbers`，原因是无法通过文件首行解析出 Schema。

## 常见问题

<!-- 知识类型: FAQ -->

**Q1：INSERT INTO 是同步还是异步？**

INSERT INTO 默认为**同步**导入，执行后立即返回结果。如需异步执行，可结合 [JOB](../../../admin-manual/workload-management/job-scheduler) 使用。

**Q2：INSERT INTO 失败时数据会部分写入吗？**

不会。INSERT INTO 保证**原子性**——要么全部成功，要么全部失败。

**Q3：导入超时如何处理？**

调整以下两个参数确保 `导入超时 ≥ 数据量 / 预估导入速度`：

- FE 配置：`insert_load_default_timeout_second`
- 会话变量：`insert_timeout`

**Q4：如何控制错误数据的容忍度？**

- `enable_insert_strict = true`：遇到任何不合格数据立即失败。
- `enable_insert_strict = false`：忽略不合格行（2.1.4 及以前版本）。
- 自 2.1.5 起，可使用 `insert_max_filter_ratio`（仅在 `enable_insert_strict = false` 时生效）按比例控制错误容忍率，仅适用于 `INSERT INTO FROM S3/HDFS/LOCAL()`。

**Q5：状态返回 `committed` 但未 `visible` 怎么办？**

`committed` 表示导入已完成，数据最终一定可见，无需重试。可通过 [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) 查询 `TransactionStatus` 是否变为 `visible`。

## 更多帮助

关于 INSERT INTO 使用的更多详细语法，请参阅 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT) 命令手册，也可在 MySQL 客户端命令行下输入 `HELP INSERT` 获取更多帮助信息。
