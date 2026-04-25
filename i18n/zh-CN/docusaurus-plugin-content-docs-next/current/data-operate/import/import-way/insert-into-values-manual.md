---
{
    "title": "Insert Into Values",
    "language": "zh-CN",
    "description": "INSERT INTO VALUES 语句支持将 SQL 中的值导入到 Doris 的表中。INSERT INTO VALUES 是一个同步导入方式，执行导入后返回导入结果。可以通过请求的返回判断导入是否成功。INSERT INTO VALUES 可以保证导入任务的原子性，要么全部导入成功，"
}
---

INSERT INTO VALUES 语句支持将 SQL 中的值导入到 Doris 的表中。INSERT INTO VALUES 是一个同步导入方式，执行导入后返回导入结果。可以通过请求的返回判断导入是否成功。INSERT INTO VALUES 可以保证导入任务的原子性，要么全部导入成功，要么全部导入失败。

## 使用场景

1. 用户希望仅导入几条假数据，验证一下 Doris 系统的功能。此时适合使用 INSERT INTO VALUES 的语法，语法和 MySQL 一样。
2. 并发的 INSERT INTO VALUES 的性能会受到 commit 阶段的瓶颈限制。导入数据量较大时，可以打开 [group commit](../group-commit-manual.md) 达到更高的性能。

## 基本原理

在使用 INSERT INTO VALUES 时，需要通过 MySQL 协议发起导入作业给 FE 节点，FE 会生成执行计划，执行计划中前部是查询相关的算子，最后一个是 OlapTableSink 算子，用于将查询结果写到目标表中。执行计划会被发送给 BE 节点执行，Doris 会选定一个节点做为 Coordinator 节点，Coordinator 节点负责接受数据并分发数据到其他节点上。

## 快速上手

INSERT INTO VALUES 通过 MySQL 协议提交和传输。下例以 MySQL 命令行为例，演示通过 INSERT INTO VALUES 提交导入作业。

详细语法可以参见 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT)。

### 前置检查

INSERT INTO VALUES 需要对目标表的 INSERT 权限。如果没有 INSERT 权限，可以通过 [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) 命令给用户授权。

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

INSERT INTO VALUES 是一种同步导入方式，导入结果会直接返回给用户。

```JSON
Query OK, 5 rows affected (0.308 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
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

### 查看导入作业

可以通过 `show load` 命令查看已完成的 INSERT INTO VALUES 任务。

```sql
mysql> SHOW LOAD FROM testdb\G
*************************** 1. row ***************************
         JobId: 77172
         Label: label_26eebc33411f441c_b2b286730d495e2c
         State: FINISHED
      Progress: Unknown id: 77172
          Type: INSERT
       EtlInfo: NULL
      TaskInfo: cluster:N/A; timeout(s):14400; max_filter_ratio:0.0
      ErrorMsg: NULL
    CreateTime: 2024-11-20 16:44:08
  EtlStartTime: 2024-11-20 16:44:08
 EtlFinishTime: 2024-11-20 16:44:08
 LoadStartTime: 2024-11-20 16:44:08
LoadFinishTime: 2024-11-20 16:44:08
           URL: 
    JobDetails: {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0}
 TransactionId: 61071
  ErrorTablets: {}
          User: root
       Comment: 
1 row in set (0.00 sec)
```

### 取消导入作业

用户可以通过 Ctrl-C 取消当前正在执行的 INSERT INTO VALUES 作业。

## 参考手册

### 导入命令

INSERT INTO VALUES 一般仅用于 Demo，不建议在生产环境使用。

```sql
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```

### 导入配置参数

**FE 配置**

| 参数 | 默认值 | 描述 |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400（4 小时） | 导入任务的超时时间，单位：秒。导入任务在该超时时间内未完成则会被系统取消，变成 `CANCELLED`。 |

**环境变量**

| 参数 | 默认值 | 描述 |
| --- | --- | --- |
| insert_timeout | 14400（4 小时） | INSERT INTO 作为 SQL 语句的的超时时间，单位：秒。 |
| enable_insert_strict | true | 如果设置为 true，当 INSERT INTO 遇到不合格数据时导入会失败。如果设置为 false，INSERT INTO 会忽略不合格的行，只要有一条数据被正确导入，导入就会成功。在 2.1.4 及以前的版本中。INSERT INTO 无法控制错误率，只能通过该参数设置为严格检查数据质量或完全忽略错误数据。常见的数据不合格的原因有：源数据列长度超过目的数据列长度、列类型不匹配、分区不匹配、列顺序不匹配等。 |
| insert_max_filter_ratio | 1.0 | 自 2.1.5 版本，仅当 `enable_insert_strict` 值为 false 时生效。用于控制当使用 `INSERT INTO FROM S3/HDFS/LOCAL()` 时，设定错误容忍率的。默认为 1.0 表示容忍所有错误。可以取值 0 ~ 1 之间的小数。表示当错误行数超过该比例后，INSERT 任务会失败。 |

### 导入返回值

INSERT INTO VALUES 是一个 SQL 语句，其返回结果会包含一个 JSON 字符串。

其中的参数如下表说明：

| 参数名称 | 说明                                                         |
| -------- | ------------------------------------------------------------ |
| Label    | 导入作业的 label，通过 INSERT INTO tbl WITH LABEL label ... 指定 |
| Status   | 表示导入数据是否可见。如果可见，显示 `visible`，如果不可见，显示 `committed`<p>- `visible`：表示导入成功，数据可见</p> <p>- `committed`：该状态也表示导入已经完成，只是数据可能会延迟可见，无需重试</p> <p>- Label Already Exists：Label 重复，需要更换 label</p> <p>- Fail：导入失败</p> |
| Err      | 导入错误信息                                                 |
| TxnId    | 导入事务的 ID                                                |

**INSERT 执行成功**

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.05 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

其中 `Query OK` 表示执行成功。`5 rows affected` 表示总共有 5 行数据被导入。

**INSERT 执行成功但是有 warning**

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 4 rows affected, 1 warning (0.04 sec)
{'label':'label_a8d99ae931194d2b_93357aac59981a18', 'status':'VISIBLE', 'txnId':'61068'}
```

其中 `Query OK` 表示执行成功。`4 rows affected` 表示总共有 4 行数据被导入。`1 warnings` 表示被过滤了 1 行。

当需要查看被过滤的行时，用户可以通过 [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md)语句。返回结果中的 URL 可以用于查询错误的数据，具体见后面 查看错误行 小结。

```sql
mysql> SHOW LOAD WHERE label="label_a8d99ae931194d2b_93357aac59981a18"\G
*************************** 1. row ***************************
         JobId: 77158
         Label: label_a8d99ae931194d2b_93357aac59981a18
         State: FINISHED
      Progress: Unknown id: 77158
          Type: INSERT
       EtlInfo: NULL
      TaskInfo: cluster:N/A; timeout(s):14400; max_filter_ratio:0.0
      ErrorMsg: NULL
    CreateTime: 2024-11-20 16:35:40
  EtlStartTime: 2024-11-20 16:35:40
 EtlFinishTime: 2024-11-20 16:35:40
 LoadStartTime: 2024-11-20 16:35:40
LoadFinishTime: 2024-11-20 16:35:40
           URL: http://10.16.10.7:8743/api/_load_error_log?file=__shard_18/error_log_insert_stmt_a8d99ae931194d2b-93357aac59981a19_a8d99ae931194d2b_93357aac59981a19
    JobDetails: {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0}
 TransactionId: 61068
  ErrorTablets: {}
          User: root
       Comment: 
1 row in set (0.00 sec)
```

**INSERT 执行成功但是 status 是 committed**

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.04 sec)
{'label':'label_78bf5396d9594d4d_a8d9a914af40f73d', 'status':'COMMITTED', 'txnId':'61074'}
```

数据不可见是一个临时状态，这批数据最终是一定可见的

可以通过 [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md) 语句查看这批数据的可见状态。
当返回结果中的 `TransactionStatus` 列变成 `VISIBLE` 时代表数据可见。

```sql
mysql> SHOW TRANSACTION WHERE id=61074\G
*************************** 1. row ***************************
     TransactionId: 61074
             Label: label_78bf5396d9594d4d_a8d9a914af40f73d
       Coordinator: FE: 10.16.10.7
 TransactionStatus: VISIBLE
 LoadJobSourceType: INSERT_STREAMING
       PrepareTime: 2024-11-20 16:51:54
     PreCommitTime: NULL
        CommitTime: 2024-11-20 16:51:54
       PublishTime: 2024-11-20 16:51:54
        FinishTime: 2024-11-20 16:51:54
            Reason: 
ErrorReplicasCount: 0
        ListenerId: -1
         TimeoutMs: 14400000
            ErrMsg: 
1 row in set (0.00 sec)
```

**INSERT 执行失败**

执行失败表示没有任何数据被成功导入，并返回如下：

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```

其中 `ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.` 显示失败原因。后面的 url 可以用于查询错误的数据，具体见后面 查看错误行 小结。

## 导入最佳实践

### 数据量

INSERT INTO VALUES 通常用于测试和演示，不建议用于导入大量数据的场景。

### 查看错误行

当 INSERT INTO 返回结果中提供了 url 字段时，可以通过以下命令查看错误行：

```sql
SHOW LOAD WARNINGS ON "url";
```

示例：

```sql
mysql> SHOW LOAD WARNINGS ON "http://10.16.10.7:8743/api/_load_error_log?file=__shard_18/error_log_insert_stmt_a8d99ae931194d2b-93357aac59981a19_a8d99ae931194d2b_93357aac59981a19"\G
*************************** 1. row ***************************
         JobId: -1
         Label: NULL
ErrorMsgDetail: Reason: column_name[user_id], null value for not null column, type=BIGINT. src line []; 
1 row in set (0.00 sec)
```

常见的错误的原因有：源数据列长度超过目的数据列长度、列类型不匹配、分区不匹配、列顺序不匹配等。

可以通过环境变量 `enable_insert_strict`来控制 INSERT INTO 是否忽略错误行。

## 更多帮助

关于 Insert Into 使用的更多详细语法，请参阅 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT.md) 命令手册，也可以在 MySQL 客户端命令行下输入 `HELP INSERT` 获取更多帮助信息。
