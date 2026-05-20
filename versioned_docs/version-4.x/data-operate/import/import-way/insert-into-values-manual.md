---
{
    "title": "Insert Into Values",
    "language": "en",
    "description": "Use the INSERT INTO VALUES statement to atomically load SQL inline data into Doris tables in a synchronous manner, suitable for feature validation, demos, and small-batch data ingestion.",
    "keywords": [
        "INSERT INTO VALUES",
        "Doris synchronous load",
        "SQL write to Doris",
        "atomic load",
        "group commit",
        "insert_max_filter_ratio",
        "enable_insert_strict",
        "insert_load_default_timeout_second"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenarios: Feature validation / Demo / Small-batch data ingestion -->

The INSERT INTO VALUES statement loads inline values from SQL into a Doris table. It is a **synchronous load method** that returns the load result directly after execution, so you can determine whether the load succeeded based on the response. This method guarantees the **atomicity** of the load task: either all data is loaded successfully, or none of it is.

## Use Cases

INSERT INTO VALUES targets the following two scenarios:

| Scenario | Description |
| --- | --- |
| Feature validation / Demo | Load a small amount of mock data to validate Doris features. The syntax is consistent with MySQL. |
| Small-batch data ingestion | Use it in scenarios with low concurrency and small data volume. |

:::tip Performance tip
The performance of concurrent INSERT INTO VALUES is limited by the bottleneck of the commit phase. When the data volume is large, enable [Group Commit](../load-best-practices/group-commit-manual.md) to achieve higher throughput.
:::

## How It Works

INSERT INTO VALUES sends jobs to the FE node for execution through the MySQL protocol. The overall flow is as follows:

1. The client submits the INSERT INTO VALUES statement to the FE through the MySQL protocol.
2. The FE generates an execution plan: the front part contains query-related operators, and the last operator is `OlapTableSink`, which writes the query result into the target table.
3. The FE dispatches the execution plan to BE nodes for execution and selects one BE as the **Coordinator** node.
4. The Coordinator node receives the data and distributes it to other BE nodes to complete the write.

## Quick Start

INSERT INTO VALUES is submitted and transmitted through the MySQL protocol. The example below uses the MySQL command line to demonstrate the full submission flow. For detailed syntax, see [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT).

### Prerequisites

Executing INSERT INTO VALUES requires the **INSERT privilege** on the target table. If the current user does not have this privilege, use the [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) command to grant it.

### Create a Load Job

#### Step 1: Create the target table

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

#### Step 2: Run INSERT INTO VALUES to write data

:::caution Not recommended for production
INSERT INTO VALUES is generally only used for demos or testing, and is not recommended for data ingestion in production environments.
:::

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

As a synchronous load method, the result is returned directly to the client:

```JSON
Query OK, 5 rows affected (0.308 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

#### Step 3: Verify the loaded data

```sql
MySQL> SELECT COUNT(*) FROM testdb.test_table;
+----------+
| count(*) |
+----------+
|        5 |
+----------+
1 row in set (0.179 sec)
```

### View the Load Job

Use the `SHOW LOAD` command to view completed INSERT INTO VALUES jobs:

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

### Cancel the Load Job

In the MySQL client, use `Ctrl-C` to cancel a currently running INSERT INTO VALUES job.

## Reference

### Load Command Syntax

```sql
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```

:::note
INSERT INTO VALUES is generally only used for demos and is not recommended for production environments.
:::

### Load Configuration Parameters

#### FE Configuration

| Parameter | Default value | Description |
| --- | --- | --- |
| `insert_load_default_timeout_second` | 14400 (4 hours) | Timeout of the load task, in seconds. If the load task does not complete within this timeout, the system cancels it and the status changes to `CANCELLED`. |

#### Session Variables

| Parameter | Default value | Description |
| --- | --- | --- |
| `insert_timeout` | 14400 (4 hours) | Timeout when INSERT INTO is executed as a SQL statement, in seconds. |
| `enable_insert_strict` | true | When set to `true`, the load fails if any unqualified data is encountered. When set to `false`, unqualified rows are ignored, and the load is considered successful as long as at least one row is loaded correctly. In versions 2.1.4 and earlier, INSERT INTO cannot control the error rate; this parameter only allows strict data quality checking or completely ignoring erroneous data. |
| `insert_max_filter_ratio` | 1.0 | Supported since version 2.1.5. **Takes effect only when `enable_insert_strict=false`.** Used to control the error tolerance ratio for `INSERT INTO FROM S3/HDFS/LOCAL()`. The value range is 0 to 1. The default 1.0 means tolerating all errors. When the proportion of error rows exceeds this value, the INSERT task fails. |

:::info Common causes of unqualified data
The source column length exceeds the target column length, column types do not match, partitions do not match, column order does not match, and so on.
:::

### Load Return Values

INSERT INTO VALUES is a SQL statement. The return result contains a JSON string with the following fields:

| Parameter | Description |
| -------- | ------------------------------------------------------------ |
| `Label`  | The label of the load job. It can be specified with `INSERT INTO tbl WITH LABEL label ...`. |
| `Status` | The visibility status of the loaded data:<br />- `visible`: the load succeeded and the data is visible.<br />- `committed`: the load is complete; the data may be visible after a delay, and no retry is needed.<br />- `Label Already Exists`: the label is duplicated and needs to be replaced.<br />- `Fail`: the load failed. |
| `Err`    | Error message of the load. |
| `TxnId`  | The ID of the load transaction. |

The four typical return scenarios are illustrated below.

#### Scenario 1: INSERT executed successfully

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.05 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

- `Query OK`: indicates the statement was executed successfully.
- `5 rows affected`: indicates a total of 5 rows were loaded.

#### Scenario 2: INSERT executed successfully with warnings

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 4 rows affected, 1 warning (0.04 sec)
{'label':'label_a8d99ae931194d2b_93357aac59981a18', 'status':'VISIBLE', 'txnId':'61068'}
```

- `Query OK`: indicates the statement was executed successfully.
- `4 rows affected`: indicates a total of 4 rows were loaded.
- `1 warnings`: indicates 1 row was filtered out.

Use the [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md) statement to view the filtered rows. The `URL` in the result can be used to query the error data. See [View Error Rows](#view-error-rows) below.

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

#### Scenario 3: INSERT executed successfully but status is committed

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.04 sec)
{'label':'label_78bf5396d9594d4d_a8d9a914af40f73d', 'status':'COMMITTED', 'txnId':'61074'}
```

The data being invisible is a temporary state; this batch of data will eventually become visible. Use the [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md) statement to check the visibility status. When the `TransactionStatus` column becomes `VISIBLE`, the data is visible.

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

#### Scenario 4: INSERT execution failed

A failed execution means no data was loaded successfully:

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```

- `ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.` shows the failure reason.
- The url at the end can be used to query the error data. See [View Error Rows](#view-error-rows) below.

## Best Practices

### Data Volume

INSERT INTO VALUES is typically used for testing and demos. It is **not recommended** for loading large amounts of data. For large-batch write requirements, use [Group Commit](../load-best-practices/group-commit-manual.md) or other batch load methods.

### View Error Rows

When the INSERT INTO return result provides a `url` field, use the following command to view the error rows:

```sql
SHOW LOAD WARNINGS ON "url";
```

Example:

```sql
mysql> SHOW LOAD WARNINGS ON "http://10.16.10.7:8743/api/_load_error_log?file=__shard_18/error_log_insert_stmt_a8d99ae931194d2b-93357aac59981a19_a8d99ae931194d2b_93357aac59981a19"\G
*************************** 1. row ***************************
         JobId: -1
         Label: NULL
ErrorMsgDetail: Reason: column_name[user_id], null value for not null column, type=BIGINT. src line []; 
1 row in set (0.00 sec)
```

Common causes of errors include:

- The source column length exceeds the target column length.
- Column types do not match.
- Partitions do not match.
- Column order does not match.

Use the session variable `enable_insert_strict` to control whether INSERT INTO ignores error rows.

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: Is INSERT INTO VALUES synchronous or asynchronous?**

A: Synchronous. The load result is returned directly after the statement is executed, with no additional polling required.

**Q2: Does INSERT INTO VALUES guarantee atomicity?**

A: Yes. All data in a single INSERT INTO VALUES is either fully loaded successfully or fully fails; partial writes do not occur.

**Q3: Does a returned status of `COMMITTED` mean the load failed?**

A: No. `COMMITTED` indicates that the load is complete and the data will become visible shortly, with no retry required. Use `SHOW TRANSACTION` to check `TransactionStatus` until it becomes `VISIBLE`.

**Q4: Why does the load report `Insert has too many filtered data`?**

A: When `enable_insert_strict=false`, the proportion of filtered data exceeded the threshold set by `insert_max_filter_ratio`. Either relax `insert_max_filter_ratio`, or check whether the source data conforms to the table schema (column types, NULL allowance, and so on).

**Q5: What method should be used for large-batch loading?**

A: INSERT INTO VALUES is limited by the commit bottleneck under high concurrency or large data volumes. Enable [Group Commit](../load-best-practices/group-commit-manual.md), or choose dedicated load methods such as Stream Load or Broker Load.

## Troubleshooting

<!-- Knowledge type: Troubleshooting -->

| Symptom | Possible cause | Solution |
| --- | --- | --- |
| Error `null value for not null column` | A NULL value was inserted into a NOT NULL column. | Fix the source data, or change the target column to allow NULL. |
| Error `Insert has too many filtered data` | The proportion of filtered rows exceeds `insert_max_filter_ratio`. | Increase the `insert_max_filter_ratio` threshold, or fix the source data. |
| Error `Label Already Exists` | The specified label is already in use. | Use a different label, or do not specify a label and let the system generate one automatically. |
| The task is canceled after running for a long time without completing. | Exceeds `insert_load_default_timeout_second` or `insert_timeout`. | Increase the corresponding timeout parameters, or split the load into multiple batches. |
| Throughput is low under high concurrency. | Limited by the bottleneck of the commit phase. | Enable [Group Commit](../load-best-practices/group-commit-manual.md). |

## More Help

For more detailed syntax of INSERT INTO, see the [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT.md) command manual. You can also enter `HELP INSERT` in the MySQL client command line for more help.
