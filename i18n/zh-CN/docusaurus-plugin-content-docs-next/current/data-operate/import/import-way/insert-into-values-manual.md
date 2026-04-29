---
{
    "title": "Insert Into Values",
    "language": "zh-CN",
    "description": "通过 INSERT INTO VALUES 语句以同步方式将 SQL 内联数据原子性导入 Doris 表，适用于功能验证、Demo 与小批量数据写入。",
    "keywords": [
        "INSERT INTO VALUES",
        "Doris 同步导入",
        "SQL 写入 Doris",
        "原子性导入",
        "group commit",
        "insert_max_filter_ratio",
        "enable_insert_strict",
        "insert_load_default_timeout_second"
    ]
}
---

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 功能验证 / Demo 演示 / 小批量数据写入 -->

INSERT INTO VALUES 语句支持将 SQL 中的内联值导入到 Doris 的表中，是一种**同步导入方式**，执行后会直接返回导入结果，可以根据返回内容判断导入是否成功。该方式保证导入任务的**原子性**：要么全部成功，要么全部失败。

## 使用场景

INSERT INTO VALUES 主要面向以下两类场景：

| 场景 | 说明 |
| --- | --- |
| 功能验证 / Demo | 仅导入少量假数据以验证 Doris 系统的功能，语法与 MySQL 一致 |
| 小批量数据写入 | 在并发较低、数据量较小的场景下使用 |

:::tip 性能提示
并发的 INSERT INTO VALUES 性能会受到 commit 阶段瓶颈的限制。当导入数据量较大时，建议开启 [Group Commit](../group-commit-manual.md) 以获得更高吞吐。
:::

## 基本原理

INSERT INTO VALUES 通过 MySQL 协议将作业发送给 FE 节点执行，整体流程如下：

1. 客户端通过 MySQL 协议向 FE 提交 INSERT INTO VALUES 语句。
2. FE 生成执行计划：前部为查询相关的算子，最后一个算子为 `OlapTableSink`，负责将查询结果写入目标表。
3. FE 将执行计划下发给 BE 节点执行，并选定一个 BE 作为 **Coordinator** 节点。
4. Coordinator 节点负责接收数据，并将数据分发到其他 BE 节点完成写入。

## 快速上手

INSERT INTO VALUES 通过 MySQL 协议提交和传输。下例以 MySQL 命令行为例，演示完整的提交流程。详细语法请参见 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT)。

### 前置检查

执行 INSERT INTO VALUES 需要对目标表具有 **INSERT 权限**。如果当前用户没有该权限，可使用 [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) 命令进行授权。

### 创建导入作业

#### 步骤 1：创建目标表

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

#### 步骤 2：执行 INSERT INTO VALUES 写入数据

:::caution 不推荐在生产环境中使用
INSERT INTO VALUES 一般仅用于 Demo 或测试，不建议用于生产环境的数据导入。
:::

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

作为同步导入方式，结果会直接返回给客户端：

```JSON
Query OK, 5 rows affected (0.308 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

#### 步骤 3：校验导入数据

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

可通过 `SHOW LOAD` 命令查看已完成的 INSERT INTO VALUES 作业：

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

在 MySQL 客户端中，可以使用 `Ctrl-C` 取消当前正在执行的 INSERT INTO VALUES 作业。

## 参考手册

### 导入命令语法

```sql
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```

:::note
INSERT INTO VALUES 一般仅用于 Demo，不建议在生产环境使用。
:::

### 导入配置参数

#### FE 配置

| 参数 | 默认值 | 描述 |
| --- | --- | --- |
| `insert_load_default_timeout_second` | 14400（4 小时） | 导入任务的超时时间，单位：秒。导入任务在该超时时间内未完成则会被系统取消，状态变为 `CANCELLED` |

#### 环境变量（Session Variables）

| 参数 | 默认值 | 描述 |
| --- | --- | --- |
| `insert_timeout` | 14400（4 小时） | INSERT INTO 作为 SQL 语句执行时的超时时间，单位：秒 |
| `enable_insert_strict` | true | 取值为 `true` 时，遇到不合格数据则导入失败；取值为 `false` 时，忽略不合格行，只要有一条数据被正确导入，导入即视为成功。在 2.1.4 及以前的版本中，INSERT INTO 无法控制错误率，只能通过该参数设置为严格检查数据质量或完全忽略错误数据 |
| `insert_max_filter_ratio` | 1.0 | 自 2.1.5 版本起支持，**仅在 `enable_insert_strict=false` 时生效**。用于控制 `INSERT INTO FROM S3/HDFS/LOCAL()` 时的错误容忍率，取值范围 0 ~ 1。默认 1.0 表示容忍所有错误；当错误行数比例超过该值时 INSERT 任务会失败 |

:::info 数据不合格的常见原因
源数据列长度超过目的数据列长度、列类型不匹配、分区不匹配、列顺序不匹配等。
:::

### 导入返回值

INSERT INTO VALUES 是一个 SQL 语句，返回结果中包含一个 JSON 字符串，字段含义如下：

| 参数名称 | 说明 |
| -------- | ------------------------------------------------------------ |
| `Label`  | 导入作业的 label，可通过 `INSERT INTO tbl WITH LABEL label ...` 指定 |
| `Status` | 导入数据的可见状态：<br />- `visible`：导入成功，数据可见<br />- `committed`：导入已完成，数据可能延迟可见，无需重试<br />- `Label Already Exists`：Label 重复，需要更换<br />- `Fail`：导入失败 |
| `Err`    | 导入错误信息 |
| `TxnId`  | 导入事务的 ID |

下面分别给出四种典型返回场景的示例。

#### 场景 1：INSERT 执行成功

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.05 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

- `Query OK`：表示语句执行成功
- `5 rows affected`：表示总共有 5 行数据被导入

#### 场景 2：INSERT 执行成功但有 warning

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 4 rows affected, 1 warning (0.04 sec)
{'label':'label_a8d99ae931194d2b_93357aac59981a18', 'status':'VISIBLE', 'txnId':'61068'}
```

- `Query OK`：表示语句执行成功
- `4 rows affected`：表示总共有 4 行数据被导入
- `1 warnings`：表示被过滤了 1 行

可通过 [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md) 语句查看被过滤的行。返回结果中的 `URL` 可用于查询错误数据，详见下文 [查看错误行](#查看错误行)。

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

#### 场景 3：INSERT 执行成功但 status 为 committed

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.04 sec)
{'label':'label_78bf5396d9594d4d_a8d9a914af40f73d', 'status':'COMMITTED', 'txnId':'61074'}
```

数据不可见是临时状态，这批数据最终一定会变为可见。可通过 [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md) 语句查看可见状态，当 `TransactionStatus` 列变为 `VISIBLE` 时即代表数据可见。

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

#### 场景 4：INSERT 执行失败

执行失败表示没有任何数据被成功导入：

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```

- `ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.` 显示失败原因
- 末尾的 url 可用于查询错误数据，详见下文 [查看错误行](#查看错误行)

## 导入最佳实践

### 数据量

INSERT INTO VALUES 通常用于测试和演示，**不建议**用于导入大量数据的场景。如有大批量写入需求，建议使用 [Group Commit](../group-commit-manual.md) 或其他批量导入方式。

### 查看错误行

当 INSERT INTO 返回结果中提供了 `url` 字段时，可通过以下命令查看错误行：

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

常见错误原因包括：

- 源数据列长度超过目的数据列长度
- 列类型不匹配
- 分区不匹配
- 列顺序不匹配

可通过环境变量 `enable_insert_strict` 控制 INSERT INTO 是否忽略错误行。

## 常见问题（FAQ）

<!-- 知识类型: FAQ -->

**Q1：INSERT INTO VALUES 是同步还是异步导入？**

A：同步导入。语句执行完成后会直接返回导入结果，无需额外轮询。

**Q2：INSERT INTO VALUES 能保证原子性吗？**

A：可以。一次 INSERT INTO VALUES 的所有数据要么全部导入成功，要么全部失败，不会出现部分写入。

**Q3：返回 status 为 `COMMITTED` 是导入失败了吗？**

A：不是。`COMMITTED` 表示导入已完成，数据稍后会变为可见，无需重试。可通过 `SHOW TRANSACTION` 查看 `TransactionStatus` 直到变为 `VISIBLE`。

**Q4：为什么导入后报 `Insert has too many filtered data`？**

A：当 `enable_insert_strict=false` 时，被过滤的数据比例超过了 `insert_max_filter_ratio` 设置的阈值。可放宽 `insert_max_filter_ratio`，或检查源数据是否符合表结构（列类型、是否允许 NULL 等）。

**Q5：大批量导入应该使用什么方式？**

A：INSERT INTO VALUES 在高并发或大数据量场景下会受到 commit 瓶颈限制，建议开启 [Group Commit](../group-commit-manual.md)，或选择 Stream Load、Broker Load 等专用导入方式。

## 故障排查（Troubleshooting）

<!-- 知识类型: 故障排查 -->

| 问题现象 | 可能原因 | 解决方案 |
| --- | --- | --- |
| 报错 `null value for not null column` | 向 NOT NULL 列插入了 NULL 值 | 修正源数据，或调整目标列为允许 NULL |
| 报错 `Insert has too many filtered data` | 过滤行比例超出 `insert_max_filter_ratio` | 提高 `insert_max_filter_ratio` 阈值，或修正源数据 |
| 报错 `Label Already Exists` | 指定的 Label 已被使用 | 更换 Label，或不指定 Label 让系统自动生成 |
| 任务长时间未完成被取消 | 超过 `insert_load_default_timeout_second` 或 `insert_timeout` | 调大对应超时参数，或拆分批次导入 |
| 高并发下吞吐不高 | 受 commit 阶段瓶颈限制 | 开启 [Group Commit](../group-commit-manual.md) |

## 更多帮助

关于 INSERT INTO 使用的更多详细语法，请参阅 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT.md) 命令手册，也可以在 MySQL 客户端命令行下输入 `HELP INSERT` 获取更多帮助信息。
