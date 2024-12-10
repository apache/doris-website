---
{
    "title": "Insert Into Values",
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

The INSERT INTO VALUES statement supports importing the results of a Doris query into another table. INSERT INTO VALUES is a synchronous import method, where the import result is returned after the import is executed. Whether the import is successful can be determined based on the returned result. INSERT INTO VALUES ensures the atomicity of the import task, meaning that either all the data is imported successfully or none of it is imported.

- INSERT INTO tbl (col1, col2, ...) VALUES (1, 2, ...), (1,3, ...)

## Applicable scenarios

1. If a user wants to import only a few test data records to verify the functionality of the Doris system, the INSERT INTO VALUES syntax is applicable. It is similar to the MySQL syntax. However, it is not recommended to use INSERT INTO VALUES in a production environment.
2. The performance of concurrent INSERT INTO VALUES jobs will be bottlenecked by commit stage. When loading large quantity of data, you can enable [group commit](../import-way/group-commit-manual.md) to achieve high performance. 

## Implementation

When using INSERT INTO VALUES, the import job needs to be initiated and submitted to the FE node using the MySQL protocol. The FE generates an execution plan, which includes query-related operators, with the last operator being the OlapTableSink. The OlapTableSink operator is responsible for writing the query result to the target table. The execution plan is then sent to the BE nodes for execution. Doris designates one BE node as the Coordinator, which receives and distributes the data to other BE nodes.

## Get started

An INSERT INTO VALUES job is submitted and transmitted using the MySQL protocol. The following example demonstrates submitting an import job using INSERT INTO VALUES through the MySQL command-line interface.

### Preparation

INSERT INTO VALUES requires INSERT permissions on the target table. You can grant permissions to user accounts using the GRANT command.

### Create an INSERT INTO VALUES job

**INSERT INTO VALUES**

1. Create a source table

```SQL
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

2. Import data into the source table using `INSERT INTO VALUES` (not recommended for production environments).

```SQL
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

INSERT INTO VALUES is a synchronous import method, where the import result is directly returned to the user.

```JSON
Query OK, 5 rows affected (0.308 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

3. View imported data.

```SQL
MySQL> SELECT COUNT(*) FROM testdb.test_table;
+----------+
| count(*) |
+----------+
|        5 |
+----------+
1 row in set (0.179 sec)
```

### View INSERT INTO VALUES jobs

You can use the `SHOW LOAD` command to view the completed INSERT INTO VALUES tasks.

```SQL
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

### Cancel INSERT INTO VALUES jobs

You can cancel the currently executing INSERT INTO VALUES job via Ctrl-C.

## Manual

### Syntax

INSERT INTO VALUES is typically used for testing purposes. It is not recommended for production environments.

```SQL
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```

### Parameter configuration

**FE** **configuration**

insert_load_default_timeout_second

- Default value: 14400s (4 hours)
- Description: Timeout for import tasks, measured in seconds. If the import task does not complete within this timeout period, it will be canceled by the system and marked as CANCELLED.

**Environment parameters**

insert_timeout

- Default value: 14400s (4 hours)
- Description: Timeout for INSERT INTO VALUES as an SQL statement, measured in seconds. 

enable_insert_strict

- Default value: true
- Description: If this is set to true, INSERT INTO VALUES will fail when the task involves invalid data. If set to false, INSERT INTO VALUES will ignore invalid rows, and the import will be considered successful as long as at least one row is imported successfully.
- Explanation: Until version 2.1.4, INSERT INTO VALUES cannot control the error rate, so this parameter is used to either strictly check data quality or completely ignore invalid data. Common reasons for data invalidity include: source data column length exceeding destination column length, column type mismatch, partition mismatch, and column order mismatch.

insert_max_filter_ratio

- Default value: 1.0

- Description: Since version 2.1.5. Only effective when `enable_insert_strict` is false. Used to control the error tolerance when using `INSERT INTO VALUES`. The default value is 1.0, which means all errors are tolerated. It can be a decimal between 0 and 1. It means that when the number of error rows exceeds this ratio, the INSERT task will fail.

### Return values

INSERT INTO VALUES is a SQL statement, and it returns a JSON string in its results.

Parameters in the JSON string:

| Parameter | Description                                                  |
| --------- | ------------------------------------------------------------ |
| Label     | Label of the import job: can be specified using "INSERT INTO tbl WITH LABEL label..." |
| Status    | Visibility of the imported data: If it is visible, it will be displayed as "visible." If not, it will be displayed as "committed." In the "committed" state, the import is completed, but the data may be delayed in becoming visible. There is no need to retry in this case.`visible`: The import is successful and the data is visible.`committed`: The import is completed, but the data may be delayed in becoming visible. There is no need to retry in this case.Label Already Exists: The specified label already exists and needs to be changed to a different one.Fail: The import fails. |
| Err       | Error message                                                |
| TxnId     | ID of the import transaction                                 |

**Successful INSERT**

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.05 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

`Query OK` indicates successful execution. `5 rows affected` indicates that a total of 5 rows of data have been imported. 

**Successful INSERT with warnings**

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 4 rows affected, 1 warning (0.04 sec)
{'label':'label_a8d99ae931194d2b_93357aac59981a18', 'status':'VISIBLE', 'txnId':'61068'}
```

`Query OK` indicates successful execution. `4 rows affected` indicates that a total of 4 rows of data have been imported. `1 warnings` indicates the number of rows that were filtered out. 

You can use the [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md) statement to view the filtered rows.

The result of this statement will include a URL that can be used to query the error data. For more details, refer to the "View error rows" section below.

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

**Successful INSERT with committed status**

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.04 sec)
{'label':'label_78bf5396d9594d4d_a8d9a914af40f73d', 'status':'COMMITTED', 'txnId':'61074'}
```

The invisible state of data is temporary, and the data will eventually become visible. 

You can check the visibility status of a batch of data using the [SHOW TRANSACTION](../../../sql-manual/sql-statements/Show-Statements/SHOW-TRANSACTION/) statement.

If the `TransactionStatus` column in the result is `visible`, it indicates that the data is visible.

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

**Non-empty result set but failed INSERT**

Failed execution means that no data was successfully imported. An error message will be returned:

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```

`ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.` indicates the root cause for the failure. The URL provided in the error message can be used to locate the error data. For more details, refer to the "View error rows" section below.

## Best practice

### Data size

INSERT INTO VALUES is usually used for test and demo, it is not recommended to load large quantity data with INSERT INTO VALUES.

### View error rows

When the INSERT INTO result includes a URL field, you can use the following command to view the error rows:

```SQL
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

Common reasons for errors include: source data column length exceeding destination column length, column type mismatch, partition mismatch, and column order mismatch.

You can control whether INSERT INTO ignores error rows by configuring the environment variable `enable_insert_strict`.

## More help

For more detailed syntax on INSERT INTO, refer to the [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT.md) command manual. You can also type `HELP INSERT` at the MySQL client command line for further information.
